import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Promocion from "../../models/Promocion";
import { useCarrito } from "../../hooks/useCarrito";
import "../../styles/promocionDetalle.css"; // Archivo CSS para estilos
import PromocionService from "../../services/PromocionService";
import { useSucursalUsuario } from "../../context/SucursalContext";

const PromocionDetalle: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const carritoCtx = useCarrito();
    const navigate = useNavigate();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [promocion, setPromocion] = useState<Promocion | null>(null);
    const [imageError, setImageError] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPromocion, setIsLoadingPromocion] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { esSucursalAbierta, sucursalActualUsuario } = useSucursalUsuario();

    useEffect(() => {
        const fetchPromocion = async () => {
            if (!id) {
                setError("ID de promoción no válido");
                setIsLoadingPromocion(false);
                return;
            }

            try {
                setIsLoadingPromocion(true);
                const promo = await PromocionService.getById(Number(id));
                setPromocion(promo);
                setError(null);
            } catch (error) {
                console.error("Error al cargar la promoción:", error);
                setError("Error al cargar la promoción");
            } finally {
                setIsLoadingPromocion(false);
            }
        };

        fetchPromocion();
    }, [id]);

    const handleAgregarAlCarrito = async () => {
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

    const handleImageError = (index: number) => {
        setImageError(prev => [...prev, index]);
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (time: string) => {
        return time || 'No especificado';
    };

    const isPromocionActiva = () => {
        if (!promocion) return false;

        const now = new Date();
        const desde = new Date(promocion.fechaDesde);
        const hasta = new Date(promocion.fechaHasta);

        return promocion.activa && now >= desde && now <= hasta;
    };

    // Estados de carga y error
    if (isLoadingPromocion) {
        return (
            <div className="promocion-detalle">
                <div className="promocion-detalle__loading">
                    <div className="spinner"></div>
                    <p>Cargando promoción...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="promocion-detalle">
                <div className="promocion-detalle__error">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={handleBackClick} className="promocion-detalle__back-button">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // Verifica si alguna categoría asociada a los artículos de los detalles está eliminada (recursivamente)
    const isCategoriaEliminada = (categoria: any): boolean => {
        if (!categoria) return false;
        if (categoria.eliminado) return true;
        return isCategoriaEliminada(categoria.categoriaPadre);
    };

    // Si la promoción no existe, está eliminada, o alguna categoría de algún artículo está eliminada, no mostrar la promoción
    if (
        !promocion ||
        promocion.eliminado ||
        (promocion.detalles &&
            promocion.detalles.some(
                detalle =>
                    detalle.articulo &&
                    isCategoriaEliminada(detalle.articulo.categoria)
            )
        )
    ) {
        return (
            <div className="promocion-detalle">
                <div className="promocion-detalle__not-found">
                    <h2>Promoción no encontrada</h2>
                    <p>La promoción que buscas no existe o ha sido eliminada.</p>
                    <button onClick={handleBackClick} className="promocion-detalle__back-button">
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="promocion-detalle">
            {/* Header con botón de volver */}
            <div className="promocion-detalle__header">
                <button
                    onClick={handleBackClick}
                    className="promocion-detalle__back-button"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="15,18 9,12 15,6"></polyline>
                    </svg>
                    Volver
                </button>
            </div>

            <div className="promocion-detalle__container">
                {/* Sección de imágenes */}
                <div className="promocion-detalle__images-section">
                    <div className="promocion-detalle__main-image">
                        {promocion?.imagenes && promocion.imagenes.length > 0 ? (
                            imageError.includes(selectedImageIndex) ? (
                                <div className="promocion-detalle__image-placeholder">
                                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21,15 16,10 5,21" />
                                    </svg>
                                    <span>Imagen no disponible</span>
                                </div>
                            ) : (
                                <img
                                    src={promocion.imagenes[selectedImageIndex]?.denominacion || "/placeholder.png"}
                                    alt={`${promocion.denominacion} - Imagen ${selectedImageIndex + 1}`}
                                    className="promocion-detalle__main-image-img"
                                    onError={() => handleImageError(selectedImageIndex)}
                                />
                            )
                        ) : (
                            <div className="promocion-detalle__image-placeholder">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21,15 16,10 5,21" />
                                </svg>
                                <span>Sin imágenes</span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails de imágenes */}
                    {promocion?.imagenes && promocion.imagenes.length > 1 && (
                        <div className="promocion-detalle__thumbnails">
                            {promocion.imagenes.map((imagen, index) => (
                                <div
                                    key={index}
                                    className={`promocion-detalle__thumbnail ${selectedImageIndex === index ? 'active' : ''
                                        }`}
                                    onClick={() => setSelectedImageIndex(index)}
                                >
                                    {imageError.includes(index) ? (
                                        <div className="promocion-detalle__thumbnail-placeholder">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <img
                                            src={imagen.denominacion}
                                            alt={`Miniatura ${index + 1}`}
                                            onError={() => handleImageError(index)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Información de la promoción */}
                <div className="promocion-detalle__info-section">
                    <div className="promocion-detalle__status">
                        <span className={`promocion-detalle__status-badge ${isPromocionActiva() ? 'active' : 'inactive'
                            }`}>
                            {isPromocionActiva() ? 'Promoción Activa' : 'Promoción Inactiva'}
                        </span>
                    </div>

                    <h1 className="promocion-detalle__title">
                        {promocion?.denominacion}
                    </h1>

                    {promocion?.descripcionDescuento && (
                        <div className="promocion-detalle__description">
                            <h3>Descripción del descuento</h3>
                            <p>{promocion.descripcionDescuento}</p>
                        </div>
                    )}

                    <div className="promocion-detalle__price">
                        <span className="promocion-detalle__price-label">Precio promocional:</span>
                        <span className="promocion-detalle__price-value">
                            ${promocion?.precioPromocional?.toLocaleString() || 'No especificado'}
                        </span>
                    </div>

                    {/* Información de fechas y horarios */}
                    <div className="promocion-detalle__schedule">
                        <h3>Vigencia de la promoción</h3>
                        <div className="promocion-detalle__schedule-grid">
                            <div className="promocion-detalle__schedule-item">
                                <strong>Desde:</strong> {promocion?.fechaDesde ? formatDate(promocion.fechaDesde) : 'No especificado'}
                            </div>
                            <div className="promocion-detalle__schedule-item">
                                <strong>Hasta:</strong> {promocion?.fechaHasta ? formatDate(promocion.fechaHasta) : 'No especificado'}
                            </div>
                            <div className="promocion-detalle__schedule-item">
                                <strong>Hora desde:</strong> {formatTime(promocion?.horaDesde || '')}
                            </div>
                            <div className="promocion-detalle__schedule-item">
                                <strong>Hora hasta:</strong> {formatTime(promocion?.horaHasta || '')}
                            </div>
                        </div>
                    </div>

                    {/* Detalles de la promoción */}
                    {promocion?.detalles && promocion.detalles.length > 0 && (
                        <div className="promocion-detalle__details">
                            <h3>Artículos incluidos</h3>
                            <div className="promocion-detalle__articles">
                                {promocion.detalles
                                    .filter(detalle => !detalle.eliminado)
                                    .map((detalle, index) => (
                                        <div key={detalle.id || index} className="promocion-detalle__article">
                                            <div className="promocion-detalle__article-info">
                                                <span className="promocion-detalle__article-name">
                                                    {detalle.articulo?.denominacion || 'Artículo sin nombre'}
                                                </span>
                                                <span className="promocion-detalle__article-quantity">
                                                    Cantidad: {detalle.cantidad}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Sucursales */}
                    {promocion?.sucursales && promocion.sucursales.length > 0 && (
                        <div className="promocion-detalle__branches">
                            <h3>Sucursales participantes</h3>
                            <div className="promocion-detalle__branches-list">
                                {promocion.sucursales.map((sucursal, index) => (
                                    <span key={sucursal.id || index} className="promocion-detalle__branch">
                                        {sucursal.nombre || `Sucursal ${index + 1}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botón de agregar al carrito */}
                    {esSucursalAbierta(sucursalActualUsuario!) &&
                        < div className="promocion-detalle__actions">
                            <button
                                onClick={handleAgregarAlCarrito}
                                disabled={isLoading || !isPromocionActiva()}
                                className={`promocion-detalle__add-button ${isLoading ? 'loading' : ''
                                    } ${!isPromocionActiva() ? 'disabled' : ''}`}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Agregando...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="9" cy="21" r="1" />
                                            <circle cx="20" cy="21" r="1" />
                                            <path d="m1 1 4 4 14 1-1 12H6" />
                                        </svg>
                                        {isPromocionActiva() ? 'Agregar al carrito' : 'Promoción no disponible'}
                                    </>
                                )}
                            </button>
                        </div>
                    }
                </div>
            </div>
        </div >
    );
};

export default PromocionDetalle;