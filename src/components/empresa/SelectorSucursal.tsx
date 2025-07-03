import { useState } from "react";
import { Modal, Button, ListGroup, Spinner } from "react-bootstrap";
import { useSucursalUsuario } from "../../context/SucursalContext";
import PedidoService from "../../services/PedidoService";
import type Pedido from "../../models/Pedido";

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

    try {
      // Crear un array de promesas para verificar el stock en paralelo
      const verificaciones = sucursales.map(async (sucursal) => {
        try {
          // Crear una copia del pedido con la sucursal temporal
          const pedidoConSucursal = { ...pedido, sucursal };

          // Usar el servicio en lugar de fetch directo
          const tieneStock = await PedidoService.verificarStockPorSucursal(pedidoConSucursal);

          if (tieneStock) {
            return sucursal.id!;
          }
          return null;
        } catch (error) {
          console.error(`Error al verificar stock para sucursal ${sucursal.id}:`, error);
          return null;
        }
      });

      // Esperar a que todas las verificaciones terminen
      const resultados = await Promise.all(verificaciones);

      // Filtrar los resultados válidos (que no sean null)
      const sucursalesValidas = resultados.filter((id): id is number => id !== null);

      setSucursalesConStock(sucursalesValidas);
    } catch (error) {
      console.error("Error general al verificar stock en sucursales:", error);
      setSucursalesConStock([]);
    } finally {
      setVerificandoStock(false);
    }
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
                    const esActual = sucursalActual?.id === sucursal.id;

                    return (
                        <ListGroup.Item
                            key={sucursal.id}
                            className={`d-flex justify-content-between align-items-start ${
                                !tieneStock ? 'bg-danger text-white' : ''
                            } ${esActual ? 'border-primary border-2' : ''}`}
                        >
                          <div className="flex-grow-1">
                            <strong>
                              {sucursal.nombre}
                              {esActual && <span className="badge bg-primary ms-2">Actual</span>}
                            </strong><br />
                            <small>
                              {sucursal.domicilio?.calle} {sucursal.domicilio?.numero}, {sucursal.domicilio?.localidad?.nombre}<br />
                              Horario: {sucursal.horarioApertura} - {sucursal.horarioCierre}
                            </small>
                            {!tieneStock && (
                                <div className="mt-1">
                                  <small><strong>⚠️ Sin stock suficiente para este pedido</strong></small>
                                </div>
                            )}
                          </div>
                          <Button
                              variant={tieneStock ? "primary" : "light"}
                              size="sm"
                              disabled={!tieneStock || esActual}
                              onClick={() => handleCambiarSucursal(sucursal.id!)}
                              className="ms-2"
                          >
                            {esActual ? 'Seleccionada' : !tieneStock ? 'Sin stock' : 'Seleccionar'}
                          </Button>
                        </ListGroup.Item>
                    );
                  })}
                </ListGroup>
            )}

            {!verificandoStock && sucursalesConStock.length === 0 && (
                <div className="alert alert-warning mt-3" role="alert">
                  <strong>⚠️ Atención:</strong> Ninguna sucursal tiene stock suficiente para completar este pedido.
                  Por favor, modifique su pedido o intente más tarde.
                </div>
            )}

            {!verificandoStock && sucursalesConStock.length > 0 && (
                <div className="alert alert-info mt-3" role="alert">
                  <strong>ℹ️ Info:</strong> {sucursalesConStock.length} sucursal(es) tienen stock disponible para este pedido.
                </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal>
      </>
  );
}
