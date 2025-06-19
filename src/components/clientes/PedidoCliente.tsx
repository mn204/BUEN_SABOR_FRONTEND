import React, { useEffect, useState } from "react";
import { Button, Form, Row, Col, Spinner } from "react-bootstrap";
import Pedido from "../../models/Pedido";
import pedidoService from "../../services/PedidoService";
import { useAuth } from "../../context/AuthContext";
import PedidoDetalleModal from "../empleados/modales/PedidoDetalleModal.tsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Estado from "../../models/enums/Estado";
import PedidoCard from "./PedidoCard";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";

const PedidoCliente: React.FC = () => {
    const { cliente } = useAuth();
    const [pedidos, setPedidos] = useState<{ content: Pedido[]; totalPages: number }>({ content: [], totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
    const [showModal, setShowModal] = useState(false);

    const [filtros, setFiltros] = useState({
        sucursal: "",
        estado: "",
        desde: null as Date | null,
        hasta: null as Date | null,
        articulo: "",
    });

    // Paginación
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);

    const fetchPedidos = async () => {
        try {
            if (!cliente) return;
            setLoading(true);

            // Preparar filtros para la API (conversión de fechas)
            const filtrosConvertidos = {
                ...filtros,
                desde: filtros.desde ? filtros.desde.toISOString() : null,
                hasta: filtros.hasta ? filtros.hasta.toISOString() : null,
            };

            const result = await pedidoService.getPedidosCliente(cliente.id!, filtrosConvertidos, page, size);
            setPedidos(result);
            setTotalPages(result.totalPages);
        } catch (err: any) {
            setError(err.message || "Error al obtener pedidos");
        } finally {
            setLoading(false);
        }
    };

    // Efecto para filtros instantáneos
    useEffect(() => {
        fetchPedidos();
    }, [page, filtros]); // Agregamos filtros como dependencia

    const handleDetalle = async (pedidoId: number) => {
        try {
            const detalle = await pedidoService.getDetallePedido(cliente!.id!, pedidoId);
            setDetallePedido(detalle);
            setShowModal(true);
        } catch {
            alert("Error al obtener detalle del pedido");
        }
    };

    const handleDescargarFactura = async (pedidoId: number) => {
        try {
            const blob = await pedidoService.descargarFactura(cliente!.id!, pedidoId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `factura_pedido_${pedidoId}.pdf`;
            a.click();
        } catch {
            alert("Error al descargar la factura");
        }
    };

    const limpiarFiltros = () => {
        setFiltros({
            sucursal: "",
            estado: "",
            desde: null,
            hasta: null,
            articulo: "",
        });
        setPage(0);
    };

    // Función para manejar cambios en filtros y resetear página
    const handleFiltroChange = (newFiltros: any) => {
        setFiltros(newFiltros);
        setPage(0); // Resetear a la primera página cuando cambian los filtros
    };

    return (
        <div className="container mt-4 m-4 d-flex flex-column justify-content-center m-auto">
            <h2 className="text-center fw-bold mb-4 perfilTitle">Mis Pedidos</h2>
                    {/* Filtros responsive */}
                    <Form className="mb-3">
                        <Row className="g-2">
                            <Col xs={12} lg>
                                <Form.Control
                                    placeholder="Sucursal"
                                    value={filtros.sucursal}
                                    onChange={(e) => handleFiltroChange({ ...filtros, sucursal: e.target.value })}
                                />
                            </Col>
                            <Col xs={12} lg>
                                <Form.Select
                                    value={filtros.estado}
                                    onChange={(e) => handleFiltroChange({ ...filtros, estado: e.target.value })}
                                >
                                    <option value="">Estado</option>
                                    {Object.values(Estado).map((est) => (
                                        <option key={est} value={est}>
                                            {est}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col xs={12} lg>
                                <DatePicker
                                    className="form-control"
                                    placeholderText="Desde"
                                    selected={filtros.desde}
                                    onChange={(date) => handleFiltroChange({ ...filtros, desde: date })}
                                    showTimeSelect
                                    dateFormat="Pp"
                                />
                            </Col>
                            <Col xs={12} lg>
                                <DatePicker
                                    className="form-control"
                                    placeholderText="Hasta"
                                    selected={filtros.hasta}
                                    onChange={(date) => handleFiltroChange({ ...filtros, hasta: date })}
                                    showTimeSelect
                                    dateFormat="Pp"
                                />
                            </Col>
                            <Col xs={12} lg>
                                <Form.Control
                                    placeholder="Artículo"
                                    value={filtros.articulo}
                                    onChange={(e) => handleFiltroChange({ ...filtros, articulo: e.target.value })}
                                />
                            </Col>
                            <Col xs={12} lg="auto">
                                <Button
                                    variant="outline-secondary"
                                    onClick={limpiarFiltros}
                                    className="w-100"
                                >
                                    Ver Todos
                                </Button>
                            </Col>
                        </Row>
                    </Form>

                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        <>
                            {pedidos.content.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <p>No hay pedidos que coincidan con los filtros aplicados</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column align-items-center">
                                    {pedidos.content.map((p) => (
                                        <div key={p.id} className="w-100" style={{ maxWidth: "1000px" }}>
                                            <PedidoCard
                                                pedido={p}
                                                onVerDetalle={handleDetalle}
                                                onDescargarFactura={handleDescargarFactura}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Navegación de páginas responsive */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4 pt-3 border-top mb-4">
                                    <div
                                        className="d-flex align-items-center gap-2 flex-wrap justify-content-center bg-white px-3 py-2 rounded shadow-sm"
                                        style={{ zIndex: 0 }} // Evita superponerse a otros elementos como navbar
                                    >
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            disabled={page === 0}
                                            onClick={() => setPage(page - 1)}
                                            className="d-flex align-items-center"
                                        >
                                            <ChevronLeft size={16} />
                                            <span className="d-none d-sm-inline ms-1">Anterior</span>
                                        </Button>

                                        <div className="text-muted fw-medium small px-2">
                                            <span className="d-inline d-sm-none">
                                                {page + 1} / {totalPages}
                                            </span>
                                            <span className="d-none d-sm-inline">
                                                Página {page + 1} de {totalPages}
                                            </span>
                                        </div>

                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            disabled={page >= totalPages - 1}
                                            onClick={() => setPage(page + 1)}
                                            className="d-flex align-items-center"
                                        >
                                            <span className="d-none d-sm-inline me-1">Siguiente</span>
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {detallePedido && (
                        <PedidoDetalleModal show={showModal} onHide={() => setShowModal(false)} pedido={detallePedido} />
                    )}
            </div>
    );
};

export default PedidoCliente;