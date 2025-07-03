import { Form } from "react-bootstrap";
import { useSucursalUsuario } from "../../context/SucursalContext";

export function SelectorSucursal() {
    const { sucursalActualUsuario, sucursalesUsuario, cambiarSucursalUsuario } = useSucursalUsuario();

    return (
        <div className="SelectSucursalHome sucursal text-white align-items-center justift-content-center mt-4" style={{ width: '100%' }}>
            <Form.Select
                id="selectSucursalUsuario2"
                value={sucursalActualUsuario?.id || ""}
                onChange={(e) => {
                    const id = parseInt(e.target.value);
                    const sucursal = sucursalesUsuario.find(s => s.id === id);
                    if (sucursal) cambiarSucursalUsuario(sucursal);
                }}
                style={{ width: '100%', minWidth: '200px', margin: "1px 10px 10px 10px" }}
            >
                {sucursalesUsuario.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
            </Form.Select>
        </div>
    )
}