import ArticuloInsumo from "../models/ArticuloInsumo";

const API_URL = "http://localhost:8080/api/articulo";

class ArticuloInsumoService {
    async getAll(): Promise<ArticuloInsumo[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener insumos");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async filtrar(params: {
        denominacion?: string;
        categoriaId?: number | null;
        unidadMedidaId?: number | null;
        eliminado?: boolean | null;
        precioCompraMin?: number | null;
        precioCompraMax?: number | null;
        precioVentaMin?: number | null;
        precioVentaMax?: number | null;
        page?: number;
        size?: number;
        sort?: string; // ejemplo: "denominacion,asc"
    }): Promise<{
        content: ArticuloInsumo[];
        totalPages: number;
        totalElements: number;
        number: number;
        size: number;
    }> {
        const searchParams = new URLSearchParams();

        if (params.denominacion) searchParams.append("denominacion", params.denominacion);
        if (params.categoriaId != null) searchParams.append("categoriaId", params.categoriaId.toString());
        if (params.unidadMedidaId != null) searchParams.append("unidadMedidaId", params.unidadMedidaId.toString());
        if (params.eliminado != null) searchParams.append("eliminado", params.eliminado.toString());
        if (params.precioCompraMin != null) searchParams.append("precioCompraMin", params.precioCompraMin.toString());
        if (params.precioCompraMax != null) searchParams.append("precioCompraMax", params.precioCompraMax.toString());
        if (params.precioVentaMin != null) searchParams.append("precioVentaMin", params.precioVentaMin.toString());
        if (params.precioVentaMax != null) searchParams.append("precioVentaMax", params.precioVentaMax.toString());
        if (params.page != null) searchParams.append("page", params.page.toString());
        if (params.size != null) searchParams.append("size", params.size.toString());
        if (params.sort) searchParams.append("sort", params.sort);

        const response = await fetch(`${API_URL}/filtrados?${searchParams.toString()}`);
        if (!response.ok) {
            throw new Error('Error al filtrar los insumos');
        }
        return await response.json();
    }

    async getAllNoParaElaborar(): Promise<ArticuloInsumo[]> {
        try {
            const res = await fetch(`${API_URL}/no-para-elaborar`);
            if (!res.ok) throw new Error("Error al obtener insumos");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAllParaElaborar(): Promise<ArticuloInsumo[]> {
        try {
            const res = await fetch(`${API_URL}/para-elaborar`);
            if (!res.ok) throw new Error("Error al obtener insumos");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getAllPaginated(params: URLSearchParams): Promise<{
        content: ArticuloInsumo[];
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
            throw new Error('Error al obtener los insumos paginados');
        }
        return response.json();
    }

    async delete(id: number): Promise<Response> {
        return await fetch(`${API_URL}/baja-logica/${id}`, {
            method: "DELETE",
        });
    }

    async getById(id: number): Promise<ArticuloInsumo> {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            if (!res.ok) throw new Error("Error al obtener insumo");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    //Busqueda de Stock bajo
    async obtenerArticulosConStockBajo(idSucursal: number): Promise<ArticuloInsumo[]> {
        try {
            console.log(`${API_URL}`)
            const response = await fetch(`${API_URL}/stock-bajo/${idSucursal}`);
            if (!response.ok) {
                throw new Error("Error al obtener artículos con stock bajo.");
            }
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    async obtenerArticulosConStockBajo2(idSucursal: number | null): Promise<ArticuloInsumo[]> {
        try {
            console.log(`${API_URL}`);
            let url: string;

            if (idSucursal === null) {
                // Para todas las sucursales - sin query parameter
                url = `${API_URL}/stock-bajo`;
            } else {
                // Para una sucursal específica - con query parameter
                url = `${API_URL}/stock-bajo?idSucursal=${idSucursal}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Error al obtener artículos con stock bajo.");
            }
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async alta(id: number): Promise<Response> {
        return await fetch(`${API_URL}/alta-logica/${id}`, {
            method: "PUT",
        });
    }

    async create(articulo: any): Promise<any> {
        try {
            const res = await fetch(`${API_URL}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articulo)
            });
            console.log(JSON.stringify(articulo));
            if (!res.ok) throw new Error("Error al crear artículo insumo");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    async update(id: number, articulo: ArticuloInsumo): Promise<ArticuloInsumo> {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(articulo)
            });
            console.log(JSON.stringify(articulo))
            if (!res.ok) throw new Error("Error al actualizar artículo Insumo");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default new ArticuloInsumoService();