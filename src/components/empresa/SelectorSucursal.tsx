import { useState } from "react";
import { Modal, Button, ListGroup, Spinner } from "react-bootstrap";
import { useSucursalUsuario } from "../../context/SucursalContext";
import type Pedido from "../../models/Pedido";

const API_URL = "http://localhost:8080/api/pedidos"; // Asegurate de cambiarlo si usás otro dominio

function SelectorSucursal({ tipoEnvio, pedido }: { tipoEnvio: string, pedido: Pedido }) {
  const { sucursalActual, sucursales, cambiarSucursal } = useSucursalUsuario();
  const [showModal, setShowModal] = useState(false);
  const [sucursalesConStock, setSucursalesConStock] = useState<number[]>([]);
  const [verificandoStock, setVerificandoStock] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
    verificarStockSucursal();
  };

  const handleCloseModal = () => setShowModal(false);

  const handleCambiarSucursal = (sucursalId: number) => {
    const sucursalSeleccionada = sucursales.find(s => s.id === sucursalId);
    if (sucursalSeleccionada) {
      cambiarSucursal(sucursalSeleccionada);
    }
    handleCloseModal();
  };

  const verificarStockSucursal = async () => {
    setVerificandoStock(true);
    const idsConStock: number[] = [];

    for (const sucursal of sucursales) {
      const pedidoConSucursal = { ...pedido, sucursal }; // Asociar sucursal temporalmente

      try {
        const res = await fetch(`${API_URL}/verificar-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedidoConSucursal),
        });

        if (res.ok) {
          const resultado = await res.json();
          if (resultado) {
            idsConStock.push(sucursal.id!);
          }
        }
      } catch (error) {
        console.error(`Error al verificar stock para sucursal ${sucursal.id}:`, error);
      }
    }

    setSucursalesConStock(idsConStock);
    setVerificandoStock(false);
  };

  if (tipoEnvio !== "TAKEAWAY") return null;

  return (
    <>
      <div className="d-flex flex-column mb-3 p-3 rounded border">
        <h5>Sucursal actual</h5>
        {sucursalActual ? (
          <>
            <p><strong>{sucursalActual.nombre}</strong></p>
            <p>
              {sucursalActual.domicilio?.calle} {sucursalActual.domicilio?.numero}{" "}
              ({sucursalActual.domicilio?.codigoPostal})<br />
              {sucursalActual.domicilio?.localidad?.nombre}
            </p>
            <p>Horario: {sucursalActual.horarioApertura} - {sucursalActual.horarioCierre}</p>
          </>
        ) : (
          <p>No hay sucursal seleccionada</p>
        )}
        <Button variant="dark" onClick={handleOpenModal} className="mt-2">
          Cambiar sucursal
        </Button>
      </div>

      {/* Modal de selección */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Seleccionar sucursal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {verificandoStock ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Verificando stock en sucursales...</p>
            </div>
          ) : (
            <ListGroup>
              {sucursales.map(sucursal => {
                const tieneStock = sucursalesConStock.includes(sucursal.id!);
                return (
                  <ListGroup.Item
                    key={sucursal.id}
                    className={`d-flex justify-content-between align-items-start ${!tieneStock ? 'bg-danger text-white' : ''}`}
                  >
                    <div>
                      <strong>{sucursal.nombre}</strong><br />
                      {sucursal.domicilio?.calle} {sucursal.domicilio?.numero}, {sucursal.domicilio?.localidad?.nombre}<br />
                      Horario: {sucursal.horarioApertura} - {sucursal.horarioCierre}
                    </div>
                    <Button
                      variant={tieneStock ? "primary" : "light"}
                      size="sm"
                      disabled={!tieneStock}
                      onClick={() => handleCambiarSucursal(sucursal.id!)}
                    >
                      {!tieneStock ? 'Sin stock suficiente' : 'Seleccionar'}
                    </Button>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default SelectorSucursal;
