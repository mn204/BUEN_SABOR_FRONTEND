import { useEffect, useState } from "react";
import { useCarrito } from "../../hooks/useCarrito";
import { useAuth } from "../../context/AuthContext";
import TipoEnvio from "../../models/enums/TipoEnvio";
import FormaPago from "../../models/enums/FormaPago";
import type Domicilio from "../../models/Domicilio";
import CheckoutMP from "./CheckoutMP";
import type Pedido from "../../models/Pedido";
import { Wallet } from "@mercadopago/sdk-react";
import { useSucursalUsuario } from "../../context/SucursalContext";
import PedidoService from "../../services/PedidoService";
import { Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa6";
import ModalDomicilio from "../clientes/ModalDomicilio";
import SucursalService from "../../services/SucursalService";
import { useNavigate } from "react-router-dom";
import ModalCambioSucursal from './ModalCambioSucursal';
import ModalMensaje from "../empleados/modales/ModalMensaje";

export function Carrito() {
  const { cliente, setCliente } = useAuth();
  const navigate = useNavigate();
  const carritoCtx = useCarrito();
  const [currentStep, setCurrentStep] = useState(1);
  const [tipoEnvio, setTipoEnvio] = useState<'DELIVERY' | 'TAKEAWAY' | null>(null);
  const [domicilioSeleccionado, setDomicilioSeleccionado] = useState<Domicilio | null>();
  const [formaPago, setFormaPago] = useState<'EFECTIVO' | 'MERCADOPAGO' | null>(null);
  const [showDomicilioModal, setShowDomicilioModal] = useState(false);
  const [pedidoGuardado, setPedidoGuardado] = useState<Pedido | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);
  const [verificandoStock, setVerificandoStock] = useState(false);
  const { sucursalActualUsuario } = useSucursalUsuario();
  const [modalVisible, setModalVisible] = useState(false);
  const [mensajeCambioSucursal, setMensajeCambioSucursal] = useState<string>("");
  const [mostrarModalPedido, setMostrarModalPedido] = useState(false);
  if (!carritoCtx) return null;

  const handleModalSubmit = (clienteActualizado: any) => {
    setCliente(clienteActualizado);
  };

  useEffect(() => {
    if (formaPago == 'EFECTIVO') {
      pedido.formaPago = FormaPago.EFECTIVO
    } else {
      pedido.formaPago = FormaPago.MERCADO_PAGO;
    }
  }, [formaPago]);

  // Efecto mejorado para manejar cambio de sucursal con promociones
  useEffect(() => {
    if (!sucursalActualUsuario) return;

    const manejarCambioSucursal = async () => {
      try {
        const promosSucursal = await SucursalService.getAllBySucursalId(sucursalActualUsuario.id!);
        await cambiarSucursal(sucursalActualUsuario.id!, promosSucursal);
        pedido.sucursal = sucursalActualUsuario;
      } catch (error) {
        console.error("Error al cambiar sucursal:", error);
      }
    };

    manejarCambioSucursal();
  }, [sucursalActualUsuario]);

  useEffect(() => {
    pedido.cliente = cliente!;
  }, [cliente]);

  useEffect(() => {
    fetch("/localidades.json").then((res) => res.json()).then((localidades) => localidades.map((loc: any) => {
      if (loc.nombre == domicilioSeleccionado?.localidad?.nombre && tipoEnvio != 'TAKEAWAY') {
        if (domicilioSeleccionado) {
          pedido.domicilio = domicilioSeleccionado;
        }
      }
    }))
  }, [domicilioSeleccionado]);

  const {
    pedido,
    preferenceId,
    restarDelCarrito,
    agregarAlCarrito,
    quitarPromocionCompleta,
    quitarDelCarrito,
    limpiarCarrito,
    guardarPedidoYObtener,
    agregarPromocionAlCarrito,
    cambiarSucursal,
    showModalCambioSucursal,
    datosModalCambioSucursal,
    cerrarModalCambioSucursal,// Agregar la función cambiarSucursal del contexto
  } = carritoCtx;

  const handleAgregar = () => {
    setDomicilioSeleccionado(null);
    setModalVisible(true);
  };

  const carrito = pedido.detalles;

  const verificarStock = async () => {
    setVerificandoStock(true);
    setStockError(null);

    try {
      // Si hay stock suficiente, el backend devuelve true
      const stockDisponible = await PedidoService.consultarStock(pedido);
      console.log("Stock disponible:", stockDisponible);
      return stockDisponible; // Si es false, es decisión del backend, pero no debería llegar acá con excepciones.
    } catch (error: any) {
      // 🔥 Esta parte es la importante: capturás el mensaje del backend
      const parsed = JSON.parse(error.message);
      if (parsed.errorMsg) {
        setStockError(
          `<span>Stock insuficiente en la sucursal: ${sucursalActualUsuario?.nombre}</span><span>${parsed.errorMsg}</span>`
        );
      } else {
        setStockError("Error al verificar el stock.");
      }

      return false;
    } finally {
      setVerificandoStock(false);
    }
  };


  const handleProceedToStep2 = async () => {
    if (!cliente) {
      setStockError("Debe Iniciar Sesion para continuar")
    } else {
      const stockOk = await verificarStock();
      if (stockOk) {
        setCurrentStep(2);
        setTipoEnvio(null);
        setFormaPago(null);
      }
    }
  };

  const handleTipoEnvioChange = (tipo: 'DELIVERY' | 'TAKEAWAY') => {
    setTipoEnvio(tipo);
    if (tipo === 'DELIVERY') {
      setShowDomicilioModal(true);
      pedido.tipoEnvio = TipoEnvio.DELIVERY;
    } else {
      pedido.tipoEnvio = TipoEnvio.TAKEAWAY;
      setDomicilioSeleccionado(undefined)
    }
  };

  const handleDomicilioSelect = (domicilio: Domicilio) => {
    setDomicilioSeleccionado(domicilio);
    setFormaPago('MERCADOPAGO')
    setShowDomicilioModal(false);
  };

  const guardarPedidoTakeAwayEfectivo = async () => {
    // Verificar stock nuevamente antes de confirmar
    console.log("efectivo")
    const stockOk = await verificarStock();
    if (!stockOk) {
      return;
    }
    pedido.total = pedido.total * 0.9;
    const pedidoFinal = await guardarPedidoYObtener();
    if (pedidoFinal) {
      setMostrarModalPedido(true);
      limpiarCarrito()
    }
    window.location.href = `/pedidoConfirmado/${pedidoFinal!.id}`;
  }

  const handlePagarConMP = async () => {
    // Verificar stock nuevamente antes de confirmar
    console.log("mp")
    const stockOk = await verificarStock();
    if (!stockOk) {
      return;
    }
    if (tipoEnvio === 'TAKEAWAY') {
      pedido.total = pedido.total * 0.9; // Aplicar descuento del 10% para Takeaway
    }else if (tipoEnvio === 'DELIVERY' && domicilioSeleccionado) {
      pedido.total = pedido.total + 2000; // Agregar costo de envío
    }

    const pedidoFinal = await guardarPedidoYObtener();
    if (pedidoFinal) {
      setPedidoGuardado(pedidoFinal);
      setMostrarModalPedido(true);
      limpiarCarrito()
    }
  };

  // Opción 2: Limpiar preferenceId al agregar productos al carrito
  useEffect(() => {
    if (carrito.length > 0 && preferenceId) {
      // Si hay productos en el carrito y existe un preferenceId de un pedido anterior, limpiarlo
      carritoCtx.limpiarPreferenceId();
      setPedidoGuardado(null);
    }
  }, [carrito.length]);

  // Opción 3: Limpiar preferenceId al cambiar de step
  useEffect(() => {
    if (currentStep === 1) {
      // Limpiar estados relacionados con pagos anteriores
      carritoCtx.limpiarPreferenceId();
      setPedidoGuardado(null);
    }
  }, [currentStep]);

  // Opción 4: Detectar cuando el usuario regresa de MercadoPago
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && preferenceId && carrito.length === 0) {
        // El usuario regresó a la página y el carrito está vacío
        // Limpiar el preferenceId para resetear el estado
        carritoCtx.limpiarPreferenceId();
        setPedidoGuardado(null);
        setCurrentStep(1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preferenceId, carrito.length]);

  const renderStep1 = () => {
    return (
      <>
        {carrito.length === 0 ? (
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
            <div className="text-center">
              <div className="mb-4">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="m1 1 4 4 5.8 8.8a2 2 0 0 0 1.7 1.2h9.9a2 2 0 0 0 1.7-1.2L19 8H7"></path>
                </svg>
              </div>
              <h4 className="text-muted mb-3">Tu carrito está vacío</h4>
              <p className="text-muted">Agrega algunos productos para comenzar</p>
              <Button onClick={() => navigate("/")}>
                Ver Productos
              </Button>
            </div>
          </div>
        ) : (
          <div className="container-fluid px-4 py-3">
            {stockError && (
              <div className="alert alert-danger mx-auto mb-4" role="alert" style={{ maxWidth: "800px" }}>
                <div className="d-flex align-items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  <div
                    className="d-flex flex-column justify-content-center align-items-start"
                    dangerouslySetInnerHTML={{ __html: stockError }}
                  />
                </div>
              </div>
            )}

            <div className="row justify-content-center">
              <div className="col-12 col-lg-8">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white py-3">
                    <h5 className="mb-0 d-flex align-items-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="m1 1 4 4 5.8 8.8a2 2 0 0 0 1.7 1.2h9.9a2 2 0 0 0 1.7-1.2L19 8H7"></path>
                      </svg>
                      Carrito de Compras
                      <span className="badge bg-primary ms-2">{carrito.length}</span>
                    </h5>
                  </div>

                  <div className="card-body p-0">
                    {carrito.map((item, index) =>
                      item.promocion ? (
                        // PROMOCIÓN
                        <div key={`promo-${item.promocion.id}`} className={`p-3 p-md-4 ${index !== carrito.length - 1 ? 'border-bottom' : ''}`}>
                          <div className="row g-3 g-md-4 align-items-start align-items-lg-center">

                            {/* Imagen de la promoción */}
                            <div className="col-12 col-sm-4 col-md-3 col-lg-2">
                              <div className="text-center text-sm-start">
                                <div className="position-relative">
                                  <img
                                    src={item.promocion.imagenes[0]?.denominacion}
                                    alt={item.promocion.denominacion}
                                    className="img-fluid rounded-3 shadow-sm"
                                    style={{
                                      width: "100%",
                                      maxWidth: "200px",
                                      height: "120px",
                                      objectFit: "cover",
                                      transition: "transform 0.2s ease"
                                    }}
                                    onMouseEnter={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1.05)")}
                                    onMouseLeave={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1)")}
                                  />
                                  <div className="position-absolute top-0 start-0 m-1">
                                    <span className="badge bg-success rounded-pill px-2 py-1">
                                      <small>Promoción</small>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Información de la promoción */}
                            <div className="col-12 col-sm-8 col-md-9 col-lg-10">
                              <div className="row g-3 align-items-start">

                                {/* Título y botón eliminar */}
                                <div className="col-12">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="mb-1 fw-semibold text-dark flex-grow-1 me-3">
                                      {item.promocion.denominacion}
                                    </h6>
                                    <button
                                      className="btn btn-outline-danger btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{ width: "32px", height: "32px", fontSize: "14px" }}
                                      onClick={() => quitarPromocionCompleta(item.promocion!.id!)}
                                      title="Eliminar del carrito"
                                    >
                                      ×
                                    </button>
                                  </div>

                                  {/* Precio promocional */}
                                  <div className="mb-3">
                                    <span className="badge bg-success text-white border px-3 py-2 rounded-pill">
                                      <strong>${item.promocion.precioPromocional.toFixed(2)}</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* Controles de cantidad y subtotal */}
                                <div className="col-12">
                                  <div className="row g-3 align-items-center">

                                    {/* Controles de cantidad */}
                                    <div className="col-12 col-md-6 col-lg-5">
                                      <div className="d-flex align-items-center justify-content-start">
                                        <span className="text-muted me-3 flex-shrink-0">Cantidad:</span>
                                        <div className="btn-group" role="group">
                                          <button
                                            className="btn btn-outline-secondary btn-sm px-2 px-sm-3"
                                            onClick={() => restarDelCarrito(item.promocion!.id!)}
                                            disabled={item.cantidad <= 1}
                                          >
                                            −
                                          </button>
                                          <span className="btn btn-outline-secondary btn-sm px-2 px-sm-3 bg-light">
                                            {item.cantidad}
                                          </span>
                                          <button
                                            className="btn btn-outline-secondary btn-sm px-2 px-sm-3"
                                            onClick={() => agregarPromocionAlCarrito(item.promocion!)}
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="col-12 col-md-6 col-lg-7">
                                      <div className="text-start text-md-end">
                                        <div className="text-muted small">Subtotal</div>
                                        <div className="h6 mb-0 text-success fw-bold">
                                          ${item.subTotal.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // ARTÍCULO
                        <div key={`articulo-${item.articulo!.id}`} className={`p-3 p-md-4 ${index !== carrito.length - 1 ? 'border-bottom' : ''}`}>
                          <div className="row g-3 g-md-4 align-items-start align-items-lg-center">

                            {/* Imagen del producto */}
                            <div className="col-12 col-sm-4 col-md-3 col-lg-2">
                              <div className="text-center text-sm-start">
                                <img
                                  src={item.articulo!.imagenes[0]?.denominacion}
                                  alt={item.articulo!.denominacion}
                                  className="img-fluid rounded-3 shadow-sm"
                                  style={{
                                    width: "100%",
                                    maxWidth: "200px",
                                    height: "120px",
                                    objectFit: "cover",
                                    transition: "transform 0.2s ease"
                                  }}
                                  onMouseEnter={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1.05)")}
                                  onMouseLeave={(e) => ((e.target as HTMLImageElement).style.transform = "scale(1)")}
                                />
                              </div>
                            </div>

                            {/* Información del producto */}
                            <div className="col-12 col-sm-8 col-md-9 col-lg-10">
                              <div className="row g-3 align-items-start">

                                {/* Título y botón eliminar */}
                                <div className="col-12">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="mb-1 fw-semibold text-dark flex-grow-1 me-3">
                                      {item.articulo!.denominacion}
                                    </h6>
                                    <button
                                      className="btn btn-outline-danger btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{ width: "32px", height: "32px", fontSize: "14px" }}
                                      onClick={() => quitarDelCarrito(item.articulo!.id!)}
                                      title="Eliminar del carrito"
                                    >
                                      ×
                                    </button>
                                  </div>

                                  {/* Precio unitario */}
                                  <div className="mb-3">
                                    <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                                      <strong>${item.articulo!.precioVenta!.toFixed(2)}</strong>
                                    </span>
                                  </div>
                                </div>

                                {/* Controles de cantidad y subtotal */}
                                <div className="col-12">
                                  <div className="row g-3 align-items-center">

                                    {/* Controles de cantidad */}
                                    <div className="col-12 col-md-6 col-lg-5">
                                      <div className="d-flex align-items-center justify-content-start">
                                        <span className="text-muted me-3 flex-shrink-0">Cantidad:</span>
                                        <div className="btn-group" role="group">
                                          <button
                                            className="btn btn-outline-secondary btn-sm px-2 px-sm-3"
                                            onClick={() => restarDelCarrito(item.articulo!.id!)}
                                            disabled={item.cantidad <= 1}
                                          >
                                            −
                                          </button>
                                          <span className="btn btn-outline-secondary btn-sm px-2 px-sm-3 bg-light">
                                            {item.cantidad}
                                          </span>
                                          <button
                                            className="btn btn-outline-secondary btn-sm px-2 px-sm-3"
                                            onClick={() => agregarAlCarrito(item.articulo!, 1)}
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="col-12 col-md-6 col-lg-7">
                                      <div className="text-start text-md-end">
                                        <div className="text-muted small">Subtotal</div>
                                        <div className="h6 mb-0 text-primary fw-bold">
                                          ${item.subTotal.toFixed(2)}
                                        </div>
                                      </div>
                                    </div>

                                  </div>
                                </div>

                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="card-footer bg-light">
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <div className="h4 mb-0 text-success fw-bold">
                          Total: ${carrito.reduce((acc, item) => acc + item.subTotal, 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex justify-content-end gap-2 mt-3 mt-md-0">
                          <button
                            className="btn btn-outline-warning d-flex align-items-center px-4"
                            onClick={limpiarCarrito}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                            </svg>
                            Limpiar
                          </button>
                          <button
                            className="btn btn-success d-flex align-items-center px-4"
                            onClick={handleProceedToStep2}
                            disabled={verificandoStock}
                          >
                            {verificandoStock ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Verificando...
                              </>
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                                  <path d="M9 12l2 2 4-4"></path>
                                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                                </svg>
                                Realizar pedido
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderStep2 = () => (
    <div className="p-4">
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-link p-0 me-3 text-decoration-none"
          onClick={() => setCurrentStep(1)}
        >
          ← Volver
        </button>
        <h4>Datos de Entrega y Pago</h4>
      </div>
      {stockError && (
        <div className="alert alert-danger" role="alert">
          {stockError}
        </div>
      )}

      <div className="container-fluid justify-content-center">
        <div className="row">
          {/* Columna izquierda - Opciones (70%) */}
          <div className="col-lg-8 pe-4">
            {/* Forma de Entrega */}
            <div className="card mb-4">
              <div className="card-header">
                <h5>Forma de Entrega</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="d-grid gap-2">
                      <button
                        className={`btn py-3 ${tipoEnvio === 'DELIVERY' && domicilioSeleccionado
                          ? 'btn-success'
                          : 'btn-outline-success'
                          }`}
                        onClick={() => handleTipoEnvioChange('DELIVERY')}
                      >
                        <div>
                          <strong>🚚 Envío a Domicilio</strong>
                          <br />
                          <small>Recibí tu pedido en tu casa</small>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-grid gap-2">
                      <button
                        className={`btn py-3 ${tipoEnvio === 'TAKEAWAY'
                          ? 'btn-success'
                          : 'btn-outline-success'
                          }`}
                        onClick={() => handleTipoEnvioChange('TAKEAWAY')}
                      >
                        <div>
                          <strong>🏪 Retiro en Local</strong>
                          <br />
                          <small>
                            Retirá tu pedido en nuestro local
                            <span className="ms-2 badge bg-warning text-dark" style={{ fontSize: '0.9em', marginLeft: '8px' }}>
                              10% OFF
                            </span>
                          </small>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {tipoEnvio === 'DELIVERY' && domicilioSeleccionado && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <strong>Domicilio seleccionado:</strong>
                    <p className="mb-0">
                      {domicilioSeleccionado.calle} {domicilioSeleccionado.numero}
                      {domicilioSeleccionado.piso && `, Piso ${domicilioSeleccionado.piso}`}
                      {domicilioSeleccionado.nroDepartamento && `, Depto ${domicilioSeleccionado.nroDepartamento}`}
                      <br />
                      {domicilioSeleccionado.localidad?.nombre} - CP: {domicilioSeleccionado.codigoPostal}
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm mt-2"
                      onClick={() => setShowDomicilioModal(true)}
                    >
                      Cambiar domicilio
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Forma de Pago */}
            <div className="card mb-4">
              <div className="card-header">
                <h5>Forma de Pago</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="d-grid gap-2">
                      <button
                        className={`btn py-3 ${formaPago === 'EFECTIVO'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                          }`}
                        disabled={tipoEnvio == "DELIVERY" ? true : false}
                        onClick={() => setFormaPago('EFECTIVO')}
                      >
                        <div>
                          <strong>💵 Efectivo</strong>
                          <br />
                          <small>Pagá al recibir tu pedido</small>
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-grid gap-2">
                      <button
                        className={`btn py-3 ${formaPago === 'MERCADOPAGO'
                          ? 'btn-primary'
                          : 'btn-outline-primary'
                          }`}
                        onClick={() => setFormaPago('MERCADOPAGO')}
                      >
                        <div>
                          <strong>💳 Mercado Pago</strong>
                          <br />
                          <small>Pagá online de forma segura</small>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Resumen y botón (30%) */}
          <div className="col-lg-4 ps-3">
            {/* Resumen del Pedido */}
            <div className="card mb-4">
              <div className="card-header">
                <h5>Resumen del Pedido</h5>
              </div>
              <div className="card-body">
                {/* Usar carrito si tiene items, sino usar pedidoGuardado */}
                {(carrito && carrito.length > 0 ? carrito : pedidoGuardado?.detalles || []).map((item) => (
                  <div key={item.articulo?.id || item.id} className="d-flex justify-content-between mb-2">
                    <span>
                      {item.cantidad}x {item.articulo?.denominacion || item.promocion?.denominacion}
                    </span>
                    <span>
                      ${(item.subTotal || (item.cantidad * item.articulo!.precioVenta!)).toFixed(2)}
                    </span>
                  </div>
                ))}

                {tipoEnvio === 'DELIVERY' && (
                  <div key="7000" className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Envío:</span>
                    <span className="text-muted">$2000</span>
                  </div>
                )}
                {tipoEnvio === 'TAKEAWAY' && (
                  <div key="7000" className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Descuento:</span>
                    <span className="text-muted">10%</span>
                  </div>
                )}

                {/* Mostrar mensaje si no hay items en ninguno */}
                {(!carrito || carrito.length === 0) && (!pedidoGuardado?.detalles || pedidoGuardado.detalles.length === 0) && (
                  <div className="text-center py-3">
                    <p className="text-muted mb-0">No hay productos en el pedido</p>
                  </div>
                )}

                <hr />
                <div className="d-flex justify-content-between">
                  <strong>Total: </strong>
                  <strong>
                    ${(() => {
                      const items = carrito && carrito.length > 0 ? carrito : pedidoGuardado?.detalles || [];
                      const subtotal = items.reduce((acc, item) => {
                        return acc + (item.subTotal || (item.cantidad * item.articulo!.precioVenta!));
                      }, 0);

                        if (tipoEnvio === 'TAKEAWAY') {
                        return (subtotal * 0.9).toFixed(2); // 10% descuento
                        } else if (tipoEnvio === 'DELIVERY') {
                        return (subtotal + 2000).toFixed(2); // Envío $2000
                        } else {
                        return subtotal.toFixed(2); // Solo subtotal
                        }
                    })()}
                  </strong>
                </div>
              </div>
            </div>

            {/* SECCIÓN CORREGIDA - Botones de pago */}
            <div className="d-grid gap-2">
              {/* Solo mostrar botones si se ha seleccionado una forma de pago */}
              {formaPago && (
                <>
                  {/* Para pago con Mercado Pago */}
                  {formaPago === 'MERCADOPAGO' && (
                    <>
                      {/* Si ya existe un pedido guardado y un preferenceId, mostrar el widget de MP */}
                      {pedidoGuardado &&
                        <CheckoutMP pedido={pedidoGuardado} />
                      }
                      {pedidoGuardado && preferenceId ? (
                        <div>
                          <Wallet
                            initialization={{ preferenceId: preferenceId, redirectMode: "blank" }}
                          />
                        </div>
                      ) : (
                        /* Si no hay preferenceId, mostrar botón para generar el pago */
                        <button
                          className={`btn btn-lg ${!stockError ? 'btn-success' : 'btn-secondary'}`}
                          onClick={handlePagarConMP}
                          disabled={stockError !== null || verificandoStock || (!domicilioSeleccionado && tipoEnvio == 'DELIVERY')}
                        >
                          {verificandoStock ? 'Verificando...' : 'Pagar con Mercado Pago'}
                        </button>
                      )}
                    </>
                  )}

                  {/* Para pago en efectivo (solo TAKEAWAY) */}
                  {formaPago === 'EFECTIVO' && tipoEnvio === 'TAKEAWAY' && (
                    <button
                      className={`btn btn-lg ${!stockError ? 'btn-success' : 'btn-secondary'}`}
                      onClick={guardarPedidoTakeAwayEfectivo}
                      disabled={stockError !== null || verificandoStock}
                    >
                      {verificandoStock ? 'Verificando...' : 'Confirmar Pedido'}
                    </button>
                  )}
                </>
              )}

              {/* Mensaje si no se ha seleccionado forma de pago */}
              {!formaPago && (
                <div className="alert alert-info">
                  <small>Selecciona una forma de pago para continuar</small>
                </div>
              )}
            </div>

            {/* Información de Sucursal */}
            <div className="card mb-4 mt-2">
              <div className="card-header">
                <h5>Sucursal Seleccionada</h5>
              </div>
              <div className="card-body">
                <div className="p-3 bg-light rounded">
                  <strong>{sucursalActualUsuario?.nombre}</strong>
                  <p className="mb-0 text-muted">
                    {sucursalActualUsuario?.domicilio?.calle} {sucursalActualUsuario?.domicilio?.numero}
                    <br />
                    {sucursalActualUsuario?.domicilio?.localidad?.nombre}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentStep === 1 ? renderStep1() : renderStep2()}

      {/* Modal para seleccionar domicilio */}
      {showDomicilioModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-0 pb-2">
                <div>
                  <h4 className="modal-title fw-bold text-dark mb-1">Seleccionar Domicilio</h4>
                  <p className="text-muted mb-0 small">Elige la dirección para tu pedido</p>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white bg-light rounded-circle p-2"
                  style={{ opacity: 0.8 }}
                  onClick={() => setShowDomicilioModal(false)}
                ></button>
              </div>

              <div className="modal-body px-4 py-3">
                {cliente?.domicilios && cliente.domicilios.length > 0 ? (
                  <div className="row g-3">
                    {cliente.domicilios
                      .filter(domicilio => !domicilio.eliminado)
                      .map((domicilio) => (
                        <div key={domicilio.id} className="col-12 col-md-6">
                          <div
                            className={`card h-100 border-2 transition-all ${domicilioSeleccionado?.id === domicilio.id
                              ? 'border-success shadow-sm bg-success bg-opacity-10'
                              : 'border-light-subtle hover-shadow'
                              }`}
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              borderRadius: '12px'
                            }}
                            onClick={() => handleDomicilioSelect(domicilio)}
                            onMouseEnter={(e) => {
                              if (domicilioSeleccionado?.id !== domicilio.id) {
                                (e.target as HTMLElement).classList.add('shadow-sm', 'border-primary', 'border-opacity-50');
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (domicilioSeleccionado?.id !== domicilio.id) {
                                (e.target as HTMLElement).classList.remove('shadow-sm', 'border-primary', 'border-opacity-50');
                              }
                            }}
                          >
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-center align-items-start mb-2">
                                <h6 className="card-title fw-semibold text-dark mb-0">
                                  <i className="fas fa-map-marker-alt text-primary me-2"></i>
                                  {domicilio.calle} {domicilio.numero}
                                </h6>
                                {domicilioSeleccionado?.id === domicilio.id && (
                                  <i className="fas fa-check-circle text-success"></i>
                                )}
                              </div>

                              <div className="card-text">
                                <div className="d-flex flex-column gap-1 text-muted small">
                                  {domicilio.piso && (
                                    <span>
                                      <i className="fas fa-building me-1"></i>
                                      Piso {domicilio.piso}
                                      {domicilio.nroDepartamento && `, Depto ${domicilio.nroDepartamento}`}
                                    </span>
                                  )}

                                  <span>
                                    <i className="fas fa-city me-1"></i>
                                    {domicilio.localidad?.nombre}
                                  </span>

                                  <span>
                                    <i className="fas fa-mail-bulk me-1"></i>
                                    CP: {domicilio.codigoPostal}
                                  </span>

                                  {domicilio.detalles && (
                                    <div className="mt-2 pt-2 border-top border-light">
                                      <span className="text-info small">
                                        <i className="fas fa-info-circle me-1"></i>
                                        {domicilio.detalles}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="fas fa-home fa-3x text-muted opacity-50"></i>
                    </div>
                    <h5 className="text-muted mb-2">No tienes domicilios registrados</h5>
                    <p className="text-muted small mb-0">Agrega tu primera dirección para continuar</p>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light bg-opacity-50 border-0 rounded-bottom-4 px-4 py-3">
                <div className="d-flex justify-content-between w-100 gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 rounded-pill"
                    onClick={() => setShowDomicilioModal(false)}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancelar
                  </button>

                  <Button
                    variant="dark"
                    className="px-4 rounded-pill shadow-sm"
                    onClick={handleAgregar}
                    style={{
                      background: 'linear-gradient(135deg, #343a40 0%, #495057 100%)',
                      border: 'none'
                    }}
                  >
                    <FaPlus className="me-2" />
                    Agregar dirección
                  </Button>
                </div>
              </div>
              {mensajeCambioSucursal && (
                <div className="alert alert-info alert-dismissible fade show" role="alert">
                  <strong>Cambio de sucursal:</strong> {mensajeCambioSucursal}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setMensajeCambioSucursal("")}
                    aria-label="Close"
                  ></button>
                </div>
              )}

              <ModalDomicilio
                show={modalVisible}
                onHide={() => setModalVisible(false)}
                onSubmit={handleModalSubmit}
                domicilioActual={domicilioSeleccionado!}
                cliente={cliente!}
              />
            </div>
          </div>
        </div>
      )}
      <ModalCambioSucursal
        show={showModalCambioSucursal}
        onHide={cerrarModalCambioSucursal}
        promocionesEliminadas={datosModalCambioSucursal.promocionesEliminadas}
        promocionesRestauradas={datosModalCambioSucursal.promocionesRestauradas}
        mensaje={datosModalCambioSucursal.mensaje}
      />
      <ModalMensaje
        mensaje="Pedido Guardado"
        show={mostrarModalPedido}
        onHide={() => setMostrarModalPedido(false)}
      />
    </>
  );
}