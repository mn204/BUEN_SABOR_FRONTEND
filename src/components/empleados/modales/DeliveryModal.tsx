import React, { useState } from "react";
import { Modal, Button, Row, Col, Table } from "react-bootstrap";
import Pedido from "../../../models/Pedido.ts";
import pedidoService from "../../../services/PedidoService.ts";
import Estado from "../../../models/enums/Estado.ts";
import dayjs from "dayjs";
import ModalMensaje from "./ModalMensaje";

interface Props {
    show: boolean;
    onHide: () => void;
    pedido: Pedido | null;
}

const DeliveryModal: React.FC<Props> = ({ show, onHide, pedido }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modalMensaje, setModalMensaje] = useState({
        show: false,
        mensaje: "",
        titulo: "Mensaje",
        variante: "danger" as "primary" | "success" | "danger" | "warning" | "info" | "secondary"
    });

    const mostrarModalMensaje = (mensaje: string, variante: typeof modalMensaje.variante = "danger", titulo = "Error") => {
        setModalMensaje({ show: true, mensaje, variante, titulo });
    };

    if (!pedido) return null;

    const domicilio = pedido.domicilio;
    const cliente = pedido.cliente;
    const delivery = pedido.empleado;
    const detalles = pedido.detalles;

    const abrirEnGoogleMaps = () => {
        if (!domicilio.localidad) {
            mostrarModalMensaje("No se puede abrir el mapa: localidad no disponible", "warning", "Advertencia");
            return;
        }
        const direccion = `${domicilio.calle} ${domicilio.numero}, ${domicilio.localidad.nombre}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
        window.open(url, '_blank');
    };

    const handleConfirmEntrega = async () => {
        try {
            setLoading(true);
            const pedidoActualizado = {
                ...pedido,
                estado: Estado.ENTREGADO,
            };
            await pedidoService.cambiarEstadoPedido(pedidoActualizado);
            setShowConfirm(false);
            onHide();
        } catch (error) {
            mostrarModalMensaje("Error al cambiar el estado del pedido", "danger", "Error");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Modal Principal */}
            <Modal show={show} onHide={onHide} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Pedido #{pedido.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="mb-3">
                        <Col md={6}>
                            <strong>Fecha Pedido:</strong>{dayjs(pedido.fechaPedido).format("DD/MM/YYYY HH:mm")}<br />
                            <strong>Hora Estimada Llegada:</strong> {pedido.horaEstimadaFinalizacion}<br />
                            <strong>Cliente:</strong> {cliente.nombre} {cliente.apellido}<br />
                            <strong>Teléfono:</strong> {cliente.telefono}<br />
                            <strong>Delivery:</strong> {delivery?.nombre} {delivery?.apellido}<br />
                            <strong>Estado:</strong> {pedido.estado}<br /><br />
                            <Button
                                size="sm"
                                variant="success"
                                className="ms-2"
                                onClick={() => setShowConfirm(true)}
                            >
                                Entregar Pedido
                            </Button>
                        </Col>
                    </Row>

                    <Row className="mb-3">
                        <Col>
                            <strong>Domicilio del Pedido:</strong><br />
                            <div>
                                Referencia: {domicilio.detalles || "-"}, {domicilio.calle} {domicilio.numero}, CP {domicilio.codigoPostal}
                                {domicilio.piso && `, Piso ${domicilio.piso}`}
                                {domicilio.nroDepartamento && `, Dpto ${domicilio.nroDepartamento}`} - {domicilio.localidad?.nombre || 'Localidad no disponible'}
                            </div>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="mt-2"
                                onClick={abrirEnGoogleMaps}
                                disabled={!domicilio.localidad}
                            >
                                📍 Ver ubicación en Google Maps
                            </Button>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <strong>Detalle del Pedido</strong>
                            <Table striped bordered hover responsive className="mt-2">
                                <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                </tr>
                                </thead>
                                <tbody>
                                {detalles && detalles.length > 0 ? detalles.map((detalle) => {
                                    const esArticulo = !!detalle.articulo?.denominacion;
                                    const esPromocion = !!detalle.promocion?.denominacion;

                                    const nombre = esArticulo
                                        ? detalle.articulo.denominacion
                                        : esPromocion
                                            ? `🎁 Promo: ${detalle.promocion.denominacion}`
                                            : "Sin nombre";

                                    return (
                                        <React.Fragment key={detalle.id}>
                                            <tr>
                                                <td>{nombre}</td>
                                                <td>{detalle.cantidad}</td>
                                            </tr>

                                            {/* Si es promoción, mostrar el detalle interno */}
                                            {esPromocion && detalle.promocion.detalles?.length > 0 && (
                                                <tr>
                                                    <td colSpan={2}>
                                                        <ul className="mb-0 ps-3">
                                                            {detalle.promocion.detalles.map((dPromo) => (
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
                                }) : (
                                    <tr>
                                        <td colSpan={2} className="text-center text-muted">
                                            No hay detalles disponibles para este pedido
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                </Modal.Body>
            </Modal>

            {/* Mini modal de confirmación */}
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar entrega</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Desea confirmar la entrega de este pedido?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleConfirmEntrega}
                        disabled={loading}
                    >
                        {loading ? "Enviando..." : "Confirmar entrega"}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ModalMensaje
                show={modalMensaje.show}
                onHide={() => setModalMensaje({ ...modalMensaje, show: false })}
                mensaje={modalMensaje.mensaje}
                titulo={modalMensaje.titulo}
                variante={modalMensaje.variante}
            />
        </>
    );
};

export default DeliveryModal;