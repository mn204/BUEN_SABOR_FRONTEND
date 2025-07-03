import { Table, Form, Button, Image } from "react-bootstrap";
import DetalleArticuloManufacturado from "../../../models/DetalleArticuloManufacturado.ts";

type Props = {
  detalles: DetalleArticuloManufacturado[];
  onEliminar: (index: number) => void;
  onCantidadChange: (index: number, cantidad: number) => void;
  totalInsumos: number;
};

const DetalleInsumosTable = ({
  detalles,
  onEliminar,
  onCantidadChange,
  totalInsumos,
}: Props) => {
  // Calcular el total de todos los insumos
  const calcularTotalGeneral = () => {
    return detalles.reduce((total, det) => {
      const precioCompra = det.articuloInsumo?.precioCompra ?? 0;
      const cantidad = det.cantidad || 0;
      return total + (precioCompra * cantidad);
    }, 0);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Table responsive bordered hover size="sm">
        <thead>
          <tr>
            <th className="text-center align-middle" style={{ width: "8%" }}>Imagen</th>
            <th className="text-center align-middle" style={{ width: "28%" }}>Insumo</th>
            <th className="text-center align-middle" style={{ width: "18%" }}>Cantidad</th>
            <th className="text-center align-middle" style={{ width: "16%" }}>Precio Compra</th>
            <th className="text-center align-middle" style={{ width: "16%" }}>Costo Total</th>
            <th className="text-center align-middle" style={{ width: "14%" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {detalles.map((det, idx) => {
            const precioCompra = det.articuloInsumo?.precioCompra ?? 0;
            const cantidad = det.cantidad || 0;
            const totalItem = precioCompra * cantidad;

            return (
              <tr key={idx}>
                <td className="text-center align-middle">
                  {det.articuloInsumo?.imagenes?.[0]?.denominacion ? (
                    <Image
                      src={det.articuloInsumo.imagenes[0].denominacion}
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
                  {det.articuloInsumo?.denominacion}
                </td>
                <td className="text-center align-middle">
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <Form.Control
                      type="number"
                      size="sm"
                      min={0}
                      step={det.articuloInsumo?.unidadMedida?.denominacion === "Unidad" ? 1 : 0.1}
                      inputMode={det.articuloInsumo?.unidadMedida?.denominacion === "Unidad" ? "numeric" : "decimal"}
                      value={det.cantidad}
                      onChange={(e) => {
                        const value = e.target.value;
                        const parsed = det.articuloInsumo?.unidadMedida?.denominacion === "Unidad"
                          ? parseInt(value)
                          : parseFloat(value);
                        if (!isNaN(parsed)) {
                          onCantidadChange(idx, parsed);
                        }
                      }}
                      onKeyDown={(e) => {
                        const unidadEsEntera = det.articuloInsumo?.unidadMedida?.denominacion === "Unidad";
                        if (
                          e.key === "-" ||
                          e.key === "e" ||
                          (unidadEsEntera && (e.key === "." || e.key === ",")) // evita decimales si es "Unidad"
                        ) {
                          e.preventDefault();
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
                    <small>{det.articuloInsumo?.unidadMedida?.denominacion}</small>
                  </div>
                </td>
                <td className="text-center align-middle">
                  ${precioCompra.toFixed(2)}
                </td>
                <td className="text-center align-middle fw-bold">
                  ${totalItem.toFixed(2)}
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
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="text-end fw-bold align-middle">
              Total General:
            </td>
            <td className="text-center fw-bold align-middle" style={{ backgroundColor: "#f8f9fa" }}>
              ${calcularTotalGeneral().toFixed(2)}
            </td>
            <td />
          </tr>
        </tfoot>
      </Table>
    </div>
  );
};

export default DetalleInsumosTable;