import { useState, useEffect } from "react";
import ArticuloManufacturadoService from "../../../services/ArticuloManufacturadoService.ts";
import ArticuloManufacturado from "../../../models/ArticuloManufacturado.ts";
import CategoriaService from "../../../services/CategoriaService.ts";
import Categoria from "../../../models/Categoria.ts";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { ReusableTable } from "../../Tabla";
import "../../../styles/GrillaArticuloManufactura.css";
import BotonEliminar from "../../layout/BotonEliminar.tsx";
import BotonModificar from "../../layout/BotonModificar.tsx";
import BotonVer from "../../layout/BotonVer.tsx";
import BotonAlta from "../../layout/BotonAlta.tsx";
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
    const [categorias, setCategorias] = useState<Categoria[]>([]);

    // Modal
    const [showModalDetalle, setShowModalDetalle] = useState(false);
    const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
    const [mostrarModalInfo, setMostrarModalInfo] = useState(false);
    const [modalTitulo, setModalTitulo] = useState("");
    const [modalMensaje, setModalMensaje] = useState("");
    const [articuloSeleccionado, setArticuloSeleccionado] = useState<ArticuloManufacturado | null>(null);
    const [accionConfirmada, setAccionConfirmada] = useState<(() => void) | null>(null);

    // Función para cargar solo categorías de comidas
    const cargarCategoriasComidas = async () => {
        try {
            const todasLasCategorias = await CategoriaService.getAll();

            // Filtrar para obtener solo categorías de comidas
            // ID 1 corresponde a "Comidas" según los datos proporcionados
            const categoriasComidas = todasLasCategorias.filter(categoria =>
                (categoria.categoriaPadre && categoria.categoriaPadre.id === 1) // Subcategorías de comidas
            );

            setCategorias(categoriasComidas);
        } catch (error) {
            console.error("Error al cargar categorías de comidas:", error);
        }
    };

    useEffect(() => {
        cargarArticulos();
        cargarCategoriasComidas(); // Cambiado para cargar solo categorías de comidas
    }, []);

    const cargarArticulos = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await ArticuloManufacturadoService.getAll();
            setArticulos(data);
            // Simulamos paginación para el ejemplo
            setTotalPages(Math.ceil(data.length / size));
        } catch (err) {
            setError("Error al cargar los artículos manufacturados");
        } finally {
            setLoading(false);
        }
    };

    // Filtro local (puedes reemplazar por API si tienes endpoints específicos)
    const articulosFiltrados = articulos.filter(a =>
        (!filtroDenominacion || a.denominacion.toLowerCase().includes(filtroDenominacion.toLowerCase())) &&
        (!filtroCategoria || String(a.categoria?.id) === filtroCategoria) &&
        (!filtroEstado ||
            (filtroEstado === "activo" && !a.eliminado) ||
            (filtroEstado === "eliminado" && a.eliminado)
        ) &&
        (!filtroPrecioMin || a.precioVenta >= Number(filtroPrecioMin)) &&
        (!filtroPrecioMax || a.precioVenta <= Number(filtroPrecioMax))
    );

    // Aplicar paginación local
    const articulosPaginados = articulosFiltrados.slice(page * size, (page + 1) * size);

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
            setArticulos(prev =>
                prev.map(a =>
                    a.id === id ? { ...a, eliminado: true } : a
                )
            );
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
            setArticulos(prev =>
                prev.map(a =>
                    a.id === id ? { ...a, eliminado: false } : a
                )
            );
            setModalTitulo("Éxito");
            setModalMensaje("Artículo manufacturado dado de alta correctamente");
            setMostrarModalInfo(true);
        } catch (err) {
            setModalTitulo("Error");
            setModalMensaje("Error al dar de alta el artículo manufacturado");
            setMostrarModalInfo(true);
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
            {/* Filtros */}
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
                            value={filtroCategoria}
                            onChange={e => setFiltroCategoria(e.target.value)}
                        >
                            <option value="">Todas las categorías de comidas</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.denominacion}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <select
                            className="form-select"
                            value={filtroEstado}
                            onChange={e => setFiltroEstado(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="activo">Activo</option>
                            <option value="eliminado">Eliminado</option>
                        </select>
                    </div>
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
                    <div className="col-md-1 d-flex justify-content-center">
                        <button
                            type="button"
                            className="btn btn-outline-primary btn-sm w-100"
                            style={{ minHeight: '38px' }}
                            onClick={() => {
                                setFiltroDenominacion("");
                                setFiltroCategoria("");
                                setFiltroEstado("");
                                setFiltroPrecioMin("");
                                setFiltroPrecioMax("");
                                setPage(0);
                            }}
                        >
                            Ver Todos
                        </button>
                    </div>
                </div>
                <div className="text-center mt-4">
                    <Link to="/FormularioManufacturado" className="btn btn-success">
                        Crear Articulo Manufacturado
                    </Link>
                </div>
            </div>

            {/* Tabla con paginación */}
            <div className="p-3 border rounded bg-white shadow-sm">
                {articulosPaginados.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-muted mb-0">
                            No hay artículos manufacturados para mostrar
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Tabla */}
                        <div className="table-responsive">
                            <ReusableTable columns={columns} data={articulosPaginados} />
                        </div>

                        {/* Paginación */}
                        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                            <div className="text-muted">
                                Mostrando {articulosPaginados.length} artículos de {articulosFiltrados.length} total
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
                  Página {page + 1} de {Math.ceil(articulosFiltrados.length / size) || 1}
                </span>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={page >= Math.ceil(articulosFiltrados.length / size) - 1}
                                    onClick={() => setPage(page + 1)}
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <Modal show={showModalDetalle} onHide={() => { setShowModalDetalle(false); setArticuloSeleccionado(null); }} centered size="md">
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
                                <p className="mb-2"><strong>💰 Precio Venta:</strong> ${articuloSeleccionado.precioVenta.toFixed(2)}</p>
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
            <Modal show={mostrarModalConfirmacion} onHide={() => {setMostrarModalConfirmacion(false); setAccionConfirmada(null)}}>
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