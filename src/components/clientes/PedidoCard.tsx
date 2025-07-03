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
        <Card className="mb-1 shadow-sm border-0" style={{ borderRadius: "0.5rem" }}>
            <Card.Body className="p-0">
                <Row className="align-items-center gx-2">
                    {/* Información principal del pedido */}
                    <Col xs={12} md={9} lg={8}>
                        {/* Primera línea: ID, fecha y estado */}
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-1">
                            <div className="d-flex align-items-center gap-2">
                                <h6 className="mb-0 fw-bold" style={{ fontSize: '1rem' }}>Pedido #{pedido.id}</h6>
                                <small className="text-muted" style={{ fontSize: '0.85rem' }}>
                                    {dayjs(pedido.fechaPedido).format("DD/MM/YY HH:mm")}
                                </small>
                            </div>
                        </div>

                        {/* Segunda línea: información adicional */}
                        <div className="d-flex flex-wrap align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                            <span className="text-muted">
                                <strong>Entrega:</strong> {pedido.horaEstimadaFinalizacion}
                            </span>
                            <span className="text-muted">
                                <strong>Total:</strong> <span className="fw-bold text-dark">${pedido.total.toFixed(2)}</span>
                            </span>
                            <span className="text-muted">
                                <strong>Estado de Pago:</strong>
                                <span className={`badge ms-1 ${pedido.pagado ? 'bg-success' : 'bg-warning text-dark'}`}
                                      style={{ fontSize: '0.75rem' }}>
                                    {pedido.pagado ? 'PAGADO' : 'PENDIENTE'}
                                </span>
                            </span>
                        </div>
                    </Col>

                    {/* Columna de acciones con separación mejorada */}
                    <Col xs={12} md={3} lg={4} className="mt-1 mt-md-0">
                        <div className="mb-2 text-start text-md-end">
                            <Badge bg={getColorEstado(pedido.estado as Estado)} className="px-2 py-1" style={{ fontSize: '0.8rem' }}>
                                {pedido.estado}
                            </Badge>
                        </div>
                        <div className="d-flex gap-1 justify-content-start justify-content-md-end">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => onDescargarFactura(pedido.id!)}
                                className="d-flex align-items-center gap-1 px-2 py-1"
                                style={{ fontSize: '0.85rem' }}
                            >
                                <Download size={14} />
                                <span className="d-none d-sm-inline">Factura</span>
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onVerDetalle(pedido.id!)}
                                className="d-flex align-items-center gap-1 px-2 py-1"
                                style={{ fontSize: '0.85rem' }}
                            >
                                <Eye size={14} />
                                <span>Detalle</span>
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default PedidoCard;