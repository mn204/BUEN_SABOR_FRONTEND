import Articulo from "../models/Articulo";
import type Categoria from "../models/Categoria";

const API_URL = "http://localhost:8080/api/articulo-insumos";

class ArticuloService {
    async getAll(): Promise<Articulo[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener categorías");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async consultarStock(articulo: Articulo, sucursalId: number): Promise<boolean> {
        try {
            console.log("Enviando articulo:", articulo);
console.log("ID sucursal:", sucursalId);

            const res = await fetch(`${API_URL}/verificar-stock/${sucursalId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articulo)
            });
            if (!res.ok) throw new Error("Error al obtener categorías");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    async buscarPorIdCategoria(categoria: Categoria): Promise<Articulo[]> {
        try {
            const res = await fetch(`${API_URL}/categoria/${categoria.id}`, {
                method: "GET"
            });
            if (!res.ok) throw new Error("Error al obtener artículos");
            console.log(res)
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
            if (!res.ok) throw new Error("Error al eliminar la Articulo");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getById(id: number): Promise<Articulo> {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            if (!res.ok) throw new Error("Error al obtener el la Articulo");
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
            if (!res.ok) throw new Error("Error al crear la Articulo");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async update(id: number, articulo: Articulo): Promise<Articulo> {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articulo)
            });
            console.log(JSON.stringify(articulo))
            if (!res.ok) throw new Error("Error al actualizar la Articulo");
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
            if (!res.ok) throw new Error("Error al dar de alta la Articulo");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default new ArticuloService();