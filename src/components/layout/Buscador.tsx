import { useState, useEffect, useRef } from 'react';
import '../../styles/buscador.css';
import { Link } from 'react-router-dom';
import type Articulo from '../../models/Articulo';

type BuscadorProps = {
  onBuscar: (valor: string) => void;
  valorInicial?: string;
  setValor?: (valor: string) => void;
};

function Buscador({ onBuscar, valorInicial = "", setValor }: BuscadorProps) {
  const [query, setQuery] = useState(valorInicial);
  const [results, setResults] = useState<Articulo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Maneja el cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.trim() === '') {
      setResults([]); // Limpia los resultados si el input está vacío
    }
    if (setValor) setValor(e.target.value);
  };

  // Consulta la API cuando cambia el query (solo para mostrar sugerencias)
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const fetchData = async () => {
      try {
        let allResults: Articulo[] = [];

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
        // Establecer todos los resultados combinados
        setResults(allResults);

      } catch (error) {
        console.error('Error general:', error);
        setResults([]);
      }
    };
    
    fetchData();
  }, [query]);

  useEffect(() => {
    // Limpia los resultados cuando el componente se monta o se desmonta
    return () => {
      if(query.trim() === ''){
        setResults([]);
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() !== "") {
      onBuscar(query.trim());
      setQuery(""); // Limpia el input local
      inputRef.current?.blur();
      setResults([]); // Limpia los resultados al buscar
    }
  };

  const handleResultClick = () => {
    // acá hacés lo que tengas que hacer con el item seleccionado
    // limpiar input y resultados
    setQuery("");
    setResults([]);
  };

  return (
    <section className="buscador d-flex flex-column">
      <form className={`search-bar ${
          results.length > 0 && query.trim() !== ""
            ? "rounded-bottom"
            : "rounded-pill"
        }`} onSubmit={handleSubmit}>
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
        />
      </form>
      {results.length > 0 && query.trim() !== "" && (
        <div className="search-results position-absolute overflow-hidden p-10 align-items-start justify-content-center flex-column" style={{ padding: results.length === 0 ? '0' : '15px' }}>
          {(results.length > 0 && query != "") && (
            <ul className='listaProductoBuscado overflow-hidde list-unstyled d-flex flex-column gap-2 w-100'>
              {results.slice(0, 3).map((producto: any) => (
                <li key={producto.id}>
                  <Link className='linkProductoBsucado text-black d-flex text-start' to={`/articulo/${producto.id}`} onClick={() => handleResultClick()}>
                    <img className='imgProductoBuscado' src={producto.imagenes[0]?.denominacion} alt={producto.denominacion} />
                    <div className='d-flex flex-column'>
                      <span>{producto.denominacion}</span>
                      <span className='precioProductoBuscado'>${producto.precioVenta}</span>
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