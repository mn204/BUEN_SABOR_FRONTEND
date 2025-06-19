import React, { useEffect, useState } from "react";
import { Button, Form, Row, Col, Spinner, Card } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pedido from "../../../models/Pedido.ts";
import Estado from "../../../models/enums/Estado.ts";
import PedidoDetalleModal from "../modales/PedidoDetalleModal.tsx";
import pedidoService from "../../../services/PedidoService.ts";
import { ReusableTable } from "../../Tabla";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import Cliente from "../../../models/Cliente.ts";
import { useAuth } from "../../../context/AuthContext.tsx";
import { useSucursal } from "../../../context/SucursalContextEmpleado.tsx";
import { obtenerSucursales } from "../../../services/SucursalService.ts";
import type Sucursal from "../../../models/Sucursal.ts";
import SelectDeliveryModal from '../modales/ModalDeliverySeleccion.tsx';
import Empleado from '../../../models/Empleado.ts';
import Rol from '../../../models/enums/Rol.ts';
import dayjs from 'dayjs';
interface Props {
    cliente?: Cliente;
}

const GrillaPedidos: React.FC<Props> = ({ cliente }) => {
    const [loadingEstados, setLoadingEstados] = useState<Record<number, boolean>>({});
    const { sucursalActual, sucursalIdSeleccionada } = useSucursal();
    const { empleado, usuario } = useAuth();

    const getColorEstado = (estado: Estado): string => {
        switch (estado) {
            case Estado.PENDIENTE: return "warning";
            case Estado.PREPARACION: return "info";
            case Estado.LISTO: return "primary";
            case Estado.EN_DELIVERY: return "secondary";
            case Estado.ENTREGADO: return "success";
            case Estado.CANCELADO: return "danger";
            default: return "light";
        }
    };

    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [loading, setLoading] = useState(false);
    const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [estadoSeleccionado, setEstadoSeleccionado] = useState<Record<number, Estado>>({});
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [empleadosDelivery, setEmpleadosDelivery] = useState<Empleado[]>([]);
    const [pedidoEnProceso, setPedidoEnProceso] = useState<Pedido | null>(null);


    // Estados para exportación a Excel (solo admin)
    const [pedidosSeleccionados, setPedidosSeleccionados] = useState<Map<number, Pedido>>(new Map());
    const [modoSeleccion, setModoSeleccion] = useState(false);

    const [filtros, setFiltros] = useState({
        sucursalId: "",
        estado: "",
        desde: null as Date | null,
        hasta: null as Date | null,
        idPedido: undefined as number | undefined,
        clienteNombre: "",
        pagado: ""
    });

    const fetchPedidos = async () => {
        const sucursalId = usuario?.rol === 'ADMINISTRADOR' && filtros.sucursalId
            ? parseInt(filtros.sucursalId)
            : sucursalIdSeleccionada;

        try {
            setLoading(true);
            const filtrosConvertidos = {
                estado: filtros.estado || undefined,
                clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : (filtros.clienteNombre || undefined),
                fechaDesde: filtros.desde ? filtros.desde.toISOString() : undefined,
                fechaHasta: filtros.hasta ? filtros.hasta.toISOString() : undefined,
                pagado: filtros.pagado === "" ? undefined : filtros.pagado === "true"
            };

            // Agregamos el parámetro de orden descendente por fecha
            const result = await pedidoService.getPedidosFiltrados(
                sucursalId,
                filtrosConvertidos,
                page,
                size,
            );
            setPedidos(result.content);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            alert("Error al obtener pedidos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchSucursales = async () => {
            if (usuario?.rol === 'ADMINISTRADOR') {
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
    }, [usuario]);

    useEffect(() => {
        // Los empleados regulares necesitan sucursal, los admin pueden ver todas
        if (usuario?.rol === 'ADMINISTRADOR' || sucursalActual?.id) {
            fetchPedidos();
        }
    }, [page, sucursalIdSeleccionada, filtros.estado, filtros.desde, filtros.hasta, filtros.idPedido, filtros.clienteNombre, filtros.sucursalId, filtros.pagado]);

    const handleVerDetalle = async (pedidoId: number) => {
        try {
            let detalle;
            if (cliente?.id) {
                detalle = await pedidoService.getDetallePedido(cliente.id, pedidoId);
            } else {
                const pedido = pedidos.find(p => p.id === pedidoId);
                if (pedido?.cliente?.id) {
                    detalle = await pedidoService.getDetallePedido(pedido.cliente.id, pedidoId);
                } else {
                    throw new Error("No se pudo determinar el cliente del pedido");
                }
            }
            setDetallePedido(detalle);
            setShowDetalleModal(true);
        } catch (error) {
            console.error("Error al obtener detalle:", error);
            alert("Error al obtener detalle del pedido");
        }
    };

    const handleCambiarEstado = async (pedidoId: number, nuevoEstado: Estado) => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) return;

        // Verificar si el cambio es a EN_DELIVERY
        if (nuevoEstado === Estado.EN_DELIVERY) {
            // Para ADMIN: puede cambiar desde cualquier estado
            // Para CAJERO: solo puede cambiar desde LISTO
            if (usuario?.rol === 'ADMINISTRADOR' ||
                (usuario?.rol === 'CAJERO' && pedido.estado === Estado.LISTO)) {
                try {
                    if (!pedido.sucursal?.id) {
                        throw new Error('El pedido no tiene una sucursal válida asignada');
                    }

                    const deliverys = await pedidoService.obtenerEmpleadosPorSucursalYRol(
                        pedido.sucursal.id,
                        Rol.DELIVERY
                    );

                    if (deliverys.length === 0) {
                        throw new Error('No hay empleados delivery disponibles en esta sucursal');
                    }

                    setEmpleadosDelivery(deliverys);
                    setPedidoEnProceso(pedido);
                    setShowDeliveryModal(true);
                } catch (error: any) {
                    console.error('Error al cargar empleados delivery:', error);
                    alert(error.message || 'Error al cargar lista de deliverys disponibles');
                }
                return;
            } else {
                alert('No tienes permisos para cambiar a estado EN_DELIVERY desde este estado');
                return;
            }
        }

        // Para otros cambios de estado que no sean a EN_DELIVERY
        try {
            setLoadingEstados(prev => ({
                ...prev,
                [pedidoId]: true
            }));

            const pedidoActualizado = {
                ...pedido,
                estado: nuevoEstado
            };

            await pedidoService.cambiarEstadoPedido(pedidoActualizado);

            // Actualizar estado local
            setPedidos(prev => prev.map(p =>
                p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
            ));

        } catch (error) {
            console.error('Error al cambiar estado:', error);
            alert('Error al cambiar el estado del pedido');
        } finally {
            setLoadingEstados(prev => ({
                ...prev,
                [pedidoId]: false
            }));
        }
    };

    // Agregar función para procesar el cambio con delivery
    const handleConfirmarDelivery = async (empleadoDelivery: Empleado) => {
        if (!pedidoEnProceso) return;

        try {
            setLoadingEstados(prev => ({
                ...prev,
                [pedidoEnProceso.id!]: true
            }));

            const pedidoActualizado = {
                ...pedidoEnProceso,
                estado: Estado.EN_DELIVERY,
                empleado: empleadoDelivery
            };

            await pedidoService.cambiarEstadoPedido(pedidoActualizado);

            // Actualizar estado local
            setPedidos(prev => prev.map(p =>
                p.id === pedidoEnProceso.id
                    ? { ...p, estado: Estado.EN_DELIVERY, empleado: empleadoDelivery }
                    : p
            ));

            setShowDeliveryModal(false);
            setPedidoEnProceso(null);

        } catch (error) {
            console.error('Error al asignar delivery:', error);
            alert('Error al asignar el delivery al pedido');
        } finally {
            setLoadingEstados(prev => ({
                ...prev,
                [pedidoEnProceso.id!]: false
            }));
        }
    };


    const handleMarcarPagado = async (pedidoId: number) => {
        try {
            const pedidoActualizado = await pedidoService.marcarComoPagado(pedidoId);

            // Actualizar el estado local con el objeto devuelto
            setPedidos(prev =>
                prev.map(p =>
                    p.id === pedidoId ? { ...p, pagado: pedidoActualizado.pagado } : p
                )
            );
        } catch (error) {
            console.error("Error al marcar como pagado:", error);
            alert("Error al marcar el pedido como pagado");
        }
    };

    const handleDescargarFactura = async (pedidoId: number) => {
        try {
            let clienteId;
            if (cliente?.id) {
                clienteId = cliente.id;
            } else {
                const pedido = pedidos.find(p => p.id === pedidoId);
                clienteId = pedido?.cliente?.id;
            }

            if (!clienteId) {
                throw new Error("No se pudo determinar el cliente del pedido");
            }

            const blob = await pedidoService.descargarFactura(clienteId, pedidoId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `factura_pedido_${pedidoId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al descargar factura:", error);
            alert("Error al descargar la factura");
        }
    };

    // Función para limpiar todos los filtros
    const handleVerTodos = () => {
        setFiltros({
            sucursalId: "",
            estado: "",
            desde: null,
            hasta: null,
            idPedido: undefined,
            clienteNombre: "",
            pagado: ""
        });
        setPage(0);
    };

    // Funciones para exportación a Excel (solo admin)
    const handleToggleSeleccion = (pedidoId: number) => {
        setPedidosSeleccionados(prev => {
            const newMap = new Map(prev);
            if (newMap.has(pedidoId)) {
                newMap.delete(pedidoId);
            } else {
                const pedido = pedidos.find(p => p.id === pedidoId);
                if (pedido) {
                    newMap.set(pedidoId, pedido);
                }
            }
            return newMap;
        });
    };

    /*
    const handleSeleccionarTodos = () => {
        const pedidosActualesSeleccionados = pedidos.filter(p => pedidosSeleccionados.has(p.id!));

        if (pedidosActualesSeleccionados.length === pedidos.length) {
            // Deseleccionar todos los de esta página
            setPedidosSeleccionados(prev => {
                const newMap = new Map(prev);
                pedidos.forEach(p => newMap.delete(p.id!));
                return newMap;
            });
        } else {
            // Seleccionar todos los de esta página
            setPedidosSeleccionados(prev => {
                const newMap = new Map(prev);
                pedidos.forEach(p => newMap.set(p.id!, p));
                return newMap;
            });
        }
    };
    */

    const handleExportarExcel = async () => {
        try {
            setLoading(true);
            // Exporta todos los pedidos filtrados (no solo los de la página actual)
            const sucursalId = usuario?.rol === 'ADMINISTRADOR' && filtros.sucursalId
                ? parseInt(filtros.sucursalId)
                : sucursalIdSeleccionada;

            const filtrosConvertidos = {
                estado: filtros.estado || undefined,
                clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : (filtros.clienteNombre || undefined),
                fechaDesde: filtros.desde ? filtros.desde.toISOString() : undefined,
                fechaHasta: filtros.hasta ? filtros.hasta.toISOString() : undefined,
                pagado: filtros.pagado === "" ? undefined : filtros.pagado === "true"
            };

            // Llama a un método que exporte todos los pedidos filtrados (sin paginación)
            const blob = await pedidoService.exportarPedidosFiltrados(
                sucursalId,
                filtrosConvertidos,
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "pedidos.xlsx";
            a.click();
            window.URL.revokeObjectURL(url);
            alert("Exportando pedidos filtrados a Excel...");
        } catch (error) {
            console.error("Error al exportar Excel:", error);
            alert("Error al exportar a Excel");
        } finally {
            setLoading(false);
        }
    };

    /*
    const handleCancelarSeleccion = () => {
        setPedidosSeleccionados(new Map());
        setModoSeleccion(false);
    };
    */
    const getEstadosDisponibles = (estadoActual: Estado): Estado[] => {
        if (usuario?.rol === 'ADMINISTRADOR') {
            return Object.values(Estado);
        }

        if (usuario?.rol === 'CAJERO') {
            switch (estadoActual) {
                case Estado.PENDIENTE:
                    return [Estado.PENDIENTE, Estado.CANCELADO, Estado.PREPARACION, Estado.LISTO, Estado.EN_DELIVERY, Estado.ENTREGADO];
                case Estado.PREPARACION:
                    return [Estado.PREPARACION, Estado.LISTO];
                case Estado.LISTO:
                    return [Estado.LISTO, Estado.EN_DELIVERY, Estado.ENTREGADO];
                case Estado.EN_DELIVERY:
                    return [Estado.EN_DELIVERY, Estado.ENTREGADO];
                case Estado.ENTREGADO:
                case Estado.CANCELADO:
                default:
                    return [estadoActual]; // Solo puede ver el estado actual
            }
        }

        return [estadoActual]; // Por defecto, solo el estado actual
    };
    const isBotonCambioDeshabilitado = (estadoActual: Estado): boolean => {
        if (usuario?.rol === 'ADMINISTRADOR') {
            return false;
        }

        if (usuario?.rol === 'CAJERO') {
            return estadoActual === Estado.EN_DELIVERY || estadoActual === Estado.PREPARACION;
        }

        return true; // Por defecto, deshabilitado para otros roles
    };

    const columns = [
        // Columna de selección solo para admin en modo selección
        ...(usuario?.rol === 'ADMINISTRADOR' && modoSeleccion ? [{
            key: "seleccion",
            label: "",
            render: (_: any, row: Pedido) => (
                <Form.Check
                    type="checkbox"
                    checked={pedidosSeleccionados.has(row.id!)}
                    onChange={() => handleToggleSeleccion(row.id!)}
                />
            )
        }] : []),
        { key: "numero", label: "Número", render: (_: any, row: Pedido) => row.id },
        { key: "cliente", label: "Cliente", render: (_: any, row: Pedido) => `${row.cliente?.nombre} ${row.cliente?.apellido}` },
        { key: "fecha", label: "Fecha", render: (_: any, row: Pedido) => dayjs(row.fechaPedido).format("DD/MM/YYYY HH:mm") },
        { key: "total", label: "Total", render: (_: any, row: Pedido) => `$${row.total.toFixed(2)}` },
        { key: "tipoPago", label: "Medio de Pago", render: (_: any, row: Pedido) => row.formaPago },
        { key: "pagado", label: "Pagado", render: (_: any, row: Pedido) => row.pagado ? "SI" : "NO" },
        { key: "estado", label: "Estado", render: (_: any, row: Pedido) => row.estado },
        { key: "sucursal", label: "Sucursal", render: (_: any, row: Pedido) => row.sucursal.nombre },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: Pedido) => {
                const estadosDisponibles = getEstadosDisponibles(row.estado);
                const botonDeshabilitado = isBotonCambioDeshabilitado(row.estado);
                const isLoadingEstado = loadingEstados[row.id!] || false;
                return (
                    <div className="d-flex flex-column gap-1">
                        <div className="d-flex gap-2 align-items-center">
                            <Form.Select
                                size="sm"
                                className={`border-${getColorEstado(row.estado)}`}
                                value={estadoSeleccionado[row.id!] || row.estado}
                                onChange={(e) => setEstadoSeleccionado({ ...estadoSeleccionado, [row.id!]: e.target.value as Estado })}
                                disabled={botonDeshabilitado || isLoadingEstado}
                            >
                                {estadosDisponibles.map((estado) => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </Form.Select>
                            <Button
                                size="sm"
                                variant={getColorEstado(estadoSeleccionado[row.id!] || row.estado)}
                                onClick={() => handleCambiarEstado(row.id!, estadoSeleccionado[row.id!] || row.estado)}
                                disabled={botonDeshabilitado || !estadoSeleccionado[row.id!] || estadoSeleccionado[row.id!] === row.estado || isLoadingEstado}
                            >
                                {isLoadingEstado ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Cambiando estado...</span>
                                        </div>
                                        Cambiando Estado...
                                    </>
                                ) : (
                                    'Cambiar'
                                )}
                            </Button>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="primary" size="sm" onClick={() => handleVerDetalle(row.id!)}>Detalle</Button>
                            <Button variant="outline-secondary" size="sm" onClick={() => handleDescargarFactura(row.id!)}>Factura</Button>
                            {!row.pagado && row.estado !== Estado.CANCELADO && (
                                <Button variant="success" size="sm" onClick={() => handleMarcarPagado(row.id!)}>Pagado ✓</Button>
                            )}
                        </div>
                    </div>
                );
            }
        }
    ];

    return (
        <>
            <Card>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">
                            {cliente ? `Pedidos del Cliente #${cliente.id} - ${cliente.nombre} ${cliente.apellido}` : 'Gestión de Pedidos'}
                        </Card.Title>
                        {/* Botón de exportar Excel solo para admin y sin selección */}
                        {usuario?.rol === 'ADMINISTRADOR' && !cliente && (
                            <Button
                                variant="success"
                                size="sm"
                                onClick={handleExportarExcel}
                                disabled={pedidos.length === 0}
                            >
                                📊 Exportar Excel
                            </Button>
                        )}
                    </div>
                </Card.Header>
                <Card.Body>
                    <Form className="mb-3">
                        <Row>
                            {!cliente && (
                                <Col>
                                    <Form.Control
                                        placeholder="Cliente"
                                        value={filtros.clienteNombre}
                                        onChange={(e) => setFiltros({ ...filtros, clienteNombre: e.target.value })}
                                    />
                                </Col>
                            )}
                            <Col>
                                <Form.Select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
                                    <option value="">Estados</option>
                                    {Object.values(Estado).map((est) => (
                                        <option key={est} value={est}>{est}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col>
                                <DatePicker
                                    className="form-control"
                                    placeholderText="Desde"
                                    selected={filtros.desde}
                                    onChange={(date) => setFiltros({ ...filtros, desde: date })}
                                    showTimeSelect
                                    dateFormat="Pp"
                                />
                            </Col>
                            <Col>
                                <DatePicker
                                    className="form-control"
                                    placeholderText="Hasta"
                                    selected={filtros.hasta}
                                    onChange={(date) => setFiltros({ ...filtros, hasta: date })}
                                    showTimeSelect
                                    dateFormat="Pp"
                                />
                            </Col>
                            <Col>
                                <Form.Select value={filtros.pagado} onChange={(e) => setFiltros({ ...filtros, pagado: e.target.value })}>
                                    <option value="">Todos (pagado/no pagado)</option>
                                    <option value="true">SI (Pagado)</option>
                                    <option value="false">NO (No pagado)</option>
                                </Form.Select>
                            </Col>
                            <Col>
                                <Form.Control
                                    type="number"
                                    placeholder="ID Pedido"
                                    value={filtros.idPedido || ""}
                                    onChange={(e) => setFiltros({ ...filtros, idPedido: e.target.value ? parseInt(e.target.value) : undefined })}
                                />
                            </Col>
                            <Col>
                                <Button variant="outline-secondary" onClick={handleVerTodos}>Ver Todos</Button>
                            </Col>
                        </Row>
                    </Form>

                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        pedidos.length === 0 ? (
                            <p className="text-center">No hay pedidos</p>
                        ) : (
                            <>
                                <ReusableTable data={pedidos} columns={columns} />
                                <div className="d-flex justify-content-end mt-3">
                                    <Button variant="outline-secondary" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                                        <ChevronLeft />
                                    </Button>
                                    <span className="mx-2 align-self-center">Página {page + 1} de {totalPages}</span>
                                    <Button variant="outline-secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                                        <ChevronRight />
                                    </Button>
                                </div>
                            </>
                        )
                    )}
                </Card.Body>
            </Card>

            {detallePedido && (
                <PedidoDetalleModal
                    show={showDetalleModal}
                    onHide={() => setShowDetalleModal(false)}
                    pedido={detallePedido}
                />
            )}
            <SelectDeliveryModal
                show={showDeliveryModal}
                onHide={() => {
                    setShowDeliveryModal(false);
                    setPedidoEnProceso(null);
                }}
                onConfirm={handleConfirmarDelivery}
                pedido={pedidoEnProceso!}
                empleadosDelivery={empleadosDelivery}
            />
        </>
    );
};

export default GrillaPedidos;