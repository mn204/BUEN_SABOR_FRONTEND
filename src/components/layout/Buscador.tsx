import { useState, useEffect, useRef } from 'react';
import '../../styles/buscador.css';
import { Link } from 'react-router-dom';
import type Articulo from '../../models/Articulo';
import BuscadorService from '../../services/BuscadorService';
import { useSucursalUsuario } from '../../context/SucursalContext';

type BuscadorProps = {
  onBuscar: (valor: string) => void;
  valorInicial?: string;
  setValor?: (valor: string) => void;
};

function Buscador({ onBuscar, valorInicial = "", setValor }: BuscadorProps) {
  const [query, setQuery] = useState(valorInicial);
  const [results, setResults] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { sucursalActualUsuario } = useSucursalUsuario();

  // Obtener instancia del servicio
  const buscadorService = BuscadorService.getInstance();

  // Maneja el cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);

    if (newValue.trim() === '') {
      setResults([]); // Limpia los resultados si el input está vacío
      setLoading(false);
    }

    if (setValor) setValor(newValue);
  };

  // Consulta la API cuando cambia el query (solo para mostrar sugerencias)
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setLoading(false);
      return;
    }

    // Solo buscar si el query tiene al menos 2 caracteres
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchData = async () => {
      try {
        console.log("Buscando sugerencias para:", query);

        // Usar el BuscadorService para obtener sugerencias (limitadas a 3)
        const articulos = await buscadorService.buscarArticulosParaSugerencias(query, 3, sucursalActualUsuario!.id!);
        const isCategoriaEliminada = (categoria: any): boolean => {
          if (!categoria) return false;
          if (categoria.eliminado) return true;
          return isCategoriaEliminada(categoria.categoriaPadre);
        };
        // Filtrar artículos que no tienen categoría eliminada
        const articulosFiltrados = articulos.filter(articulo => !isCategoriaEliminada(articulo.categoria));
        console.log("Sugerencias encontradas:", articulos.length);
        setResults(articulosFiltrados);

      } catch (error) {
        console.error('Error al buscar sugerencias:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce para evitar demasiadas llamadas a la API
    const timeoutId = setTimeout(fetchData, 500);

    return () => clearTimeout(timeoutId);
  }, [query, buscadorService, sucursalActualUsuario]);

  useEffect(() => {
    // Actualizar el query local si cambia el valorInicial
    if (valorInicial !== query) {
      setQuery(valorInicial);
    }
  }, [valorInicial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() !== "") {
      onBuscar(query.trim());
      setQuery(""); // Limpia el input local
      inputRef.current?.blur();
      setResults([]); // Limpia los resultados al buscar
      setLoading(false);
    }
  };

  const handleResultClick = () => {
    // Limpiar input y resultados al hacer clic en un resultado
    setQuery("");
    setResults([]);
    setLoading(false);
  };

  return (
    <section className="buscador d-flex flex-column">
      <form
        className={`search-bar ${results.length > 0 && query.trim() !== ""
            ? "rounded-bottom"
            : "rounded-pill"
          }`}
        onSubmit={handleSubmit}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="feather feather-search"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          ref={inputRef}
          type="text"
          placeholder="¿Qué estás buscando?"
          value={query}
          onChange={handleInputChange}
          autoComplete="off"
        />

        {loading && (
          <div className="spinner-border spinner-border-sm ms-2" role="status" aria-label="Cargando">
            <span className="visually-hidden">Cargando...</span>
          </div>
        )}
      </form>

      {(results.length > 0) && query.trim().length >= 2 && (
        <div
          className="search-results position-absolute overflow-hidden align-items-start justify-content-center flex-column"
          style={{ padding: '15px', zIndex: 1000 }}
        >
          {results.length > 0 && (
            <ul className='listaProductoBuscado overflow-hidden list-unstyled d-flex flex-column gap-2 w-100'>
              {results.map((producto) => (
                <li key={producto.id}>
                  <Link
                    className='linkProductoBsucado text-black d-flex text-start'
                    to={`/articulo/${producto.id}`}
                    onClick={handleResultClick}
                  >
                    <img
                      className='imgProductoBuscado'
                      src={producto.imagenes?.[0]?.denominacion || '/placeholder-image.jpg'}
                      alt={producto.denominacion}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className='d-flex flex-column'>
                      <span>{producto.denominacion}</span>
                      <span className='precioProductoBuscado'>
                        ${producto.precioVenta?.toLocaleString() || 'N/A'}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export default Buscador;