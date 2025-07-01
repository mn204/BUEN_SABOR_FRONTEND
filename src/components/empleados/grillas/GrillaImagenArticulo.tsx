import { useState, useEffect } from "react";
import ImagenArticuloService from "../../../services/ImagenArticuloService.ts";
import ImagenArticulo from "../../../models/ImagenArticulo.ts";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { ReusableTable } from "../../Tabla";
import BotonVer from "../../layout/botones/BotonVer.tsx";
import BotonEliminar from "../../layout/botones/BotonEliminar.tsx";
import BotonModificar from "../../layout/botones/BotonModificar.tsx";
import BotonAlta from "../../layout/botones/BotonAlta.tsx";
import ModalMensaje from "../modales/ModalMensaje";

function GrillaImagenArticulo() {
  const [imagenes, setImagenes] = useState<ImagenArticulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<ImagenArticulo | null>(null);

  const [modalMensaje, setModalMensaje] = useState({
    show: false,
    mensaje: "",
    titulo: "Mensaje",
    variante: "success" as "primary" | "success" | "danger" | "warning" | "info" | "secondary"
  });
  const mostrarModalMensaje = (mensaje: string, variante: typeof modalMensaje.variante = "success", titulo = "Mensaje") => {
    setModalMensaje({ show: true, mensaje, variante, titulo });
  };
  const [modalConfirm, setModalConfirm] = useState({
    show: false,
    mensaje: "",
    onConfirm: () => {},
  });
  const pedirConfirmacion = (mensaje: string, onConfirm: () => void) => {
    setModalConfirm({ show: true, mensaje, onConfirm });
  };

  useEffect(() => {
    cargarImagenes();
  }, []);

  const cargarImagenes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ImagenArticuloService.getAll();
      setImagenes(data);
    } catch (err) {
      setError("Error al cargar las imágenes");
    } finally {
      setLoading(false);
    }
  };

  const eliminarImagen = async (id: number) => {
    pedirConfirmacion("¿Seguro que desea eliminar esta imagen?", async () => {
      try {
        await ImagenArticuloService.delete(id);
        setImagenes(prev => prev.filter(a => a.id !== id));
        mostrarModalMensaje("Imagen eliminada correctamente", "success", "Éxito");
      } catch (err) {
        mostrarModalMensaje("Error al eliminar la imagen", "danger", "Error");
      }
    });
  };

  const handleActualizar = (img: ImagenArticulo) => {
    window.location.href = `/imagen?id=${img.id}`;
  };

  const handleVer = (img: ImagenArticulo) => {
    setImagenSeleccionada(img);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setImagenSeleccionada(null);
  };

  const columns = [
    {
      key: "denominacion",
      label: "Imagen",
      render: (value: string) => (
        <img src={value} alt="Imagen" style={{ width: 60, height: 60, objectFit: "cover" }} />
      ),
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (_: any, row: ImagenArticulo) => (
        <div className="d-flex justify-content-center">
          <BotonVer 
            onClick={() => handleVer(row)}
          />
          <BotonModificar
            onClick={() => handleActualizar(row)}
          />
          {!row.eliminado ? (  
            <BotonEliminar
              onClick={() => eliminarImagen(row.id!)}
            />
          ) : (
            <BotonAlta/>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <div>Cargando imágenes...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Imágenes de Artículo</h2>
      <ReusableTable columns={columns} data={imagenes} />
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de la Imagen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {imagenSeleccionada && (
            <div>
              <img src={imagenSeleccionada.denominacion} alt="Imagen" style={{ width: 200, objectFit: "cover" }} />
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

export default GrillaImagenArticulo;