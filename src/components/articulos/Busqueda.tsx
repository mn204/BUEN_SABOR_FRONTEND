import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CardArticulo from "./CardArticulo";
import Articulo from "../../models/Articulo";
import ArticuloService from "../../services/ArticuloService";
import BuscadorService from "../../services/BuscadorService";
import { useSucursalUsuario } from "../../context/SucursalContext";

// Interfaz para artículo con stock
interface ArticuloConStock {
  articulo: Articulo;
  stock: boolean;
  stockLoading: boolean;
}

function Busqueda() {
  const { sucursalActualUsuario } = useSucursalUsuario();
  const [searchParams] = useSearchParams();
  const [resultados, setResultados] = useState<ArticuloConStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Obtener instancia del servicio
  const buscadorService = BuscadorService.getInstance();

  const query = searchParams.get("q") || "";

  // Función para consultar stock de un artículo
  const consultarStockArticulo = async (articulo: Articulo): Promise<boolean> => {
    try {
      if (sucursalActualUsuario && sucursalActualUsuario.id) {
        console.log("consultando stock para:", articulo.denominacion);
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
      stock: false,
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
    if (!query) return;

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        console.log("Buscando artículos para:", query);

        // Usar el BuscadorService para obtener todos los artículos
        const articulos = await buscadorService.buscarTodosLosArticulos(query);

        console.log("Artículos encontrados:", articulos.length);

        if (articulos.length === 0) {
          setResultados([]);
          setLoading(false);
          return;
        }

        // Procesar artículos con stock
        const articulosConStock = await procesarArticulosConStock(articulos);
        const isCategoriaEliminada = (categoria: any): boolean => {
          if (!categoria) return false;
          if (categoria.eliminado) return true;
          return isCategoriaEliminada(categoria.categoriaPadre);
        };
        // Filtrar artículos que no tienen categoría eliminada
        const articulosFiltrados = articulosConStock.filter(articulo => !isCategoriaEliminada(articulo.articulo.categoria));
        setResultados(articulosFiltrados);
        console.log("Artículos procesados con stock:", articulosFiltrados);

      } catch (error) {
        console.error('Error general:', error);
        setResultados([]);
        setError('Error al cargar los resultados. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query, navigate, sucursalActualUsuario]);

  // Función para actualizar stock de un artículo específico
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
      <div className="resultados-busqueda m-5">
        {loading && (
            <div className="text-center">
              <p>Cargando resultados...</p>
              <div className="spinner-border" role="status" aria-label="Cargando">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
        )}

        {error && (
            <div className="alert alert-danger" role="alert">
              <strong>Error:</strong> {error}
            </div>
        )}

        {query && !loading && !error && resultados.length === 0 && (
            <div className="alert alert-info" role="alert">
              <strong>Sin resultados:</strong> No se encontraron artículos que coincidan con "{query}".
              <br />
              <small>Intenta con otros términos de búsqueda o verifica la ortografía.</small>
            </div>
        )}

        {resultados.length > 0 && (
            <>
              <h2 className="mb-4">
                Resultados para "{query}"
                <span className="badge bg-secondary ms-2">{resultados.length}</span>
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                {resultados.map((item, index) => (
                    <CardArticulo
                        key={item.articulo.id}
                        articulo={item.articulo}
                        stock={item.stock}
                        stockLoading={item.stockLoading}
                        onStockUpdate={() => actualizarStock(index)}
                    />
                ))}
              </div>
            </>
        )}
      </div>
  );
}

export default Busqueda;