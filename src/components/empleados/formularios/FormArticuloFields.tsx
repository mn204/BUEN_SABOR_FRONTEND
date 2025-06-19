import Categoria from "../../../models/Categoria";
import UnidadMedida from "../../../models/UnidadMedida";
import ModalCategoriaArbol from "../modales/ModalCategoriaArbol.tsx";
import type ImagenArticulo from "../../../models/ImagenArticulo";

interface Props {
  denominacion: string;
  setDenominacion: (v: string) => void;
  descripcion: string;
  setDescripcion: (v: string) => void;
  tiempoEstimadoMinutos: number;
  setTiempoEstimadoMinutos: (v: number) => void;
  preparacion: string;
  setPreparacion: (v: string) => void;
  categoria: string;
  setCategoria: (v: string) => void;
  categorias: Categoria[];
  unidad: string;
  setUnidad: (v: string) => void;
  unidadesMedida: UnidadMedida[];
  // Imágenes
  imagenes: File[];
  imagenesExistentes: ImagenArticulo[];
  handleImagenesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  eliminarImagenNueva: (idx: number) => void;
  eliminarImagenExistente: (idx: number) => void;
  showModalCategoria: boolean;
  setShowModalCategoria: (v: boolean) => void;
}

const FormArticuloFields: React.FC<Props> = ({
  denominacion,
  setDenominacion,
  descripcion,
  setDescripcion,
  tiempoEstimadoMinutos,
  setTiempoEstimadoMinutos,
  preparacion,
  setPreparacion,
  categoria,
  setCategoria,
  categorias,
  unidad,
  setUnidad,
  unidadesMedida,
  imagenes,
  imagenesExistentes,
  handleImagenesChange,
  eliminarImagenNueva,
  eliminarImagenExistente,
  showModalCategoria,
  setShowModalCategoria,
}) => {
  
  const categoriaSeleccionada = categorias.find(cat => String(cat.id) === categoria);

  return (
    <form className="d-flex flex-column gap-3 text-start" onSubmit={e => e.preventDefault()}>
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
      
      <div className="d-flex flex-column">
        <label>Descripción:</label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          className="form-control"
          required
        />
      </div>
      
      <div className="d-flex flex-column">
        <label>Tiempo estimado (minutos):</label>
        <input
          type="number"
          min={0}
          value={tiempoEstimadoMinutos}
          onChange={e => setTiempoEstimadoMinutos(Number(e.target.value))}
          className="form-control"
          required
        />
      </div>
      
      <div className="d-flex flex-column">
        <label>Preparación:</label>
        <textarea
          value={preparacion}
          onChange={e => setPreparacion(e.target.value)}
          className="form-control"
          required
        />
      </div>
      
      {/* Categoría mejorada con opción de deseleccionar */}
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
      
      {/* Unidad de medida deshabilitada */}
      <div className="d-flex flex-column">
        <label>Unidad de medida:</label>
        <select
          value={unidad}
          onChange={e => setUnidad(e.target.value)}
          className="form-select"
          disabled
          required
        >
          <option value="">Seleccione una unidad</option>
          {unidadesMedida.map(um => (
            <option key={um.id} value={um.id}>{um.denominacion}</option>
          ))}
        </select>
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
  );
};

export default FormArticuloFields;