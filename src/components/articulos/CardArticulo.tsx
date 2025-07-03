import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Articulo from "../../models/Articulo";
import { useCarrito } from "../../hooks/useCarrito";
import "../.././styles/cardArticulo.css"; // Archivo CSS para estilos
import { useSucursalUsuario } from "../../context/SucursalContext";

interface Props {
    articulo: Articulo;
    stock?: boolean;
    stockLoading?: boolean;
    onStockUpdate?: () => void;
}

const Cardarticulo: React.FC<Props> = ({
    articulo,
    stock = true,
    stockLoading = false,
    onStockUpdate
}) => {
    const carritoCtx = useCarrito();
    const navigate = useNavigate();
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { esSucursalAbierta, sucursalActualUsuario } = useSucursalUsuario();

    // Determinar si el artículo está disponible
    const isOutOfStock = !stockLoading && stock == false;
    const isDisabled = stockLoading || isOutOfStock || isLoading;

    const handleAgregarAlCarrito = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que se navegue al hacer click en el botón

        if (isOutOfStock) return;

        if (carritoCtx && articulo) {
            setIsLoading(true);
            try {
                await carritoCtx.agregarAlCarrito(articulo, 1);
                // Actualizar stock después de agregar al carrito
                if (onStockUpdate) {
                    onStockUpdate();
                }
                // Aquí podrías agregar una notificación de éxito
            } catch (error) {
                console.error("Error al agregar al carrito:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleCardClick = () => {
        // Permitir navegación incluso si no hay stock
        navigate(`/articulo/${articulo.id}`);
    };

    const handleCardClickFalse = () => {
        // Permitir navegación incluso si no hay stock
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const getButtonText = () => {
        if (isLoading) return "Agregando...";
        if (stockLoading) return "Consultando stock...";
        if (isOutOfStock) return "Sin stock";
        return "Agregar al carrito";
    };

    return (
        <div className={`card-articulo ${isOutOfStock ? 'out-of-stock' : ''}`} onClick={isOutOfStock ? handleCardClickFalse : handleCardClick}>
            <div className="card-articulo__image-container">
                {isOutOfStock && (
                    <div className="card-articulo__overlay">
                        <span className="card-articulo__out-of-stock-text">Sin Stock</span>
                    </div>
                )}
                {imageError ? (
                    <div className="card-articulo__placeholder">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21,15 16,10 5,21" />
                        </svg>
                        <span>Sin imagen</span>
                    </div>
                ) : (
                    <img
                        src={articulo?.imagenes?.[0]?.denominacion || "/placeholder.png"}
                        alt={articulo.denominacion || "Promoción"}
                        className="card-articulo__image"
                        onError={handleImageError}
                        loading="lazy"
                    />
                )}
            </div>

            <div className="card-articulo__content">
                <h3 className="card-articulo__title">
                    {articulo.denominacion}
                </h3>

                <div className="card-articulo__price-section">
                    <span className="card-articulo__promo-price">
                        ${articulo.precioVenta?.toLocaleString() || 'N/A'}
                    </span>
                </div>

                {/* Información de stock */}
                <div className="card-articulo__stock-info">
                    {stockLoading && (
                        <span className="card-articulo__stock-loading">Consultando stock...</span>
                    )
                    }
                </div>
                {esSucursalAbierta(sucursalActualUsuario!) &&
                    <button
                        onClick={handleAgregarAlCarrito}
                        disabled={isDisabled}
                        className={`card-articulo__button ${isLoading ? 'loading' : ''} ${isDisabled ? 'disabled' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                Agregando...
                            </>
                        ) : stockLoading ? (
                            <>
                                <span className="spinner"></span>
                                Consultando stock...
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="m1 1 4 4 14 1-1 12H6" />
                                </svg>
                                {getButtonText()}
                            </>
                        )}
                    </button>
                }
            </div>
        </div>
    );
};

export default Cardarticulo;