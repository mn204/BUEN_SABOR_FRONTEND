import { useState, useMemo } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import ArticuloInsumo from "../../../models/ArticuloInsumo.ts";
import { Form, InputGroup } from "react-bootstrap";
import FormInsumos from "../formularios/FormInsumos.tsx";

interface Props {
  show: boolean;
  onHide: () => void;
  articulosInsumo: ArticuloInsumo[];
  insumoSeleccionado: ArticuloInsumo | null;
  setInsumoSeleccionado: (a: ArticuloInsumo | null) => void;
  cantidadInsumo: number;
  setCantidadInsumo: (n: number) => void;
  onAgregar: () => void;
}

function ModalAgregarInsumo({
  show, onHide, articulosInsumo,
  insumoSeleccionado, setInsumoSeleccionado,
  cantidadInsumo, setCantidadInsumo,
  onAgregar
}: Props) {
  const [filtroDenominacion, setFiltroDenominacion] = useState("");
  const [filtroUnidad, setFiltroUnidad] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const unidades = useMemo(
    () =>
      Array.from(
        new Set(articulosInsumo.map(i => i.unidadMedida?.denominacion).filter(Boolean))
      ),
    [articulosInsumo]
  );

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(articulosInsumo.map(i => i.categoria?.denominacion).filter(Boolean))
      ),
    [articulosInsumo]
  );

  const insumosFiltrados = useMemo(
    () =>
      articulosInsumo.filter(insumo =>
        (!filtroDenominacion ||
          insumo.denominacion.toLowerCase().includes(filtroDenominacion.toLowerCase())) &&
        (!filtroUnidad || insumo.unidadMedida?.denominacion === filtroUnidad) &&
        (!filtroCategoria || insumo.categoria?.denominacion === filtroCategoria)
      ),
    [articulosInsumo, filtroDenominacion, filtroUnidad, filtroCategoria]
  );

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered scrollable>
        <Modal.Header closeButton className="d-flex justify-content-around">
          <Modal.Title>Seleccionar Insumo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {/* Filtros */}
            <div className="mb-3 d-flex justify-content-center flex-wrap gap-3">
              <InputGroup style={{ maxWidth: 300 }}>
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por denominación"
                  value={filtroDenominacion}
                  onChange={e => setFiltroDenominacion(e.target.value)}
                />
              </InputGroup>

              <Form.Select
                value={filtroUnidad}
                onChange={e => setFiltroUnidad(e.target.value)}
                aria-label="Filtrar por unidad"
                style={{ maxWidth: 160 }}
              >
                <option value="">Todas las unidades</option>
                {unidades.map(um => (
                  <option key={um} value={um}>{um}</option>
                ))}
              </Form.Select>

              <Form.Select
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
                aria-label="Filtrar por categoría"
                style={{ maxWidth: 180 }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </div>

            {/* Tabla */}
            <table className="table">
              <thead>
                <tr>
                  <th>Denominación</th>
                  <th>Precio venta</th>
                  <th>Unidad</th>
                  <th>Categoría</th>
                  <th>Seleccionar</th>
                </tr>
              </thead>
              <tbody>
                {insumosFiltrados.map(insumo => (
                  <tr key={insumo.id}>
                    <td>{insumo.denominacion}</td>
                    <td>${insumo.precioVenta ?? 0}</td>
                    <td>{insumo.unidadMedida?.denominacion}</td>
                    <td>{insumo.categoria?.denominacion}</td>
                    <td>
                      <input
                        type="radio"
                        checked={insumoSeleccionado?.id === insumo.id}
                        onChange={() => setInsumoSeleccionado(insumo)}
                      />
                    </td>
                  </tr>
                ))}
                {insumosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      No hay insumos que coincidan con el filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Cantidad */}
            <div className="mt-2">
              <label>Cantidad:</label>
              <input
                type="number"
                min={0.01}
                step="any"
                value={cantidadInsumo}
                onChange={e => setCantidadInsumo(Number(e.target.value))}
                className="form-control"
                style={{ maxWidth: 120, display: "inline-block", marginLeft: 8 }}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
            <Button variant="secondary" onClick={onHide}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={onAgregar}
              disabled={!insumoSeleccionado || cantidadInsumo <= 0}
            >
              Agregar
            </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ModalAgregarInsumo;
