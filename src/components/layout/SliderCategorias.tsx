import CategoriaCard from '../articulos/CategoriaCard';
import FlechaDerecha from '../../assets/flecha.svg';
import FlechaIzquierda from '../../assets/flechaIzquierda.svg';
import { useEffect, useState, useRef } from 'react';
import Categoria from '../../models/Categoria';
import CategoriaService from '../../services/CategoriaService';

function Slider() {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [start, setStart] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    
    const visibleCount = 5;

    // Lista de denominaciones que deben aparecer (excluyendo "Insumos")
    const denominacionesDeseadas = [
        "Gaseosas",
        "Cervezas",
        "Aguas y otros",
        "Hamburguesas",
        "Pizzas",
        "Lomos",
        "Empanadas",
        "Papas Fritas"
    ];

    // Detectar si es dispositivo móvil
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    useEffect(() => {
        const fetchCategoriasPorDenominacion = async () => {
            try {
                // Se obtienen las categorías para cada denominación deseada
                const promesas = denominacionesDeseadas.map(denom =>
                    CategoriaService.getByDenominacion(denom)
                );
                const resultados = await Promise.all(promesas);

                // 'resultados' es un array de arrays; se aplana para tener una sola lista
                const categoriasObtenidas = resultados.flat();

                // Filtrar categorías válidas (no null/undefined)
                const categoriasValidas = categoriasObtenidas.filter(
                    (cat): cat is Categoria => cat != null && !cat.eliminado
                );

                setCategorias(categoriasValidas);
            } catch (error) {
                console.error("Error al obtener las categorías por denominación:", error);
            }
        };

        fetchCategoriasPorDenominacion();
    }, []);

    const handleNext = () => {
        if (categorias.length === 0) return;
        
        if (isMobile && sliderRef.current) {
            // En móvil, desplazar suavemente
            const cardWidth = 160; // Aproximadamente el ancho de una tarjeta
            const scrollAmount = cardWidth + 16; // Incluir gap
            sliderRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        } else {
            // En desktop, usar la lógica original
            setStart((prev) => (prev + 1) % categorias.length);
        }
    };

    const handlePrev = () => {
        if (categorias.length === 0) return;
        
        if (isMobile && sliderRef.current) {
            // En móvil, desplazar suavemente hacia atrás
            const cardWidth = 160;
            const scrollAmount = cardWidth + 16;
            sliderRef.current.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        } else {
            // En desktop, usar la lógica original
            setStart((prev) => ((prev - 1) % categorias.length) >= 0 ? (prev - 1) % categorias.length : categorias.length - 1);
        }
    };

    // Para desktop: mostrar solo 5 categorías a la vez, con loop circular
    const visibleCategorias = [];
    if (!isMobile) {
        for (let i = 0; i < Math.min(visibleCount, categorias.length); i++) {
            if (categorias.length > 0) {
                visibleCategorias.push(categorias[(start + i) % categorias.length]);
            }
        }
    }

    // Estilos CSS en línea para mejor control
    const sliderStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '0' : '20px 0',
        gap: isMobile ? '0' : '20px'
    };

    const containerStyles: React.CSSProperties = isMobile ? {
        display: 'flex',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        gap: '16px',
        padding: '20px 16px',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch'
    } : {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        flex: 1
    };

    const buttonStyles: React.CSSProperties = {
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.3s ease',
        zIndex: 10,
        position: isMobile ? 'absolute' : 'relative'
    };

    const leftButtonStyles: React.CSSProperties = isMobile ? {
        ...buttonStyles,
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)'
    } : buttonStyles;

    const rightButtonStyles: React.CSSProperties = isMobile ? {
        ...buttonStyles,
        right: '10px',
        top: '50%',
        transform: 'translateY(-50%)'
    } : buttonStyles;

    const cardWrapperStyles: React.CSSProperties = isMobile ? {
        minWidth: '160px',
        scrollSnapAlign: 'start',
        flexShrink: 0
    } : {};

    return (
        <div style={sliderStyles} className="sliderCategorias">
            {/* CSS personalizado para ocultar scrollbar */}
            <style>
                {`
                    .slider-container::-webkit-scrollbar {
                        display: none;
                    }
                    
                    .slider-button:hover {
                        transform: ${isMobile ? 'translateY(-50%) scale(1.1)' : 'scale(1.1)'};
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
                    }
                    
                    .slider-button:active {
                        transform: ${isMobile ? 'translateY(-50%) scale(0.95)' : 'scale(0.95)'};
                    }
                    
                    .slider-button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }
                    
                    .slider-button img {
                        width: 20px;
                        height: 20px;
                        object-fit: contain;
                    }

                    @media (max-width: 768px) {
                        .sliderCategorias {
                            position: relative;
                        }
                    }
                `}
            </style>

            <button
                className="slider-button flechaIzquierda"
                style={leftButtonStyles}
                onClick={handlePrev}
                disabled={categorias.length <= (isMobile ? 1 : visibleCount)}
                onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = isMobile 
                            ? 'translateY(-50%) scale(1.1)' 
                            : 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = isMobile 
                        ? 'translateY(-50%)' 
                        : 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
            >
                <img src={FlechaIzquierda} alt="Anterior" />
            </button>

            <div 
                ref={sliderRef}
                className="slider-container"
                style={containerStyles}
            >
                {isMobile ? (
                    // En móvil: mostrar todas las categorías en scroll horizontal
                    categorias.map((cat, index) => (
                        cat && (
                            <div key={cat?.id ? cat.id : `cat-mobile-${index}`} style={cardWrapperStyles}>
                                <CategoriaCard categoria={cat} />
                            </div>
                        )
                    ))
                ) : (
                    // En desktop: mostrar solo las visibles con navegación por botones
                    visibleCategorias.map((cat, index) => (
                        cat && (
                            <CategoriaCard
                                key={cat?.id ? cat.id : `cat-desktop-${start}-${index}`}
                                categoria={cat}
                            />
                        )
                    ))
                )}
            </div>

            <button
                className="slider-button flechaDerecha"
                style={rightButtonStyles}
                onClick={handleNext}
                disabled={categorias.length <= (isMobile ? 1 : visibleCount)}
                onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = isMobile 
                            ? 'translateY(-50%) scale(1.1)' 
                            : 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = isMobile 
                        ? 'translateY(-50%)' 
                        : 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
            >
                <img src={FlechaDerecha} alt="Siguiente" />
            </button>
        </div>
    );
}

export default Slider;