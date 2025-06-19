import { useState, useEffect } from "react";
import CategoriaService from "../../../services/CategoriaService.ts";
import Categoria from "../../../models/Categoria.ts";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import BotonVer from "../../layout/BotonVer.tsx";
import BotonEliminar from "../../layout/BotonEliminar.tsx";
import BotonModificar from "../../layout/BotonModificar.tsx";
import BotonAlta from "../../layout/BotonAlta.tsx";
import { Link } from "react-router-dom";

function GrillaCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await CategoriaService.getAll();
      setCategorias(data);
    } catch (err) {
      setError("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  };

  const darDeAlta = async (id: number) => {
    if (!window.confirm("¿Seguro que desea dar de alta esta categoría?")) return;
    try {
      await CategoriaService.changeEliminado(id);
      cargarCategorias();
      alert("Categoría dada de alta correctamente");
    } catch (err) {
      alert("Error al dar de alta la categoría");
    }
  }

  const eliminarCategoria = async (id: number) => {
    if (!window.confirm("¿Seguro que desea eliminar esta categoría?")) return;
    try {
      await CategoriaService.delete(id);
      cargarCategorias();
      alert("Categoría eliminada correctamente");
    } catch (err) {
      alert("Error al eliminar la categoría");
    }
  };

  const handleActualizar = (cat: Categoria) => {
    window.location.href = `/FormularioCategoria?id=${cat.id}`;
  };

  const handleVer = (cat: Categoria) => {
    setCategoriaSeleccionada(cat);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCategoriaSeleccionada(null);
  };

  // Función para transformar lista plana a árbol
  const construirArbol = (categorias: Categoria[]): CategoriaNodo[] => {
    const mapa = new Map<number, CategoriaNodo>();
    const raiz: CategoriaNodo[] = [];

    categorias.forEach(cat => {
      mapa.set(cat.id!, { ...cat, hijos: [] });
    });

    mapa.forEach(cat => {
      if (cat.categoriaPadre?.id) {
        const padre = mapa.get(cat.categoriaPadre.id);
        padre?.hijos.push(cat);
      } else {
        raiz.push(cat);
      }
    });

    return raiz;
  };

  const categoriasArbol = construirArbol(categorias);

  if (loading) return <div>Cargando categorías...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="position-relative">
      <h2 className="mb-4">Categorías</h2>
      <Link to="/FormularioCategoria" className="btn border-success position-absolute" style={{right: 0, top: 0}}>
        Crear Categoria
      </Link>
      <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
        {categoriasArbol.map(cat => (
          <CategoriaNodoUI
            key={cat.id}
            categoria={cat}
            onVer={handleVer}
            onModificar={handleActualizar}
            onEliminar={eliminarCategoria}
            onAlta={darDeAlta}
          />
        ))}
      </ul>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de la Categoría</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {categoriaSeleccionada && (
            <div>
              <p><b>Denominación:</b> {categoriaSeleccionada.denominacion}</p>
              <p><b>Categoría Padre:</b> {categoriaSeleccionada.categoriaPadre?.denominacion || "-"}</p>
              <p><b>Estado:</b> {categoriaSeleccionada.eliminado ? "Eliminado" : "Activo"}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default GrillaCategorias;

// Tipo extendido para árbol
type CategoriaNodo = Categoria & { hijos: CategoriaNodo[] };

function CategoriaNodoUI({
  categoria,
  onVer,
  onModificar,
  onEliminar,
  onAlta
}: {
  categoria: CategoriaNodo;
  onVer: (cat: Categoria) => void;
  onModificar: (cat: Categoria) => void;
  onEliminar: (id: number) => void;
  onAlta: (id: number) => void;
}) {
  const [expandido, setExpandido] = useState(false);

  return (
    <li style={{ marginLeft: "1rem", borderLeft: "2px solid #eee", paddingLeft: "1rem", marginBottom: "0.5rem" }}>
      <div className="d-flex justify-content-between align-items-center">
        <div
            style={{ cursor: categoria.hijos.length > 0 ? "pointer" : "default", fontWeight: 600 }}
            onClick={() => categoria.hijos.length > 0 && setExpandido(!expandido)}
            className="d-flex align-items-center gap-2"
        >
  <span>
    {categoria.hijos.length > 0 ? (expandido ? "− " : "+ ") : "• "}
  </span>
          {categoria.urlImagen && (
              <img
                  src={categoria.urlImagen}
                  alt={categoria.denominacion}
                  style={{
                    width: "30px",
                    height: "30px",
                    objectFit: "cover",
                    borderRadius: "4px"
                  }}
              />
          )}
          <span>{categoria.denominacion}</span>
        </div>
        <div className="d-flex gap-2">
          <BotonVer onClick={() => onVer(categoria)} />
          <BotonModificar onClick={() => onModificar(categoria)} />
          {!categoria.eliminado ? (
            <BotonEliminar onClick={() => onEliminar(categoria.id!)} />
          ) : (
            <BotonAlta onClick={() => onAlta(categoria.id!)} />
          )}
        </div>
      </div>
          <br />
      {expandido && categoria.hijos.length > 0 && (
        <ul style={{ listStyleType: "none", paddingLeft: "1rem" }}>
          {categoria.hijos.map(hijo => (
            <CategoriaNodoUI
              key={hijo.id}
              categoria={hijo}
              onVer={onVer}
              onModificar={onModificar}
              onEliminar={onEliminar}
              onAlta={onAlta}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
