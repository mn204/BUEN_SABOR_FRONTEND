// components/pedidos/PedidoCard.tsx
import React from "react";
import { Card, Button, Row, Col, Badge } from "react-bootstrap";
import { Download, Eye } from "react-bootstrap-icons";
import Pedido from "../../models/Pedido";
import Estado from "../../models/enums/Estado";
import dayjs from "dayjs";
interface Props {
    pedido: Pedido;
    onVerDetalle: (pedidoId: number) => void;
    onDescargarFactura: (pedidoId: number) => void;
}

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

const PedidoCard: React.FC<Props> = ({ pedido, onVerDetalle, onDescargarFactura }) => {
    return (
        <Card className="mb-3 shadow-sm p-2 border-0" style={{ borderRadius: "1rem" }}>
        <Card.Body>
            <Row className="align-items-center gx-3 gy-2">
                <Col xs={12} md={8}>
                    <h5 className="mb-2">Pedido #{pedido.id}</h5>
                    <p className="mb-1"><strong>Hora de entrega:</strong> {pedido.horaEstimadaFinalizacion}</p>
                    <small className="text-muted">
                        {dayjs(pedido.fechaPedido).format("DD/MM/YYYY HH:mm")}
                    </small>
                    <p className="mb-0 mt-2"><strong>Total:</strong> ${pedido.total.toFixed(2)}</p>
                    <p className="mb-0">
                        <strong>Estado de pago:</strong>
                        <span className={`ms-2 badge ${pedido.pagado ? 'bg-success' : 'bg-warning'}`}>
            {pedido.pagado ? 'PAGADO ✓' : 'PENDIENTE DE PAGO'}
        </span>
                    </p>
                </Col>
                    <Col xs={12} md={4} className="text-md-end mt-3 mt-md-0">
                        <Badge bg={getColorEstado(pedido.estado as Estado)} className="mb-2">{pedido.estado}</Badge>
                        <div>
                            <Button variant="outline-secondary" size="sm" className="me-2"
                                    onClick={() => onDescargarFactura(pedido.id!)}
                            >
                                <Download />
                            </Button>
                            <Button variant="primary" size="sm"
                                    onClick={() => onVerDetalle(pedido.id!)}
                            >
                                <Eye /> Ver detalle
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default PedidoCard;
