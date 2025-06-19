import Promocion from "../models/Promocion";

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
            console.log(JSON.stringify(promocion));
            if (!res.ok) throw new Error("Error al crear artículo manufacturado");
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
            if (!res.ok) throw new Error("Error al actualizar artículo manufacturado");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    // ...existing code...

    async getAllFiltradas(
        idSucursal?: number | null,
        activa?: boolean,
        tipoPromocion?: string,
        fechaDesde?: Date,
        fechaHasta?: Date,
        page: number = 0,
        size: number = 10
    ): Promise<any> {
        try {
            let url = `${API_URL}/filtradas?page=${page}&size=${size}`;

            if (idSucursal !== undefined && idSucursal !== null) {
                url += `&idSucursal=${idSucursal}`;
            }
            if (activa !== undefined) {
                url += `&activa=${activa}`;
            }
            if (tipoPromocion) {
                url += `&tipoPromocion=${tipoPromocion}`;
            }
            if (fechaDesde) {
                url += `&fechaDesde=${fechaDesde.toISOString().split('T')[0]}`;
            }
            if (fechaHasta) {
                url += `&fechaHasta=${fechaHasta.toISOString().split('T')[0]}`;
            }

            const res = await fetch(url);
            if (!res.ok) throw new Error("Error al obtener promociones filtradas");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default new PromocionService();