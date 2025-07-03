import React, { useEffect, useState } from "react";
import { Button, Form, Spinner, Card, Modal } from "react-bootstrap";
import { Eye, CheckCircle, ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import Pedido from "../../../models/Pedido.ts";
import Estado from "../../../models/enums/Estado.ts";
import pedidoService from "../../../services/PedidoService.ts";
import { connectWebSocket } from "../../../services/WebSocketService.ts";
import { ReusableTable } from "../../Tabla";
import { useAuth } from "../../../context/AuthContext.tsx";
import { useSucursal } from "../../../context/SucursalContextEmpleado.tsx";
import { obtenerSucursales } from "../../../services/SucursalService.ts";
import type Sucursal from "../../../models/Sucursal.ts";
import CocinaModal from "../modales/CocinaModal.tsx";
import ModalMensaje from "../modales/ModalMensaje";

const GrillaCocina: React.FC = () => {
    const { sucursalActual, esModoTodasSucursales, sucursalIdSeleccionada } = useSucursal();
    const { empleado, usuario } = useAuth();

    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [loading, setLoading] = useState(false);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);

    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
    const [showModal, setShowModal] = useState(false);

    const [showConfirmListo, setShowConfirmListo] = useState(false);
    const [pedidoParaMarcarListo, setPedidoParaMarcarListo] = useState<number | null>(null);
    const [loadingListo, setLoadingListo] = useState(false);

    // Filtros
    const [filtros, setFiltros] = useState({
        ordenHora: "ASC", // ASC para temprano a tarde, DESC para tarde a temprano
        sucursalFiltro: "" // Solo se usa cuando está en modo "todas las sucursales"
    });

    const isAdmin = usuario?.rol === 'ADMINISTRADOR';
    const isCocinero = usuario?.rol === 'COCINERO';


    const calcularHoraEstimada = (pedido: Pedido): string => {
        if (!pedido.horaEstimadaFinalizacion) return "No especificada";

        const fecha = new Date(`1970-01-01T${pedido.horaEstimadaFinalizacion}`);

        if (pedido.tipoEnvio === "DELIVERY") {
            fecha.setMinutes(fecha.getMinutes() - 10);
        }

        // Formato HH:mm (puedes cambiar a HH:mm:ss si lo preferís)
        const horas = fecha.getHours().toString().padStart(2, '0');
        const minutos = fecha.getMinutes().toString().padStart(2, '0');

        return `${horas}:${minutos}`;
    };



    // Función para contar productos
    const contarProductos = (pedido: Pedido): number => {
        if (!pedido.detalles) return 0;
        return pedido.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
    };

    const [modalMensaje, setModalMensaje] = useState({
        show: false,
        mensaje: "",
        titulo: "Mensaje",
        variante: "danger" as "primary" | "success" | "danger" | "warning" | "info" | "secondary"
    });
    const mostrarModalMensaje = (mensaje: string, variante: typeof modalMensaje.variante = "danger", titulo = "Error") => {
        setModalMensaje({ show: true, mensaje, variante, titulo });
    };

    const fetchPedidos = async () => {
        try {
            setLoading(true);

            let sucursalId: number | null = null;

            if (isAdmin) {
                // Para admin: usar el contexto de sucursal
                if (esModoTodasSucursales) {
                    // Si está en modo "todas" pero tiene filtro específico de sucursal
                    sucursalId = filtros.sucursalFiltro ? parseInt(filtros.sucursalFiltro) : null;
                } else {
                    // Si está viendo una sucursal específica desde el navbar
                    sucursalId = sucursalIdSeleccionada;
                }
            } else if (isCocinero) {
                // Para cocinero: solo su sucursal
                sucursalId = sucursalActual?.id || null;
            } else {
                // Otros roles no tienen acceso
                return;
            }

            // ✅ CORRECCIÓN: Cambiar 'estado' por 'estados' y usar array de strings
            const filtrosAPI = {
                estados: [Estado.PREPARACION] as string[] // Asegurar que sea array de strings
            };

            // ✅ CORRECCIÓN: Agregar parámetro de ordenamiento
            const sortParam = filtros.ordenHora === "ASC" ? "fechaPedido,ASC" : "fechaPedido,DESC";

            const result = await pedidoService.getPedidosFiltrados(
                sucursalId,
                filtrosAPI,
                page,
                size,
                sortParam // ✅ Pasar el parámetro de ordenamiento al servicio
            );

            // ✅ Ya no necesitas ordenar manualmente aquí, el backend lo hace
            setPedidos(result.content);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Error al obtener pedidos en preparación:", error);
            mostrarModalMensaje("Error al obtener pedidos en preparación", "danger", "Error");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (!usuario || !isCocinero) return;

        const client = connectWebSocket('/topic/cocina', (pedidoActualizado) => {
            setPedidos(prevPedidos => {
                const index = prevPedidos.findIndex(p => p.id === pedidoActualizado.id);

                if (index !== -1) {
                    const copia = [...prevPedidos];
                    copia[index] = pedidoActualizado;
                    return copia;
                }

                if (
                    pedidoActualizado.estado === "PREPARACION" ||
                    pedidoActualizado.estado === "LISTO"
                ) {
                    return [...prevPedidos, pedidoActualizado];
                }

                return prevPedidos;
            });
        });

        // 🔧 ¡IMPORTANTE! El cleanup debe ser sincrónico:
        return () => {
            client.deactivate(); // ✅ Esto ya es síncrono y está OK
        };
    }, [usuario, isCocinero]);

    // Cargar sucursales para admin cuando está en modo "todas las sucursales"
    useEffect(() => {
        const fetchSucursales = async () => {
            if (isAdmin && esModoTodasSucursales) {
                try {
                    const sucursalesData = await obtenerSucursales();
                    setSucursales(sucursalesData);
                } catch (error) {
                    console.error("Error al cargar sucursales:", error);
                }
            }
        };

        if (usuario) {
            fetchSucursales();
        }
    }, [usuario, isAdmin, esModoTodasSucursales]);

    // Fetch pedidos cuando cambien los filtros, la página o el contexto de sucursal
    useEffect(() => {
        if ((isAdmin || (isCocinero && sucursalActual?.id)) && usuario) {
            fetchPedidos();
        }
    }, [page, filtros.ordenHora, filtros.sucursalFiltro, sucursalIdSeleccionada, sucursalActual?.id, usuario, isAdmin, isCocinero, esModoTodasSucursales]);

    const handleVerDetalle = async (pedidoId: number) => {
        try {
            const pedido = await pedidoService.getPedidoPorId(pedidoId);
            setPedidoSeleccionado(pedido);
            setShowModal(true);
        } catch (error) {
            mostrarModalMensaje("No se pudo obtener el detalle del pedido", "danger", "Error");
        }
    };

    const handleAgregar5Min = async (pedido: Pedido) => {
        try {
            await pedidoService.agregarCincoMinutos(pedido);
            fetchPedidos();
            console.log("Hora estimada actualizada correctamente.");
        } catch (error) {
            console.error("Error al agregar 5 minutos:", error);
        }
    };

    const handleMarcarListo = (pedidoId: number) => {
        setPedidoParaMarcarListo(pedidoId);
        setShowConfirmListo(true);
    };

    const handleConfirmMarcarListo = async () => {
        if (!pedidoParaMarcarListo) return;
        try {
            setLoadingListo(true);
            const pedidoActual = pedidos.find(p => p.id === pedidoParaMarcarListo);
            if (!pedidoActual) return;
            const pedidoActualizado = {
                ...pedidoActual,
                estado: Estado.LISTO,
                empleado: empleado
            };
            await pedidoService.cambiarEstadoPedido(pedidoActualizado);
            setShowConfirmListo(false);
            setPedidoParaMarcarListo(null);
            fetchPedidos();
        } catch (error) {
            mostrarModalMensaje("Error al cambiar el estado del pedido", "danger", "Error");
            console.error(error);
        } finally {
            setLoadingListo(false);
        }
    };
    const marcarListoDirecto = async (pedidoId: number) => {
        try {
            setLoadingListo(true);
            const pedidoActual = pedidos.find(p => p.id === pedidoId);
            if (!pedidoActual) return;
            const pedidoActualizado = {
                ...pedidoActual,
                estado: Estado.LISTO,
                empleado: empleado
            };
            await pedidoService.cambiarEstadoPedido(pedidoActualizado);
            setShowModal(false);
            setPedidoSeleccionado(null);
            fetchPedidos();
        } catch (error) {
            mostrarModalMensaje("Error al cambiar el estado del pedido", "danger", "Error");
            console.error(error);
        } finally {
            setLoadingListo(false);
        }
    };

    const handleLimpiarFiltros = () => {
        setFiltros({
            ordenHora: "ASC",
            sucursalFiltro: ""
        });
        setPage(0);
    };

    const columns = [
        {
            key: "numero",
            label: "Número",
            render: (_: any, row: Pedido) => row.id
        },
        {
            key: "horaPedido",
            label: "Hora Pedido",
            render: (_: any, row: Pedido) => {
                const fecha = new Date(row.fechaPedido);
                return fecha.toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }
        },
        {
            key: "productos",
            label: "Productos",
            render: (_: any, row: Pedido) => `${contarProductos(row)} productos`
        },
        {
            key: "horaEstimada",
            label: "Hora Estimada Finalizacion",
            render: (_: any, row: Pedido) => calcularHoraEstimada(row)
        },
        // Columna de sucursal solo visible para admin cuando está en modo "todas las sucursales"
        ...(isAdmin && esModoTodasSucursales ? [{
            key: "sucursal",
            label: "Sucursal",
            render: (_: any, row: Pedido) => row.sucursal?.nombre || "No especificada"
        }] : []),
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: Pedido) => (
                <div className="d-flex gap-4 justify-content-center align-items-center">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleVerDetalle(row.id!)}
                        title="Ver detalle"
                    >
                        <Eye />
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleAgregar5Min(row)}
                        title="Agregar 5 minutos"
                    >
                        +5 min
                    </Button>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleMarcarListo(row.id!)}
                        title="Marcar como listo"
                    >
                        <CheckCircle />
                    </Button>
                </div>
            )
        }
    ];

    // Verificar permisos
    if (!isAdmin && !isCocinero) {
        return (
            <Card>
                <Card.Body>
                    <Card.Text className="text-center text-muted">
                        No tienes permisos para acceder a esta sección.
                    </Card.Text>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div className="container-fluid">
            {/* Filtros */}
            <div className="mb-3">
                <Form>
                    <div className="d-flex align-items-end flex-wrap gap-3">
                        {/* Filtro de orden por hora (visible para admin y cocinero) */}
                        <Form.Group className="d-flex align-items-center" style={{ minWidth: "200px" }}>
                            <Form.Label className="me-2 mb-0">Ordenar por hora:</Form.Label>
                            <Form.Select
                                value={filtros.ordenHora}
                                onChange={(e) => {
                                    setFiltros({ ...filtros, ordenHora: e.target.value });
                                    setPage(0);
                                }}
                            >
                                <option value="ASC">Temprano a tarde</option>
                                <option value="DESC">Tarde a temprano</option>
                            </Form.Select>
                        </Form.Group>

                        {/* Campo Sucursal (solo para admin en modo todas las sucursales) */}
                        {isAdmin && esModoTodasSucursales && (
                            <Form.Group className="d-flex align-items-center" style={{ minWidth: "280px" }}>
                                <Form.Label className="me-2 mb-0">Sucursal:</Form.Label>
                                <Form.Select
                                    value={filtros.sucursalFiltro}
                                    onChange={(e) => {
                                        setFiltros({ ...filtros, sucursalFiltro: e.target.value });
                                        setPage(0);
                                    }}
                                >
                                    <option value="">Todas</option>
                                    {sucursales.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        )}

                        {/* Botón limpiar filtros */}
                        <div>
                            <Button
                                variant="outline-secondary"
                                onClick={handleLimpiarFiltros}
                                disabled={filtros.ordenHora === "ASC" && !filtros.sucursalFiltro}
                            >
                                Limpiar Filtros
                            </Button>
                        </div>
                    </div>
                </Form>
            </div>

            {/* Tabla de pedidos */}
            <div className="p-3 border rounded bg-white shadow-sm">
                {loading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" />
                        <p className="mt-2">Cargando pedidos...</p>
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-muted mb-0">
                            {isCocinero
                                ? "No hay pedidos en preparación en este momento"
                                : "No hay pedidos en preparación para el contexto actual"
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Tabla */}
                        <div className="table-responsive">
                            <ReusableTable data={pedidos} columns={columns} />
                        </div>

                        {/* Paginación */}
                        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                            <div className="text-muted">
                                Mostrando {pedidos.length} pedidos
                                {isAdmin && filtros.sucursalFiltro && (
                                    <span> (con filtros aplicados)</span>
                                )}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                >
                                    <ChevronLeft />
                                </Button>
                                <span className="px-2">
                                    Página {page + 1} de {totalPages || 1}
                                </span>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(page + 1)}
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal de detalle - necesitarás crear CocinaModal similar a DeliveryModal */}
            <CocinaModal
                show={showModal}
                onHide={() => {
                    setShowModal(false);
                    setPedidoSeleccionado(null);
                    fetchPedidos();
                }}
                pedido={pedidoSeleccionado}
                onMarcarListo={marcarListoDirecto} // 👈 cambiamos la función
            />

            {/* Modal de confirmación para marcar como listo */}
            <Modal show={showConfirmListo} onHide={() => setShowConfirmListo(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Marcar pedido como listo</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Desea confirmar que el pedido está listo para entregar?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmListo(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleConfirmMarcarListo}
                        disabled={loadingListo}
                    >
                        {loadingListo ? "Procesando..." : "Marcar como Listo"}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ModalMensaje
                show={modalMensaje.show}
                onHide={() => setModalMensaje({ ...modalMensaje, show: false })}
                mensaje={modalMensaje.mensaje}
                titulo={modalMensaje.titulo}
                variante={modalMensaje.variante}
            />
        </div>
    );
};

export default GrillaCocina;