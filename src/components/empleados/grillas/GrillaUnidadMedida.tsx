import { useState, useEffect } from "react";
import UnidadMedidaService from "../../../services/UnidadMedidaService.ts";
import UnidadMedida from "../../../models/UnidadMedida.ts";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { ReusableTable } from "../../Tabla";
import BotonVer from "../../layout/BotonVer.tsx";
import BotonEliminar from "../../layout/BotonEliminar.tsx";
import BotonModificar from "../../layout/BotonModificar.tsx";
import BotonAlta from "../../layout/BotonAlta.tsx";

function GrillaUnidadMedida() {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<UnidadMedida | null>(null);

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
    if (!window.confirm("¿Seguro que desea eliminar esta unidad?")) return;
    try {
      await UnidadMedidaService.delete(id);
      setUnidades(prev => prev.filter(a => a.id !== id));
      alert("Unidad eliminada correctamente");
    } catch (err) {
      alert("Error al eliminar la unidad");
    }
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
    </div>
  );
}

export default GrillaUnidadMedida;