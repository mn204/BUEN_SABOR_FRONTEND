import { Table, Form, Button, Image } from "react-bootstrap";
import DetallePromocion from "../../../models/DetallePromocion.ts";

type Props = {
  detalles: DetallePromocion[];
  onEliminar: (index: number) => void;
  onCantidadChange: (index: number, cantidad: number) => void;
  totalInsumos: number;
};

const DetalleArticulosTable = ({
  detalles,
  onEliminar,
  onCantidadChange,
  totalInsumos,
}: Props) => (
  <div style={{ maxWidth: 700, margin: "0 auto" }}>
    <Table responsive bordered hover size="sm">
      <thead>
        <tr>
          <th className="text-center align-middle" style={{ width: "10%" }}>Imagen</th>
          <th className="text-center align-middle" style={{ width: "32%" }}>Artículo</th>
          <th className="text-center align-middle" style={{ width: "23%" }}>Cantidad</th>
          <th className="text-center align-middle" style={{ width: "20%" }}>Precio Venta</th>
          <th className="text-center align-middle" style={{ width: "15%" }}>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {detalles.map((det, idx) => (
          <tr key={idx}>
            <td className="text-center align-middle">
              {det.articulo?.imagenes?.[0]?.denominacion ? (
                <Image
                  src={det.articulo.imagenes[0].denominacion}
                  rounded
                  style={{ width: 40, height: 40, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: "#eee",
                    borderRadius: 4,
                  }}
                />
              )}
            </td>
            <td
              className="text-center align-middle"
              style={{
                maxWidth: 150,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {det.articulo?.denominacion}
            </td>
            <td className="text-center align-middle">
              <div className="d-flex align-items-center justify-content-center gap-2">
                <Form.Control
                  type="number"
                  size="sm"
                  min={0}
                  step={1}
                  value={det.cantidad}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed)) {
                      onCantidadChange(idx, parsed);
                    }
                  }}
                  style={{
                    width: "55px",
                    textAlign: "right",
                    borderRadius: "10px",
                    padding: "2px 6px",
                    fontSize: "0.8rem",
                    lineHeight: "1.2",
                    height: "28px",
                    border: "1px solid #ccc",
                    backgroundColor: "#fafafa",
                  }}
                />
                <small>{det.articulo?.unidadMedida?.denominacion}</small>
              </div>
            </td>
            <td className="text-center align-middle">
              ${(det.articulo?.precioVenta ?? 0).toFixed(2)}
            </td>
            <td className="text-center align-middle">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onEliminar(idx)}
              >
                Eliminar
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={3} className="text-end fw-bold align-middle">
            Total insumos:
          </td>
          <td className="text-center fw-bold align-middle">${totalInsumos.toFixed(2)}</td>
          <td />
        </tr>
      </tfoot>
    </Table>
  </div>
);

export default DetalleArticulosTable;
