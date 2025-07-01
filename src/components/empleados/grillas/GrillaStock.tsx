import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SucursalInsumoService from "../../../services/SucursalInsumoService";
import { useSucursal } from "../../../context/SucursalContextEmpleado";
import ReusableTable from "../../Tabla/reusable-table";
import ModalMensaje from "../modales/ModalMensaje";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { Row, Col, Card, Button, Modal, Form } from "react-bootstrap";

// Tipo para manejar los datos en la tabla
interface StockTableRow {
    id: number;
    insumoNombre: string;
    sucursalNombre: string;
    stockActual: number;
    stockMinimo: number;
    stockMaximo: number;
    sucursalInsumo: any;
}

function GrillaStock() {
    const navigate = useNavigate();
    const { sucursalActual, sucursales, esModoTodasSucursales, sucursalIdSeleccionada } = useSucursal();
    const [sucursalInsumos, setSucursalInsumos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Modal Ver
    const [showModal, setShowModal] = useState(false);
    const [stockSeleccionado, setStockSeleccionado] = useState<StockTableRow | null>(null);
    // Modal Agregar Stock
    const [showModalAgregar, setShowModalAgregar] = useState(false);
    const [stockParaAgregar, setStockParaAgregar] = useState<StockTableRow | null>(null);
    const [cantidadAgregar, setCantidadAgregar] = useState<number>(0);
    const [loadingAgregar, setLoadingAgregar] = useState(false);

    const [totalRegistros, setTotalRegistros] = useState(0);
    const [totalStockBajo, setTotalStockBajo] = useState(0);

    // Filtros
    const [filtros, setFiltros] = useState({
        insumo: "",
        sucursal: "",
        stockBajo: false,
        stockAlto: false
    });

    
    // Estado para modal de mensaje profesional
    const [modalMensaje, setModalMensaje] = useState({
        show: false,
        mensaje: "",
        titulo: "Mensaje",
        variante: "success" as "primary" | "success" | "danger" | "warning" | "info" | "secondary"
    });
    const mostrarModalMensaje = (mensaje: string, variante: typeof modalMensaje.variante = "success", titulo = "Mensaje") => {
        setModalMensaje({ show: true, mensaje, variante, titulo });
    };

    const [sortAsc, setSortAsc] = useState(true);

    // Si el contexto cambia, actualiza el filtro de sucursal
    useEffect(() => {
        setFiltros(f => {
            const nuevaSucursal = sucursalIdSeleccionada !== null && sucursalIdSeleccionada !== undefined
                ? sucursalIdSeleccionada.toString()
                : "";
            // Solo actualiza si realmente cambió
            if (f.sucursal !== nuevaSucursal) {
                return { ...f, sucursal: nuevaSucursal };
            }
            return f;
        });
        // eslint-disable-next-line
    }, [sucursalIdSeleccionada]);

    const cargarTotales = useCallback(async () => {
        try {
            // Total de registros con los filtros actuales
            const paramsTotales = {
                idSucursal: filtros.sucursal ? Number(filtros.sucursal) : undefined,
                nombreInsumo: filtros.insumo || undefined,
                stockActualMenorAStockMinimo: filtros.stockBajo ? true : undefined,
                stockActualMayorAStockMaximo: filtros.stockAlto ? true : undefined,
                page: 0,
                size: 999999, // Número muy grande para obtener todos los registros
                sort: `articuloInsumo.denominacion,${sortAsc ? "asc" : "desc"}`
            };

            const dataTotales = await SucursalInsumoService.getFiltrados(paramsTotales);
            const todosLosRegistros = dataTotales.content || [];

            setTotalRegistros(todosLosRegistros.length);

            // Calcular stock bajo de todos los registros
            const stockBajoCount = todosLosRegistros.filter((item: any) =>
                (item.stockActual || 0) <= (item.stockMinimo || 0)
            ).length;

            setTotalStockBajo(stockBajoCount);

        } catch (error) {
            console.error("Error al cargar totales:", error);
        }
    }, [filtros.sucursal, filtros.insumo, filtros.stockBajo, filtros.stockAlto, sortAsc]);


    const cargarStockInsumos = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                idSucursal: filtros.sucursal ? Number(filtros.sucursal) : undefined,
                nombreInsumo: filtros.insumo || undefined,
                stockActualMenorAStockMinimo: filtros.stockBajo ? true : undefined,
                stockActualMayorAStockMaximo: filtros.stockAlto ? true : undefined,
                page,
                size,
                sort: `articuloInsumo.denominacion,${sortAsc ? "asc" : "desc"}`
            };

            const data = await SucursalInsumoService.getFiltrados(params);
            setSucursalInsumos(data.content || []);
            setTotalPaginas(data.totalPages || 1);
        } catch (error) {
            console.error("Error al cargar stock:", error);
            setError("Error al cargar el stock");
        } finally {
            setLoading(false);
        }
    }, [filtros.sucursal, filtros.insumo, filtros.stockBajo, filtros.stockAlto, page, size, sortAsc]);

    useEffect(() => {
        cargarStockInsumos();
        cargarTotales();
    }, [cargarStockInsumos, cargarTotales]);

    useEffect(() => {
        setPage(0);
    }, [filtros.sucursal, filtros.stockBajo, filtros.stockAlto]);

    // Convertir SucursalInsumo a formato de tabla
    const convertirAFilasDeTabla = (sucursalInsumos: any[]): StockTableRow[] => {
        return sucursalInsumos.map(item => ({
            id: item.id || 0,
            insumoNombre: item.articuloInsumo?.denominacion || "Sin nombre",
            sucursalNombre: item.sucursal?.nombre || "Sin sucursal",
            stockActual: item.stockActual || 0,
            stockMinimo: item.stockMinimo || 0,
            stockMaximo: item.stockMaximo || 0,
            sucursalInsumo: item
        }));
    };

    const filasDeTabla = convertirAFilasDeTabla(sucursalInsumos);

    const handleVer = (fila: StockTableRow) => {
        setStockSeleccionado(fila);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setStockSeleccionado(null);
    };

    const handleActualizarStock = (fila: StockTableRow) => {
        if (sucursalActual && sucursalActual.id) {
            navigate(`/FormularioStock?id=${fila.sucursalInsumo.id}`);
        } else {
            mostrarModalMensaje("Debes seleccionar una sucursal antes de actualizar el stock.", "warning", "Advertencia");
        }
    };

    // Manejar modal agregar stock
    const handleAgregarStock = (fila: StockTableRow) => {
        setStockParaAgregar(fila);
        setCantidadAgregar(0);
        setShowModalAgregar(true);
    };

    const handleCloseModalAgregar = () => {
        setShowModalAgregar(false);
        setStockParaAgregar(null);
        setCantidadAgregar(0);
        setLoadingAgregar(false);
    };

    const handleConfirmarAgregarStock = async () => {
        if (!stockParaAgregar || cantidadAgregar <= 0) {
            mostrarModalMensaje("Por favor ingrese una cantidad válida mayor a 0", "warning", "Advertencia");
            return;
        }
        setLoadingAgregar(true);
        try {
            const stockActualizado = {
                ...stockParaAgregar.sucursalInsumo,
                stockActual: stockParaAgregar.stockActual + cantidadAgregar
            };
            await SucursalInsumoService.agregarStock(stockActualizado);
            await cargarStockInsumos();
            handleCloseModalAgregar();
            mostrarModalMensaje(`Stock agregado exitosamente. Nuevo stock: ${stockParaAgregar.stockActual + cantidadAgregar}`, "success", "Éxito");
        } catch (error) {
            console.error('Error al agregar stock:', error);
            mostrarModalMensaje('Error al agregar stock. Por favor intente nuevamente.', "danger", "Error");
        } finally {
            setLoadingAgregar(false);
        }
    };

    const handleFiltroInsumo = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiltros(f => ({ ...f, insumo: e.target.value }));
        // NO resetear página para el filtro de insumo para evitar que se trabe el input
    };
    const handleFiltroSucursal = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFiltros(f => ({ ...f, sucursal: e.target.value }));
    };
    const handleFiltroStockBajo = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiltros(f => ({ ...f, stockBajo: e.target.checked }));
    };
    const handleFiltroStockAlto = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiltros(f => ({ ...f, stockAlto: e.target.checked }));
    };

    // Limpiar filtros y resetear página
    const limpiarFiltros = () => {
        setFiltros({
            insumo: "",
            sucursal: "",
            stockBajo: false,
            stockAlto: false
        });
        setPage(0);
    };

    // Determina si la unidad de medida es "Unidad"
    const esUnidad = stockParaAgregar?.sucursalInsumo?.articuloInsumo?.unidadMedida?.denominacion?.toLowerCase() === "unidad";

    const getStockStatus = (stockActual: number, stockMinimo: number, stockMaximo: number) => {
        if (stockActual <= stockMinimo) {
            return { text: "Stock Bajo", className: "text-danger fw-bold", variant: "danger" };
        } else if (stockActual >= stockMaximo) {
            return { text: "Stock Alto", className: "text-warning fw-bold", variant: "warning" };
        } else {
            return { text: "Stock Normal", className: "text-success", variant: "success" };
        }
    };

    const columns = [
        {
            key: "imagen",
            label: "Imagen",
            render: (_: any, row: StockTableRow) => {
                const imagenUrl = row.sucursalInsumo.articuloInsumo?.imagenes?.[0]?.denominacion;
                return imagenUrl ? (
                    <img
                        src={imagenUrl}
                        alt="Imagen insumo"
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
            key: "insumoNombre",
            label: "Insumo",
            render: (_: any, row: StockTableRow) => (
                <div>
                    <div className="fw-semibold">{row.insumoNombre}</div>
                    <small className="text-muted">
                        {row.sucursalInsumo.articuloInsumo?.categoria?.denominacion || "Sin categoría"}
                    </small>
                </div>
            )
        },
        {
            key: "sucursalNombre",
            label: "Sucursal",
            render: (_: any, row: StockTableRow) => (
                <span className="badge bg-light text-dark border">
                    {row.sucursalNombre}
                </span>
            )
        },
        {
            key: "stockActual",
            label: "Stock Actual",
            render: (_: any, row: StockTableRow) => {
                const status = getStockStatus(row.stockActual, row.stockMinimo, row.stockMaximo);
                return (
                    <div className="text-center">
                        <div className={`fs-5 fw-bold ${status.className}`}>
                            {row.stockActual.toFixed(2)}
                        </div>
                        <small className="text-muted">
                            {row.sucursalInsumo.articuloInsumo?.unidadMedida?.denominacion || "unidades"}
                        </small>
                    </div>
                );
            }
        },
        {
            key: "stockMinimo",
            label: "Stock Mínimo",
            render: (_: any, row: StockTableRow) => (
                <div className="text-center">
                    <span className="badge bg-danger-subtle text-danger">
                        {row.stockMinimo}
                    </span>
                </div>
            )
        },
        {
            key: "stockMaximo",
            label: "Stock Máximo",
            render: (_: any, row: StockTableRow) => (
                <div className="text-center">
                    <span className="badge bg-success-subtle text-success">
                        {row.stockMaximo}
                    </span>
                </div>
            )
        },
        {
            key: "estado",
            label: "Estado",
            render: (_: any, row: StockTableRow) => {
                const status = getStockStatus(row.stockActual, row.stockMinimo, row.stockMaximo);
                return (
                    <div className="text-center">
                        <span className={`badge bg-${status.variant}`}>
                            {status.text}
                        </span>
                    </div>
                );
            }
        },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: StockTableRow) => (
                <div className="d-flex gap-2" style={{ minWidth: 180 }}>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        className="flex-fill"
                        onClick={() => handleVer(row)}
                    >
                        Ver
                    </Button>
                    <Button
                        onClick={() => handleAgregarStock(row)}
                        variant="outline-success"
                        size="sm"
                        className="flex-fill"
                    >
                        Agregar Stock
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="position-relative">
            {/* Filtros con estilo compacto */}
            <Card className="mb-4 shadow-sm">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <Card.Title className="mb-0">Gestión de Stock</Card.Title>
                            <div className="d-flex gap-2">
                                <span className="badge bg-secondary fs-6">
                                    Total: {totalRegistros}
                                </span>
                                <span className="badge bg-danger fs-6">
                                    Stock Bajo: {totalStockBajo}
                                </span>
                            </div>
                        </div>
                        <Button variant="success" size="sm" onClick={() => navigate('/FormularioStock')}>
                            ➕ Nuevo Stock
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Form className="mb-0" onSubmit={e => e.preventDefault()}>
                        <Row className="gy-2 align-items-center">
                            <Col xs={12} md={8} lg={9} className="d-flex flex-wrap align-items-center gap-3">
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Buscar insumo</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        style={{ width: 180, display: "inline-block" }}
                                        placeholder="Nombre del insumo..."
                                        value={filtros.insumo}
                                        onChange={handleFiltroInsumo}
                                    />
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Sucursal</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        style={{ width: 180, display: "inline-block" }}
                                        value={filtros.sucursal}
                                        onChange={handleFiltroSucursal}
                                        disabled={!!sucursalActual && !esModoTodasSucursales}
                                    >
                                        <option value="">Todas las sucursales</option>
                                        {sucursales.map(sucursal => (
                                            <option key={sucursal.id} value={sucursal.id?.toString()}>
                                                {sucursal.nombre}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </div>
                                <div className="d-flex gap-3">
                                    <Form.Check
                                        type="checkbox"
                                        id="stockBajo"
                                        label={<span className="text-danger fw-bold">Stock Bajo</span>}
                                        checked={filtros.stockBajo}
                                        onChange={handleFiltroStockBajo}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        id="stockAlto"
                                        label={<span className="text-warning fw-bold">Stock Alto</span>}
                                        checked={filtros.stockAlto}
                                        onChange={handleFiltroStockAlto}
                                    />
                                </div>
                            </Col>
                            <Col xs={12} md={4} lg={3} className="d-flex flex-column align-items-end justify-content-center">
                                <Button
                                    type="button"
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
            <div className="card">
                <div className="card-body p-0">
                    {filasDeTabla.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="mb-3">
                                <i className="bi bi-box-seam display-1 text-muted"></i>
                            </div>
                            <h5 className="text-muted">No hay información de stock</h5>
                            <p className="text-muted mb-0">
                                {filtros.insumo || filtros.sucursal || filtros.stockBajo || filtros.stockAlto
                                    ? "No se encontraron registros con los filtros aplicados"
                                    : "No hay información de stock para mostrar"
                                }
                            </p>
                            {(filtros.insumo || filtros.sucursal || filtros.stockBajo || filtros.stockAlto) && (
                                <Button variant="outline-primary" onClick={limpiarFiltros} className="mt-2">
                                    Limpiar filtros
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Tabla */}
                            <div className="table-responsive">
                                <ReusableTable columns={columns} data={filasDeTabla} />
                            </div>

                            {/* Paginación */}
                            <div className="card-footer bg-light">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="text-muted small">
                                        Mostrando {page * size + 1}-{Math.min((page + 1) * size, filasDeTabla.length)} de {filasDeTabla.length} registros
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
                                        <span className="px-2 small">
                                            Página {page + 1} de {totalPaginas || 1}
                                        </span>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            disabled={page >= totalPaginas - 1 || totalPaginas === 0}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            <ChevronRight />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal detalle */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>Detalle de Stock</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {stockSeleccionado && (
                        <div className="row">
                            <div className="col-md-6">
                                <h5 className="text-primary border-bottom pb-2">Información del Insumo</h5>
                                <div className="mb-3">
                                    <strong>Insumo:</strong>
                                    <div className="text-muted fs-5">{stockSeleccionado.insumoNombre}</div>
                                </div>
                                <div className="mb-3">
                                    <strong>Categoría:</strong>
                                    <div className="text-muted">
                                        {stockSeleccionado.sucursalInsumo.articuloInsumo?.categoria?.denominacion || "Sin categoría"}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <strong>Unidad de Medida:</strong>
                                    <div className="text-muted">
                                        {stockSeleccionado.sucursalInsumo.articuloInsumo?.unidadMedida?.denominacion || "Sin unidad"}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <strong>Sucursal:</strong>
                                    <div className="text-muted">{stockSeleccionado.sucursalNombre}</div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <h5 className="text-primary border-bottom pb-2">Control de Stock</h5>
                                <div className="mb-3">
                                    <strong>Stock Actual:</strong>
                                    <div className="fs-3 fw-bold text-primary">{stockSeleccionado.stockActual.toFixed(2)}</div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-6">
                                        <strong>Stock Mínimo:</strong>
                                        <div className="badge bg-danger fs-6">{stockSeleccionado.stockMinimo}</div>
                                    </div>
                                    <div className="col-6">
                                        <strong>Stock Máximo:</strong>
                                        <div className="badge bg-success fs-6">{stockSeleccionado.stockMaximo}</div>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <strong>Estado del Stock:</strong>
                                    <div className="mt-1">
                                        {(() => {
                                            const status = getStockStatus(
                                                stockSeleccionado.stockActual,
                                                stockSeleccionado.stockMinimo,
                                                stockSeleccionado.stockMaximo
                                            );
                                            return (
                                                <span className={`badge bg-${status.variant} fs-6`}>
                                                    {status.text}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Indicador visual de stock */}
                                <div className="mb-3">
                                    <strong>Nivel de Stock:</strong>
                                    <div className="progress mt-2" style={{ height: '20px' }}>
                                        <div
                                            className={`progress-bar ${stockSeleccionado.stockActual <= stockSeleccionado.stockMinimo ? 'bg-danger' :
                                                stockSeleccionado.stockActual >= stockSeleccionado.stockMaximo ? 'bg-warning' : 'bg-success'
                                                }`}
                                            role="progressbar"
                                            style={{
                                                width: `${Math.min(100, (stockSeleccionado.stockActual / stockSeleccionado.stockMaximo) * 100)}%`
                                            }}
                                        >
                                            {stockSeleccionado.stockActual.toFixed(2)}/{stockSeleccionado.stockMaximo}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cerrar
                    </Button>
                    {stockSeleccionado && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                handleActualizarStock(stockSeleccionado);
                                handleCloseModal();
                            }}
                        >
                            Actualizar Stock
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Modal Agregar Stock */}
            <Modal show={showModalAgregar} onHide={handleCloseModalAgregar} centered>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>Agregar Stock</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {stockParaAgregar && (
                        <div>
                            <div className="mb-4">
                                <h6 className="text-success border-bottom pb-2">Información del Insumo</h6>
                                <div className="row">
                                    <div className="col-8">
                                        <strong>Insumo:</strong>
                                        <div className="text-muted">{stockParaAgregar.insumoNombre}</div>
                                    </div>
                                    <div className="col-4">
                                        <strong>Sucursal:</strong>
                                        <div className="text-muted">{stockParaAgregar.sucursalNombre}</div>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <strong>Stock Actual:</strong>
                                    <span className="ms-2 badge bg-primary fs-6">
                                        {stockParaAgregar.stockActual.toFixed(2)} {stockParaAgregar.sucursalInsumo.articuloInsumo?.unidadMedida?.denominacion || "unidades"}
                                    </span>
                                </div>
                            </div>

                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cantidad a agregar *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        step={esUnidad ? "1" : "any"}
                                        value={cantidadAgregar}
                                        onChange={e => {
                                            let val = e.target.value;
                                            // Si es Unidad, solo permitir enteros positivos
                                            if (esUnidad) {
                                                val = val.replace(/[^0-9]/g, "");
                                                setCantidadAgregar(val === "" ? 0 : Math.max(1, parseInt(val, 10)));
                                            } else {
                                                setCantidadAgregar(val === "" ? 0 : Math.max(1, Number(val)));
                                            }
                                        }}
                                        placeholder="Ingrese la cantidad a agregar"
                                        disabled={loadingAgregar}
                                    />
                                    <Form.Text className="text-muted">
                                        La cantidad debe ser mayor a 0
                                    </Form.Text>
                                </Form.Group>

                                {cantidadAgregar > 0 && (
                                    <div className="alert alert-info">
                                        <strong>Resumen de la operación:</strong>
                                        <ul className="mb-0 mt-2">
                                            <li>Stock anterior: <strong>{stockParaAgregar.stockActual.toFixed(2)}</strong></li>
                                            <li>Cantidad a agregar: <strong>{cantidadAgregar}</strong></li>
                                            <li>Stock resultante: <strong>{(stockParaAgregar.stockActual + cantidadAgregar).toFixed(2)}</strong></li>
                                        </ul>
                                    </div>
                                )}
                            </Form>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModalAgregar} disabled={loadingAgregar}>
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleConfirmarAgregarStock}
                        disabled={loadingAgregar || cantidadAgregar <= 0}
                    >
                        {loadingAgregar ? (
                            <>
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Cargando...</span>
                                </div>
                                Agregando...
                            </>
                        ) : (
                            'Confirmar Agregar Stock'
                        )}
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
}

export default GrillaStock;