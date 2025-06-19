import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Row, Col, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pedido from "../../../models/Pedido";
import Estado from "../../../models/enums/Estado";
import PedidoDetalleModal from "./PedidoDetalleModal";
import pedidoService from "../../../services/PedidoService";
import { ReusableTable } from "../../Tabla";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import Cliente from "../../../models/Cliente";
import dayjs from 'dayjs';
interface Props {
    show: boolean;
    onHide: () => void;
    cliente: Cliente;
}

const PedidoClienteModal: React.FC<Props> = ({ show, onHide, cliente }) => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [loading, setLoading] = useState(false);
    const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
    const [showDetalleModal, setShowDetalleModal] = useState(false);

    const [filtros, setFiltros] = useState({
        sucursal: "",
        estado: "",
        desde: null as Date | null,
        hasta: null as Date | null,
        articulo: ""
    });

    const fetchPedidos = async () => {
        try {
            setLoading(true);
            const filtrosConvertidos = {
                ...filtros,
                desde: filtros.desde ? filtros.desde.toISOString() : null,
                hasta: filtros.hasta ? filtros.hasta.toISOString() : null
            };
            const result = await pedidoService.getPedidosCliente(cliente.id!, filtrosConvertidos, page, size);
            setPedidos(result.content);
            setTotalPages(result.totalPages);
        } catch {
            alert("Error al obtener pedidos del cliente");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) fetchPedidos();
    }, [show, page]);

    const handleVerDetalle = async (pedidoId: number) => {
        try {
            const detalle = await pedidoService.getDetallePedido(cliente.id!, pedidoId);
            setDetallePedido(detalle);
            setShowDetalleModal(true);
        } catch {
            alert("Error al obtener detalle del pedido");
        }
    };

    const handleDescargarFactura = async (pedidoId: number) => {
        try {
            const blob = await pedidoService.descargarFactura(cliente.id!, pedidoId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `factura_pedido_${pedidoId}.pdf`;
            a.click();
        } catch {
            alert("Error al descargar la factura");
        }
    };

    const handleFiltrar = () => {
        setPage(0);
        fetchPedidos();
    };

    const columns = [
        { key: "numero", label: "Número", render: (_: any, row: Pedido) => row.id },
        { key: "fecha", label: "Fecha", render: (_: any, row: Pedido) => dayjs(row.fechaPedido).format("DD/MM/YYYY HH:mm") },
        { key: "total", label: "Total", render: (_: any, row: Pedido) => `$${row.total.toFixed(2)}` },
        { key: "estado", label: "Estado", render: (_: any, row: Pedido) => row.estado },
        { key: "sucursal", label: "Sucursal", render: (_: any, row: Pedido) => row.sucursal.nombre },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: Pedido) => (
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => handleDescargarFactura(row.id!)}>Descargar Factura</Button>
                    <Button variant="primary" size="sm" onClick={() => handleVerDetalle(row.id!)}>Ver detalle</Button>
                </div>
            )
        }
    ];

    return (
        <>
            <Modal show={show} onHide={onHide} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Pedidos del Cliente #{cliente.id} - {cliente.nombre} {cliente.apellido}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form className="mb-3">
                        <Row>
                            <Col><Form.Control placeholder="Sucursal" value={filtros.sucursal} onChange={(e) => setFiltros({ ...filtros, sucursal: e.target.value })} /></Col>
                            <Col>
                                <Form.Select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
                                    <option value="">Estado</option>
                                    {Object.values(Estado).map((est) => (
                                        <option key={est} value={est}>{est}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col><DatePicker className="form-control" placeholderText="Desde" selected={filtros.desde} onChange={(date) => setFiltros({ ...filtros, desde: date })} showTimeSelect dateFormat="Pp" /></Col>
                            <Col><DatePicker className="form-control" placeholderText="Hasta" selected={filtros.hasta} onChange={(date) => setFiltros({ ...filtros, hasta: date })} showTimeSelect dateFormat="Pp" /></Col>
                            <Col><Form.Control placeholder="Artículo" value={filtros.articulo} onChange={(e) => setFiltros({ ...filtros, articulo: e.target.value })} /></Col>
                            <Col><Button onClick={handleFiltrar}>Filtrar</Button></Col>
                        </Row>
                    </Form>

                    {loading ? <Spinner animation="border" /> : (
                        pedidos.length === 0 ? <p>No hay pedidos</p> : (
                            <>
                                <ReusableTable data={pedidos} columns={columns} />
                                <div className="d-flex justify-content-end mt-3">
                                    <Button variant="outline-secondary" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft /></Button>
                                    <span className="mx-2 align-self-center">Página {page + 1} de {totalPages}</span>
                                    <Button variant="outline-secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight /></Button>
                                </div>
                            </>
                        )
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            {detallePedido && (
                <PedidoDetalleModal
                    show={showDetalleModal}
                    onHide={() => setShowDetalleModal(false)}
                    pedido={detallePedido}
                />
            )}
        </>
    );
};

export default PedidoClienteModal;
