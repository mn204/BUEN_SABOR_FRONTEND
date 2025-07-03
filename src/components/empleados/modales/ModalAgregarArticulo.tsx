import { useState, useMemo } from "react";
import { Form, InputGroup } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Articulo from "../../../models/Articulo.ts";

interface Props {
  show: boolean;
  onHide: () => void;
  articulos: Articulo[];
  articuloSeleccionado: Articulo | null;
  setArticuloSeleccionado: (a: Articulo | null) => void;
  cantidadInsumo: number;
  setCantidadInsumo: (n: number) => void;
  onAgregar: () => void;
}

function ModalAgregarArticulo({
  show, onHide, articulos,
  articuloSeleccionado, setArticuloSeleccionado,
  cantidadInsumo, setCantidadInsumo,
  onAgregar
}: Props) {
  // Filtros
  const [filtroDenominacion, setFiltroDenominacion] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const categorias = useMemo(
    () =>
      Array.from(
        new Set(articulos.map(i => i.categoria?.denominacion).filter(Boolean))
      ),
    [articulos]
  );

  // Filtrado
  const insumosFiltrados = useMemo(
    () =>
      articulos.filter(insumo =>
        (!filtroDenominacion ||
          insumo.denominacion.toLowerCase().includes(filtroDenominacion.toLowerCase())) &&
        (!filtroCategoria || insumo.categoria?.denominacion === filtroCategoria)
      ),
    [articulos, filtroDenominacion, filtroCategoria]
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar Articulo</Modal.Title>
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
              {insumosFiltrados.map(art => (
                <tr key={art.id}>
                  <td>{art.denominacion}</td>
                  <td>${art.precioVenta ?? 0}</td>
                  <td>{art.unidadMedida?.denominacion}</td>
                  <td>{art.categoria?.denominacion}</td>
                  <td>
                    <input
                      type="radio"
                      checked={articuloSeleccionado?.id === art.id}
                      onChange={() => setArticuloSeleccionado(art)}
                    />
                  </td>
                </tr>
              ))}
              {insumosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No hay artículos que coincidan con el filtro.
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
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={onAgregar}
          disabled={!articuloSeleccionado || cantidadInsumo <= 0}
        >
          Agregar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ModalAgregarArticulo;