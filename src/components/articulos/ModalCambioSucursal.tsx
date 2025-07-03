import React from 'react';
import { Modal, Button } from 'react-bootstrap'; // O tu librería de UI
import Promocion from '../models/Promocion';

interface ModalCambioSucursalProps {
    show: boolean;
    onHide: () => void;
    promocionesEliminadas: Promocion[];
    promocionesRestauradas: Promocion[];
    mensaje: string;
}

const ModalCambioSucursal: React.FC<ModalCambioSucursalProps> = ({
                                                                     show,
                                                                     onHide,
                                                                     promocionesEliminadas,
                                                                     promocionesRestauradas,
                                                                     mensaje
                                                                 }) => {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Cambio de Sucursal</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {promocionesEliminadas.length > 0 && (
                    <div className="mb-3">
                        <h6 className="text-warning">Promociones eliminadas del carrito:</h6>
                        <ul>
                            {promocionesEliminadas.map(promo => (
                                <li key={promo.id}>{promo.denominacion}</li>
                            ))}
                        </ul>
                        <small className="text-muted">
                            Estas promociones no están disponibles en la sucursal seleccionada.
                        </small>
                    </div>
                )}

                {promocionesRestauradas.length > 0 && (
                    <div className="mb-3">
                        <h6 className="text-success">Promociones restauradas:</h6>
                        <ul>
                            {promocionesRestauradas.map(promo => (
                                <li key={promo.id}>{promo.denominacion}</li>
                            ))}
                        </ul>
                        <small className="text-muted">
                            Se han restaurado promociones que tenías previamente en esta sucursal.
                        </small>
                    </div>
                )}

                {mensaje && (
                    <div className="alert alert-info">
                        {mensaje}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onHide}>
                    Entendido
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalCambioSucursal;