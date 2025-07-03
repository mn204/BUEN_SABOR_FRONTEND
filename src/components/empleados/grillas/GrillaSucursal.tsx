import { useEffect, useState } from "react";
import Sucursal from "../../../models/Sucursal.ts";
import Empresa from "../../../models/Empresa.ts";
import Localidad from "../../../models/Localidad.ts";
import { obtenerSucursales } from "../../../services/SucursalService.ts";
import SucursalService from "../../../services/SucursalService.ts"; // NUEVO IMPORT
import EmpresaService from "../../../services/EmpresaService.ts";
import { obtenerLocalidades } from "../../../services/LocalizacionService.ts";
import { ReusableTable } from "../../Tabla";
import BotonVer from "../../layout/botones/BotonVer.tsx";
import BotonEliminar from "../../layout/botones/BotonEliminar.tsx";
import BotonAlta from "../../layout/botones/BotonAlta.tsx";
import BotonModificar from "../../layout/botones/BotonModificar.tsx";
import { Modal, Form, Button, Card } from "react-bootstrap";
import ModalSucursal from "../modales/ModalSucursal"; // Ajusta la ruta según tu estructura

const GrillaSucursal = () => {
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [sucursalesFiltradas, setSucursalesFiltradas] = useState<Sucursal[]>([]);
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModalFormulario, setShowModalFormulario] = useState(false);
    const [sucursalIdEdicion, setSucursalIdEdicion] = useState<number | null>(null);

    // Estados para filtros
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos"); // todos, activas, inactivas
    const [casaMatrizFiltro, setCasaMatrizFiltro] = useState("todos"); // todos, si, no
    const [localidadFiltro, setLocalidadFiltro] = useState("todas");
    const [ordenAsc, setOrdenAsc] = useState(true);

    // Estados para modal de ver detalle
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState<Sucursal | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Estados para modal de confirmación y resultado - NUEVOS
    const [showModalConfirmacion, setShowModalConfirmacion] = useState(false);
    const [showModalResultado, setShowModalResultado] = useState(false);
    const [accionPendiente, setAccionPendiente] = useState<{
        tipo: 'eliminar' | 'alta';
        sucursalId: number;
        sucursalNombre: string;
    } | null>(null);
    const [mensajeResultado, setMensajeResultado] = useState("");
    const [tipoResultado, setTipoResultado] = useState<'success' | 'error'>('success');
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [sucursales, search, estadoFiltro, casaMatrizFiltro, localidadFiltro, ordenAsc]);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Cargar empresa (ID fijo 1)
            const empresaData = await EmpresaService.getEmpresaById(1);
            setEmpresa(empresaData);

            // Cargar sucursales
            const sucursalesData = await obtenerSucursales();
            setSucursales(sucursalesData);

            // Cargar localidades
            const localidadesData = await obtenerLocalidades();
            setLocalidades(localidadesData);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            mostrarResultado("Error al cargar datos", 'error'); // ACTUALIZADO
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let resultado = [...sucursales];

        // Filtro por nombre
        if (search.trim() !== "") {
            resultado = resultado.filter(sucursal =>
                sucursal.nombre?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Filtro por estado (activa/inactiva)
        if (estadoFiltro === "activas") {
            resultado = resultado.filter(sucursal => !sucursal.eliminado);
        } else if (estadoFiltro === "inactivas") {
            resultado = resultado.filter(sucursal => sucursal.eliminado);
        }

        // Filtro por casa matriz
        if (casaMatrizFiltro === "si") {
            resultado = resultado.filter(sucursal => sucursal.casaMatriz);
        } else if (casaMatrizFiltro === "no") {
            resultado = resultado.filter(sucursal => !sucursal.casaMatriz);
        }

        // Filtro por localidad
        if (localidadFiltro !== "todas") {
            resultado = resultado.filter(sucursal =>
                sucursal.domicilio?.localidad?.id === parseInt(localidadFiltro)
            );
        }

        // Ordenamiento por nombre
        resultado.sort((a, b) => {
            const nombreA = a.nombre?.toLowerCase() || "";
            const nombreB = b.nombre?.toLowerCase() || "";

            if (ordenAsc) {
                return nombreA.localeCompare(nombreB);
            } else {
                return nombreB.localeCompare(nombreA);
            }
        });

        setSucursalesFiltradas(resultado);
    };

    const handleVer = (sucursal: Sucursal) => {
        setSucursalSeleccionada(sucursal);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSucursalSeleccionada(null);
    };

    // Nuevas funciones para manejo de modales - NUEVAS
    const mostrarConfirmacion = (tipo: 'eliminar' | 'alta', sucursalId: number, sucursalNombre: string) => {
        setAccionPendiente({
            tipo,
            sucursalId,
            sucursalNombre
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
                await SucursalService.eliminar(accionPendiente.sucursalId);
                mostrarResultado("Sucursal eliminada correctamente", 'success');
            } else {
                await SucursalService.darDeAlta(accionPendiente.sucursalId);
                mostrarResultado("Sucursal dada de alta correctamente", 'success');
            }

            // Recargar datos después de la operación
            await cargarDatos();
        } catch (error) {
            const mensaje = accionPendiente.tipo === 'eliminar'
                ? "Error al eliminar la sucursal"
                : "Error al dar de alta la sucursal";
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

    // ACTUALIZADO: Funciones handleEliminar y handleAlta
    const handleEliminar = (sucursal: Sucursal) => {
        mostrarConfirmacion('eliminar', sucursal.id!, sucursal.nombre!);
    };

    const handleAlta = (sucursal: Sucursal) => {
        mostrarConfirmacion('alta', sucursal.id!, sucursal.nombre!);
    };

    const handleModificar = (sucursal: Sucursal) => {
        setSucursalIdEdicion(sucursal.id!);
        setShowModalFormulario(true);
    };


    const handleNuevaSucursal = () => {
        setSucursalIdEdicion(null);
        setShowModalFormulario(true);
    };

    const handleSucursalGuardada = async () => {
        // Cerrar modal
        setShowModalFormulario(false);
        setSucursalIdEdicion(null);

        // Recargar datos
        await cargarDatos();

        // Mostrar mensaje de éxito
        const mensaje = sucursalIdEdicion
            ? "Sucursal actualizada correctamente"
            : "Sucursal creada correctamente";
        mostrarResultado(mensaje, 'success');
    };

    const handleCerrarModalFormulario = () => {
        setShowModalFormulario(false);
        setSucursalIdEdicion(null);
    };

    const formatearDomicilio = (sucursal: Sucursal) => {
        if (!sucursal.domicilio) return "Sin domicilio";

        const { calle, numero, localidad } = sucursal.domicilio;
        return `${calle} ${numero}, ${localidad?.nombre || "Sin localidad"}`;
    };

    const formatearHorario = (horario?: string) => {
        if (!horario) return "No definido";

        // Si es 00:00:00, mostrar "24hs"
        if (horario === "00:00:00") return "24hs";

        // Formatear horario normal (HH:MM:SS -> HH:MM)
        const partes = horario.split(":");
        return `${partes[0]}:${partes[1]}`;
    };

    const columns = [
        {
            key: "nombre",
            label: "Nombre",
            render: (_: any, row: Sucursal) => row.nombre,
        },
        {
            key: "horarioApertura",
            label: "Horario Apertura",
            render: (_: any, row: Sucursal) => formatearHorario(row.horarioApertura),
        },
        {
            key: "horarioCierre",
            label: "Horario Cierre",
            render: (_: any, row: Sucursal) => formatearHorario(row.horarioCierre),
        },
        {
            key: "casaMatriz",
            label: "Casa Matriz",
            render: (_: any, row: Sucursal) => (
                <span className={`badge ${row.casaMatriz ? 'bg-success' : 'bg-secondary'}`}>
                    {row.casaMatriz ? "Sí" : "No"}
                </span>
            ),
        },
        {
            key: "domicilio",
            label: "Domicilio",
            render: (_: any, row: Sucursal) => formatearDomicilio(row),
        },
        {
            key: "estado",
            label: "Estado",
            render: (_: any, row: Sucursal) => (
                <span className={`badge ${!row.eliminado ? 'bg-success' : 'bg-danger'}`}>
                    {!row.eliminado ? "Activa" : "Inactiva"}
                </span>
            ),
        },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: Sucursal) => (
                <div className="d-flex justify-content-center gap-2">
                    <BotonVer onClick={() => handleVer(row)} />
                    <BotonModificar onClick={() => handleModificar(row)} />
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
            {/* Información de la empresa */}
            {empresa && (
                <div className="col-md-10 mx-auto">
                    <Card className="p-1 m-1">
                        <Card.Body>
                            <Card.Title className="mb-3">Información de la Empresa</Card.Title>
                            <div className="row">
                                <div className="col-md-4">
                                    <p><strong>Nombre:</strong> {empresa.nombre}</p>
                                </div>
                                <div className="col-md-4">
                                    <p><strong>Razón Social:</strong> {empresa.razonSocial}</p>
                                </div>
                                <div className="col-md-4">
                                    <p><strong>CUIL:</strong> {empresa.cuil}</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            )}

            {/* Título y botón nueva sucursal */}
            <div className="d-flex justify-content-between align-items-center m-3">
                <h2>Sucursales</h2>
                <Button variant="warning" onClick={handleNuevaSucursal}>
                    Nueva Sucursal
                </Button>
            </div>

            {/* Filtros */}
            <div className="d-flex gap-2 mb-3 align-items-center flex-nowrap overflow-auto">
                <Form.Control
                    type="text"
                    placeholder="Buscar por nombre"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ minWidth: "180px" }}
                />

                <Form.Select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    style={{ minWidth: "130px" }}
                >
                    <option value="todos">Todas</option>
                    <option value="activas">Activas</option>
                    <option value="inactivas">Inactivas</option>
                </Form.Select>

                <Form.Select
                    value={casaMatrizFiltro}
                    onChange={(e) => setCasaMatrizFiltro(e.target.value)}
                    style={{ minWidth: "130px" }}
                >
                    <option value="todos">Casa Matriz</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                </Form.Select>

                <Form.Select
                    value={localidadFiltro}
                    onChange={(e) => setLocalidadFiltro(e.target.value)}
                    style={{ minWidth: "160px" }}
                >
                    <option value="todas">Todas las localidades</option>
                    {localidades.map(localidad => (
                        <option key={localidad.id} value={localidad.id}>
                            {localidad.nombre}
                        </option>
                    ))}
                </Form.Select>

                <Button
                    variant="outline-secondary"
                    onClick={() => setOrdenAsc(!ordenAsc)}
                    style={{ minWidth: "110px" }}
                >
                    Orden: {ordenAsc ? "A-Z" : "Z-A"}
                </Button>
            </div>

            {/* Tabla */}
            {loading ? (
                <div className="text-center">
                    <p>Cargando sucursales...</p>
                </div>
            ) : (
                <>
                    <ReusableTable data={sucursalesFiltradas} columns={columns} />

                    <div className="mt-3 text-muted">
                        Mostrando {sucursalesFiltradas.length} de {sucursales.length} sucursales
                        {(search || estadoFiltro !== "todos" || casaMatrizFiltro !== "todos" || localidadFiltro !== "todas") && (
                            <span> (con filtros aplicados)</span>
                        )}
                    </div>
                </>
            )}

            {/* Modal Ver Sucursal */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Sucursal # {sucursalSeleccionada?.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {sucursalSeleccionada && (
                        <div className="container">
                            <div className="row">
                                <div className="col-md-6">
                                    <p><b>Nombre:</b> {sucursalSeleccionada.nombre}</p>
                                    <p><b>Horario de Apertura:</b> {formatearHorario(sucursalSeleccionada.horarioApertura)}</p>
                                    <p><b>Horario de Cierre:</b> {formatearHorario(sucursalSeleccionada.horarioCierre)}</p>
                                    <p><b>Casa Matriz:</b> {sucursalSeleccionada.casaMatriz ? "Sí" : "No"}</p>
                                    <p><b>Estado:</b> {sucursalSeleccionada.eliminado ? "Inactiva" : "Activa"}</p>
                                </div>
                                <div className="col-md-6">
                                    <p><b>Empresa:</b> {sucursalSeleccionada.empresa?.nombre}</p>
                                    {sucursalSeleccionada.domicilio && (
                                        <>
                                            <p><b>Domicilio:</b></p>
                                            <div className="ms-3">
                                                <p><b>Calle:</b> {sucursalSeleccionada.domicilio.calle} {sucursalSeleccionada.domicilio.numero}</p>
                                                {sucursalSeleccionada.domicilio.piso && (
                                                    <p><b>Piso:</b> {sucursalSeleccionada.domicilio.piso}</p>
                                                )}
                                                {sucursalSeleccionada.domicilio.nroDepartamento && (
                                                    <p><b>Departamento:</b> {sucursalSeleccionada.domicilio.nroDepartamento}</p>
                                                )}
                                                <p><b>Código Postal:</b> {sucursalSeleccionada.domicilio.codigoPostal}</p>
                                                <p><b>Localidad:</b> {sucursalSeleccionada.domicilio.localidad?.nombre}</p>
                                                <p><b>Provincia:</b> {sucursalSeleccionada.domicilio.localidad?.provincia?.nombre}</p>
                                                <p><b>País:</b> {sucursalSeleccionada.domicilio.localidad?.provincia?.pais?.nombre}</p>
                                                {sucursalSeleccionada.domicilio.detalles && (
                                                    <p><b>Detalles:</b> {sucursalSeleccionada.domicilio.detalles}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Confirmación - NUEVO */}
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
                                ? '¿Está seguro que desea eliminar esta sucursal?'
                                : '¿Está seguro que desea dar de alta esta sucursal?'
                            }
                        </h5>
                        <p className="text-muted">
                            <strong>{accionPendiente?.sucursalNombre}</strong>
                        </p>
                        <p className="small text-muted">
                            {accionPendiente?.tipo === 'eliminar'
                                ? 'Esta acción cambiará el estado de la sucursal a inactiva.'
                                : 'Esta acción cambiará el estado de la sucursal a activa.'
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

            {/* Modal de Resultado - EXISTENTE */}
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

            {/* Modal Formulario Sucursal - NUEVO */}
            <ModalSucursal
                show={showModalFormulario}
                onHide={handleCerrarModalFormulario}
                sucursalId={sucursalIdEdicion}
                onSucursalGuardada={handleSucursalGuardada}
                sucursales={sucursales}
            />
        </div>
    );
};

export default GrillaSucursal;