import { useEffect, useState } from "react";
import ArticuloInsumo from "../../../models/ArticuloInsumo";
import UnidadMedida from "../../../models/UnidadMedida";
import Categoria from "../../../models/Categoria";
import articuloInsumoService from "../../../services/ArticuloInsumoService";
import unidadMedidaService from "../../../services/UnidadMedidaService";
import categoriaService from "../../../services/CategoriaService";
import { Button } from "react-bootstrap";
import ModalCategoriaArbol from "../modales/ModalCategoriaArbol.tsx";
import ModalMensaje from "../modales/ModalMensaje"; // Importar el modal
import { useSearchParams } from "react-router-dom";
import ImagenArticulo from "../../../models/ImagenArticulo";
import { subirACloudinary } from "../../../funciones/funciones";
import { useNavigate } from "react-router-dom";
import "../../../styles/ArticuloManufacturado.css";

function FormInsumos() {
  const [denominacion, setDenominacion] = useState("");
  const [precioCompra, setPrecioCompra] = useState<number>(0);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [unidad, setUnidad] = useState<string>("");
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [categoria, setCategoria] = useState<string>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [eliminado, setEliminado] = useState(false);
  const [elaborar, setElaborar] = useState(false);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenArticulo[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idFromUrl = searchParams.get("id");

  // Estados para el modal de mensajes
  const [showModal, setShowModal] = useState(false);
  const [modalMensaje, setModalMensaje] = useState("");
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalVariante, setModalVariante] = useState<"primary" | "success" | "danger" | "warning" | "info" | "secondary">("primary");
  const [accionPostModal, setAccionPostModal] = useState<(() => void) | null>(null);

  const categoriaSeleccionada = categorias.find(cat => String(cat.id) === categoria);
  const [showModalCategoria, setShowModalCategoria] = useState(false);

  // Estado para controlar si el usuario ha interactuado con los campos
  const [touched, setTouched] = useState({
    denominacion: false,
    precioCompra: false,
    precioVenta: false,
    unidad: false,
    categoria: false
  });

  // Estados para errores de validación
  const [errores, setErrores] = useState({
    precioCompra: "",
    precioVenta: ""
  });

  // Función para mostrar mensajes con el modal
  const mostrarMensaje = (
      mensaje: string,
      titulo: string = "Mensaje",
      variante: "primary" | "success" | "danger" | "warning" | "info" | "secondary" = "primary",
      accion?: () => void
  ) => {
    setModalMensaje(mensaje);
    setModalTitulo(titulo);
    setModalVariante(variante);
    setAccionPostModal(accion ? () => accion : null);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    if (accionPostModal) {
      accionPostModal();
      setAccionPostModal(null);
    }
  };

  const eliminarImagenNueva = (idx: number) => {
    setImagenes(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    unidadMedidaService.getAll().then(setUnidadesMedida);
    categoriaService.getAll().then(setCategorias);
    if (idFromUrl) {
      articuloInsumoService.getById(Number(idFromUrl)).then(insumo => {
        setDenominacion(insumo.denominacion);
        setPrecioCompra(insumo.precioCompra || 0);
        if (insumo.precioCompra) {
          const ganancia = (((insumo.precioVenta ?? 0) - insumo.precioCompra) / insumo.precioCompra) * 100;
          setPorcentajeGanancia(Number(ganancia.toFixed(2)));
        }
        setPrecioVenta(insumo.precioVenta || 0);
        setUnidad(insumo.unidadMedida?.id?.toString() || "");
        setCategoria(insumo.categoria?.id?.toString() || "");
        setEliminado(!!insumo.eliminado);
        setElaborar(!!insumo.esParaElaborar);
        // Cargar imágenes existentes si las hay
        if (insumo.imagenes && insumo.imagenes.length > 0) {
          setImagenesExistentes(insumo.imagenes);
        }
        // Marcar todos los campos como "touched" al cargar datos existentes
        setTouched({
          denominacion: true,
          precioCompra: true,
          precioVenta: true,
          unidad: true,
          categoria: true
        });
      });
    }
  }, [idFromUrl]);

  useEffect(() => {
    if (!elaborar && precioCompra > 0) {
      const ganancia = ((precioVenta - precioCompra) / precioCompra) * 100;
      setPorcentajeGanancia(Number(ganancia.toFixed(2)));
    } else {
      setPorcentajeGanancia(0);
    }
  }, [precioCompra, precioVenta, elaborar]);

  // Función para validar precios (con opción de actualizar errores)
  const validarPrecios = (actualizarErrores = true) => {
    const nuevosErrores = { precioCompra: "", precioVenta: "" };
    let esValido = true;

    // Validaciones para precio de compra (aplica siempre)
    if (precioCompra <= 0) {
      nuevosErrores.precioCompra = "El precio de compra debe ser mayor a 0";
      esValido = false;
    }

    // Validaciones adicionales si NO es para elaborar
    if (!elaborar) {
      if (precioVenta <= 0) {
        nuevosErrores.precioVenta = "El precio de venta debe ser mayor a 0";
        esValido = false;
      } else if (precioVenta <= precioCompra) {
        nuevosErrores.precioVenta = "El precio de venta debe ser mayor al precio de compra";
        esValido = false;
      }
    }

    if (actualizarErrores) {
      setErrores(nuevosErrores);
    }
    return esValido;
  };

  // Función para verificar si el formulario es válido (sin actualizar errores)
  const esFormularioValido = () => {
    const preciosValidos = validarPrecios(false); // No actualizar errores aquí
    const camposRequeridos = denominacion.trim() !== "" && unidad !== "" && categoria !== "";

    return preciosValidos && camposRequeridos;
  };

  const handlePrecioCompraChange = (valor: string) => {
    const compra = Number(valor);

    // Permitir valores temporalmente durante la escritura
    setPrecioCompra(compra);

    // Calcular precio de venta si no es para elaborar
    if (!elaborar && compra > 0) {
      const ventaCalculada = compra * (1 + porcentajeGanancia / 100);
      setPrecioVenta(Number(ventaCalculada.toFixed(2)));
    }

    // Limpiar errores mientras escribe
    if (compra > 0 && errores.precioCompra) {
      setErrores(prev => ({ ...prev, precioCompra: "" }));
    }
  };

  const handlePrecioVentaChange = (valor: string) => {
    const venta = Number(valor);
    setPrecioVenta(venta);

    // Limpiar errores mientras escribe
    if (venta > 0 && venta > precioCompra && errores.precioVenta) {
      setErrores(prev => ({ ...prev, precioVenta: "" }));
    }
  };

  const Guardar = async () => {
    // Validar antes de guardar
    if (!esFormularioValido()) {
      mostrarMensaje(
          "Por favor, corrija los errores en el formulario antes de guardar.",
          "Error de validación",
          "warning"
      );
      return;
    }

    const insumo = new ArticuloInsumo();
    insumo.id = idFromUrl ? Number(idFromUrl) : undefined;
    insumo.denominacion = denominacion;
    insumo.precioCompra = precioCompra;
    insumo.precioVenta = elaborar ? null : precioVenta;
    insumo.eliminado = eliminado;

    const nuevasImagenes = await Promise.all(
        imagenes.map(async (file) => {
          const url = await subirACloudinary(file);
          const imagen = new ImagenArticulo();
          imagen.denominacion = url; // Usamos URL en lugar de base64
          imagen.eliminado = false;
          return imagen;
        })
    );

    const imagenesNoEliminadas = imagenesExistentes.filter(img => !img.eliminado);

    insumo.imagenes = [
      ...imagenesNoEliminadas,
      ...nuevasImagenes,
    ];
    insumo.esParaElaborar = elaborar;
    insumo.unidadMedida = unidad ? unidadesMedida.find(um => um.id === Number(unidad))! : new UnidadMedida();
    insumo.categoria = categoria ? categorias.find(cat => cat.id === Number(categoria))! : new Categoria();

    try {
      console.log("articulo: ", insumo)
      if (idFromUrl) {
        await articuloInsumoService.update(Number(idFromUrl), insumo);
      } else {
        await articuloInsumoService.create(insumo);
      }

      mostrarMensaje(
          "Insumo guardado exitosamente",
          "Éxito",
          "success",
          () => {
            window.location.href = "/empleado/insumos"; // Redirige a la lista de insumos
          }
      );
    } catch (error) {
      mostrarMensaje(
          "Error al guardar el insumo",
          "Error",
          "danger"
      );
    }
  };

  const eliminarImagenExistente = (idx: number) => {
    setImagenesExistentes(prev =>
        prev.map((img, i) => (i === idx ? { ...img, eliminado: true } : img))
    );
  };

  const handleImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const nuevosArchivos = Array.from(e.target.files as FileList);

      // Filtra para evitar duplicados por nombre y tamaño
      const archivosFiltrados = nuevosArchivos.filter(nuevo =>
          !imagenes.some(img => img.name === nuevo.name && img.size === nuevo.size)
      );

      if (archivosFiltrados.length < nuevosArchivos.length) {
        mostrarMensaje(
            "Algunas imágenes ya fueron seleccionadas y no se agregarán de nuevo.",
            "Información",
            "info"
        );
      }

      setImagenes(prev => [...prev, ...archivosFiltrados]);
    }
  };

  return (
      <div className="formArticuloManufacturado">
        <div className="d-flex align-items-center">
          <h2
              className="position-absolute"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            {idFromUrl ? "Editar Insumo" : "Nuevo Insumo"}
          </h2>
          <button
              onClick={() => navigate(-1)}
              className="promocion-detalle__back-button mt-5"
              style={{ marginLeft: "5em" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Volver
          </button>
        </div>

        <div className="row">
          <div className="col-12">
            <form className="d-flex flex-column gap-3 text-start" onSubmit={e => e.preventDefault()}>
              {/* Denominación */}
              <div className="d-flex flex-column">
                <label>Nombre: <span className="text-danger">*</span></label>
                <input
                    type="text"
                    value={denominacion}
                    onChange={e => setDenominacion(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, denominacion: true }))}
                    className={`form-control ${touched.denominacion && denominacion.trim() === "" ? "is-invalid" : ""}`}
                    required
                />
                {touched.denominacion && denominacion.trim() === "" && (
                    <div className="invalid-feedback">
                      El nombre es obligatorio
                    </div>
                )}
              </div>

              <div className="col-md-6 d-flex flex-column">
                <div className="d-flex flex-row align-items-center gap-2">
                  <label className="w-100">Es para Elaborar:</label>
                  <select
                      className="form-select"
                      value={elaborar ? "si" : "no"}
                      onChange={e => setElaborar(e.target.value === "si")}
                  >
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              {/* Precio Compra */}
              <div className="col-md-6 d-flex flex-column">
                <label>Precio Compra: <span className="text-danger">*</span></label>
                <input
                    type="number"
                    value={precioCompra}
                    onChange={e => handlePrecioCompraChange(e.target.value)}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, precioCompra: true }));
                      validarPrecios(true);
                    }}
                    className={`form-control ${touched.precioCompra && errores.precioCompra ? "is-invalid" : ""}`}
                    min="0.01"
                    step="0.01"
                    required
                />
                {touched.precioCompra && errores.precioCompra && (
                    <div className="invalid-feedback">
                      {errores.precioCompra}
                    </div>
                )}
              </div>

              {/*Precio Venta */}
              {!elaborar && (
                  <div className="col-md-6 d-flex flex-column">
                    <label>Precio Venta: <span className="text-danger">*</span></label>
                    <input
                        type="number"
                        value={precioVenta}
                        onChange={e => handlePrecioVentaChange(e.target.value)}
                        onBlur={() => {
                          setTouched(prev => ({ ...prev, precioVenta: true }));
                          validarPrecios(true);
                        }}
                        className={`form-control ${touched.precioVenta && errores.precioVenta ? "is-invalid" : ""}`}
                        min="0.01"
                        step="0.01"
                        required
                    />
                    {touched.precioVenta && errores.precioVenta && (
                        <div className="invalid-feedback">
                          {errores.precioVenta}
                        </div>
                    )}
                  </div>
              )}

              {/* Unidad de medida */}
              <div className="col-md-6 d-flex flex-column">
                <label>Unidad de medida: <span className="text-danger">*</span></label>
                <select
                    value={unidad}
                    onChange={e => setUnidad(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, unidad: true }))}
                    className={`form-select ${touched.unidad && unidad === "" ? "is-invalid" : ""}`}
                    required
                >
                  <option value="">Seleccione una unidad</option>
                  {unidadesMedida.map(um => (
                      <option key={um.id} value={um.id}>{um.denominacion}</option>
                  ))}
                </select>
                {touched.unidad && unidad === "" && (
                    <div className="invalid-feedback">
                      Debe seleccionar una unidad de medida
                    </div>
                )}
              </div>

              {/* Categoría */}
              <div className="d-flex flex-column">
                <label>Categoría: <span className="text-danger">*</span></label>
                <div className="d-flex align-items-center gap-2">
                  <button
                      type="button"
                      className={`btn ${categoriaSeleccionada ? 'btn-outline-success' : 'btn-outline-primary'} ${touched.categoria && categoria === "" ? "border-danger" : ""}`}
                      onClick={() => {
                        setShowModalCategoria(true);
                        setTouched(prev => ({ ...prev, categoria: true }));
                      }}
                  >
                    {categoriaSeleccionada ? categoriaSeleccionada.denominacion : 'Seleccionar categoría'}
                  </button>

                  {categoriaSeleccionada && (
                      <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setCategoria('')}
                          title="Deseleccionar categoría"
                      >
                        ✕
                      </button>
                  )}
                </div>
                {touched.categoria && categoria === "" && (
                    <small className="text-danger">
                      Debe seleccionar una categoría
                    </small>
                )}

                <ModalCategoriaArbol
                    show={showModalCategoria}
                    onHide={() => setShowModalCategoria(false)}
                    categorias={categorias}
                    categoriaSeleccionada={categoria}
                    setCategoriaSeleccionada={setCategoria}
                />
              </div>

              {/* Imágenes */}
              <div className="d-flex flex-column">
                <label>Imágenes:</label>

                {/* Imágenes existentes */}
                {imagenesExistentes.length > 0 && (
                    <div className="preview-imagenes mt-2 d-flex gap-2 flex-wrap">
                      {imagenesExistentes.map((img, idx) =>
                              !img.eliminado && (
                                  <div key={img.id || idx} style={{ position: "relative", display: "inline-block" }}>
                                    <img
                                        src={img.denominacion}
                                        alt={`img-existente-${idx}`}
                                        style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => eliminarImagenExistente(idx)}
                                        style={{
                                          position: "absolute",
                                          top: -5,
                                          right: -5,
                                          background: "red",
                                          color: "white",
                                          border: "none",
                                          borderRadius: "50%",
                                          width: 20,
                                          height: 20,
                                          cursor: "pointer",
                                          fontSize: "12px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center"
                                        }}
                                    >
                                      ×
                                    </button>
                                  </div>
                              )
                      )}
                    </div>
                )}

                {/* Imágenes nuevas */}
                <div className="preview-imagenes mt-2 d-flex gap-2 flex-wrap">
                  {imagenes.map((img, idx) => (
                      <div key={idx} style={{ position: "relative", display: "inline-block" }}>
                        <img
                            src={URL.createObjectURL(img)}
                            alt={`preview-${idx}`}
                            style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                        />
                        <button
                            type="button"
                            onClick={() => eliminarImagenNueva(idx)}
                            style={{
                              position: "absolute",
                              top: -5,
                              right: -5,
                              background: "red",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              width: 20,
                              height: 20,
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                        >
                          ×
                        </button>
                      </div>
                  ))}
                </div>

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImagenesChange}
                    className="form-control mt-2"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Resumen y botón guardar */}
        <div className="row justify-content-center mt-4">
          <div className="col-md-6">
            <div className="card p-4">
              <h5 className="text-center mb-3">Resumen</h5>
              <div className="d-flex justify-content-between mb-3">
                <span className="fs-6">Precio de Compra:</span>
                <strong className="fs-6">${precioCompra.toFixed(2)}</strong>
              </div>
              {!elaborar && (
                  <>
                    <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                      <span className="fs-6">% Ganancia:</span>
                      <strong className="fs-6">{porcentajeGanancia}%</strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-3">
                      <span className="fs-5 fw-bold">Precio de Venta:</span>
                      <strong className="text-primary fs-5">
                        ${precioVenta.toFixed(2)}
                      </strong>
                    </div>
                  </>
              )}
              {elaborar && (
                  <>
                    <hr />
                    <div className="d-flex justify-content-between mb-3">
                      <span className="fs-5 fw-bold">Solo Precio de Compra</span>
                      <span className="text-muted fs-6">(Insumo para elaborar)</span>
                    </div>
                  </>
              )}

              <Button
                  variant={idFromUrl ? "warning" : "success"}
                  className="w-100"
                  size="lg"
                  onClick={Guardar}
                  disabled={!esFormularioValido()}
              >
                {idFromUrl ? "Actualizar Insumo" : "Guardar Insumo"}
              </Button>

              {/* Mensaje de ayuda cuando el botón está deshabilitado */}
              {!esFormularioValido() && (
                  <small className="text-muted text-center mt-2 d-block">
                    <span className="text-danger">*</span> Complete todos los campos obligatorios y corrija los errores para continuar
                  </small>
              )}
            </div>
          </div>
        </div>

        {/* Modal de mensajes */}
        <ModalMensaje
            show={showModal}
            onHide={cerrarModal}
            mensaje={modalMensaje}
            titulo={modalTitulo}
            variante={modalVariante}
        />
      </div>
  );
}

export default FormInsumos;