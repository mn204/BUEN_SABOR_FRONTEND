import UnidadMedida from "../models/UnidadMedida";

const API_URL = "http://localhost:8080/api/unidadmedida";

class UnidadMedidaService {
    async getAll(): Promise<UnidadMedida[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener categorías");
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
            if (!res.ok) throw new Error("Error al eliminar la categoria");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default new UnidadMedidaService();