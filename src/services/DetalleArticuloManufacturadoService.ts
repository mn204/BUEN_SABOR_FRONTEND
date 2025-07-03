import DetalleArticuloManufacturado from "../models/DetalleArticuloManufacturado";

const API_URL = "http://localhost:8080/api/detalleArticulo";

class DetalleArticuloManufacturadoService {
    async getAll(): Promise<DetalleArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener detalles");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getById(id: number): Promise<DetalleArticuloManufacturado> {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            if (!res.ok) throw new Error("Error al obtener detalle");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async create(detalle: DetalleArticuloManufacturado): Promise<DetalleArticuloManufacturado> {
        try {
            const res = await fetch(`${API_URL}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(detalle)
            });
            if (!res.ok) throw new Error("Error al crear detalle");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async update(id: number, detalle: DetalleArticuloManufacturado): Promise<DetalleArticuloManufacturado> {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(detalle)
            });
            if (!res.ok) throw new Error("Error al actualizar detalle");
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
            if (!res.ok) throw new Error("Error al eliminar detalle");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default new DetalleArticuloManufacturadoService();