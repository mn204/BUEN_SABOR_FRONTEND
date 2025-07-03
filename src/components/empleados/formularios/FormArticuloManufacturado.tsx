import { useEffect, useState } from "react";
import ArticuloManufacturadoService from "../../../services/ArticuloManufacturadoService.ts";
import ArticuloInsumo from "../../../models/ArticuloInsumo.ts";
import Categoria from "../../../models/Categoria.ts";
import DetalleArticuloManufacturado from "../../../models/DetalleArticuloManufacturado.ts";
import ArticuloManufacturado from "../../../models/ArticuloManufacturado.ts";
import UnidadMedida from "../../../models/UnidadMedida.ts";
import ModalAgregarInsumo from "../modales/ModalAgregarInsumo.tsx";
import DetalleInsumosTable from "../grillas/DetalleInsumosTable.tsx";
import FormArticuloFields from "./FormArticuloFields";
import "../../../styles/ArticuloManufacturado.css";
import Button from "react-bootstrap/Button";
import { useManufacturado } from "../../../hooks/useManufactuado.ts";
import { useCargaDatosIniciales } from "../../../hooks/useCargarDatosIiniciales.ts";
import { useModal } from "../../../hooks/useModal.ts";
import ImagenArticulo from "../../../models/ImagenArticulo.ts";
import TipoArticulo from "../../../models/enums/TipoArticulo.ts";
import { subirACloudinary } from "../../../funciones/funciones.tsx";
import { useNavigate } from "react-router-dom";
import ModalMensaje from "../modales/ModalMensaje";

function FormArticuloManufacturado() {
  const {
    idFromUrl,
    denominacion, setDenominacion,
    descripcion, setDescripcion,
    tiempoEstimadoMinutos, setTiempoEstimadoMinutos,
    preparacion, setPreparacion,
    unidad, setUnidad,
    categoria, setCategoria,
    detalles, setDetalles,
    imagenesExistentes,
    eliminado,
    porcentajeGanancia, setPorcentajeGanancia,
    eliminarImagenExistente,
    imagenes, setImagenes,
    limpiarFormulario, EliminarDetalle,
    eliminarImagenNueva, CambiarCantidadDetalle
  } = useManufacturado();
  const { unidadesMedida, categorias } = useCargaDatosIniciales();
  const navigate = useNavigate();


  // Setear automáticamente la unidad "Unidad" y no permitir cambiarla
  useEffect(() => {
    const unidadDefault = unidadesMedida.find(u => u.denominacion === "Unidad");
    if (unidadDefault) {
      setUnidad(String(unidadDefault.id));
    }
  }, [unidadesMedida, setUnidad]);

  const { showModal, setShowModal, articulosInsumo } = useModal();
  // Estados principales
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<ArticuloInsumo | null>(null);
  const [cantidadInsumo, setCantidadInsumo] = useState<number>(1);
  const [showModalCategoria, setShowModalCategoria] = useState(false);

  // Estado para el modal de mensaje
  const [showModalMensaje, setShowModalMensaje] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");
  const [tituloModal, setTituloModal] = useState("Mensaje");
  const [varianteModal, setVarianteModal] = useState<"primary" | "success" | "danger" | "warning" | "info" | "secondary">("primary");

  // Función para mostrar el modal de mensaje
  const mostrarMensaje = (mensaje: string, titulo = "Mensaje", variante: typeof varianteModal = "primary") => {
    setMensajeModal(mensaje);
    setTituloModal(titulo);
    setVarianteModal(variante);
    setShowModalMensaje(true);
  };

  // Utilidades
  const totalInsumos = detalles.reduce((acc, det) => {
    const precio = det.articuloInsumo?.precioCompra ?? 0;
    return acc + precio * det.cantidad;
  }, 0);
  const totalConGanancia = totalInsumos * (1 + (porcentajeGanancia / 100));

  // Handlers
  const handleImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const nuevosArchivos = Array.from(e.target.files as FileList);

      // Filtra para evitar duplicados por nombre y tamaño
      const archivosFiltrados = nuevosArchivos.filter(nuevo =>
        !imagenes.some(img => img.name === nuevo.name && img.size === nuevo.size)
      );

      if (archivosFiltrados.length < nuevosArchivos.length) {
        mostrarMensaje("Algunas imágenes ya fueron seleccionadas y no se agregarán de nuevo.", "Atención", "warning");
      }

      setImagenes(prev => [...prev, ...archivosFiltrados]);
    }
  };

  const AgregarInsumo = () => {
    if (insumoSeleccionado) {
      setDetalles(prev => {
        const index = prev.findIndex(
          det => det.articuloInsumo?.id === insumoSeleccionado.id
        );
        if (index !== -1) {
          // Si ya existe, suma la cantidad
          const nuevosDetalles = [...prev];
          nuevosDetalles[index] = {
            ...nuevosDetalles[index],
            cantidad: nuevosDetalles[index].cantidad + cantidadInsumo,
          };
          return nuevosDetalles;
        } else {
          // Si no existe, lo agrega
          return [
            ...prev,
            {
              cantidad: cantidadInsumo,
              articuloInsumo: insumoSeleccionado,
              eliminado: false,
            } as DetalleArticuloManufacturado,
          ];
        }
      });
      setShowModal(false);
      setInsumoSeleccionado(null);
      setCantidadInsumo(1);
      // Scroll mejorado para evitar error visual
      requestAnimationFrame(() => {
        const detallesSection = document.querySelector('.detalles-insumos-section');
        if (detallesSection) {
          detallesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  };

  // Factoriza la creación del objeto manufacturado
  const buildManufacturado = async (): Promise<ArticuloManufacturado | null> => {
    const unidadMedidaSeleccionada = unidadesMedida.find(um => um.id === Number(unidad));
    if (!unidadMedidaSeleccionada) {
      mostrarMensaje("Unidad de medida inválida", "Error", "danger");
      return null;
    }

    const categoriaSeleccionada = categorias.find(cat => cat.id === Number(categoria));
    if (!categoriaSeleccionada) {
      mostrarMensaje("Categoría inválida", "Error", "danger");
      return null;
    }

    const manufacturado = new ArticuloManufacturado();
    manufacturado.denominacion = denominacion;
    manufacturado.ganancia = porcentajeGanancia;
    manufacturado.precioVenta = totalConGanancia;
    manufacturado.unidadMedida = { id: unidadMedidaSeleccionada.id } as UnidadMedida;
    manufacturado.categoria = { id: categoriaSeleccionada.id } as Categoria;
    manufacturado.descripcion = descripcion;
    manufacturado.tiempoEstimadoMinutos = tiempoEstimadoMinutos;
    manufacturado.preparacion = preparacion;
    manufacturado.eliminado = eliminado;

    manufacturado.detalles = detalles.map(det => ({
      id: det.id ?? undefined,
      cantidad: det.cantidad,
      articuloInsumo: det.articuloInsumo!,
      eliminado: false,
    }));

    // 🔄 Subir imágenes nuevas a Cloudinary
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

    manufacturado.imagenes = [
      ...imagenesNoEliminadas,
      ...nuevasImagenes,
    ];

    return manufacturado;
  };

  const guardarOModificar = async () => {
    try {
      const manufacturado = await buildManufacturado();
      if (!manufacturado) return;
      console.log(manufacturado.detalles)
      manufacturado.precioVenta = totalConGanancia;
      manufacturado.ganancia = porcentajeGanancia;
      manufacturado.eliminado = eliminado;
      manufacturado.tipoArticulo = TipoArticulo.ArticuloManufacturado;
      if (idFromUrl) {
        manufacturado.id = Number(idFromUrl);
        await ArticuloManufacturadoService.update(Number(idFromUrl), manufacturado);
        mostrarMensaje("Artículo manufacturado actualizado correctamente", "Éxito", "success");
      } else {
        await ArticuloManufacturadoService.create(manufacturado);
        mostrarMensaje("Artículo manufacturado guardado correctamente", "Éxito", "success");
      }
      limpiarFormulario();
      setTimeout(() => {
        window.location.href = "/empleado/productos";
      }, 1200);
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al guardar o actualizar el artículo manufacturado", "Error", "danger");
    }
  };

  const modalProps = {
    show: showModal,
    onHide: () => {
      setShowModal(false);
      setInsumoSeleccionado(null);
      setCantidadInsumo(1);
    },
    articulosInsumo: articulosInsumo.filter(
      insumo => !detalles.some(det => det.articuloInsumo?.id === insumo.id)
    ),
    insumoSeleccionado: insumoSeleccionado,
    setInsumoSeleccionado: setInsumoSeleccionado,
    cantidadInsumo: cantidadInsumo,
    setCantidadInsumo: setCantidadInsumo,
    onAgregar: AgregarInsumo
  };


  const tableProps = {
    detalles: detalles,
    onEliminar: EliminarDetalle,
    onCantidadChange: CambiarCantidadDetalle,
    totalInsumos: totalInsumos
  };

  return (
    <div className="formArticuloManufacturado">
      <div className="d-flex align-items-center mb-4 position-relative">
        <h2
          className="mb-0 position-absolute"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          {idFromUrl ? "Editar Producto" : "Nuevo Producto"}
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
          <FormArticuloFields
            denominacion={denominacion}
            setDenominacion={setDenominacion}
            descripcion={descripcion}
            setDescripcion={setDescripcion}
            tiempoEstimadoMinutos={tiempoEstimadoMinutos}
            setTiempoEstimadoMinutos={setTiempoEstimadoMinutos}
            preparacion={preparacion}
            setPreparacion={setPreparacion}
            categoria={categoria}
            setCategoria={setCategoria}
            categorias={categorias}
            unidad={unidad}
            setUnidad={setUnidad}
            unidadesMedida={unidadesMedida}
            // Props de imágenes:
            imagenes={imagenes}
            imagenesExistentes={imagenesExistentes}
            handleImagenesChange={handleImagenesChange}
            eliminarImagenNueva={eliminarImagenNueva}
            eliminarImagenExistente={eliminarImagenExistente}
            showModalCategoria={showModalCategoria}
            setShowModalCategoria={setShowModalCategoria}
          />
        </div>
      </div>

      {/* Botón Agregar Insumo */}
      <div className="d-flex justify-content-center my-4">
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          size="lg"
        >
          Agregar Insumo
        </Button>
      </div>

      <div className="detalles-insumos-section mt-4">
        <DetalleInsumosTable {...tableProps} />
      </div>

      {/* Resumen movido abajo */}
      {detalles.length > 0 && (
        <div className="row justify-content-center mt-4">
          <div className="col-md-6">
            <div className="card p-4">
              <h5 className="text-center mb-3">Resumen</h5>
              <div className="d-flex justify-content-between mb-3">
                <span className="fs-6">Total Precio Compra Insumos:</span>
                <strong className="fs-6">${totalInsumos.toFixed(2)}</strong>
              </div>
              <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                <span className="fs-6">% Ganancia:</span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={porcentajeGanancia}
                  onChange={e => {
                    const valor = Number(e.target.value.replace(",", "."));
                    if (valor >= 0) setPorcentajeGanancia(valor);
                  }}
                  onKeyDown={e => {
                    if (e.key === "-") e.preventDefault();
                  }}
                  className="form-control form-control-sm"
                  style={{ maxWidth: '100px' }}
                />
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <span className="fs-5 fw-bold">Precio Final:</span>
                <strong className="text-primary fs-5">
                  ${totalConGanancia.toFixed(2)}
                </strong>
              </div>

              <Button
                variant={idFromUrl ? "warning" : "success"}
                className="w-100"
                size="lg"
                onClick={guardarOModificar}
                disabled={!denominacion || !descripcion || !preparacion || !categoria || !unidad || detalles.length === 0}
              >
                {idFromUrl ? "Actualizar Producto" : "Guardar Producto"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ModalAgregarInsumo {...modalProps} />
      <ModalMensaje
        show={showModalMensaje}
        onHide={() => setShowModalMensaje(false)}
        mensaje={mensajeModal}
        titulo={tituloModal}
        variante={varianteModal}
      />
    </div>
  );
}

export default FormArticuloManufacturado;