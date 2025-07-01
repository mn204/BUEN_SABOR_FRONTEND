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
import Sucursal from "../../../models/Sucursal";
import { obtenerSucursales } from "../../../services/SucursalService";
import { es } from 'date-fns/locale';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import ModalMensaje from "./ModalMensaje";

dayjs.extend(utc);
dayjs.extend(timezone);

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
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [sortDesc, setSortDesc] = useState(true);

    const [filtros, setFiltros] = useState({
        sucursal: "",
        estado: "",
        desde: null as Date | null,
        hasta: null as Date | null,
        articulo: ""
    });

    const [modalMensaje, setModalMensaje] = useState({
        show: false,
        mensaje: "",
        titulo: "Mensaje",
        variante: "danger" as "primary" | "success" | "danger" | "warning" | "info" | "secondary"
    });

    // Cargar sucursales al montar el componente
    useEffect(() => {
        obtenerSucursales().then(setSucursales);
    }, []);

    const mostrarModalMensaje = (mensaje: string, variante: typeof modalMensaje.variante = "danger", titulo = "Error") => {
        setModalMensaje({ show: true, mensaje, variante, titulo });
    };

    const fetchPedidos = async () => {
        try {
            setLoading(true);

            // Ajustar fechaHasta si la hora es 00:00:00
            let fechaHastaDate = filtros.hasta;
            if (
                fechaHastaDate &&
                fechaHastaDate.getHours() === 0 &&
                fechaHastaDate.getMinutes() === 0 &&
                fechaHastaDate.getSeconds() === 0 &&
                fechaHastaDate.getMilliseconds() === 0
            ) {
                fechaHastaDate = new Date(fechaHastaDate);
                fechaHastaDate.setHours(23, 59, 59, 999);
            }

            const fechaDesde = filtros.desde
                ? dayjs(filtros.desde).tz("America/Argentina/Buenos_Aires").format()
                : undefined;
            const fechaHasta = fechaHastaDate
                ? dayjs(fechaHastaDate).tz("America/Argentina/Buenos_Aires").format()
                : undefined;

            const filtrosConvertidos = {
                ...filtros,
                fechaDesde,
                fechaHasta,
            };

            const result = await pedidoService.getPedidosCliente(
                cliente.id!,
                filtrosConvertidos,
                page,
                size,
                sortDesc ? "DESC" : "ASC"
            );

            setPedidos(result.content);
            setTotalPages(result.totalPages);
        } catch {
            mostrarModalMensaje("Error al obtener pedidos del cliente", "danger", "Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show) fetchPedidos();
    }, [show, page, filtros, sortDesc]);

    const handleVerDetalle = async (pedidoId: number) => {
        try {
            const detalle = await pedidoService.getDetallePedido(cliente.id!, pedidoId);
            setDetallePedido(detalle);
            setShowDetalleModal(true);
        } catch {
            mostrarModalMensaje("Error al obtener detalle del pedido", "danger", "Error");
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
            mostrarModalMensaje("Error al descargar la factura", "danger", "Error");
        }
    };

    // Función para manejar cambios en filtros y resetear página
    const handleFiltroChange = (newFiltros: any) => {
        setFiltros(newFiltros);
        setPage(0); // Resetear a la primera página cuando cambian los filtros
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
                    <Button variant="outline-secondary" size="sm" onClick={() => handleDescargarFactura(row.id!)}>
                        Descargar Factura
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleVerDetalle(row.id!)}>
                        Ver detalle
                    </Button>
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
                    {/* Filtros mejorados */}
                    <Form className="mb-3">
                        <Row className="gy-2 gx-2">
                            <Col xs={12} sm={6} md={3}>
                                <Form.Select
                                    size="sm"
                                    value={filtros.sucursal}
                                    onChange={(e) => handleFiltroChange({ ...filtros, sucursal: e.target.value })}
                                >
                                    <option value="">Todas las Sucursales</option>
                                    {sucursales.map((sucursal) => (
                                        <option key={sucursal.id} value={sucursal.nombre}>
                                            {sucursal.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col xs={12} sm={6} md={2}>
                                <Form.Select
                                    size="sm"
                                    value={filtros.estado}
                                    onChange={(e) => handleFiltroChange({ ...filtros, estado: e.target.value })}
                                >
                                    <option value="">Estado</option>
                                    {Object.values(Estado).map((est) => (
                                        <option key={est} value={est}>{est}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                            <Col xs={12} sm={6} md={2}>
                                <DatePicker
                                    className="form-control form-control-sm"
                                    placeholderText="Desde"
                                    selected={filtros.desde}
                                    onChange={(date) => {
                                        handleFiltroChange({
                                            ...filtros,
                                            desde: date,
                                            hasta: filtros.hasta && date && filtros.hasta < date ? null : filtros.hasta,
                                        });
                                    }}
                                    dateFormat="dd/MM/yyyy HH:mm"
                                    locale={es}
                                    maxDate={filtros.hasta || undefined}
                                    isClearable
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    timeCaption="Hora"
                                />
                            </Col>
                            <Col xs={12} sm={6} md={2}>
                                <DatePicker
                                    className="form-control form-control-sm"
                                    placeholderText="Hasta"
                                    selected={filtros.hasta}
                                    onChange={(date) => handleFiltroChange({ ...filtros, hasta: date })}
                                    dateFormat="dd/MM/yyyy HH:mm"
                                    locale={es}
                                    minDate={filtros.desde || undefined}
                                    isClearable
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    timeCaption="Hora"
                                />
                            </Col>
                            <Col xs={12} sm={6} md={2}>
                                <Form.Control
                                    size="sm"
                                    placeholder="Nombre del Artículo"
                                    value={filtros.articulo}
                                    onChange={(e) => handleFiltroChange({ ...filtros, articulo: e.target.value })}
                                />
                            </Col>
                            <Col xs={12} sm={6} md={1} className="d-flex flex-column gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={limpiarFiltros}
                                >
                                    Limpiar
                                </Button>
                                <Button
                                    variant={sortDesc ? "outline-primary" : "outline-dark"}
                                    size="sm"
                                    onClick={() => setSortDesc((prev) => !prev)}
                                    title="Alternar orden de fecha"
                                >
                                    {sortDesc ? "⬇ Nuevos" : "⬆ Viejos"}
                                </Button>
                            </Col>
                        </Row>
                    </Form>

                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        pedidos.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <p>No hay pedidos que coincidan con los filtros aplicados</p>
                            </div>
                        ) : (
                            <>
                                <ReusableTable data={pedidos} columns={columns} />
                                {/* Paginación mejorada */}
                                {totalPages > 1 && (
                                    <div className="d-flex justify-content-center mt-4 pt-3 border-top">
                                        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-center bg-white px-3 py-2 rounded shadow-sm">
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

export default PedidoClienteModal;