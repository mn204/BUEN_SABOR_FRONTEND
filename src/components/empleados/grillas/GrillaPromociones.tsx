import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Row, Col, Modal, Table, Card, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import Promocion from "../../../models/Promocion.ts";
import PromocionService from "../../../services/PromocionService.ts";
import { ReusableTable } from "../../Tabla";
import BotonAlta from "../../layout/botones/BotonAlta.tsx";
import BotonEliminar from "../../layout/botones/BotonEliminar.tsx";
import BotonModificar from "../../layout/botones/BotonModificar.tsx";
import BotonVer from "../../layout/botones/BotonVer.tsx";
import { useSucursal } from "../../../context/SucursalContextEmpleado.tsx";
import { es } from "date-fns/locale";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BotonSucursal from "../../layout/botones/BotonSucursal.tsx";
import { obtenerSucursales } from "../../../services/SucursalService.ts";
dayjs.extend(utc);
dayjs.extend(timezone);

export function GrillaPromocion() {
    const [promociones, setPromociones] = useState<Promocion[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [sortAsc, setSortAsc] = useState(true);
    const navigate = useNavigate();
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

    const [showModalSucursal, setShowModalSucursal] = useState(false);
    const [promoSucursalSeleccionada, setPromoSucursalSeleccionada] = useState<Promocion | null>(null);
    const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<number[]>([]);
    const [todasLasSucursales, setTodasLasSucursales] = useState<{ id: number, nombre: string }[]>([]);
    // Filtros
    const [filtroDenominacion, setFiltroDenominacion] = useState("");
    const [filtroTipoPromocion, setFiltroTipoPromocion] = useState<"PROMOCION" | "HAPPYHOUR" | "">("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroFechaDesde, setFiltroFechaDesde] = useState<Date | null>(null);
    const [filtroFechaHasta, setFiltroFechaHasta] = useState<Date | null>(null);
    const [filtroPrecioMin, setFiltroPrecioMin] = useState("");
    const [filtroPrecioMax, setFiltroPrecioMax] = useState("");

    const { sucursalActual, esModoTodasSucursales } = useSucursal();

    // Efecto para cargar promociones cuando cambian los filtros del backend
    useEffect(() => {
        cargarPromociones();
    }, [
        sucursalActual,
        esModoTodasSucursales,
        page,
        size,
        filtroDenominacion,
        filtroTipoPromocion,
        filtroEstado,
        filtroFechaDesde,
        filtroFechaHasta,
        filtroPrecioMin,
        filtroPrecioMax,
        sortAsc
    ]);

    // Resetear página cuando cambien los filtros
    useEffect(() => {
        if (page !== 0) {
            setPage(0);
        }
    }, [filtroDenominacion, filtroTipoPromocion, filtroEstado, filtroFechaDesde, filtroFechaHasta, filtroPrecioMin, filtroPrecioMax]);

    useEffect(() => {
        const cargarSucursales = async () => {
            try {
                const sucursales = await obtenerSucursales();
                if (Array.isArray(sucursales)) {
                    setTodasLasSucursales(
                        sucursales
                            .filter(s => typeof s.id === "number" && !!s.nombre)
                            .filter((s): s is { id: number; nombre: string } => s.id !== undefined && s.nombre !== undefined)
                            .map(s => ({
                                id: s.id,
                                nombre: s.nombre
                            }))
                    );
                } else {
                    setTodasLasSucursales([]);
                    console.error("La respuesta de sucursales no es un array:", sucursales);
                }
            } catch (error) {
                setTodasLasSucursales([]);
                console.error("Error al cargar sucursales", error);
            }
        };

        cargarSucursales();
    }, []);

    const handleVer = (promo: Promocion) => {
        setPromocionSeleccionada(promo);
        setShowModalDetalle(true);
    };

    const mostrarInfo = (titulo: string, mensaje: string) => {
        setModalTitulo(titulo);
        setModalMensaje(mensaje);
        setShowModalInfo(true);
    };

    const deshabilitarHabilitarSucusal = (promoId: number) => {
        const promo = promociones.find(p => p.id === promoId);
        if (!promo) return;
        setPromoSucursalSeleccionada(promo);
        // Solo seleccioná las sucursales asociadas a la promo
        setSucursalesSeleccionadas((promo.sucursales || []).map(s => s.id).filter((id): id is number => id !== undefined));
        setShowModalSucursal(true);
    };

    const handleSucursalChange = (id: number, checked: boolean) => {
        setSucursalesSeleccionadas(prev =>
            checked ? [...prev, id] : prev.filter(sucId => sucId !== id)
        );
    };

    const handleSelectAllSucursales = (checked: boolean) => {
        setSucursalesSeleccionadas(checked ? todasLasSucursales.map(s => s.id) : []);
    };

    const construirFiltros = () => {
        const filtros: any = {};

        // Filtro por denominación
        if (filtroDenominacion.trim()) {
            filtros.denominacion = filtroDenominacion.trim();
        }

        // Filtro por tipo de promoción
        if (filtroTipoPromocion) {
            filtros.tipoPromocion = filtroTipoPromocion;
        }

        // Filtro por estado (activa/inactiva/eliminada)
        if (filtroEstado === "activa") {
            filtros.activa = true;
            filtros.eliminado = false;
        } else if (filtroEstado === "inactiva") {
            filtros.activa = false;
            filtros.eliminado = false;
        } else if (filtroEstado === "eliminado") {
            filtros.eliminado = true;
        }
        // Si es "Todos", no agregues nada

        // Filtros por fecha (convertir a formato ISO con zona horaria)
        if (filtroFechaDesde) {
            filtros.fechaHoraDesde = dayjs(filtroFechaDesde)
                .tz("America/Argentina/Buenos_Aires")
                .format();
        }
        if (filtroFechaHasta) {
            const fechaHastaFinal = new Date(filtroFechaHasta);
            fechaHastaFinal.setHours(23, 59, 59, 999);
            filtros.fechaHoraHasta = dayjs(fechaHastaFinal)
                .tz("America/Argentina/Buenos_Aires")
                .format();
        }

        // Filtros por precio
        if (filtroPrecioMin !== "" && !isNaN(Number(filtroPrecioMin))) {
            filtros.precioMin = Number(filtroPrecioMin);
        }
        if (filtroPrecioMax !== "" && !isNaN(Number(filtroPrecioMax))) {
            filtros.precioMax = Number(filtroPrecioMax);
        }

        // Filtro por sucursal
        if (!esModoTodasSucursales && sucursalActual?.id) {
            filtros.idSucursal = sucursalActual.id;
        }

        return filtros;
    };

    const cargarPromociones = async () => {
        setLoading(true);
        setError(null);
        try {
            const filtros = construirFiltros();

            const data = await PromocionService.getPromocionesFiltradas(
                filtros,
                page,
                size,
                `denominacion,${sortAsc ? "asc" : "desc"}`
            );

            setPromociones(data.content);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Error al cargar promociones:", err);
            setError("Error al cargar las promociones.");
            setPromociones([]);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    // Función para limpiar todos los filtros
    const limpiarFiltros = () => {
        setFiltroDenominacion("");
        setFiltroTipoPromocion("");
        setFiltroEstado("");
        setFiltroFechaDesde(null);
        setFiltroFechaHasta(null);
        setFiltroPrecioMin("");
        setFiltroPrecioMax("");
        setPage(0);
    };

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

    const guardarSucursalesPromo = async () => {
        if (!promoSucursalSeleccionada) return;
        try {
            // Cloná la promo y cambiá solo las sucursales
            const promoActualizada = {
                ...promoSucursalSeleccionada,
                sucursales: todasLasSucursales.filter(s => sucursalesSeleccionadas.includes(s.id))
            };
            if (promoSucursalSeleccionada.id !== undefined) {
                await PromocionService.update(promoSucursalSeleccionada.id, promoActualizada);
            } else {
                throw new Error("ID de promoción no definido");
            }
            setShowModalSucursal(false);
            await cargarPromociones();
            mostrarInfo("¡Listo!", "Sucursales actualizadas correctamente.");
        } catch (err) {
            mostrarInfo("Error", "No se pudo actualizar las sucursales.");
        }
    };

    const eliminarPromocion = async (id: number) => {
        try {
            await PromocionService.delete(id);
            await cargarPromociones();
            mostrarInfo(
                "Promoción eliminada",
                "La promoción fue eliminada correctamente."
            );
        } catch (err) {
            console.error("Error al eliminar promoción:", err);
            mostrarInfo(
                "Error de red",
                "Ocurrió un error inesperado al intentar eliminar la promoción."
            );
        }
    };

    const activarPromocion = async (id: number) => {
        try {
            await PromocionService.changeEliminado(id);
            await cargarPromociones();
            mostrarInfo(
                "Promoción reactivada",
                "La promoción fue activada correctamente."
            );
        } catch (err) {
            console.error("Error al activar promoción:", err);
            mostrarInfo(
                "Error de red",
                "Ocurrió un error inesperado al intentar reactivar la promoción."
            );
        }
    };

    const handleActualizar = (promo: Promocion) => {
        window.location.href = `/FormularioPromocion?id=${promo.id}`;
    };

    // Función para manejar el cambio de filtros con debounce (opcional)
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleFiltroChange = (filtro: string, valor: any) => {
        // Limpiar timeout anterior si existe
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Aplicar el filtro inmediatamente para la UI
        switch (filtro) {
            case 'denominacion':
                setFiltroDenominacion(valor);
                break;
            case 'tipoPromocion':
                setFiltroTipoPromocion(valor);
                break;
            case 'estado':
                setFiltroEstado(valor);
                break;
            case 'fechaDesde':
                setFiltroFechaDesde(valor);
                break;
            case 'fechaHasta':
                setFiltroFechaHasta(valor);
                break;
            case 'precioMin':
                setFiltroPrecioMin(valor);
                break;
            case 'precioMax':
                setFiltroPrecioMax(valor);
                break;
        }

        // Para filtros de texto, aplicar debounce de 500ms
        if (filtro === 'denominacion' || filtro === 'precioMin' || filtro === 'precioMax') {
            const newTimeoutId = setTimeout(() => {
                // El useEffect se encargará de cargar los datos
            }, 500);
            setTimeoutId(newTimeoutId);
        }
    };

    // Cleanup del timeout al desmontar el componente
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

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
        { key: "denominacion", label: "Nombre" },
        {
            key: "fechaDesde",
            label: "Desde",
            render: (_: any, row: Promocion) =>
                dayjs(row.fechaDesde).tz("America/Argentina/Buenos_Aires").format("DD/MM/YYYY"),
        },
        {
            key: "fechaHasta",
            label: "Hasta",
            render: (_: any, row: Promocion) =>
                dayjs(row.fechaHasta).tz("America/Argentina/Buenos_Aires").format("DD/MM/YYYY"),
        },
        {
            key: "tipoPromocion",
            label: "Tipo",
            render: (value: string) =>
                value === "HAPPYHOUR" ? "Happy Hour" : "Promoción",
        },
        {
            key: "precioPromocional",
            label: "Precio",
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
                    <BotonSucursal onClick={() => deshabilitarHabilitarSucusal(row.id!)} />
                </div>
            ),
        },
    ];

    // Calcular promociones paginadas para la tabla
    const promocionesPaginadas = promociones.slice(page * size, (page + 1) * size);

    return (
        <div className="position-relative">
            <Card className="mb-4 shadow-sm">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <Card.Title className="mb-0">Gestión de Promociones</Card.Title>
                        </div>
                        <Button variant="success" size="sm" onClick={() => navigate('/FormularioPromocion')}>
                            ➕ Crear Promoción
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Form className="mb-0">
                        <Row className="gy-2 align-items-center">
                            <Col xs={12} md={8} lg={9} className="d-flex flex-wrap align-items-center gap-3">
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Denominación</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        style={{ width: 160, display: "inline-block" }}
                                        placeholder="Buscar por Nombre"
                                        value={filtroDenominacion}
                                        onChange={(e) => handleFiltroChange('denominacion', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Estados</Form.Label>
                                    <div className="d-inline-flex flex-wrap gap-2 align-items-center">
                                        <Form.Check
                                            type="radio"
                                            id="estado-todos"
                                            label={<span style={{ fontSize: "0.85em" }}>Todos</span>}
                                            name="estado"
                                            checked={filtroEstado === ""}
                                            onChange={() => handleFiltroChange('estado', "")}
                                            className="mb-0"
                                            style={{ minWidth: "auto" }}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="estado-activa"
                                            label={<span style={{ fontSize: "0.85em" }}>Activa</span>}
                                            name="estado"
                                            checked={filtroEstado === "activa"}
                                            onChange={() => handleFiltroChange('estado', "activa")}
                                            className="mb-0"
                                            style={{ minWidth: "auto" }}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="estado-inactiva"
                                            label={<span style={{ fontSize: "0.85em" }}>Inactiva</span>}
                                            name="estado"
                                            checked={filtroEstado === "inactiva"}
                                            onChange={() => handleFiltroChange('estado', "inactiva")}
                                            className="mb-0"
                                            style={{ minWidth: "auto" }}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="estado-eliminado"
                                            label={<span style={{ fontSize: "0.85em" }}>Eliminada</span>}
                                            name="estado"
                                            checked={filtroEstado === "eliminado"}
                                            onChange={() => handleFiltroChange('estado', "eliminado")}
                                            className="mb-0"
                                            style={{ minWidth: "auto" }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Tipo</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        style={{ width: 140, display: "inline-block" }}
                                        value={filtroTipoPromocion}
                                        onChange={(e) => handleFiltroChange('tipoPromocion', e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        <option value="HAPPYHOUR">Happy Hour</option>
                                        <option value="PROMOCION">Promoción</option>
                                    </Form.Select>
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Precio Min</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        style={{ width: 100, display: "inline-block" }}
                                        placeholder="Min"
                                        value={filtroPrecioMin}
                                        onChange={(e) => handleFiltroChange('precioMin', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Precio Max</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        style={{ width: 100, display: "inline-block" }}
                                        placeholder="Max"
                                        value={filtroPrecioMax}
                                        onChange={(e) => handleFiltroChange('precioMax', e.target.value)}
                                    />
                                </div>
                                <div className="d-flex align-items-end">
                                    <div>
                                        <Form.Label className="fw-bold mb-0 me-2">Fecha Desde</Form.Label>
                                        <DatePicker
                                            className="form-control form-control-sm d-inline-block"
                                            placeholderText="Desde"
                                            selected={filtroFechaDesde}
                                            onChange={(date) => {
                                                handleFiltroChange('fechaDesde', date);
                                                // Si fecha desde es mayor que fecha hasta, limpiar fecha hasta
                                                if (filtroFechaHasta && date && filtroFechaHasta < date) {
                                                    handleFiltroChange('fechaHasta', null);
                                                }
                                            }}
                                            showTimeSelect
                                            dateFormat="dd/MM/yyyy HH:mm"
                                            locale={es}
                                            maxDate={filtroFechaHasta || undefined}
                                            isClearable
                                        />
                                    </div>
                                    <div className="ms-2">
                                        <Form.Label className="fw-bold mb-0 me-2">Fecha Hasta</Form.Label>
                                        <DatePicker
                                            className="form-control form-control-sm d-inline-block"
                                            placeholderText="Hasta"
                                            selected={filtroFechaHasta}
                                            onChange={(date) => handleFiltroChange('fechaHasta', date)}
                                            showTimeSelect
                                            dateFormat="dd/MM/yyyy HH:mm"
                                            locale={es}
                                            minDate={filtroFechaDesde || undefined}
                                            isClearable
                                        />
                                    </div>
                                </div>
                            </Col>
                            <Col xs={12} md={4} lg={3} className="d-flex flex-column align-items-end justify-content-center">
                                <Button
                                    variant="outline-secondary"
                                    onClick={limpiarFiltros}
                                    style={{ minWidth: 140, marginBottom: 6, height: 38 }}
                                >
                                    Limpiar
                                </Button>
                                <Button
                                    type="button"
                                    variant={sortAsc ? "outline-primary" : "outline-dark"}
                                    onClick={() => setSortAsc((prev) => !prev)}
                                    title="Alternar orden alfabético"
                                    style={{ minWidth: 140, height: 38 }}
                                >
                                    {sortAsc ? "A → Z" : "Z → A"}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Tabla */}
            <div className="p-3 border rounded bg-white shadow-sm">
                {promociones.length === 0 ? (
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
                                Mostrando {promociones.length === 0 ? 0 : page * size + 1}-{Math.min((page + 1) * size, promociones.length)} de {promociones.length} promociones
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
                                    <p className="mb-2">
                                        <strong>🏢 Sucursal/es:</strong>{" "}
                                        {Array.isArray(promocionSeleccionada.sucursales) && promocionSeleccionada.sucursales.length > 0
                                            ? promocionSeleccionada.sucursales.map((suc, idx) =>
                                                <span key={suc.id}>
                                                    {suc.nombre || `Sucursal ${suc.id}`}
                                                    {idx < promocionSeleccionada.sucursales.length - 1 ? ", " : ""}
                                                </span>
                                            )
                                            : <span className="text-muted">Sin sucursales asociadas</span>
                                        }
                                    </p>
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
                                            {/* Precio total de los artículos */}
                                            <tr className="table-warning">
                                                <td colSpan={3} className="text-center fw-bold">
                                                    {(() => {
                                                        const precioOriginal = promocionSeleccionada.detalles.reduce(
                                                            (acc, detalle) => acc + (detalle.articulo.precioVenta || 0) * detalle.cantidad,
                                                            0
                                                        );
                                                        return (
                                                            <span>
                                                                <strong>🧾 Precio total de los artículos: ${precioOriginal.toFixed(2)}</strong>
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                            {/* Precio promocional */}
                                            <tr className="table-success">
                                                <td colSpan={3} className="text-center fw-bold">
                                                    <strong>💰 Precio promocional: ${promocionSeleccionada.precioPromocional.toFixed(2)}</strong>
                                                </td>
                                            </tr>
                                            {/* Fila de descuento */}
                                            <tr className="table-info">
                                                <td colSpan={3} className="text-center">
                                                    {(() => {
                                                        const precioOriginal = promocionSeleccionada.detalles.reduce(
                                                            (acc, detalle) => acc + (detalle.articulo.precioVenta || 0) * detalle.cantidad,
                                                            0
                                                        );
                                                        const descuento = precioOriginal - promocionSeleccionada.precioPromocional;
                                                        const porcentaje = precioOriginal > 0 ? (descuento / precioOriginal) * 100 : 0;
                                                        return (
                                                            <span>
                                                                <strong>🔻 Descuento aplicado:</strong> ${descuento.toFixed(2)} ({porcentaje.toFixed(1)}%)
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </>
                            )}

                            {(!promocionSeleccionada.detalles || promocionSeleccionada.detalles.length === 0) && (
                                <div className="text-center mt-3">
                                    <h5 className="text-success">💰 Precio promocional: ${promocionSeleccionada.precioPromocional.toFixed(2)}</h5>
                                    {/* Descuento cuando no hay detalles */}
                                    {promocionSeleccionada.descuento > 0 && (
                                        <div className="mt-2 text-info fw-bold">
                                            <span>🔻 Descuento aplicado: {promocionSeleccionada.descuento}%</span>
                                        </div>
                                    )}
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

            <Modal show={showModalSucursal} onHide={() => setShowModalSucursal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Deshabilitar/Habilitar promoción en sucursales
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex flex-column">
                        <label className="mb-2">
                            Sucursales donde se Deshabilitara/Habilitara la promoción:
                        </label>
                        <div className="border p-3 rounded text-start" style={{ maxHeight: 220, overflowY: 'auto' }}>
                            <div className="text-start mb-2 d-flex align-items-center">
                                <input
                                    className="form-check-input me-2"
                                    type="checkbox"
                                    id="selectAllSucursales"
                                    checked={sucursalesSeleccionadas.length === todasLasSucursales.length && todasLasSucursales.length > 0}
                                    onChange={e => handleSelectAllSucursales(e.target.checked)}
                                />
                                <label className="form-check-label fw-bold mb-0" htmlFor="selectAllSucursales">
                                    Seleccionar todas
                                </label>
                            </div>
                            {todasLasSucursales.map(sucursal => (
                                <div key={sucursal.id} className="mb-1 d-flex align-items-center">
                                    <input
                                        className="form-check-input me-2"
                                        type="checkbox"
                                        id={`sucursal-${sucursal.id}`}
                                        checked={sucursalesSeleccionadas.includes(sucursal.id)}
                                        onChange={e => handleSucursalChange(sucursal.id, e.target.checked)}
                                    />
                                    <label className="form-check-label mb-0" htmlFor={`sucursal-${sucursal.id}`}>
                                        {sucursal.nombre}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {sucursalesSeleccionadas.length === 0 && (
                            <small className="text-danger mt-1">Debe seleccionar al menos una sucursal</small>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModalSucursal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={guardarSucursalesPromo}
                        disabled={sucursalesSeleccionadas.length === 0}
                    >
                        Guardar cambios
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}