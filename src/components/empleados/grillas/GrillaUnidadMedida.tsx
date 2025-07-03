import { useState, useEffect } from "react";
import UnidadMedidaService from "../../../services/UnidadMedidaService.ts";
import UnidadMedida from "../../../models/UnidadMedida.ts";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { ReusableTable } from "../../Tabla";
import BotonVer from "../../layout/botones/BotonVer.tsx";
import BotonEliminar from "../../layout/botones/BotonEliminar.tsx";
import BotonModificar from "../../layout/botones/BotonModificar.tsx";
import BotonAlta from "../../layout/botones/BotonAlta.tsx";
import ModalMensaje from "../modales/ModalMensaje";

function GrillaUnidadMedida() {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<UnidadMedida | null>(null);

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
    cargarUnidades();
  }, []);

  const cargarUnidades = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await UnidadMedidaService.getAll();
      setUnidades(data);
    } catch (err) {
      setError("Error al cargar las unidades de medida");
    } finally {
      setLoading(false);
    }
  };

  const eliminarUnidad = async (id: number) => {
    pedirConfirmacion("¿Seguro que desea eliminar esta unidad?", async () => {
      try {
        await UnidadMedidaService.delete(id);
        setUnidades(prev => prev.filter(a => a.id !== id));
        mostrarModalMensaje("Unidad eliminada correctamente", "success", "Éxito");
      } catch (err) {
        mostrarModalMensaje("Error al eliminar la unidad", "danger", "Error");
      }
    });
  };

  const handleActualizar = (unidad: UnidadMedida) => {
    window.location.href = `/unidad?id=${unidad.id}`;
  };

  const handleVer = (unidad: UnidadMedida) => {
    setUnidadSeleccionada(unidad);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setUnidadSeleccionada(null);
  };

  const columns = [
    { key: "denominacion", label: "Denominación" },
    {
      key: "acciones",
      label: "Acciones",
      render: (_: any, row: UnidadMedida) => (
        <div className="d-flex justify-content-center">
          <BotonVer 
            onClick={() => handleVer(row)}
          />
          <BotonModificar
            onClick={() => handleActualizar(row)}
          />
          {!row.eliminado ? (  
            <BotonEliminar
              onClick={() => eliminarUnidad(row.id!)}
            />
          ) : (
            <BotonAlta />
          )}
        </div>
      ),
    },
  ];

  if (loading) return <div>Cargando unidades...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Unidades de Medida</h2>
      <ReusableTable columns={columns} data={unidades} />
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de la Unidad de Medida</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {unidadSeleccionada && (
            <div>
              <p><b>Denominación:</b> {unidadSeleccionada.denominacion}</p>
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

export default GrillaUnidadMedida;