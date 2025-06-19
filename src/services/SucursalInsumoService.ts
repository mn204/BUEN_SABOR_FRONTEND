import SucursalInsumo from "../models/SucursalInsumo";

const API_URL = "http://localhost:8080/api/sucursal-insumo";

class SucursalInsumoService {
    async create(sucursalInsumo: SucursalInsumo): Promise<any> {
        try {
            const res = await fetch(`${API_URL}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sucursalInsumo)
            });
            if (!res.ok) throw new Error("Error al crear el stock");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async update(sucursalInsumo: SucursalInsumo, id: number): Promise<any> {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sucursalInsumo)
            });
            if (!res.ok) throw new Error("Error al crear el stock");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getById(id: number): Promise<SucursalInsumo> {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            if (!res.ok) throw new Error("Error al crear el stock");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async agregarStock(sucursalInsumo: SucursalInsumo): Promise<any> {
        try {
            const res = await fetch(`${API_URL}/${sucursalInsumo.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sucursalInsumo)
            });
            if (!res.ok) throw new Error("Error al agregar stock");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAll(): Promise<SucursalInsumo[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener insumos");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    async getStockBajo(idSucursal?: number | null): Promise<SucursalInsumo[]> {
        try {
            const sucursalId = idSucursal != null ? `?idSucursal=${idSucursal}` : "";
            const res = await fetch(`${API_URL}/stock-bajo${sucursalId}`);
            if (!res.ok) throw new Error("Error al obtener stock bajo");
            return await res.json();
        } catch (error) {
            console.error("Error en getStockBajo:", error);
            throw error;
        }
    }
    
    async getBySucursal(idSucursal: number): Promise<SucursalInsumo[]> {
        try {
            const res = await fetch(`${API_URL}/sucursal/${idSucursal}`);
            if (!res.ok) throw new Error("Error al obtener stock bajo");
            return await res.json();
        } catch (error) {
            console.error("Error en getStockBajo:", error);
            throw error;
        }
    }
}

export default new SucursalInsumoService();