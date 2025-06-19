import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Articulo from "../../models/Articulo";
import { useCarrito } from "../../hooks/useCarrito";
import ArticuloInsumoService from "../../services/ArticuloInsumoService";
import { useSucursalUsuario } from "../../context/SucursalContext";

const API_URL = "http://localhost:8080/api/productos";

const VistaArticulo: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [articulo, setArticulo] = useState<Articulo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
  const [agregandoCarrito, setAgregandoCarrito] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const carritoCtx = useCarrito();
  const { esSucursalAbierta, sucursalActualUsuario } = useSucursalUsuario();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/${id}`)
      .then((res) => {
        if (!res.ok) {
          ArticuloInsumoService.getById(Number(id))
            .then((data: Articulo) => {
              setArticulo(data);
              setLoading(false);
            })
            .catch((err) => {
              setError(err.message);
              setLoading(false);
            });
        }
        return res.json();
      })
      .then((data: Articulo) => {
        setArticulo(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleAgregarAlCarrito = async () => {
    if (carritoCtx && articulo) {
      setAgregandoCarrito(true);
      try {
        for (let i = 0; i < cantidad; i++) {
          carritoCtx.agregarAlCarrito(articulo, 1);
        }
        setMostrarConfirmacion(true);
        setTimeout(() => setMostrarConfirmacion(false), 3000);
      } catch (error) {
        console.error("Error al agregar al carrito:", error);
      } finally {
        setAgregandoCarrito(false);
      }
    }
  };

  const handleCantidadChange = (operacion: 'aumentar' | 'disminuir') => {
    if (operacion === 'aumentar') {
      setCantidad(prev => prev + 1);
    } else if (operacion === 'disminuir' && cantidad > 1) {
      setCantidad(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando artículo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center" role="alert">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <h4>Error al cargar el artículo</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  if (!articulo) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center" role="alert">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h4>Artículo no encontrado</h4>
          <p>El artículo que buscas no existe o ha sido eliminado.</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  const imagenes = articulo.imagenes || [];
  const imagenPrincipal = imagenes[imagenSeleccionada]?.denominacion || "/placeholder.png";

  return (
    <div className="container py-5">
      {/* Notificación de confirmación */}
      {mostrarConfirmacion && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
          <div className="toast show" role="alert">
            <div className="toast-header bg-success text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                <path d="M9 12l2 2 4-4"></path>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
              </svg>
              <strong className="me-auto">¡Agregado al carrito!</strong>
            </div>
            <div className="toast-body">
              {cantidad} {cantidad === 1 ? 'unidad' : 'unidades'} de {articulo.denominacion}
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <button
        onClick={() => navigate(-1)}
        className="promocion-detalle__back-button mb-5"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="15,18 9,12 15,6"></polyline>
        </svg>
        Volver
      </button>

      <div className="row g-5">
        {/* Sección de imágenes */}
        <div className="col-lg-6">
          <div className="" style={{ top: "20px" }}>
            {/* Imagen principal */}
            <div className="mb-3">
              <img
                src={imagenPrincipal}
                alt={articulo.denominacion}
                className="img-fluid rounded-3 shadow-lg w-100"
                style={{
                  height: "400px",
                  objectFit: "cover",
                  transition: "transform 0.3s ease"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.02)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              />
            </div>

            {/* Miniaturas */}
            {imagenes.length > 1 && (
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                {imagenes.map((imagen, index) => (
                  <button
                    key={index}
                    className={`btn p-0 border-0 rounded-2 ${index === imagenSeleccionada ? 'ring ring-primary' : ''
                      }`}
                    onClick={() => setImagenSeleccionada(index)}
                    style={{ width: "80px", height: "80px" }}
                  >
                    <img
                      src={imagen.denominacion}
                      alt={`${articulo.denominacion} ${index + 1}`}
                      className=" rounded-2"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: index === imagenSeleccionada ? 1 : 0.7
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Información del producto */}
        <div className="col-lg-6">
          <div className="h-100 d-flex flex-column">
            {/* Título y precio */}
            <div className="mb-4">
              <h1 className="display-5 fw-bold text-dark mb-3">{articulo.denominacion}</h1>
              <div className="mb-3 d-flex align-items-center justify-content-center">
                <span className="h2 text-success fw-bold">
                  ${articulo.precioVenta?.toFixed(2)}
                </span>
                <span className="text-muted ms-2">por unidad</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <h5 className="fw-semibold mb-3">Descripción</h5>
              <p className="text-muted lh-lg">
                {articulo.denominacion}
              </p>
            </div>

            {/* Información adicional */}
            <div className="mb-4">
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center text-start">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary me-2">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"></path>
                      </svg>
                      <div>
                        <small className="text-muted d-block">Categoría</small>
                        <span className="fw-semibold">
                          {articulo.categoria?.denominacion || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3">
                    <div className="d-flex align-items-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success me-2">
                        <path d="M9 12l2 2 4-4"></path>
                        <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                        <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                      </svg>
                      <div>
                        <small className="text-muted d-block">Disponible</small>
                        <span className="fw-semibold text-success">En stock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de cantidad */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Cantidad</label>
              <div className="d-flex align-items-center gap-3">
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => handleCantidadChange('disminuir')}
                    disabled={cantidad <= 1}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <span className="btn btn-outline-secondary bg-light px-4">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => handleCantidadChange('aumentar')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                <div className="text-muted">
                  Total: <span className="fw-bold text-success">
                    ${(articulo.precioVenta * cantidad).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            {esSucursalAbierta(sucursalActualUsuario!) &&
              <div className="mt-auto">
                <div className="d-grid gap-2 d-md-flex">
                  <button
                    className="btn btn-success btn-lg flex-fill d-flex align-items-center justify-content-center gap-2"
                    onClick={handleAgregarAlCarrito}
                    disabled={agregandoCarrito}
                  >
                    {agregandoCarrito ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Agregando...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="m1 1 4 4 5.8 8.8a2 2 0 0 0 1.7 1.2h9.9a2 2 0 0 0 1.7-1.2L19 8H7"></path>
                        </svg>
                        Agregar al carrito
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-primary btn-lg d-flex align-items-center justify-content-center gap-2"
                    onClick={() => navigate('/carrito')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L6 5H3m4 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
                    </svg>
                    Ver carrito
                  </button>
                </div>

                {/* Información de envío */}
                <div className="mt-4 p-3 bg-light rounded-3">
                  <div className="d-flex align-items-start gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary mt-1">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <path d="m16 8 4-4-4-4"></path>
                    </svg>
                    <div>
                      <h6 className="mb-1">Información de entrega</h6>
                      <p className="text-muted mb-0 small">
                        Realizamos entregas en el día. Consulta los horarios disponibles durante el proceso de compra.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default VistaArticulo;