import { useState, useEffect } from "react";
import CategoriaService from "../../../services/CategoriaService.ts";
import Categoria from "../../../models/Categoria.ts";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import BotonVer from "../../layout/botones/BotonVer.tsx";
import BotonEliminar from "../../layout/botones/BotonEliminar.tsx";
import BotonModificar from "../../layout/botones/BotonModificar.tsx";
import BotonAlta from "../../layout/botones/BotonAlta.tsx";
import { Link } from "react-router-dom";
import ModalMensaje from "../modales/ModalMensaje";

function GrillaCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<Categoria | null>(null);

  // Estado para modal de mensaje
  const [modalMensaje, setModalMensaje] = useState({
    show: false,
    mensaje: "",
    titulo: "Mensaje",
    variante: "success" as "primary" | "success" | "danger" | "warning" | "info" | "secondary"
  });
  const mostrarModalMensaje = (mensaje: string, variante: typeof modalMensaje.variante = "success", titulo = "Mensaje") => {
    setModalMensaje({ show: true, mensaje, variante, titulo });
  };
  // Estado para modal de confirmación
  const [modalConfirm, setModalConfirm] = useState({
    show: false,
    mensaje: "",
    onConfirm: () => {},
  });

  const pedirConfirmacion = (mensaje: string, onConfirm: () => void) => {
    setModalConfirm({ show: true, mensaje, onConfirm });
  };

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
    pedirConfirmacion("¿Seguro que desea dar de alta esta categoría?", async () => {
      try {
        await CategoriaService.changeEliminado(id);
        cargarCategorias();
        mostrarModalMensaje("Categoría dada de alta correctamente", "success", "Éxito");
      } catch (err) {
        mostrarModalMensaje("Error al dar de alta la categoría", "danger", "Error");
      }
    });
  }

  const eliminarCategoria = async (id: number) => {
    pedirConfirmacion("¿Seguro que desea eliminar esta categoría?", async () => {
      try {
        await CategoriaService.delete(id);
        cargarCategorias();
        mostrarModalMensaje("Categoría eliminada correctamente", "success", "Éxito");
      } catch (err) {
        mostrarModalMensaje("Error al eliminar la categoría", "danger", "Error");
      }
    });
  };

  const handleActualizar = (cat: Categoria) => {
    window.location.href = `/empleado/FormularioCategoria?id=${cat.id}`;
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
      <Link to="/empleado/FormularioCategoria" className="btn border-success position-absolute" style={{right: 0, top: 0}}>
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

      <ModalMensaje
        show={modalMensaje.show}
        onHide={() => setModalMensaje({ ...modalMensaje, show: false })}
        mensaje={modalMensaje.mensaje}
        titulo={modalMensaje.titulo}
        variante={modalMensaje.variante}
      />
      <Modal show={modalConfirm.show} onHide={() => setModalConfirm({ ...modalConfirm, show: false })} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar acción</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="m-0">{modalConfirm.mensaje}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalConfirm({ ...modalConfirm, show: false })}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => {
            setModalConfirm({ ...modalConfirm, show: false });
            modalConfirm.onConfirm();
          }}>
            Confirmar
          </Button>
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
