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

    async getFiltrados(params: {
        idSucursal?: number | null,
        nombreInsumo?: string,
        stockActualMenorAStockMinimo?: boolean,
        stockActualMayorAStockMaximo?: boolean,
        page?: number,
        size?: number,
        sort?: string // ejemplo: "articuloInsumo.denominacion,asc"
    }): Promise<any> {
        try {
            const query = new URLSearchParams();
            if (params.idSucursal != null) query.append("idSucursal", params.idSucursal.toString());
            if (params.nombreInsumo) query.append("nombreInsumo", params.nombreInsumo);
            if (params.stockActualMenorAStockMinimo != null) query.append("stockActualMenorAStockMinimo", String(params.stockActualMenorAStockMinimo));
            if (params.stockActualMayorAStockMaximo != null) query.append("stockActualMayorAStockMaximo", String(params.stockActualMayorAStockMaximo));
            if (params.page != null) query.append("page", params.page.toString());
            if (params.size != null) query.append("size", params.size.toString());
            if (params.sort) query.append("sort", params.sort);

            const res = await fetch(`${API_URL}/filtrados?${query.toString()}`);
            if (!res.ok) throw new Error("Error al obtener stock filtrado");
            return await res.json();
        } catch (error) {
            console.error("Error en getFiltrados:", error);
            throw error;
        }
    }
}

export default new SucursalInsumoService();