import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Promocion from "../../models/Promocion";
import { useCarrito } from "../../hooks/useCarrito";
import "../.././styles/cardPromocion.css"; // Archivo CSS para estilos
import { useSucursalUsuario } from "../../context/SucursalContext";

interface Props {
    promocion: Promocion;
}

const CardPromocion: React.FC<Props> = ({ promocion }) => {
    const { esSucursalAbierta, sucursalActualUsuario } = useSucursalUsuario();
    const carritoCtx = useCarrito();
    const navigate = useNavigate();
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleAgregarAlCarrito = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que se navegue al hacer click en el botón

        if (carritoCtx && promocion) {
            setIsLoading(true);
            try {
                await carritoCtx.agregarPromocionAlCarrito(promocion);
                // Aquí podrías agregar una notificación de éxito
            } catch (error) {
                console.error("Error al agregar al carrito:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleCardClick = () => {
        navigate(`/promocion/${promocion.id}`);
    };

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div className="card-promocion" onClick={handleCardClick}>
            <div className="card-promocion__image-container">
                {imageError ? (
                    <div className="card-promocion__placeholder">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21,15 16,10 5,21" />
                        </svg>
                        <span>Sin imagen</span>
                    </div>
                ) : (
                    <img
                        src={promocion?.imagenes?.[0]?.denominacion || "/placeholder.png"}
                        alt={promocion.denominacion || "Promoción"}
                        className="card-promocion__image"
                        onError={handleImageError}
                        loading="lazy"
                    />
                )}
            </div>

            <div className="card-promocion__content">
                <h3 className="card-promocion__title">
                    {promocion.denominacion}
                </h3>

                {promocion.descripcionDescuento && (
                    <p className="card-promocion__description">
                        {promocion.descripcionDescuento.length > 80
                            ? `${promocion.descripcionDescuento.substring(0, 80)}...`
                            : promocion.descripcionDescuento
                        }
                    </p>
                )}

                <div className="card-promocion__price-section">
                    <span className="card-promocion__promo-price">
                        ${promocion.precioPromocional?.toLocaleString() || 'N/A'}
                    </span>
                </div>

                {promocion.fechaHasta && (
                    <div className="card-promocion__validity">
                        <small>Válida hasta: {new Date(promocion.fechaHasta).toLocaleDateString()}</small>
                    </div>
                )}

                {esSucursalAbierta(sucursalActualUsuario!) &&
                    <button
                        onClick={handleAgregarAlCarrito}
                        disabled={isLoading}
                        className={`card-promocion__button ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                Agregando...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="m1 1 4 4 14 1-1 12H6" />
                                </svg>
                                Agregar al carrito
                            </>
                        )}
                    </button>
                }
            </div>
        </div>
    );
};

export default CardPromocion;