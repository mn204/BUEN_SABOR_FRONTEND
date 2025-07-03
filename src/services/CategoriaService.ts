import Categoria from "../models/Categoria";

const API_URL = "http://localhost:8080/api/categoria";

class CategoriaService {
    async getAll(): Promise<Categoria[]> {
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

    async getById(id: number): Promise<Categoria> {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            if (!res.ok) throw new Error("Error al obtener el la categoria");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getByDenominacion(denominacion: string): Promise<Categoria[]> {
        try {
            const res = await fetch(`${API_URL}/buscar?denominacion=${denominacion}`);
            if (!res.ok) throw new Error("Error al obtener el la categoria");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async create(articulo: any): Promise<any> {
        try {
            const res = await fetch(`${API_URL}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articulo)
            });
            console.log(JSON.stringify(articulo));
            if (!res.ok) throw new Error("Error al crear la categoria");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async update(id: number, articulo: Categoria): Promise<Categoria> {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articulo)
            });
            console.log(JSON.stringify(articulo))
            if (!res.ok) throw new Error("Error al actualizar la categoria");
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
            if (!res.ok) throw new Error("Error al dar de alta la categoria");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default new CategoriaService();