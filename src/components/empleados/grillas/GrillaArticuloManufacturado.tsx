import { useState, useEffect } from "react";
import ArticuloManufacturadoService from "../../../services/ArticuloManufacturadoService.ts";
import ArticuloManufacturado from "../../../models/ArticuloManufacturado.ts";
import CategoriaService from "../../../services/CategoriaService.ts";
import Categoria from "../../../models/Categoria.ts";
import { Button, Row, Col, Modal, Card, Form } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { ReusableTable } from "../../Tabla";
import "../../../styles/GrillaArticuloManufactura.css";
import BotonEliminar from "../../layout/botones/BotonEliminar.tsx";
import BotonModificar from "../../layout/botones/BotonModificar.tsx";
import BotonVer from "../../layout/botones/BotonVer.tsx";
import BotonAlta from "../../layout/botones/BotonAlta.tsx";
import { Link } from "react-router-dom";

function GrillaArticuloManufacturado() {
    const [articulos, setArticulos] = useState<ArticuloManufacturado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [size] = useState(10);

    // Filtros
    const [filtroDenominacion, setFiltroDenominacion] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [filtroEstado, setFiltroEstado] = useState(""); // "", "activo", "eliminado"
    const [filtroPrecioMin, setFiltroPrecioMin] = useState("");
    const [filtroPrecioMax, setFiltroPrecioMax] = useState("");
    const [sortAsc, setSortAsc] = useState(true);

    const [categorias, setCategorias] = useState<Categoria[]>([]);

    // Modal
    const [showModalDetalle, setShowModalDetalle] = useState(false);
    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
    const [modalTitulo, setModalTitulo] = useState("");
    const [modalMensaje, setModalMensaje] = useState("");
    const [articuloSeleccionado, setArticuloSeleccionado] = useState<ArticuloManufacturado | null>(null);
    const [accionConfirmada, setAccionConfirmada] = useState<(() => void) | null>(null);


    const [pageData, setPageData] = useState<{
        content: ArticuloManufacturado[];
        totalPages: number;
        totalElements: number;
        number: number;
        size: number;
    }>({
        content: [],
        totalPages: 0,
        totalElements: 0,
        number: 0,
        size: 10
    });
    // Función para cargar solo categorías de comidas
    const cargarCategoriasComidas = async () => {
        try {
            const todasLasCategorias = await CategoriaService.getAll();

            // 1. Buscar la categoría padre "COMIDAS"
            const padreComidas = todasLasCategorias.find(cat => cat.denominacion?.toUpperCase() === "COMIDAS");

            if (!padreComidas) {
                setCategorias([]);
                console.warn('No se encontró la categoría padre "COMIDAS"');
                return;
            }

            // 2. Función recursiva para armar el árbol de categorías
            const armarArbol = (padreId: number): Categoria[] => {
                return todasLasCategorias
                    .filter(cat => cat.categoriaPadre?.id === padreId && typeof cat.id === "number")
                    .map(cat => ({
                        ...cat,
                        hijos: armarArbol(cat.id as number)
                    }));
            };

            // 3. Construir el árbol desde la categoría padre "COMIDAS"
            const categoriasArbol = [{
                ...padreComidas,
                hijos: armarArbol(padreComidas.id!)
            }];

            setCategorias(categoriasArbol);
        } catch (error) {
            console.error("Error al cargar categorías de comidas:", error);
            setCategorias([]);
        }
    };

    function flattenCategorias(categorias: any[], nivel = 0): { id: number, denominacion: string }[] {
        let result: { id: number, denominacion: string }[] = [];
        for (const cat of categorias) {
            result.push({
                id: cat.id,
                denominacion: `${"— ".repeat(nivel)}${cat.denominacion}`
            });
            if (cat.hijos && cat.hijos.length > 0) {
                result = result.concat(flattenCategorias(cat.hijos, nivel + 1));
            }
        }
        return result;
    }

    useEffect(() => {
        cargarCategoriasComidas();
    }, []);

    // Cargar artículos cuando cambien los filtros o la página
    useEffect(() => {
        cargarArticulos();
    }, [page, filtroDenominacion, filtroCategoria, filtroEstado, filtroPrecioMin, filtroPrecioMax, sortAsc]);

    const cargarArticulos = async () => {
        setLoading(true);
        setError(null);
        try {
            // Construir objeto de filtros
            const filtros: {
                denominacion?: string;
                categoriaId?: number;
                eliminado?: boolean;
                precioMin?: number;
                precioMax?: number;
            } = {};

            if (filtroDenominacion.trim()) filtros.denominacion = filtroDenominacion.trim();
            if (filtroCategoria) filtros.categoriaId = Number(filtroCategoria);
            if (filtroEstado) filtros.eliminado = filtroEstado === "eliminado";
            if (filtroPrecioMin !== "") filtros.precioMin = Number(filtroPrecioMin);
            if (filtroPrecioMax !== "") filtros.precioMax = Number(filtroPrecioMax);

            // Llamar al servicio con filtros
            const data = await ArticuloManufacturadoService.getArticuloManufacturadoFiltrados(
                filtros,
                page,
                size,
                `denominacion,${sortAsc ? "asc" : "desc"}`
            );

            setPageData(data);
            setArticulos(data.content); // Si seguís usando articulos para la tabla
            setTotalPages(data.totalPages);
        } catch (err) {
            setError("Error al cargar los artículos manufacturados");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Función para resetear la página cuando cambia un filtro
    const aplicarFiltro = (filtroCallback: () => void) => {
        setPage(0); // Resetear a la primera página
        filtroCallback();
    };

    // Handlers para los filtros que resetan la página
    const handleFiltroDenominacion = (valor: string) => {
        aplicarFiltro(() => setFiltroDenominacion(valor));
    };

    const handleFiltroCategoria = (valor: string) => {
        aplicarFiltro(() => setFiltroCategoria(valor));
    };

    const handleFiltroEstado = (valor: string) => {
        aplicarFiltro(() => setFiltroEstado(valor));
    };

    const handleFiltroPrecioMin = (valor: string) => {
        aplicarFiltro(() => setFiltroPrecioMin(valor));
    };

    const handleFiltroPrecioMax = (valor: string) => {
        aplicarFiltro(() => setFiltroPrecioMax(valor));
    };

    const handleVer = (row: ArticuloManufacturado) => {
        setArticuloSeleccionado(row);
        setShowModalDetalle(true);
    };

    const handleActualizar = (row: ArticuloManufacturado) => {
        window.location.href = `/FormularioManufacturado?id=${row.id}`;
    };

    const confirmarAccion = (titulo: string, mensaje: string, accion: () => void) => {
        setModalTitulo(titulo);
        setModalMensaje(mensaje);
        setAccionConfirmada(() => accion);
        setMostrarModalConfirmacion(true);
    };

    const eliminarArticulo = async (id: number) => {
        try {
            await ArticuloManufacturadoService.delete(id);

            // Recargar la grilla después de eliminar
            await cargarArticulos();

            setModalTitulo("Éxito");
            setModalMensaje("Artículo manufacturado eliminado correctamente");
            setMostrarModalInfo(true);
        } catch (err) {
            setModalTitulo("Error");
            setModalMensaje("Error al eliminar el artículo manufacturado");
            setMostrarModalInfo(true);
        }
    };

    const darDeAlta = async (id: number) => {
        try {
            await ArticuloManufacturadoService.changeEliminado(id);

            // Recargar la grilla después de dar de alta
            await cargarArticulos();

            setModalTitulo("Éxito");
            setModalMensaje("Artículo manufacturado dado de alta correctamente");
            setMostrarModalInfo(true);
        } catch (err) {
            setModalTitulo("Error");
            setModalMensaje("Error al dar de alta el artículo manufacturado");
            setMostrarModalInfo(true);
        }
    };

    // Función para limpiar todos los filtros
    const limpiarFiltros = () => {
        setFiltroDenominacion("");
        setFiltroCategoria("");
        setFiltroEstado("");
        setFiltroPrecioMin("");
        setFiltroPrecioMax("");
        setPage(0);
    };

    // Navegación de páginas
    const irAPaginaAnterior = () => {
        if (page > 0) {
            setPage(page - 1);
        }
    };

    const irAPaginaSiguiente = () => {
        if (page < totalPages - 1) {
            setPage(page + 1);
        }
    };
    // Definición de columnas para la tabla reusable
    const columns = [
        {
            key: "imagen",
            label: "Imagen",
            render: (_: any, row: ArticuloManufacturado) => {
                const imagenUrl = row.imagenes?.[0]?.denominacion;
                return imagenUrl ? (
                    <img
                        src={imagenUrl}
                        alt="Imagen"
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
            render: (_: any, row: ArticuloManufacturado) => row.id?.toString() || "-",
        },
        { key: "denominacion", label: "Denominación" },
        {
            key: "precioVenta",
            label: "Precio Venta",
            render: (value: number) => `$${value}`,
        },
        {
            key: "eliminado",
            label: "Estado",
            render: (value: boolean) => (value ? "Eliminado" : "Activo"),
        },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: ArticuloManufacturado) => (
                <div className="d-flex gap-2 justify-content-center">
                    <BotonVer
                        onClick={() => handleVer(row)}
                    />
                    <BotonModificar
                        onClick={() => handleActualizar(row)}
                    />
                    {!row.eliminado ? (
                        <BotonEliminar
                            onClick={() => confirmarAccion(
                                "Confirmar eliminación",
                                "¿Seguro que desea eliminar este artículo manufacturado?",
                                () => eliminarArticulo(row.id!))}
                        />
                    ) : (
                        <BotonAlta onClick={() => confirmarAccion(
                            "Confirmar alta",
                            "¿Seguro que desea dar de alta este artículo manufacturado?",
                            () => darDeAlta(row.id!))} />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="position-relative">
            <h2>Productos</h2>

            <Card className="mb-4 shadow-sm">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <Card.Title className="mb-0">Gestión de Artículos Manufacturados</Card.Title>
                        </div>
                        <Link to="/FormularioManufacturado" style={{ textDecoration: "none" }}>
                            <Button variant="success" size="sm">
                                ➕ Crear Producto
                            </Button>
                        </Link>
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
                                        type="text"
                                        style={{ width: 180, display: "inline-block" }}
                                        placeholder="Nombre del Producto"
                                        value={filtroDenominacion}
                                        onChange={e => handleFiltroDenominacion(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Categoría</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        style={{ width: 180, display: "inline-block" }}
                                        value={filtroCategoria}
                                        onChange={e => handleFiltroCategoria(e.target.value)}
                                    >
                                        <option value="">Todas las categorías</option>
                                        {flattenCategorias(categorias).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.denominacion}</option>
                                        ))}
                                    </Form.Select>
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Estado</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        style={{ width: 140, display: "inline-block" }}
                                        value={filtroEstado}
                                        onChange={e => handleFiltroEstado(e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        <option value="activo">Activo</option>
                                        <option value="eliminado">Eliminado</option>
                                    </Form.Select>
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Precio Venta</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        style={{ width: 100, display: "inline-block" }}
                                        placeholder="Mín."
                                        value={filtroPrecioMin}
                                        onChange={e => handleFiltroPrecioMin(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)).toString())}
                                    />
                                    <span className="mx-1">-</span>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        min="0"
                                        style={{ width: 100, display: "inline-block" }}
                                        placeholder="Máx."
                                        value={filtroPrecioMax}
                                        onChange={e => handleFiltroPrecioMax(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)).toString())}
                                    />
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

            {/* Tabla con paginación */}
            <div className="p-3 border rounded bg-white shadow-sm">
                {loading && (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                {!loading && !error && articulos.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-muted mb-0">
                            No hay artículos manufacturados para mostrar
                        </p>
                    </div>
                ) : (
                    !loading && !error && (
                        <>
                            {/* Tabla */}
                            <div className="table-responsive">
                                <ReusableTable columns={columns} data={articulos} />
                            </div>

                            {/* Paginación */}
                            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                                <div className="text-muted">
                                    Mostrando {pageData.totalElements === 0 ? 0 : page * size + 1}
                                    -
                                    {page * size + pageData.content.length} de {pageData.totalElements} artículos
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={page === 0 || loading}
                                        onClick={irAPaginaAnterior}
                                    >
                                        <ChevronLeft />
                                    </Button>
                                    <span className="px-2">
                                        Página {page + 1} de {pageData.totalPages || 1}
                                    </span>
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        disabled={page >= pageData.totalPages - 1 || pageData.totalPages === 0 || loading}
                                        onClick={irAPaginaSiguiente}
                                    >
                                        <ChevronRight />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )
                )}
            </div>
            <Modal show={showModalDetalle} onHide={() => { setShowModalDetalle(false); setArticuloSeleccionado(null); }} centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>🧾 Detalle del Artículo Manufacturado</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {articuloSeleccionado && (
                        <div className="text-center">
                            {articuloSeleccionado.imagenes?.[0]?.denominacion ? (
                                <img
                                    src={articuloSeleccionado.imagenes[0].denominacion}
                                    alt="Imagen del artículo"
                                    className="img-thumbnail rounded mb-3 shadow-sm"
                                    style={{ maxHeight: "150px", objectFit: "cover" }}
                                />
                            ) : (
                                <div className="mb-3">Sin imagen disponible</div>
                            )}

                            <div className="text-start px-2">
                                <p className="mb-2"><strong>🧪 Denominación:</strong> {articuloSeleccionado.denominacion}</p>
                                <p className="mb-2"><strong>📝 Descripción:</strong> {articuloSeleccionado.descripcion}</p>
                                <p className="mb-2"><strong>💰 Precio Venta:</strong> ${articuloSeleccionado.precioVenta != null ? articuloSeleccionado.precioVenta.toFixed(2) : "-"}</p>
                                <p className="mb-2"><strong>📂 Categoría:</strong> {articuloSeleccionado.categoria?.denominacion || "-"}</p>
                                <p className="mb-2"><strong>⚖️ Unidad de Medida:</strong> {articuloSeleccionado.unidadMedida?.denominacion || "-"}</p>
                                <p className="mb-2"><strong>⏱️ Tiempo Estimado:</strong> {articuloSeleccionado.tiempoEstimadoMinutos} min</p>
                                <p className="mb-2"><strong>🍳 Preparación:</strong> {articuloSeleccionado.preparacion}</p>
                                <p className="mb-2"><strong>📌 Estado:</strong> {articuloSeleccionado.eliminado ? "Eliminado" : "Activo"}</p>

                                <div className="mt-3">
                                    <strong>📦 Detalles:</strong>
                                    {articuloSeleccionado.detalles?.length > 0 ? (
                                        <ul className="mt-2">
                                            {articuloSeleccionado.detalles.map((det, idx) => (
                                                <li key={idx}>
                                                    {det.articuloInsumo?.denominacion} - {det.cantidad}{" "}
                                                    {det.articuloInsumo?.unidadMedida?.denominacion}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="mt-2">Sin detalles disponibles</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowModalDetalle(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de confirmación */}
            <Modal show={mostrarModalConfirmacion} onHide={() => { setMostrarModalConfirmacion(false); setAccionConfirmada(null) }}>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitulo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{modalMensaje}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setMostrarModalConfirmacion(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={() => {
                        if (accionConfirmada) accionConfirmada();
                        setMostrarModalConfirmacion(false);
                    }}>
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de información */}
            <Modal show={mostrarModalInfo} onHide={() => setMostrarModalInfo(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitulo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>{modalMensaje}</Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setMostrarModalInfo(false)}>
                        OK
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default GrillaArticuloManufacturado;