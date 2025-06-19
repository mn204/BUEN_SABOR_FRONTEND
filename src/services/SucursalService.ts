import type Promocion from "../models/Promocion.ts";
import  Sucursal from "../models/Sucursal.ts";

const API_BASE = "http://localhost:8080/api/sucursal";

export const obtenerSucursales = async (): Promise<Sucursal[]> => {
    const res = await fetch(`${API_BASE}`);
    return await res.json();
};
class SucursalService {
    async getAllBySucursalId(id: number): Promise<Promocion[]> {
        console.log(id)
        try {
            const res = await fetch(`${API_BASE}/promociones/${id}`);
            if (!res.ok) throw new Error("Error al obtener insumo");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
export default new SucursalService();
    