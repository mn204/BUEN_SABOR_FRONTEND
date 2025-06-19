import { useEffect, useState } from "react";
import Cliente from "../../../models/Cliente.ts";
import {
    getClientesFiltrados,
    eliminarCliente,
    darDeAltaCliente,
    obtenerClientePorId
} from "../../../services/ClienteService.ts";
import { ReusableTable } from "../../Tabla";
import BotonVer from "../../layout/BotonVer.tsx";
import BotonEliminar from "../../layout/BotonEliminar.tsx";
import BotonAlta from "../../layout/BotonAlta.tsx";
import googleLogo from "../../../assets/google_logo.png";
import { Modal, Form, Button } from "react-bootstrap";
import { darDeAltaUsuario, eliminarUsuario } from "../../../services/UsuarioService.ts";
import PedidoClienteModal from "../modales/PedidoClienteModal.tsx";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import pedidoService from "../../../services/PedidoService";

const GrillaCliente = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("todos");
    const [ordenAsc, setOrdenAsc] = useState(true);
    // NUEVO: Estado para el tipo de ordenamiento
    const [tipoOrden, setTipoOrden] = useState<"nombre" | "pedidos">("nombre");
    const [loading, setLoading] = useState(false);
    const [pedidosPorCliente, setPedidosPorCliente] = useState<{ [clienteId: number]: number }>({});

    // Paginación
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const size = 10; // Tamaño de página fijo

    const [showPedidosModal, setShowPedidosModal] = useState(false);
    const [clientePedidos, setClientePedidos] = useState<Cliente | null>(null);

    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [mostrarDomicilios, setMostrarDomicilios] = useState(false);

    const cargarPedidosPorCliente = async (clientes: Cliente[]) => {
        // Solo cargar si no estamos ordenando por pedidos (ya que el backend ya los ordena)
        if (tipoOrden === "pedidos") return;

        const nuevosContadores: { [clienteId: number]: number } = {};
        await Promise.all(
            clientes.map(async (cliente) => {
                try {
                    const count = await pedidoService.getPedidosClienteCount(cliente.id!);
                    nuevosContadores[cliente.id!] = count;
                } catch (error) {
                    nuevosContadores[cliente.id!] = 0;
                }
            })
        );
        setPedidosPorCliente(nuevosContadores);
    };

    const handleVerPedidos = (cliente: Cliente) => {
        setClientePedidos(cliente);
        setShowPedidosModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setClienteSeleccionado(null);
        setMostrarDomicilios(false);
    };

    // ACTUALIZADO: Cargar clientes con filtros y paginación
    const cargarClientes = async () => {
        try {
            setLoading(true);

            // Preparar filtros
            const filtros: {
                busqueda?: string;
                ordenar?: string;
                ordenarPorPedidos?: string;
                eliminado?: boolean;
            } = {};

            // Búsqueda unificada (nombre, apellido o email)
            if (search.trim() !== "") {
                filtros.busqueda = search.trim();
            }

            // Manejar correctamente el filtro de estado
            if (estado === "activos") {
                filtros.eliminado = false;
            } else if (estado === "inactivos") {
                filtros.eliminado = true;
            }

            // NUEVO: Configurar ordenamiento según el tipo seleccionado
            if (tipoOrden === "nombre") {
                filtros.ordenar = ordenAsc ? "asc" : "desc";
            } else if (tipoOrden === "pedidos") {
                filtros.ordenarPorPedidos = ordenAsc ? "asc" : "desc";
            }

            const result = await getClientesFiltrados(
                filtros,
                page,
                size
            );

            setClientes(result.content);
            await cargarPedidosPorCliente(result.content);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Error al cargar clientes:", error);
            alert("Error al cargar clientes");
        } finally {
            setLoading(false);
        }
    };

    // ACTUALIZADO: Efecto para cargar clientes cuando cambian los filtros
    useEffect(() => {
        setPage(0); // Resetear a primera página cuando cambian los filtros
    }, [search, estado, ordenAsc, tipoOrden]);

    // Efecto para cargar clientes cuando cambia la página o los filtros
    useEffect(() => {
        cargarClientes();
    }, [page, search, estado, ordenAsc, tipoOrden]);

    const handleEliminar = async (id: number, idUsuario: number) => {
        if (!window.confirm("¿Seguro que desea eliminar este cliente?")) return;
        try {
            await eliminarCliente(id);
            await eliminarUsuario(idUsuario);
            await cargarClientes();
            alert("Cliente eliminado correctamente");
        } catch (error) {
            alert("Error al eliminar el cliente");
        }
    };

    const handleAlta = async (id: number, idUsuario: number) => {
        if (!window.confirm("¿Desea dar de alta este cliente?")) return;
        try {
            await darDeAltaCliente(id);
            await darDeAltaUsuario(idUsuario);
            await cargarClientes();
            alert("Cliente dado de alta correctamente");
        } catch (error) {
            alert("Error al dar de alta el cliente");
        }
    };

    const handleVer = async (cliente: Cliente) => {
        try {
            const data = await obtenerClientePorId(cliente.id!);
            setClienteSeleccionado(data);
            setShowModal(true);
        } catch (err) {
            alert("Error al obtener los datos del cliente");
        }
    };

    // NUEVO: Función para obtener el texto del botón de ordenamiento
    const getOrdenTexto = () => {
        if (tipoOrden === "nombre") {
            return `Nombre: ${ordenAsc ? "A-Z" : "Z-A"}`;
        } else {
            return `Pedidos: ${ordenAsc ? "Menos" : "Más"}`;
        }
    };

    const columns = [
        {
            key: "imagen",
            label: "Imagen",
            render: (_: any, row: Cliente) =>
                row.usuario.photoUrl ? (
                    <img
                        src={row.usuario.photoUrl}
                        alt="Foto"
                        style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px" }}
                    />
                ) : (
                    "Sin imagen"
                ),
        },
        {
            key: "id",
            label: "ID",
            render: (_: any, row: Cliente) => row.id,
        },
        {
            key: "nombreApellido",
            label: "Nombre y Apellido",
            render: (_: any, row: Cliente) => `${row.nombre} ${row.apellido}`,
        },
        {
            key: "email",
            label: "Email",
            render: (_: any, row: Cliente) => row.usuario?.email,
        },
        {
            key: "telefono",
            label: "Teléfono",
            render: (_: any, row: Cliente) => row.telefono,
        },
        {
            key: "pedidos",
            label: "Pedidos",
            render: (_: any, row: Cliente) => {
                // Si estamos ordenando por pedidos, no necesitamos cargar individualmente
                if (tipoOrden === "pedidos") {
                    return pedidosPorCliente[row.id!] !== undefined ? pedidosPorCliente[row.id!] : "...";
                }
                return pedidosPorCliente[row.id!] !== undefined ? pedidosPorCliente[row.id!] : "Cargando...";
            },
        },
        {
            key: "estado",
            label: "Estado",
            render: (_: any, row: Cliente) => (row.eliminado ? "Inactivo" : "Activo"),
        },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: Cliente) => (
                <div className="d-flex justify-content-center gap-2">
                    <BotonVer onClick={() => handleVer(row)} />
                    {!row.eliminado ? (
                        <BotonEliminar onClick={() => handleEliminar(row.id!, row.usuario.id)} />
                    ) : (
                        <BotonAlta onClick={() => handleAlta(row.id!, row.usuario.id)} />
                    )}
                </div>
            ),
        }
    ];

    return (
        <div>
            <h2 className="m-3">Clientes</h2>

            {/* ACTUALIZADO: Filtros con nuevos controles de ordenamiento */}
            <div className="d-flex gap-3 mb-2 align-items-start ">
                <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ minWidth: "200px" }}
                />

                <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)} style={{ minWidth: "120px" }}>
                    <option value="todos">Todos</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </Form.Select>

                {/* NUEVO: Selector de tipo de ordenamiento */}
                <Form.Select
                    value={tipoOrden}
                    onChange={(e) => setTipoOrden(e.target.value as "nombre" | "pedidos")}
                    style={{ minWidth: "150px" }}
                >
                    <option value="nombre">Ordenar por Nombre</option>
                    <option value="pedidos">Ordenar por Pedidos</option>
                </Form.Select>

                {/* ACTUALIZADO: Botón de ordenamiento con texto dinámico */}
                <Button
                    variant="outline-secondary"
                    onClick={() => setOrdenAsc(!ordenAsc)}
                    style={{ minWidth: "150px" }}
                >
                    {getOrdenTexto()}
                </Button>
            </div>

            {/* Tabla con loading */}
            {loading ? (
                <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : (
                <>
                    <ReusableTable data={clientes} columns={columns} />

                    {/* Paginación */}
                    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                        <div className="text-muted">
                            Mostrando {clientes.length} clientes
                            {(search || estado !== "todos") && (
                                <span> (con filtros aplicados)</span>
                            )}
                            {/* NUEVO: Indicador del tipo de ordenamiento actual */}
                            <span className="ms-2 badge bg-secondary">
                                Ordenado por: {tipoOrden === "nombre" ? "Nombre" : "Cantidad de Pedidos"}
                            </span>
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

            {/* Modal de detalles del cliente */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Cliente # {clienteSeleccionado?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {clienteSeleccionado && (
                        <div className="container">
                            <div className="d-flex flex-column align-items-center mb-3">
                                <img
                                    src={
                                        clienteSeleccionado.usuario.providerId === "google.com"
                                            ? googleLogo
                                            : clienteSeleccionado.usuario.photoUrl
                                    }
                                    alt="Foto de perfil"
                                    className="rounded-circle"
                                    style={{ width: 100, height: 100, objectFit: "cover" }}
                                />
                            </div>

                            <div className="mb-3">
                                <p><b>Nombre:</b> {clienteSeleccionado.nombre}</p>
                                <p><b>Apellido:</b> {clienteSeleccionado.apellido}</p>
                                <p><b>DNI:</b> {clienteSeleccionado.usuario.dni}</p>
                                <p><b>Teléfono:</b> {clienteSeleccionado.telefono}</p>
                                <p><b>Email:</b> {clienteSeleccionado.usuario.email}</p>
                                <p><b>Proveedor:</b> {clienteSeleccionado.usuario.providerId === "google.com" ? "Google" : "Contraseña"}</p>
                                <p><b>Fecha Nacimiento:</b> {clienteSeleccionado.fechaNacimiento.split('-').reverse().join('/')}</p>
                            </div>

                            <div className="mt-3">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setMostrarDomicilios(prev => !prev)}
                                    className="mb-2"
                                >
                                    {mostrarDomicilios ? "Ocultar domicilios" : "Mostrar domicilios"}
                                </Button>

                                {mostrarDomicilios && (
                                    <ul className="list-group">
                                        {clienteSeleccionado.domicilios.map((dom, idx) => (
                                            <li key={idx} className="list-group-item">
                                                <span>
                                                    <b>{dom.detalles || "Sin referencia"}:</b> {dom.calle} {dom.numero}, CP {dom.codigoPostal} - {dom.localidad.nombre}, {dom.localidad.provincia.nombre}, {dom.localidad.provincia.pais.nombre}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="mt-4 text-center">
                                <Button variant="primary" onClick={() => handleVerPedidos(clienteSeleccionado!)}>
                                    Ver Pedidos
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de pedidos del cliente */}
            {clientePedidos && (
                <PedidoClienteModal
                    show={showPedidosModal}
                    onHide={() => setShowPedidosModal(false)}
                    cliente={clientePedidos}
                />
            )}
        </div>
    );
};

export default GrillaCliente;