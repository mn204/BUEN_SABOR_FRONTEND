import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import Empleado  from '../../../models/Empleado';
import Rol from '../../../models/enums/Rol';
import Pedido from '../../../models/Pedido';

interface Props {
  show: boolean;
  onHide: () => void;
  onConfirm: (empleadoDelivery: Empleado) => void;
  pedido: Pedido;
  empleadosDelivery: Empleado[];
}

const SelectDeliveryModal: React.FC<Props> = ({ 
  show, 
  onHide, 
  onConfirm, 
  pedido,
  empleadosDelivery 
}) => {
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (show) {
      setSelectedDeliveryId('');
      setError('');
    }
  }, [show]);

  const handleConfirm = () => {
    if (!selectedDeliveryId) {
      setError('Debe seleccionar un delivery');
      return;
    }

    const empleadoSeleccionado = empleadosDelivery.find(
      emp => emp.id === parseInt(selectedDeliveryId)
    );

    if (!empleadoSeleccionado) {
      setError('Delivery no encontrado');
      return;
    }

    onConfirm(empleadoSeleccionado);
    onHide();
  };

  if (!pedido) {
    return null;
  }
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Asignar Delivery</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Seleccione el delivery para el pedido #{pedido.id || 'N/A'}</p>
        <Form.Group>
          <Form.Select 
            value={selectedDeliveryId} 
            onChange={(e) => setSelectedDeliveryId(e.target.value)}
            isInvalid={!!error}
          >
            <option value="">Seleccione un delivery...</option>
            {empleadosDelivery.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} {emp.apellido}
              </option>
            ))}
          </Form.Select>
          {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Confirmar Asignación
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SelectDeliveryModal;