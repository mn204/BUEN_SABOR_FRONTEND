import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Row, Col, Spinner, Card, Modal, Table } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import Promocion from "../../../models/Promocion.ts";
import PromocionService from "../../../services/PromocionService.ts";
import { ReusableTable } from "../../Tabla";
import BotonAlta from "../../layout/BotonAlta.tsx";
import BotonEliminar from "../../layout/BotonEliminar.tsx";
import BotonModificar from "../../layout/BotonModificar.tsx";
import BotonVer from "../../layout/BotonVer.tsx";
import { useSucursal } from "../../../context/SucursalContextEmpleado.tsx";


export function GrillaPromocion() {
    const [promociones, setPromociones] = useState<Promocion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [size] = useState(10);

    // Modales
    const [showModalDetalle, setShowModalDetalle] = useState(false);
    const [showModalInfo, setShowModalInfo] = useState(false);
    const [showModalConfirmacion, setShowModalConfirmacion] = useState(false);
    const [promocionSeleccionada, setPromocionSeleccionada] = useState<Promocion | null>(null);
    const [modalTitulo, setModalTitulo] = useState("");
    const [modalMensaje, setModalMensaje] = useState("");
    const [accionConfirmada, setAccionConfirmada] = useState<(() => void) | null>(null);

    // Filtros
    const [filtroDenominacion, setFiltroDenominacion] = useState("");
    const [filtroTipoPromocion, setFiltroTipoPromocion] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroFechaDesde, setFiltroFechaDesde] = useState<Date | null>(null);
    const [filtroFechaHasta, setFiltroFechaHasta] = useState<Date | null>(null);
    const [filtroPrecioMin, setFiltroPrecioMin] = useState("");
    const [filtroPrecioMax, setFiltroPrecioMax] = useState("");

    const { sucursalActual, esModoTodasSucursales } = useSucursal();


    useEffect(() => {
        cargarPromociones();
    }, [sucursalActual, esModoTodasSucursales, page, size, filtroEstado, filtroTipoPromocion, filtroFechaDesde, filtroFechaHasta]);


    // Resetear página cuando cambien los filtros
    useEffect(() => {
        setPage(0);
    }, [filtroDenominacion, filtroTipoPromocion, filtroEstado, filtroFechaDesde, filtroFechaHasta, filtroPrecioMin, filtroPrecioMax]);

    const handleVer = (promo: Promocion) => {
        setPromocionSeleccionada(promo);
        setShowModalDetalle(true);
    };

    const mostrarInfo = (titulo: string, mensaje: string) => {
        setModalTitulo(titulo);
        setModalMensaje(mensaje);
        setShowModalInfo(true);
    };

    const cargarPromociones = async () => {
        setLoading(true);
        setError(null);
        try {
            const sucursalId = esModoTodasSucursales ? null : sucursalActual?.id;

            const activa = filtroEstado === "activa" ? true :
                filtroEstado === "inactiva" ? false :
                    undefined;

            const data = await PromocionService.getAllFiltradas(
                sucursalId,
                activa,
                filtroTipoPromocion || undefined,
                filtroFechaDesde,
                filtroFechaHasta,
                page,
                size
            );

            setPromociones(data.content);
            // Actualizar el total de páginas si el backend devuelve esa información
            // setTotalPages(data.totalPages);
        } catch (err) {
            setError("Error al cargar las promociones.");
        } finally {
            setLoading(false);
        }
    };
    // Filtro local
    const promocionesFiltradas = promociones.filter(p => {
        const matchDenominacion = !filtroDenominacion ||
            p.denominacion.toLowerCase().includes(filtroDenominacion.toLowerCase());

        const matchTipo = !filtroTipoPromocion || p.tipoPromocion === filtroTipoPromocion;

        const matchEstado = !filtroEstado ||
            (filtroEstado === "activa" && p.activa && !p.eliminado) ||
            (filtroEstado === "inactiva" && (!p.activa || p.eliminado)) ||
            (filtroEstado === "eliminado" && p.eliminado);

        const fechaDesdePromo = new Date(p.fechaDesde);
        const fechaHastaPromo = new Date(p.fechaHasta);

        const matchFechaDesde = !filtroFechaDesde || fechaDesdePromo >= filtroFechaDesde;
        const matchFechaHasta = !filtroFechaHasta || fechaHastaPromo <= filtroFechaHasta;

        const matchPrecioMin = !filtroPrecioMin || p.precioPromocional >= Number(filtroPrecioMin);
        const matchPrecioMax = !filtroPrecioMax || p.precioPromocional <= Number(filtroPrecioMax);

        return matchDenominacion && matchTipo && matchEstado &&
            matchFechaDesde && matchFechaHasta && matchPrecioMin && matchPrecioMax;
    });

    // Calcular páginas totales basado en los elementos filtrados
    const totalPages = Math.ceil(promocionesFiltradas.length / size);

    // Aplicar paginación a los elementos filtrados
    const promocionesPaginadas = promocionesFiltradas.slice(page * size, (page + 1) * size);

    const pedirConfirmacionEliminacion = (id: number) => {
        setModalTitulo("Confirmar eliminación de promoción");
        setModalMensaje("¿Seguro que desea eliminar esta promoción?");
        setAccionConfirmada(() => () => eliminarPromocion(id));
        setShowModalConfirmacion(true);
    };

    const pedirConfirmacionAlta = (id: number) => {
        setModalTitulo("Confirmar Alta de Promoción");
        setModalMensaje("¿Seguro que desea dar de Alta esta promoción?");
        setAccionConfirmada(() => () => activarPromocion(id));
        setShowModalConfirmacion(true);
    };

    const eliminarPromocion = async (id: number) => {
        try {
            await PromocionService.delete(id); // ← importante
            await cargarPromociones(); // ← refrescar después de borrar
            mostrarInfo(
                "Promoción eliminada",
                "La promoción fue eliminada correctamente."
            );
        } catch (err) {
            mostrarInfo(
                "Error de red",
                "Ocurrió un error inesperado al intentar eliminar la promoción."
            );
        }
    };


    const activarPromocion = async (id: number) => {
        try {
            await PromocionService.changeEliminado(id); // ← importante
            await cargarPromociones(); // ← refrescar después de activar
            mostrarInfo(
                "Promoción reactivada",
                "La promoción fue activada correctamente."
            );
        } catch (err) {
            mostrarInfo(
                "Error de red",
                "Ocurrió un error inesperado al intentar reactivar la promoción."
            );
        }
    };


    const handleActualizar = (promo: Promocion) => {
        window.location.href = `/FormularioPromocion?id=${promo.id}`;
    };

    const columns = [
        {
            key: "imagen",
            label: "Imagen",
            render: (_: any, row: Promocion) => {
                const imagenUrl = row.imagenes?.[0]?.denominacion;
                return imagenUrl ? (
                    <img
                        src={imagenUrl}
                        alt="Imagen promoción"
                        style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "8px"
                        }}
                    />
                ) : (
                    "Sin imagen"
                );
            }
        },
        {
            key: "id",
            label: "ID",
            render: (_: any, row: Promocion) => row.id?.toString() || "-",
        },
        { key: "denominacion", label: "Denominación" },
        {
            key: "fechaDesde",
            label: "Desde",
            render: (_: any, row: Promocion) =>
                new Date(row.fechaDesde).toLocaleDateString(),
        },
        {
            key: "fechaHasta",
            label: "Hasta",
            render: (_: any, row: Promocion) =>
                new Date(row.fechaHasta).toLocaleDateString(),
        },
        {
            key: "tipoPromocion",
            label: "Tipo",
            render: (value: string) =>
                value === "HAPPYHOUR" ? "Happy Hour" : "Promoción",
        },
        {
            key: "precioPromocional",
            label: "Precio Promocional",
            render: (value: number) => `$${value.toFixed(2)}`,
        },
        {
            key: "estado",
            label: "Estado",
            render: (_: any, row: Promocion) => {
                if (row.eliminado) return "Eliminada";
                return row.activa ? "Activa" : "Inactiva";
            },
        },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: Promocion) => (
                <div className="d-flex justify-content-center">
                    <BotonVer onClick={() => handleVer(row)} />
                    <BotonModificar onClick={() => handleActualizar(row)} />
                    {!row.eliminado ? (
                        <BotonEliminar onClick={() => pedirConfirmacionEliminacion(row.id!)} />
                    ) : (
                        <BotonAlta onClick={() => pedirConfirmacionAlta(row.id!)} />
                    )}
                </div>
            ),
        },
    ];

    if (loading) return <div>Cargando promociones...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="position-relative">
            <h2>Promociones</h2>
            
            <div className="filtros-container bg-light p-4 rounded mb-4 shadow-sm">
                <div className="row g-3 align-items-center">
                    <div className="col-md-3">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar por denominación"
                            value={filtroDenominacion}
                            onChange={e => setFiltroDenominacion(e.target.value)}
                        />
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filtroTipoPromocion}
                            onChange={e => setFiltroTipoPromocion(e.target.value)}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="HAPPYHOUR">Happy Hour</option>
                            <option value="PROMOCION">Promoción</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filtroEstado}
                            onChange={e => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="activa">Activa</option>
                            <option value="inactiva">Inactiva</option>
                            <option value="eliminado">Eliminada</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <DatePicker
                            className="form-control"
                            placeholderText="Fecha desde"
                            selected={filtroFechaDesde}
                            onChange={(date) => setFiltroFechaDesde(date)}
                            dateFormat="dd/MM/yyyy"
                        />
                    </div>
                    <div className="col-md-2">
                        <DatePicker
                            className="form-control"
                            placeholderText="Fecha hasta"
                            selected={filtroFechaHasta}
                            onChange={(date) => setFiltroFechaHasta(date)}
                            dateFormat="dd/MM/yyyy"
                        />
                    </div>
                    <div className="col-md-1 d-flex justify-content-center">
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm w-100"
                            style={{ minHeight: '38px' }}
                            onClick={() => {
                                setFiltroDenominacion("");
                                setFiltroTipoPromocion("");
                                setFiltroEstado("");
                                setFiltroFechaDesde(null);
                                setFiltroFechaHasta(null);
                                setFiltroPrecioMin("");
                                setFiltroPrecioMax("");
                                setPage(0);
                            }}
                        >
                            Ver Todos
                        </button>
                    </div>
                </div>
                <div className="row g-3 align-items-center mt-2">
                    <div className="col-md-2">
                        <input
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="Precio mín."
                            value={filtroPrecioMin}
                            onChange={e => setFiltroPrecioMin(e.target.value)}
                        />
                    </div>
                    <div className="col-md-2">
                        <input
                            type="number"
                            min="0"
                            className="form-control"
                            placeholder="Precio máx."
                            value={filtroPrecioMax}
                            onChange={e => setFiltroPrecioMax(e.target.value)}
                        />
                    </div>
                </div>
                <div className="text-center mt-4">
                    <Link to="/FormularioPromocion" className="btn btn-success">
                        Crear Promoción
                    </Link>
                </div>
            </div>

            {/* Tabla */}
            <div className="p-3 border rounded bg-white shadow-sm">
                {promocionesFiltradas.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-muted mb-0">
                            No hay promociones para mostrar
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Tabla */}
                        <div className="table-responsive">
                            <ReusableTable columns={columns} data={promocionesPaginadas} />
                        </div>

                        {/* Paginación */}
                        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                            <div className="text-muted">
                                Mostrando {page * size + 1}-{Math.min((page + 1) * size, promocionesFiltradas.length)} de {promocionesFiltradas.length} promociones
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
                                    disabled={page >= totalPages - 1 || totalPages === 0}
                                    onClick={() => setPage(page + 1)}
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal detalle */}
            <Modal show={showModalDetalle} onHide={() => setShowModalDetalle(false)} centered size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>🎉 Detalle de la Promoción</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {promocionSeleccionada && (
                        <div>
                            {promocionSeleccionada.imagenes && promocionSeleccionada.imagenes[0] && (
                                <div className="text-center mb-3">
                                    <img
                                        src={promocionSeleccionada.imagenes[0].denominacion}
                                        alt="imagen Promoción"
                                        className="img-thumbnail rounded shadow-sm"
                                        style={{ maxHeight: "200px", objectFit: "cover" }}
                                    />
                                </div>
                            )}
                            <Row>
                                <Col md={6}>
                                    <p className="mb-2"><strong>🏷️ Denominación:</strong> {promocionSeleccionada.denominacion}</p>
                                    <p className="mb-2"><strong>📝 Descripción:</strong> {promocionSeleccionada.descripcionDescuento}</p>
                                    <p className="mb-2"><strong>🎯 Tipo:</strong> {promocionSeleccionada.tipoPromocion === "HAPPYHOUR" ? "Happy Hour" : "Promoción"}</p>
                                    <p className="mb-2"><strong>📊 Estado:</strong> {promocionSeleccionada.activa ? "Activa" : "Inactiva"}</p>
                                </Col>
                                <Col md={6}>
                                    <p className="mb-2"><strong>📅 Fecha Desde:</strong> {new Date(promocionSeleccionada.fechaDesde).toLocaleDateString()}</p>
                                    <p className="mb-2"><strong>📅 Fecha Hasta:</strong> {new Date(promocionSeleccionada.fechaHasta).toLocaleDateString()}</p>
                                    <p className="mb-2"><strong>🕐 Hora Desde:</strong> {promocionSeleccionada.horaDesde}</p>
                                    <p className="mb-2"><strong>🕐 Hora Hasta:</strong> {promocionSeleccionada.horaHasta}</p>
                                </Col>
                            </Row>

                            {promocionSeleccionada.detalles && promocionSeleccionada.detalles.length > 0 && (
                                <>
                                    <h6 className="mt-3">Artículos incluidos:</h6>
                                    <Table striped bordered hover size="sm">
                                        <thead>
                                            <tr>
                                                <th>Artículo</th>
                                                <th>Cantidad</th>
                                                <th>Precio unitario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {promocionSeleccionada.detalles.map((detalle, idx) => (
                                                <tr key={idx}>
                                                    <td>{detalle.articulo.denominacion}</td>
                                                    <td>{detalle.cantidad}</td>
                                                    <td>${detalle.articulo.precioVenta?.toFixed(2) ?? "N/A"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="table-success">
                                                <td colSpan={3} className="text-center fw-bold">
                                                    <strong>💰 Precio promocional: ${promocionSeleccionada.precioPromocional.toFixed(2)}</strong>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </>
                            )}

                            {(!promocionSeleccionada.detalles || promocionSeleccionada.detalles.length === 0) && (
                                <div className="text-center mt-3">
                                    <h5 className="text-success">💰 Precio promocional: ${promocionSeleccionada.precioPromocional.toFixed(2)}</h5>
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowModalDetalle(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Información */}
            <Modal show={showModalInfo} onHide={() => setShowModalInfo(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitulo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{modalMensaje}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setShowModalInfo(false)}>
                        Aceptar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Confirmación */}
            <Modal show={showModalConfirmacion} onHide={() => setShowModalConfirmacion(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitulo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{modalMensaje}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModalConfirmacion(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={() => {
                        if (accionConfirmada) {
                            accionConfirmada();
                            setShowModalConfirmacion(false);
                        }
                    }}>
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}