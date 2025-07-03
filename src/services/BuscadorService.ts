import Articulo from "../models/Articulo";
import ArticuloService from "./ArticuloService";

class BuscadorService {
    private static instance: BuscadorService;
    private baseUrl = "http://localhost:8080/api";

    private constructor() {}

    static getInstance(): BuscadorService {
        if (!BuscadorService.instance) {
            BuscadorService.instance = new BuscadorService();
        }
        return BuscadorService.instance;
    }

    /**
     * Busca productos para elaborar por denominación
     */
    async buscarProductosPorDenominacion(denominacion: string): Promise<Articulo[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/productos/buscar/denominacion?denominacion=${encodeURIComponent(denominacion)}`
            );

            if (response.ok) {
                return await response.json();
            }

            console.warn('Error al buscar productos para elaborar:', response.status);
            return [];
        } catch (error) {
            console.error('Error al buscar productos para elaborar:', error);
            return [];
        }
    }

    /**
     * Busca artículos no para elaborar por denominación (insumos como gaseosas, cervezas, aguas, etc.)
     */
    async buscarInsumosNoPairaElaborar(denominacion: string): Promise<Articulo[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/articulo/no-para-elaborar/denominacion?denominacion=${encodeURIComponent(denominacion)}`
            );

            if (response.ok) {
                return await response.json();
            }

            console.warn('Error al buscar insumos no para elaborar:', response.status);
            return [];
        } catch (error) {
            console.error('Error al buscar insumos no para elaborar:', error);
            return [];
        }
    }

    /**
     * Busca todos los artículos (productos para elaborar + insumos no para elaborar)
     */
    async buscarTodosLosArticulos(denominacion: string): Promise<Articulo[]> {
        try {
            const [productos, insumos] = await Promise.all([
                this.buscarProductosPorDenominacion(denominacion),
                this.buscarInsumosNoPairaElaborar(denominacion)
            ]);

            // Combinar resultados y eliminar duplicados por ID
            const todosLosArticulos = [...productos, ...insumos];
            const articulosUnicos = todosLosArticulos.filter((articulo, index, self) =>
                index === self.findIndex(a => a.id === articulo.id)
            );

            return articulosUnicos;
        } catch (error) {
            console.error('Error al buscar todos los artículos:', error);
            return [];
        }
    }

    /**
     * Busca artículos con límite para sugerencias (usado en el buscador)
     */
    async buscarArticulosParaSugerencias(denominacion: string, limite: number = 3, sucursalId: number): Promise<Articulo[]> {
        try {
            const articulos = await this.buscarTodosLosArticulos(denominacion);
            let articulosFiltrados = [];
            for (const articulo of articulos) {
                // Verificar si el artículo tiene stock en la sucursal
                const tieneStock = await ArticuloService.consultarStock(articulo, sucursalId);
                if (tieneStock) {
                    articulosFiltrados.push(articulo);
                }
            }
            return articulosFiltrados.slice(0, limite);
        } catch (error) {
            console.error('Error al buscar artículos para sugerencias:', error);
            return [];
        }
    }

    /**
     * Método auxiliar para verificar si hay resultados
     */
    async tieneResultados(denominacion: string): Promise<boolean> {
        const articulos = await this.buscarTodosLosArticulos(denominacion);
        return articulos.length > 0;
    }
}

export default BuscadorService;