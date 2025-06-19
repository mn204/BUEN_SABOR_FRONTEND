import React, { useState } from "react";
import { Modal, Button, Table, Form } from "react-bootstrap";
import Pedido from "../../../models/Pedido.ts";
import { Badge } from "react-bootstrap";
import Estado from "../../../models/enums/Estado.ts";
import Rol from "../../../models/enums/Rol.ts";
import PedidoService from "../../../services/PedidoService";
import { useSucursal } from "../../../context/SucursalContextEmpleado";
import { useAuth } from "../../../context/AuthContext";
import dayjs from "dayjs";
interface Props {
  show: boolean;
  onHide: () => void;
  pedido: Pedido;
  onEstadoChange?: (pedidoId: number, nuevoEstado: Estado) => void;
}

const PedidoDetalleModal: React.FC<Props> = ({ show, onHide, pedido, onEstadoChange }) => {
  const { sucursalActual } = useSucursal();
  const { usuario } = useAuth(); // Agregar esto

  const [estadoSeleccionado, setEstadoSeleccionado] = useState<Estado>(pedido.estado);
  const [loadingEstados, setLoadingEstados] = useState<Record<number, boolean>>({});

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultMessage, setResultMessage] = useState({ title: '', message: '', type: 'success' });

  const getColorEstado = (estado: Estado): string => {
    switch (estado) {
      case Estado.PENDIENTE:
        return "warning";
      case Estado.PREPARACION:
        return "info";
      case Estado.LISTO:
        return "primary";
      case Estado.EN_DELIVERY:
        return "secondary";
      case Estado.ENTREGADO:
        return "success";
      case Estado.CANCELADO:
        return "danger";
      default:
        return "light";
    }
  };

  const getEstadosDisponibles = (): Estado[] => {
    if (!usuario) return [];
    return getEstadosPorRol(usuario.rol, pedido.estado);
  };

  const getEstadosPorRol = (rol: Rol, estadoActual: Estado): Estado[] => {
    switch (rol) {
      case Rol.CLIENTE:
        return estadoActual === Estado.PENDIENTE ? [Estado.CANCELADO] : [];

      case Rol.ADMIN:
        return Object.values(Estado).filter(estado => estado !== estadoActual);

      case Rol.CAJERO:
        const estadosOrdenados = [
          Estado.PENDIENTE,
          Estado.PREPARACION,
          Estado.LISTO,
          Estado.EN_DELIVERY,
          Estado.ENTREGADO,
          Estado.CANCELADO
        ];
        const indiceActual = estadosOrdenados.indexOf(estadoActual);
        return indiceActual === -1 ? [] : estadosOrdenados.slice(indiceActual + 1);

      case Rol.COCINERO:
        return estadoActual === Estado.PREPARACION ? [Estado.LISTO] : [];

      case Rol.DELIVERY:
        return estadoActual === Estado.EN_DELIVERY ? [Estado.ENTREGADO] : [];

      default:
        return [];
    }
  };

  const handleCambiarEstado = async () => {
    if (estadoSeleccionado !== pedido.estado && pedido.id) {
      if (estadoSeleccionado === Estado.CANCELADO) {
        setShowConfirmModal(true);
      } else {
        await procesarCambioEstado();
      }
    }
  };
  const procesarCambioEstado = async () => {
    // Verificar que el ID existe y es un número
    const pedidoId = pedido.id;
    if (typeof pedidoId !== 'number') {
      setResultMessage({
        title: 'Error',
        message: 'ID de pedido no válido',
        type: 'error'
      });
      setShowResultModal(true);
      return;
    }

    try {
      // Usar el ID verificado
      setLoadingEstados(prev => ({
        ...prev,
        [pedidoId]: true
      }));

      const pedidoActualizado = {
        ...pedido,
        estado: estadoSeleccionado
      };

      await PedidoService.cambiarEstadoPedido(pedidoActualizado);

      if (onEstadoChange) {
        await onEstadoChange(pedidoId, estadoSeleccionado);
      }

      setResultMessage({
        title: 'Éxito',
        message: estadoSeleccionado === Estado.CANCELADO
          ? 'El pedido ha sido cancelado correctamente'
          : 'El estado del pedido ha sido actualizado correctamente',
        type: 'success'
      });
      setShowResultModal(true);

      setTimeout(() => {
        onHide();
      }, 1500);

    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      setResultMessage({
        title: 'Error',
        message: 'No se pudo procesar el cambio de estado del pedido',
        type: 'error'
      });
      setShowResultModal(true);
    } finally {
      // Usar el ID verificado
      setLoadingEstados(prev => ({
        ...prev,
        [pedidoId]: false
      }));
    }
};
  /*
  * Al cambiar el precio de un insumo se debe actualizar el precio de los manufacturados y promociones
  * cambiar exportacion de excel
  * mantener los productos en el local storage aunque se cambie la sucursal y mostrar si se elimina
  * mostrar pedidos descendente
  */

  const puedeModificarEstado = (): boolean => {
    if (!usuario) return false;

    // Verificar si el rol es CAJERO o ADMIN - si es así, NO puede modificar
    if (usuario.rol === Rol.CAJERO || usuario.rol === Rol.ADMIN) {
      return false;
    }

    const estadosDisponibles = getEstadosDisponibles();
    return estadosDisponibles.length > 0;
  };

  const isLoadingEstado = pedido.id ? loadingEstados[pedido.id] : false;

  const renderConfirmModal = () => (
    <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
      <Modal.Header closeButton className="bg-warning text-dark">
        <Modal.Title>Confirmar Cancelación</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center my-4">
          <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
          <h5 className="mt-3">¿Está seguro que desea cancelar este pedido?</h5>
          <p className="text-muted">Esta acción no se puede deshacer</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
          No, mantener pedido
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            setShowConfirmModal(false);
            procesarCambioEstado();
          }}
        >
          Sí, cancelar pedido
        </Button>
      </Modal.Footer>
    </Modal>
  );
  const renderResultModal = () => (
    <Modal show={showResultModal} onHide={() => setShowResultModal(false)} centered>
      <Modal.Header closeButton className={`bg-${resultMessage.type === 'success' ? 'success' : 'danger'} text-white`}>
        <Modal.Title>{resultMessage.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center my-4">
          <i
            className={`bi ${resultMessage.type === 'success' ? 'bi-check-circle' : 'bi-x-circle'} 
          text-${resultMessage.type === 'success' ? 'success' : 'danger'}`}
            style={{ fontSize: '3rem' }}
          ></i>
          <h5 className="mt-3">{resultMessage.message}</h5>
        </div>
      </Modal.Body>
    </Modal>
  );

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <div className="w-100 d-flex justify-content-between align-items-center">
            <Modal.Title className="mb-0">Detalle del Pedido #{pedido.id}</Modal.Title>
            <Badge bg={getColorEstado(pedido.estado)}>{pedido.estado}</Badge>
          </div>
        </Modal.Header>

        <Modal.Body>
          <p><strong>Fecha:</strong> {dayjs(pedido.fechaPedido).format("DD/MM/YYYY HH:mm")}</p>
          <p><strong>Sucursal:</strong> {pedido.sucursal.nombre}</p>
          <p><strong>Forma de pago:</strong> {pedido.formaPago}</p>
          <p><strong>Forma de entrega:</strong> {pedido.tipoEnvio}</p>
          <p className="mb-0"><strong>Domicilio:</strong></p>
          {pedido.domicilio &&
            <p>
              {pedido.domicilio.detalles && <>Referencia: {pedido.domicilio.detalles}. </>}
              {pedido.domicilio.calle} {pedido.domicilio.numero}, CP {pedido.domicilio.codigoPostal}, {pedido.domicilio.localidad?.nombre}
              {pedido.domicilio.piso && `, Piso ${pedido.domicilio.piso}`}
              {pedido.domicilio.nroDepartamento && `, Depto ${pedido.domicilio.nroDepartamento}`}
            </p>
          }

          <Table striped bordered>
            <thead>
              <tr>
                <th>Artículo / Promoción</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles.map((d, idx) => {
                const esArticulo = !!d.articulo?.denominacion;
                const esPromocion = !!d.promocion?.denominacion;

                const nombre = esArticulo
                  ? d.articulo?.denominacion
                  : esPromocion
                    ? `🎁 Promo: ${d.promocion?.denominacion}`
                    : "Sin nombre";

                const precioUnitario = esArticulo
                  ? d.articulo?.precioVenta?.toFixed(2)
                  : esPromocion
                    ? d.promocion?.precioPromocional.toFixed(2)
                    : "-";

                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td>{nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>${precioUnitario}</td>
                      <td>${d.subTotal.toFixed(2)}</td>
                    </tr>

                    {/* Subfila si es promoción */}
                    {esPromocion && d.promocion?.detalles && d.promocion.detalles.length > 0 && (
                      <tr>
                        <td colSpan={4}>
                          <ul className="mb-0 ps-3">
                            {d.promocion.detalles.map((dPromo) => (
                              <li key={dPromo.id} className="text-muted small">
                                {dPromo.articulo?.denominacion} x{dPromo.cantidad}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>

          </Table>

          <p><strong>Total:</strong> ${pedido.total.toFixed(2)}</p>
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between align-items-center">
          {/* Cambio de estado minimalista */}
          <div className="d-flex align-items-center">
            {puedeModificarEstado() && (
              <>
                <div className="position-relative me-2">
                  <Badge
                    bg={getColorEstado(estadoSeleccionado)}
                    className="position-absolute"
                    style={{
                      top: "50%",
                      left: "8px",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      fontSize: "0.6rem",
                      padding: "2px 6px"
                    }}
                  >
                    ●
                  </Badge>
                  <Form.Select
                    size="sm"
                    style={{
                      width: "200px",
                      paddingLeft: "28px",
                      border: `2px solid var(--bs-${getColorEstado(estadoSeleccionado)})`,
                      borderRadius: "6px"
                    }}
                    value={estadoSeleccionado}
                    onChange={(e) => setEstadoSeleccionado(e.target.value as Estado)}
                  >
                    <option value={pedido.estado}>{pedido.estado}</option>
                    {getEstadosDisponibles().map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </Form.Select>
                </div>
                <Button
                  variant={`outline-${getColorEstado(estadoSeleccionado)}`}
                  size="sm"
                  onClick={handleCambiarEstado}
                  disabled={estadoSeleccionado === pedido.estado || isLoadingEstado}
                  style={{ borderRadius: "6px" }}
                >
                  {isLoadingEstado ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Cambiando estado...</span>
                      </span>
                      Cambiando Estado...
                    </>
                  ) : (
                    'Cambiar'
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Botones de la derecha */}
          <div>
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cerrar
            </Button>
            <Button
              variant="primary"
              onClick={() => window.open(`http://localhost:8080/api/pedidos/cliente/${pedido.cliente?.id}/pedido/${pedido.id}/factura`, '_blank')}
            >
              Descargar Factura
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      {renderConfirmModal()}
      {renderResultModal()}
    </>
  );
};

export default PedidoDetalleModal;