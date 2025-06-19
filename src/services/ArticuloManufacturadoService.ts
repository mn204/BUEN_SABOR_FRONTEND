import ArticuloManufacturado from "../models/ArticuloManufacturado";

const API_URL = "http://localhost:8080/api/productos";

class ArticuloManufacturadoService {
    async getAll(): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener productos");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAllNoElminados(): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener productos");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAllPaginated(params: URLSearchParams): Promise<{
        content: ArticuloManufacturado[];
        pageable: {
            pageNumber: number;
            pageSize: number;
        };
        totalPages: number;
        totalElements: number;
        first: boolean;
        last: boolean;
        size: number;
        number: number;
    }> {
        const response = await fetch(`${API_URL}/page?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Error al obtener los artículos manufacturados paginados');
        }
        return response.json();
    }

    async create(articulo: ArticuloManufacturado): Promise<ArticuloManufacturado> {
        try {
            const res = await fetch(`${API_URL}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articulo)
            });
            console.log(JSON.stringify(articulo));
            if (!res.ok) throw new Error("Error al crear artículo manufacturado");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    async update(id: number, articulo: ArticuloManufacturado): Promise<ArticuloManufacturado> {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articulo)
            });
            console.log(JSON.stringify(articulo))
            if (!res.ok) throw new Error("Error al actualizar artículo manufacturado");
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
            if (!res.ok) throw new Error("Error al eliminar artículo manufacturado");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getById(id: number): Promise<ArticuloManufacturado> {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            if (!res.ok) throw new Error("Error al obtener el artículo manufacturado");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async buscarPorDenominacion(denominacion: string): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}/buscar/denominacion?denominacion=${encodeURIComponent(denominacion)}`);
            if (!res.ok) throw new Error("Error al buscar por denominación");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async buscarPorCategoria(categoriaId: number): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}/buscar/categoria/${categoriaId}`);
            if (!res.ok) throw new Error("Error al buscar por categoría");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async buscarPorRangoPrecio(precioMin: number, precioMax: number): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}/buscar/precio?precioMin=${precioMin}&precioMax=${precioMax}`);
            if (!res.ok) throw new Error("Error al buscar por rango de precio");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async buscarPorTiempoMaximo(tiempoMaximo: number): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}/buscar/tiempo/${tiempoMaximo}`);
            if (!res.ok) throw new Error("Error al buscar por tiempo máximo");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async obtenerConIngredientes(): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}/con-ingredientes`);
            if (!res.ok) throw new Error("Error al obtener productos con ingredientes");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async obtenerPorCategoriaConIngredientes(categoriaId: number): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}/categoria/${categoriaId}/con-ingredientes`);
            if (!res.ok) throw new Error("Error al obtener productos por categoría con ingredientes");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async calcularCostoTotal(producto: ArticuloManufacturado): Promise<number> {
        try {
            const res = await fetch(`${API_URL}/calcular-costo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(producto)
            });
            if (!res.ok) throw new Error("Error al calcular costo total");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async obtenerActivosOrdenados(page: number = 0, size: number = 10): Promise<ArticuloManufacturado[]> {
        try {
            const res = await fetch(`${API_URL}/activos-ordenados?page=${page}&size=${size}`);
            if (!res.ok) throw new Error("Error al obtener productos activos ordenados");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async existePorDenominacion(denominacion: string): Promise<boolean> {
        try {
            const res = await fetch(`${API_URL}/existe/${encodeURIComponent(denominacion)}`);
            if (!res.ok) throw new Error("Error al verificar existencia por denominación");
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
            if (!res.ok) throw new Error("Error al dar de alta el articulo");
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default new ArticuloManufacturadoService();