import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/PedidoConfimrado.css';
import { useParams } from "react-router-dom";
import PedidoService from '../../services/PedidoService';
import Pedido from '../../models/Pedido';
import TipoEnvio from '../../models/enums/TipoEnvio';


interface Props {
    onContinuarComprando?: () => void;
    onVerPedidos?: () => void;
}

const PedidoConfirmado: React.FC<Props> = ({
    onContinuarComprando,
    onVerPedidos
}) => {
    const navigate = useNavigate();
    const [animacionVisible, setAnimacionVisible] = useState(false);
    const { id } = useParams();
    const [pedido, setPedido] = useState<Pedido>();

    useEffect(() => {
        if (id) {
            PedidoService.getPedidoPorId(Number(id)).then((ped) => {
                setPedido(ped)
                console.log(ped)
            })
        }
        // Trigger de la animación después de montar el componente
        const timer = setTimeout(() => {
            setAnimacionVisible(true);
        }, 100);

        return () => clearTimeout(timer);
    }, [id]);

    const handleContinuarComprando = () => {
        if (onContinuarComprando) {
            onContinuarComprando();
        } else {
            navigate('/');
        }
    };

    const handleVerPedidos = () => {
        if (onVerPedidos) {
            onVerPedidos();
        } else {
            navigate('/pedidos');
        }
    };

    const handleCompartir = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Mi pedido en El Buen Sabor',
                    text: `¡Acabo de hacer un pedido! Número: ${pedido!.id}`,
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error al compartir:', error);
            }
        } else {
            // Fallback para copiar al portapapeles
            navigator.clipboard.writeText(`Mi pedido #${pedido!.id} en El Buen Sabor`);
        }
    };

    return (
        <>
            {pedido && pedido.detalles &&
                <div className="pedido-confirmado">
                    <div className={`pedido-confirmado__container ${animacionVisible ? 'visible' : ''}`}>

                        {/* Header con animación de éxito */}
                        <div className="pedido-confirmado__header">
                            <div className="pedido-confirmado__check-animation">
                                <svg className="checkmark" viewBox="0 0 100 100">
                                    <circle className="checkmark__circle" cx="50" cy="50" r="45" fill="none" stroke="#4CAF50" strokeWidth="6" />
                                    <path className="checkmark__check" d="M25 50l15 15 35-35" fill="none" stroke="#4CAF50" strokeWidth="6" strokeLinecap="round" />
                                </svg>
                            </div>

                            <h1 className="pedido-confirmado__title">
                                ¡Pedido Confirmado!
                            </h1>

                            <p className="pedido-confirmado__subtitle">
                                Tu pedido ha sido recibido y está siendo preparado
                            </p>
                        </div>

                        {/* Información del pedido */}
                        <div className="pedido-confirmado__info">
                            <div className="pedido-confirmado__numero">
                                <span className="label">Número de pedido:</span>
                                <span className="numero">#{pedido!.id}</span>
                            </div>

                            <div className="pedido-confirmado__tiempo">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12,6 12,12 16,14" />
                                </svg>
                                <span>Tiempo estimado: <strong>{pedido!.horaEstimadaFinalizacion}</strong></span>
                            </div>
                        </div>

                        {/* Resumen de productos */}
                        <div className="pedido-confirmado__productos">
                            <h3>Resumen del pedido</h3>
                            <div className="productos-lista">
                                {pedido!.detalles.map((det, index) => (
                                    <React.Fragment key={index}>
                                        {det.articulo && (
                                            <div className="producto-item">
                                                <div className="producto-info d-flex flex-row">
                                                    <span className="producto-nombre">{det.articulo.denominacion}</span>
                                                    <span className="producto-cantidad">x{det.cantidad}</span>
                                                </div>
                                                <span className="producto-precio">
                                                    {pedido?.tipoEnvio === TipoEnvio.TAKEAWAY ? (
                                                        <>
                                                            <span style={{ textDecoration: 'line-through', color: '#888', marginRight: 4 }}>
                                                                ${(det.articulo.precioVenta! * det.cantidad).toLocaleString()}
                                                            </span>
                                                            <span style={{ color: '#4CAF50', fontWeight: 600 }}>
                                                                ${(det.articulo.precioVenta! * det.cantidad * 0.9).toLocaleString()}
                                                            </span>
                                                            <span className="descuento-label" style={{ color: '#4CAF50', marginLeft: 6, fontSize: 12 }}>
                                                                10% OFF Takeaway
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>${(det.articulo.precioVenta! * det.cantidad).toLocaleString()}</>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {det.promocion && (
                                            <div className="producto-item">
                                                <div className="producto-info d-flex flex-row">
                                                    <span className="producto-nombre">{det.promocion.denominacion}</span>
                                                    <span className="producto-cantidad">x{det.cantidad}</span>
                                                </div>
                                                <span className="producto-precio">
                                                    {pedido?.tipoEnvio === TipoEnvio.TAKEAWAY ? (
                                                        <>
                                                            <span style={{ textDecoration: 'line-through', color: '#888', marginRight: 4 }}>
                                                                ${(det.promocion.precioPromocional * det.cantidad).toLocaleString()}
                                                            </span>
                                                            <span style={{ color: '#4CAF50', fontWeight: 600 }}>
                                                                ${(det.promocion.precioPromocional * det.cantidad * 0.9).toLocaleString()}
                                                            </span>
                                                            <span className="descuento-label" style={{ color: '#4CAF50', marginLeft: 6, fontSize: 12 }}>
                                                                10% OFF Takeaway
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>${(det.promocion.precioPromocional * det.cantidad).toLocaleString()}</>
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}

                            </div>

                            <div className="pedido-confirmado__total">
                                <span>Total: <strong>${pedido!.total.toLocaleString()}</strong></span>
                            </div>
                        </div>

                        {/* Información de entrega */}
                        {pedido!.domicilio && (
                            <div className="pedido-confirmado__entrega">
                                <h3>Información de entrega</h3>
                                <div className="entrega-info">
                                    <div className="entrega-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span>{pedido!.cliente!.apellido} {pedido!.cliente!.nombre}</span>
                                    </div>
                                    <div className="entrega-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span>{pedido!.domicilio.calle}, {pedido!.domicilio.localidad?.nombre}</span>
                                    </div>
                                    <div className="entrega-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                        <span>{pedido!.cliente!.telefono}</span>
                                    </div>
                                    <div className="entrega-item">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Método de pago */}
                        <div className="pedido-confirmado__pago">
                            <div className="pago-info">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                                <span>Método de pago: <strong>{pedido!.formaPago}</strong></span>
                            </div>
                        </div>

                        {/* Estado del pedido */}
                        <div className="pedido-confirmado__estado">
                            <div className="estado-timeline">
                                <div className="estado-item activo">
                                    <div className="estado-punto"></div>
                                    <span>Pedido confirmado</span>
                                </div>
                                <div className="estado-item">
                                    <div className="estado-punto"></div>
                                    <span>Preparando</span>
                                </div>
                                <div className="estado-item">
                                    <div className="estado-punto"></div>
                                    <span>En camino</span>
                                </div>
                                <div className="estado-item">
                                    <div className="estado-punto"></div>
                                    <span>Entregado</span>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="pedido-confirmado__acciones">
                            <button
                                className="btn-secundario"
                                onClick={handleCompartir}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                                Compartir
                            </button>

                            <button
                                className="btn-secundario"
                                onClick={handleVerPedidos}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14,2 14,8 20,8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10,9 9,9 8,9" />
                                </svg>
                                Ver mis pedidos
                            </button>

                            <button
                                className="btn-primario"
                                onClick={handleContinuarComprando}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="m1 1 4 4 14 1-1 12H6" />
                                </svg>
                                Continuar comprando
                            </button>
                        </div>
                    </div>
                </div>
            }
        </>
    );
};

export default PedidoConfirmado;