import Promocion from "../models/Promocion";
import type Sucursal from "../models/Sucursal";

const API_URL = "http://localhost:8080/api/promocion";

class PromocionService {

    async getAll(): Promise<Promocion[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener insumos");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async delete(id: number): Promise<void> {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Error al eliminar la promocion");
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getById(id: number): Promise<Promocion> {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            if (!res.ok) throw new Error("Error al obtener insumo");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeEliminado(id: number): Promise<void> {
        try {
            const res = await fetch(`${API_URL}/darAlta/${id}`, {
                method: "PUT"
            });
            if (!res.ok) throw new Error("Error al dar de alta insumo");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async create(promocion: Promocion): Promise<Promocion> {
        try {
            const res = await fetch(`${API_URL}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(promocion)
            });
            if (!res.ok) throw new Error("Error al crear la promocion");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async consultarStockPromocion(promocion: Promocion, cantidad: number, sucursal: Sucursal): Promise<boolean> {
        try {
            const res = await fetch(`${API_URL}/verificar-stock/${cantidad}/${sucursal.id!}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(promocion)
            });
            if (!res.ok) throw new Error("Error al consultar la promocion");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async update(id: number, promocion: Promocion): Promise<Promocion> {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(promocion)
            });
            console.log(JSON.stringify(promocion))
            if (!res.ok) throw new Error("Error al actualizar la promocion");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getPromocionesFiltradas(
        filtros: {
            denominacion?: string;
            tipoPromocion?: "PROMOCION" | "HAPPYHOUR";
            activa?: boolean;
            eliminado?: boolean; // <-- agregado
            fechaHoraDesde?: string; // formato ISO
            fechaHoraHasta?: string;
            precioMin?: number;
            precioMax?: number;
            idSucursal?: number;
        },
        page: number = 0,
        size: number = 10,
        sort: string = "denominacion,asc"
    ): Promise<{ content: Promocion[]; totalPages: number }> {
        const params = new URLSearchParams();

        if (filtros.denominacion) params.append("denominacion", filtros.denominacion);
        if (filtros.tipoPromocion) params.append("tipoPromocion", filtros.tipoPromocion);
        if (filtros.activa !== undefined) params.append("activa", filtros.activa.toString());
        if (filtros.eliminado !== undefined) params.append("eliminado", filtros.eliminado.toString()); // <-- agregado
        if (filtros.fechaHoraDesde) params.append("fechaHoraDesde", filtros.fechaHoraDesde);
        if (filtros.fechaHoraHasta) params.append("fechaHoraHasta", filtros.fechaHoraHasta);
        if (filtros.precioMin !== undefined) params.append("precioMin", filtros.precioMin.toString());
        if (filtros.precioMax !== undefined) params.append("precioMax", filtros.precioMax.toString());
        if (filtros.idSucursal !== undefined) params.append("idSucursal", filtros.idSucursal.toString());

        params.append("page", page.toString());
        params.append("size", size.toString());
        if (sort) params.append("sort", sort);

        const response = await fetch(`${API_URL}/filtradas?${params.toString()}`);
        if (!response.ok) {
            throw new Error("Error al obtener promociones filtradas");
        }
        console.log("PromocionService params:", params.toString());

        return await response.json();
    }
}

export default new PromocionService();