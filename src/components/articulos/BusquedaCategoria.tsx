import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CardArticulo from "./CardArticulo"; // Ajusta la ruta según tu estructura
import CategoriaService from "../../services/CategoriaService"; // Ajusta la ruta según tu estructura
import ArticuloService from "../../services/ArticuloService"; // Ajusta la ruta según tu estructura
import Categoria from "../../models/Categoria";
import Articulo from "../../models/Articulo"; // Asume que tienes este modelo
import { useSucursalUsuario } from "../../context/SucursalContext";

// Interfaz para artículo con stock
interface ArticuloConStock {
    articulo: Articulo;
    stock: boolean;
    stockLoading: boolean;
}
const BusquedaCategoria: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { sucursalActualUsuario } = useSucursalUsuario();
    const [resultados, setResultados] = useState<ArticuloConStock[]>([]);
    const [categoria, setCategoria] = useState<Categoria | null>(null);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const consultarStockArticulo = async (articulo: Articulo): Promise<boolean> => {
        try {
            if (sucursalActualUsuario && sucursalActualUsuario.id) {
                console.log("consultando")
                const tieneStock = await ArticuloService.consultarStock(articulo, sucursalActualUsuario.id);
                return tieneStock;
            } else {
                return false;
            }
        } catch (error) {
            console.error(`Error al consultar stock del artículo ${articulo.id}:`, error);
            return false; // En caso de error, asumimos sin stock
        }
    };

    // Función para procesar artículos y obtener su stock
    const procesarArticulosConStock = async (articulos: Articulo[]): Promise<ArticuloConStock[]> => {
        const articulosConStock: ArticuloConStock[] = articulos.map(articulo => ({
            articulo,
            stock: false, // Cambiado de 0 a false
            stockLoading: true
        }));

        // Actualizar stock de cada artículo de forma asíncrona
        const stockPromises = articulos.map(async (articulo, index) => {
            const stock = await consultarStockArticulo(articulo);
            return { index, stock };
        });

        // Procesar resultados del stock
        const stockResults = await Promise.allSettled(stockPromises);

        stockResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                articulosConStock[result.value.index].stock = result.value.stock;
            }
            articulosConStock[index].stockLoading = false;
        });

        return articulosConStock;
    };
    useEffect(() => {
        const fetchCategoriaYArticulos = async () => {
            if (!id || !sucursalActualUsuario?.id) {
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const categoriaEncontrada = await CategoriaService.getById(parseInt(id));
                if (!categoriaEncontrada) {
                    setError("Categoría no encontrada");
                    setLoading(false);
                    return;
                }

                setCategoria(categoriaEncontrada);

                const articulosEncontrados = await ArticuloService.buscarPorIdCategoria(categoriaEncontrada);
                setArticulos(articulosEncontrados); // ESTO NO LO ESTÁS HACIENDO (⬅ importante para mostrar el count)
                const articulosConStock = await procesarArticulosConStock(articulosEncontrados);
                setResultados(articulosConStock);
            } catch (err) {
                console.error("Error al cargar categoría y artículos:", err);
                setError("Error al cargar la información. Por favor, intenta de nuevo.");
            } finally {
                setLoading(false);
            }
        };

        fetchCategoriaYArticulos();
    }, [id, sucursalActualUsuario]);


    const handleVolverAtras = () => {
        navigate(-1); // Volver a la página anterior
    };

    if (loading) {
        return (
            <div className="busqueda-categoria">
                <div className="busqueda-categoria__loading">
                    <div className="spinner"></div>
                    <p>Cargando categoría y productos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="busqueda-categoria">
                <div className="busqueda-categoria__error">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={handleVolverAtras}
                        className="btn btn-secondary"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }
    const handleBackClick = () => {
        navigate(-1);
    };
    const actualizarStock = async (index: number) => {
        const nuevoStock = await consultarStockArticulo(resultados[index].articulo);
        setResultados(prev =>
            prev.map((item, i) =>
                i === index
                    ? { ...item, stock: nuevoStock, stockLoading: false }
                    : item
            )
        );
    };


    return (
        <div className="busqueda-categoria m-5">
            {/* Header con información de la categoría */}
            <div className="busqueda-categoria__header">
                <button
                    onClick={handleBackClick}
                    className="promocion-detalle__back-button"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                    Volver
                </button>

                <div className="busqueda-categoria__info">
                    <h1 className="busqueda-categoria__title">
                        {categoria?.denominacion}
                    </h1>

                    {categoria?.categoriaPadre && (
                        <p className="busqueda-categoria__parent">
                            Subcategoría de: <span>{categoria.categoriaPadre.denominacion}</span>
                        </p>
                    )}

                    <p className="busqueda-categoria__count">
                        {articulos.length} {articulos.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                    </p>
                </div>
            </div>

            {/* Lista de artículos */}
            <div className="busqueda-categoria__content">
                {articulos.length > 0 ? (
                    <div className="row g-3 g-md-4 g-lg-5">
                        {resultados.map((item, index) => (
                            <div key={item.articulo.id} className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-3">
                                <CardArticulo
                                    articulo={item.articulo}
                                    stock={item.stock}
                                    stockLoading={item.stockLoading}
                                    onStockUpdate={() => actualizarStock(index)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="busqueda-categoria__empty">
                        <div className="busqueda-categoria__empty-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8" />
                                <path d="21 21l-4.35-4.35" />
                            </svg>
                        </div>
                        <h3>No hay productos en esta categoría</h3>
                        <p>Actualmente no hay productos disponibles en "{categoria?.denominacion}"</p>
                        <button
                            onClick={handleVolverAtras}
                            className="btn btn-primary"
                        >
                            Explorar otras categorías
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusquedaCategoria;