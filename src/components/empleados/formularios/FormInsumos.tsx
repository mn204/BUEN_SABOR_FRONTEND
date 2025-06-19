import { useEffect, useState } from "react";
import ArticuloInsumo from "../../../models/ArticuloInsumo";
import UnidadMedida from "../../../models/UnidadMedida";
import Categoria from "../../../models/Categoria";
import articuloInsumoService from "../../../services/ArticuloInsumoService";
import unidadMedidaService from "../../../services/UnidadMedidaService";
import categoriaService from "../../../services/CategoriaService";
import { Button } from "react-bootstrap";
import ModalCategoriaArbol from "../modales/ModalCategoriaArbol.tsx";
import { useSearchParams, Link } from "react-router-dom";
import ImagenArticulo from "../../../models/ImagenArticulo";
import { subirACloudinary } from "../../../funciones/funciones";
import "../../../styles/ArticuloManufacturado.css"; // Asegúrate de que la ruta sea correcta


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
    const idFromUrl = searchParams.get("id");

    const categoriaSeleccionada = categorias.find(cat => String(cat.id) === categoria);
    const [showModalCategoria, setShowModalCategoria] = useState(false);

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
                    const ganancia = ((insumo.precioVenta - insumo.precioCompra) / insumo.precioCompra) * 100;
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
            });
        }
    }, [idFromUrl]);

    const Guardar = async () => {
        const insumo = new ArticuloInsumo();
        insumo.id = idFromUrl ? Number(idFromUrl) : undefined;
        insumo.denominacion = denominacion;
        insumo.precioCompra = precioCompra;
        insumo.precioVenta = precioVenta;
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
            alert("Insumo guardado exitosamente");
            window.location.href = "/empleado/insumos"; // Redirige a la lista de insumos
        } catch (error) {
            alert("Error al guardar el insumo");
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
                alert("Algunas imágenes ya fueron seleccionadas y no se agregarán de nuevo.");
            }

            setImagenes(prev => [...prev, ...archivosFiltrados]);
        }
    };

    return (
    <div className="formArticuloManufacturado">
      <div className="d-flex align-items-center mb-4 position-relative">
        <h2
          className="mb-0 position-absolute"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          {idFromUrl ? "Editar Insumo" : "Nuevo Insumo"}
        </h2>
        <Link to="/empleado/insumos" className="btn btn-outline-secondary ms-auto">
          Volver a Insumos
        </Link>
      </div>

      <div className="row">
        <div className="col-12">
          <form className="d-flex flex-column gap-3 text-start" onSubmit={e => e.preventDefault()}>
            {/* Denominación */}
            <div className="d-flex flex-column">
              <label>Denominación:</label>
              <input
                type="text"
                value={denominacion}
                onChange={e => setDenominacion(e.target.value)}
                className="form-control"
                required
              />
            </div>

            {/* Precio Compra */}
            <div className="d-flex flex-column">
              <label>Precio Compra:</label>
              <input
                type="number"
                value={precioCompra}
                onChange={e => {
                  const compra = Number(e.target.value);
                  setPrecioCompra(compra);
                  const ventaCalculada = compra * (1 + porcentajeGanancia / 100);
                  setPrecioVenta(Number(ventaCalculada.toFixed(2)));
                }}
                className="form-control"
                min={0}
                required
              />
            </div>

            {/* Porcentaje y Precio Venta */}
            <div className="d-flex flex-column">
              <div className="row">
                <div className="col-md-6">
                  <label>% Ganancia:</label>
                  <input
                    type="number"
                    value={porcentajeGanancia}
                    onChange={e => {
                      const nuevoPorcentaje = Number(e.target.value);
                      setPorcentajeGanancia(nuevoPorcentaje);
                      const nuevaVenta = precioCompra * (1 + nuevoPorcentaje / 100);
                      setPrecioVenta(Number(nuevaVenta.toFixed(2)));
                    }}
                    className="form-control"
                    min={0}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label>Precio Venta:</label>
                  <input
                    type="number"
                    value={precioVenta}
                    onChange={e => {
                      const nuevaVenta = Number(e.target.value);
                      setPrecioVenta(nuevaVenta);
                      if (precioCompra > 0) {
                        const nuevoPorcentaje = ((nuevaVenta - precioCompra) / precioCompra) * 100;
                        setPorcentajeGanancia(Number(nuevoPorcentaje.toFixed(2)));
                      }
                    }}
                    className="form-control"
                    min={0}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Unidad de medida */}
            <div className="d-flex flex-column">
              <label>Unidad de medida:</label>
              <select
                value={unidad}
                onChange={e => setUnidad(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Seleccione una unidad</option>
                {unidadesMedida.map(um => (
                  <option key={um.id} value={um.id}>{um.denominacion}</option>
                ))}
              </select>
            </div>

            {/* Categoría */}
            <div className="d-flex flex-column">
        <label>Categoría:</label>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className={`btn ${categoriaSeleccionada ? 'btn-outline-success' : 'btn-outline-primary'}`}
            onClick={() => setShowModalCategoria(true)}
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

            {/* Opciones adicionales */}
            <div className="row mt-3">
              <div className="col-md-6">
                <div className="d-flex flex-column">
                  <label>Estado:</label>
                  <select
                    className="form-select"
                    value={eliminado ? "eliminado" : "activo"}
                    onChange={e => setEliminado(e.target.value === "eliminado")}
                  >
                    <option value="activo">Activo</option>
                    <option value="eliminado">Eliminado</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex flex-column">
                  <label>Es para Elaborar:</label>
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
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
              <span className="fs-6">% Ganancia:</span>
              <strong className="fs-6">{porcentajeGanancia}%</strong>
            </div>
            <hr />
            <div className="d-flex justify-content-between mb-3">
              <span className="fs-5 fw-bold">Precio Final:</span>
              <strong className="text-primary fs-5">
                ${precioVenta.toFixed(2)}
              </strong>
            </div>

            <Button
              variant={idFromUrl ? "warning" : "success"}
              className="w-100"
              size="lg"
              onClick={Guardar}
              disabled={!denominacion || !unidad || !categoria}
            >
              {idFromUrl ? "Actualizar Insumo" : "Guardar Insumo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

}

export default FormInsumos;