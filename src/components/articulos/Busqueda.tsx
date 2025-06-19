import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CardArticulo from "./CardArticulo";
import Articulo from "../../models/Articulo";
import ArticuloService from "../../services/ArticuloService";
import { useSucursalUsuario } from "../../context/SucursalContext";

// Interfaz para artículo con stock
interface ArticuloConStock {
  articulo: Articulo;
  stock: boolean;
  stockLoading: boolean;
}

function Busqueda() {
  const {sucursalActualUsuario}=useSucursalUsuario();
  const [searchParams, setSearchParams] = useSearchParams();
  const [resultados, setResultados] = useState<ArticuloConStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const query = searchParams.get("q") || "";

  // Función para consultar stock de un artículo
  // Función para consultar stock de un artículo
  const consultarStockArticulo = async (articulo: Articulo): Promise<boolean> => {
    try {
      if(sucursalActualUsuario && sucursalActualUsuario.id){
        console.log("consultando")
        const tieneStock = await ArticuloService.consultarStock(articulo, sucursalActualUsuario.id);
        return tieneStock;
      }else{
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
    if (!query) return;

    setLoading(true);
    setError(null);

    let allResults: Articulo[] = [];
    const fetchData = async () => {
      try {

        // 1. Buscar productos por denominación
        try {
          const productosResponse = await fetch(
            `http://localhost:8080/api/productos/buscar/denominacion?denominacion=${encodeURIComponent(query)}`
          );
          if (productosResponse.ok) {
            const productosData = await productosResponse.json();
            allResults = [...productosData];
          }
        } catch (error) {
          console.error('Error al buscar productos:', error);
        }

        try {
          const productosResponse = await fetch(
            `http://localhost:8080/api/articulo/no-para-elaborar/denominacion?denominacion=${encodeURIComponent(query)}`
          );
          if (productosResponse.ok) {
            const productosData = await productosResponse.json();
            console.log(allResults)
            allResults = [...allResults, ...productosData];
          }
        } catch (error) {
          console.error('Error al buscar productos:', error);
        }
        // Procesar artículos con stock
        const articulosConStock = await procesarArticulosConStock(allResults);
        setResultados(articulosConStock);
        console.log(articulosConStock)
        setLoading(false);

      } catch (error) {
        console.error('Error general:', error);
        setResultados([]);
        setError('Error al cargar los resultados');
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
      {loading && <p>Cargando resultados...</p>}
      {error && <p>Error: {error}</p>}
      {query && !loading && !error && resultados.length === 0 && (
        <p>No se encontraron artículos.</p>
      )}
      {resultados.length > 0 && (
        <>
          <h2 className="mb-5">Resultados para "{query}"</h2>
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