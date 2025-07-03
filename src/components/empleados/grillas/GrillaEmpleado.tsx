import { useEffect, useState } from "react";
import Empleado from "../../../models/Empleado.ts";
import {
    eliminarEmpleado,
    darDeAltaEmpleado,
    obtenerEmpleadoPorId,
    getEmpleadosFiltrados // <-- Nuevo import
} from "../../../services/EmpleadoService.ts";
import { ReusableTable } from "../../Tabla";
import BotonVer from "../../layout/botones/BotonVer.tsx";
import BotonEliminar from "../../layout/botones/BotonEliminar.tsx";
import BotonAlta from "../../layout/botones/BotonAlta.tsx";
import { Modal , Form, Button} from "react-bootstrap";
import BotonModificar from "../../layout/botones/BotonModificar.tsx";
import { useNavigate } from "react-router-dom";
import Sucursal from "../../../models/Sucursal.ts";
import { obtenerSucursales } from "../../../services/SucursalService.ts";
import FormDatosEmpleado from "../formularios/FormDatosEmpleado.tsx";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";

const GrillaEmpleado = () => {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("todos");
    const [rolFiltro, setRolFiltro] = useState("todos");
    const [ordenAsc, setOrdenAsc] = useState(true);
    const [sucursalFiltro, setSucursalFiltro] = useState("todas");

    // Estados para paginación
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const size = 10; // Tamaño de página fijo

    const navigate = useNavigate();
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditar, setShowEditar] = useState(false);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);

    // Estados para modal de confirmación y resultado
    const [showModalConfirmacion, setShowModalConfirmacion] = useState(false);
    const [showModalResultado, setShowModalResultado] = useState(false);
    const [accionPendiente, setAccionPendiente] = useState<{
        tipo: 'eliminar' | 'alta';
        empleadoId: number;
        empleadoNombre: string;
    } | null>(null);
    const [mensajeResultado, setMensajeResultado] = useState("");
    const [tipoResultado, setTipoResultado] = useState<'success' | 'error'>('success');
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        cargarSucursales();
    }, []);

    // Cargar empleados cuando cambien los filtros o la página
    useEffect(() => {
        cargarEmpleados();
    }, [search, estado, rolFiltro, ordenAsc, sucursalFiltro, page]);

    const cargarSucursales = async () => {
        try {
            const data = await obtenerSucursales();
            setSucursales(data);
        } catch (error) {
            console.error("Error al cargar sucursales", error);
        }
    };

    const cargarEmpleados = async () => {
        try {
            setLoading(true);

            // Preparar sucursalId
            let sucursalId: number | null = null;
            if (sucursalFiltro !== "todas") {
                sucursalId = parseInt(sucursalFiltro);
            }

            // Preparar filtros
            const filtros: {
                busqueda?: string;
                rol?: string;
                ordenar?: string;
                eliminado?: boolean;
            } = {};

            // Búsqueda unificada (nombre, apellido o email)
            if (search.trim() !== "") {
                filtros.busqueda = search.trim();
            }

            if (rolFiltro !== "todos") {
                filtros.rol = rolFiltro;
            }

            // Manejar correctamente el filtro de estado
            if (estado === "activos") {
                filtros.eliminado = false;
            } else if (estado === "inactivos") {
                filtros.eliminado = true;
            }
            // Si estado === "todos", no asignamos filtros.eliminado (queda undefined)

            // Configurar ordenamiento
            filtros.ordenar = ordenAsc ? "asc" : "desc";

            const result = await getEmpleadosFiltrados(
                sucursalId,
                filtros,
                page,
                size
            );

            setEmpleados(result.content);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Error al cargar empleados:", error);
            mostrarResultado("Error al cargar empleados", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEmpleadoSeleccionado(null);
    };

    const handleVer = async (empleado: Empleado) => {
        try {
            const data = await obtenerEmpleadoPorId(empleado.id!);
            setEmpleadoSeleccionado(data);
            setShowModal(true);
        } catch (err) {
            mostrarResultado("Error al obtener los datos del empleado", 'error');
        }
    };

    // Nuevas funciones para manejo de modales
    const mostrarConfirmacion = (tipo: 'eliminar' | 'alta', empleadoId: number, empleadoNombre: string) => {
        setAccionPendiente({
            tipo,
            empleadoId,
            empleadoNombre
        });
        setShowModalConfirmacion(true);
    };

    const mostrarResultado = (mensaje: string, tipo: 'success' | 'error') => {
        setMensajeResultado(mensaje);
        setTipoResultado(tipo);
        setShowModalResultado(true);
    };

    const ejecutarAccion = async () => {
        if (!accionPendiente) return;

        setProcesando(true);
        setShowModalConfirmacion(false);

        try {
            if (accionPendiente.tipo === 'eliminar') {
                await eliminarEmpleado(accionPendiente.empleadoId);
                mostrarResultado("Empleado eliminado correctamente", 'success');
            } else {
                await darDeAltaEmpleado(accionPendiente.empleadoId);
                mostrarResultado("Empleado dado de alta correctamente", 'success');
            }
            
            await cargarEmpleados();
        } catch (error) {
            const mensaje = accionPendiente.tipo === 'eliminar' 
                ? "Error al eliminar el empleado" 
                : "Error al dar de alta el empleado";
            mostrarResultado(mensaje, 'error');
        } finally {
            setProcesando(false);
            setAccionPendiente(null);
        }
    };

    const cancelarAccion = () => {
        setShowModalConfirmacion(false);
        setAccionPendiente(null);
    };

    const handleEliminar = (empleado: Empleado) => {
        mostrarConfirmacion('eliminar', empleado.id!, `${empleado.nombre} ${empleado.apellido}`);
    };

    const handleAlta = (empleado: Empleado) => {
        mostrarConfirmacion('alta', empleado.id!, `${empleado.nombre} ${empleado.apellido}`);
    };

    // Resetear página cuando cambien los filtros
    const handleFiltroChange = (callback: () => void) => {
        setPage(0);
        callback();
    };

    const columns = [
        {
            key: "imagen",
            label: "Imagen",
            render: (_: any, row: Empleado) =>
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
            render: (_: any, row: Empleado) => row.id,
        },
        {
            key: "nombreApellido",
            label: "Nombre y Apellido",
            render: (_: any, row: Empleado) => `${row.nombre} ${row.apellido}`,
        },
        {
            key: "email",
            label: "Email",
            render: (_: any, row: Empleado) => row.usuario?.email,
        },
        {
            key: "telefono",
            label: "Teléfono",
            render: (_: any, row: Empleado) => row.telefono,
        },
        {
            key: "rol",
            label: "Rol",
            render: (_: any, row: Empleado) => row.usuario?.rol,
        },
        {
            key: "sucursal",
            label: "Sucursal",
            render: (_: any, row: Empleado) => row.sucursal?.nombre || "Sin asignar",
        },
        {
            key: "estado",
            label: "Estado",
            render: (_: any, row: Empleado) => (row.eliminado ? "Inactivo" : "Activo"),
        },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: Empleado) => (
                <div className="d-flex justify-content-center gap-2">
                    <BotonVer onClick={() => handleVer(row)} />
                    <BotonModificar onClick={() => {
                        setEmpleadoSeleccionado(row);
                        setShowEditar(true);
                    }} />

                    {!row.eliminado ? (
                        <BotonEliminar onClick={() => handleEliminar(row)} />
                    ) : (
                        <BotonAlta onClick={() => handleAlta(row)} />
                    )}
                </div>
            ),
        }
    ];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center m-3">
                <h2>Empleados</h2>
                <Button variant="warning" onClick={() => navigate("/admin/nuevo-empleado/")}>
                    Nuevo Empleado
                </Button>
            </div>

            <div className="d-flex gap-3 mb-2 align-items-start">
                <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o email"
                    value={search}
                    onChange={(e) => handleFiltroChange(() => setSearch(e.target.value))}
                />

                <Form.Select
                    value={estado}
                    onChange={(e) => handleFiltroChange(() => setEstado(e.target.value))}
                >
                    <option value="todos">Todos</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </Form.Select>

                <Form.Select
                    value={rolFiltro}
                    onChange={(e) => handleFiltroChange(() => setRolFiltro(e.target.value))}
                >
                    <option value="todos">Todos los roles</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                    <option value="COCINERO">Cocinero</option>
                    <option value="CAJERO">Cajero</option>
                    <option value="DELIVERY">Delivery</option>
                </Form.Select>

                <Form.Select
                    value={sucursalFiltro}
                    onChange={(e) => handleFiltroChange(() => setSucursalFiltro(e.target.value))}
                >
                    <option value="todas">Todas las sucursales</option>
                    {sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                </Form.Select>

                <Button
                    variant="outline-secondary"
                    onClick={() => handleFiltroChange(() => setOrdenAsc(!ordenAsc))}
                >
                    Orden: {ordenAsc ? "A-Z" : "Z-A"}
                </Button>
            </div>

            {loading ? (
                <div className="text-center">
                    <p>Cargando empleados...</p>
                </div>
            ) : (
                <>
                    <ReusableTable data={empleados} columns={columns} />

                    {/* Paginación */}
                    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                        <div className="text-muted">
                            Mostrando {empleados.length} empleados
                            {(search || estado !== "todos" || rolFiltro !== "todos" || sucursalFiltro !== "todas") && (
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

            {/* Modal Ver Empleado */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Empleado # {empleadoSeleccionado?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {empleadoSeleccionado && (
                        <div className="container">
                            <div className="d-flex flex-column align-items-center mb-3">
                                <img
                                    src={empleadoSeleccionado.usuario.photoUrl}
                                    alt="Foto de perfil"
                                    className="rounded-circle"
                                    style={{ width: 100, height: 100, objectFit: "cover" }}
                                />
                            </div>

                            <div className="mb-3">
                                <p><b>Nombre:</b> {empleadoSeleccionado.nombre}</p>
                                <p><b>Apellido:</b> {empleadoSeleccionado.apellido}</p>
                                <p><b>DNI:</b> {empleadoSeleccionado.dni}</p>
                                <p><b>Teléfono:</b> {empleadoSeleccionado.telefono}</p>
                                <p><b>Email:</b> {empleadoSeleccionado.usuario.email}</p>
                                <p><b>Rol:</b> {empleadoSeleccionado.usuario.rol}</p>
                                <p><b>Sucursal:</b> {empleadoSeleccionado.sucursal?.nombre || "Sin asignar"}</p>
                                <p><b>Proveedor:</b> Contraseña</p>
                                <p><b>Fecha Nacimiento:</b> {empleadoSeleccionado.fechaNacimiento.split('-').reverse().join('/')}</p>
                                <p><b>Domicilio:</b> <b>{empleadoSeleccionado.domicilio.detalles || "Sin referencia"}:</b>{" "}
                                    {empleadoSeleccionado.domicilio.calle} {empleadoSeleccionado.domicilio.numero},{" "}
                                    Piso {empleadoSeleccionado.domicilio.piso}, Dpto. {empleadoSeleccionado.domicilio.nroDepartamento} –{" "}
                                    CP {empleadoSeleccionado.domicilio.codigoPostal} -{" "}
                                    {empleadoSeleccionado.domicilio.localidad.nombre},{" "}
                                    {empleadoSeleccionado.domicilio.localidad.provincia.nombre},{" "}
                                    {empleadoSeleccionado.domicilio.localidad.provincia.pais.nombre}</p>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Editar Empleado */}
            {empleadoSeleccionado && (
                <FormDatosEmpleado
                    show={showEditar}
                    onHide={() => setShowEditar(false)}
                    empleado={empleadoSeleccionado}
                    editableAdmin={true}
                    onEmpleadoActualizado={(empleadoActualizado) => {
                        // Recargar la grilla para reflejar los cambios
                        cargarEmpleados();
                        setShowEditar(false);
                    }}
                />
            )}

            {/* Modal de Confirmación */}
            <Modal 
                show={showModalConfirmacion} 
                onHide={cancelarAccion} 
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {accionPendiente?.tipo === 'eliminar' ? 'Confirmar Eliminación' : 'Confirmar Alta'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <div className={`mb-3 ${accionPendiente?.tipo === 'eliminar' ? 'text-danger' : 'text-success'}`}>
                            <i className={`bi ${accionPendiente?.tipo === 'eliminar' ? 'bi-exclamation-triangle' : 'bi-check-circle'} display-1`}></i>
                        </div>
                        <h5>
                            {accionPendiente?.tipo === 'eliminar' 
                                ? '¿Está seguro que desea eliminar este empleado?' 
                                : '¿Está seguro que desea dar de alta este empleado?'
                            }
                        </h5>
                        <p className="text-muted">
                            <strong>{accionPendiente?.empleadoNombre}</strong>
                        </p>
                        <p className="small text-muted">
                            {accionPendiente?.tipo === 'eliminar' 
                                ? 'Esta acción cambiará el estado del empleado a inactivo.' 
                                : 'Esta acción cambiará el estado del empleado a activo.'
                            }
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelarAccion} disabled={procesando}>
                        Cancelar
                    </Button>
                    <Button 
                        variant={accionPendiente?.tipo === 'eliminar' ? 'danger' : 'success'} 
                        onClick={ejecutarAccion}
                        disabled={procesando}
                    >
                        {procesando ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Procesando...
                            </>
                        ) : (
                            accionPendiente?.tipo === 'eliminar' ? 'Eliminar' : 'Dar de Alta'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Resultado */}
            <Modal 
                show={showModalResultado} 
                onHide={() => setShowModalResultado(false)} 
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {tipoResultado === 'success' ? 'Operación Exitosa' : 'Error'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <div className={`mb-3 ${tipoResultado === 'success' ? 'text-success' : 'text-danger'}`}>
                            <i className={`bi ${tipoResultado === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} display-1`}></i>
                        </div>
                        <h5>{mensajeResultado}</h5>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant={tipoResultado === 'success' ? 'success' : 'danger'} 
                        onClick={() => setShowModalResultado(false)}
                    >
                        Aceptar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default GrillaEmpleado;