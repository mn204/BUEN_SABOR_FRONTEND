import React, { useState, useEffect } from "react"; // ✅ Agregado React al import
import { Modal, Button, Table } from 'react-bootstrap';
import Pedido from '../../../models/Pedido';
import { Eye } from 'react-bootstrap-icons';
import articuloManufacturadoService from '../../../services/ArticuloManufacturadoService';
import type ArticuloManufacturado from "../../../models/ArticuloManufacturado.ts";

interface Props {
    show: boolean;
    onHide: () => void;
    pedido: Pedido | null;
    onMarcarListo: (pedidoId: number) => void;
}

const CocinaModal = ({ show, onHide, pedido, onMarcarListo }: Props) => {
    if (!pedido) return null;

    const [articuloSeleccionado, setArticuloSeleccionado] = useState<ArticuloManufacturado | null>(null);
    const [showArticuloModal, setShowArticuloModal] = useState(false);
    const [articulosManufacturadosIds, setArticulosManufacturadosIds] = useState<Set<number>>(new Set());

    const horaPedido = new Date(pedido.fechaPedido).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,

    });

    const calcularHoraEstimada = (): string => {
        if (!pedido?.horaEstimadaFinalizacion) return "No especificada";

        const fecha = new Date(`1970-01-01T${pedido.horaEstimadaFinalizacion}`);

        if (pedido.tipoEnvio === "DELIVERY") {
            fecha.setMinutes(fecha.getMinutes() - 10);
        }

        const horas = fecha.getHours().toString().padStart(2, '0');
        const minutos = fecha.getMinutes().toString().padStart(2, '0');

        return `${horas}:${minutos}`;
    };

    const handleVerDetalleArticulo = async (idArticulo: number) => {
        try {
            const articulo = await articuloManufacturadoService.getById(idArticulo);
            setArticuloSeleccionado(articulo);
            setShowArticuloModal(true);
        } catch (error) {
            console.log("Este artículo no es un manufacturado");
        }
    };

    const handleCloseModalArticulo = () => {
        setShowArticuloModal(false);
        setArticuloSeleccionado(null);
    };

    useEffect(() => {
        const fetchArticulosManufacturados = async () => {
            if (!pedido) return;

            const idsSet = new Set<number>();

            for (const detalle of pedido.detalles) {
                if (detalle.articulo) {
                    try {
                        await articuloManufacturadoService.getById(detalle.articulo.id);
                        idsSet.add(detalle.articulo.id);
                    } catch {}
                }

                if (detalle.promocion?.detalles) {
                    for (const dPromo of detalle.promocion.detalles) {
                        if (dPromo.articulo) {
                            try {
                                await articuloManufacturadoService.getById(dPromo.articulo.id);
                                idsSet.add(dPromo.articulo.id);
                            } catch {}
                        }
                    }
                }
            }

            setArticulosManufacturadosIds(idsSet);
        };

        fetchArticulosManufacturados();
    }, [pedido]);

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered>
                <Modal.Header closeButton>
                    <div className="d-flex justify-content-between w-100 align-items-center">
                        <span className="fw-bold">Pedido Nº #{pedido.id}</span>
                        <span className="text-muted">Hora Pedido: {horaPedido}</span>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex justify-content-around align-items-center mb-3">
                        <div><strong>Hora estimada de finalización:</strong> {calcularHoraEstimada()}</div>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={async () => {
                                if (pedido) {
                                    await onMarcarListo(pedido.id);
                                }
                            }}
                        >
                            Pasar a Listo
                        </Button>
                    </div>

                    <h5 className="mb-2">Productos</h5>
                    <Table striped bordered hover size="sm">
                        <thead>
                        <tr>
                            <th>Cantidad</th>
                            <th>Denominación</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pedido.detalles?.map((detalle) => {
                            const esArticulo = !!detalle.articulo?.denominacion;
                            const esPromocion = !!detalle.promocion?.denominacion;

                            return (
                                <React.Fragment key={detalle.id}>
                                    {/* Fila principal: artículo o promoción */}
                                    <tr>
                                        <td>{detalle.cantidad}</td>
                                        <td>
                                            {esArticulo
                                                ? detalle.articulo.denominacion
                                                : esPromocion
                                                    ? `🎁 Promo: ${detalle.promocion.denominacion}`
                                                    : "Producto desconocido"}
                                        </td>
                                        <td>
                                            {esArticulo && articulosManufacturadosIds.has(detalle.articulo.id) && (
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => handleVerDetalleArticulo(detalle.articulo.id)}
                                                >
                                                    <Eye /> Ver detalle
                                                </Button>
                                            )}
                                        </td>
                                    </tr>

                                    {/* Sub-filas si es promoción */}
                                    {esPromocion && detalle.promocion.detalles?.length > 0 && detalle.promocion.detalles.map((dPromo) => (
                                        <tr key={`promo-${detalle.id}-${dPromo.id}`} className="text-muted small">
                                            <td className="ps-4">↳ {dPromo.cantidad}</td>
                                            <td>{dPromo.articulo?.denominacion}</td>
                                            <td>
                                                {dPromo.articulo && articulosManufacturadosIds.has(dPromo.articulo.id) && (
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => handleVerDetalleArticulo(dPromo.articulo.id)}
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </Table>
                </Modal.Body>
            </Modal>

            {/* Modal del artículo manufacturado */}
            <Modal show={showArticuloModal} onHide={handleCloseModalArticulo} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Detalle del Artículo Manufacturado</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {articuloSeleccionado ? (
                        <div>
                            {articuloSeleccionado.imagenes?.[0] && (
                                <img
                                    src={articuloSeleccionado.imagenes[0].denominacion}
                                    className="imgModalArtManu"
                                    alt={articuloSeleccionado.denominacion}
                                />
                            )}
                            <p><b>Denominación:</b> {articuloSeleccionado.denominacion}</p>
                            <p><b>Descripción:</b> {articuloSeleccionado.descripcion}</p>
                            <p><b>Precio Venta:</b> ${articuloSeleccionado.precioVenta}</p>
                            <p><b>Categoría:</b> {articuloSeleccionado.categoria?.denominacion}</p>
                            <p><b>Unidad de Medida:</b> {articuloSeleccionado.unidadMedida?.denominacion}</p>
                            <p><b>Tiempo Estimado:</b> {articuloSeleccionado.tiempoEstimadoMinutos} min</p>
                            <p><b>Preparación:</b> {articuloSeleccionado.preparacion}</p>
                            <p><b>Estado:</b> {articuloSeleccionado.eliminado ? "Eliminado" : "Activo"}</p>
                            <b>Detalles:</b>
                            <ul>
                                {articuloSeleccionado.detalles?.map((det, idx) => (
                                    <li key={idx}>
                                        {det.articuloInsumo?.denominacion} - {det.cantidad} {det.articuloInsumo?.unidadMedida?.denominacion}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-muted">No se pudo cargar el artículo.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModalArticulo}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default CocinaModal;