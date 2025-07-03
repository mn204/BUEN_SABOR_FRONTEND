import dayjs from 'dayjs';
import {
    type ProductoMasVendidoDTO, type ClienteFrecuenteDTO, type EstadisticaSucursalDTO,
    type VentasPorDiaDTO, type TicketPromedioDTO,
    type PedidosPorDiaDTO, type PedidosPorTipoDTO
} from '../models/Estadisticas';


const API_URL = "http://localhost:8080/api/estadisticas";

function formatearFecha(fecha: Date): string {
    return dayjs(fecha).toISOString(); // ISO con zona UTC
}

export const EstadisticaService = {
    async obtenerResumenSucursales(desde: Date, hasta: Date): Promise<EstadisticaSucursalDTO[]> {
        const url = `${API_URL}/resumen-sucursales?desde=${formatearFecha(desde)}&hasta=${formatearFecha(hasta)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener resumen de sucursales');
        return res.json();
    },

    async obtenerProductosMasVendidosFiltrados(
        sucursalId: number | null,
        desde: Date,
        hasta: Date,
        top: number = 5
    ): Promise<ProductoMasVendidoDTO[]> {
        const params = new URLSearchParams({
            desde: formatearFecha(desde),
            hasta: formatearFecha(hasta),
            top: top.toString(),
        });

        // Solo agregar sucursalId si no es null
        if (sucursalId !== null) {
            params.append('sucursalId', sucursalId.toString());
        }

        const url = `${API_URL}/productos-mas-vendidos-filtrado?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener productos más vendidos');
        return res.json();
    },

    // Hacer lo mismo para los demás métodos
    async obtenerClientesFrecuentesFiltrados(
        sucursalId: number | null,
        desde: Date,
        hasta: Date,
        tipoPedido?: string,
        top: number = 5
    ): Promise<ClienteFrecuenteDTO[]> {
        const params = new URLSearchParams({
            desde: formatearFecha(desde),
            hasta: formatearFecha(hasta),
            top: top.toString(),
        });

        if (sucursalId !== null) {
            params.append('sucursalId', sucursalId.toString());
        }

        if (tipoPedido) {
            params.append('tipoPedido', tipoPedido);
        }

        const url = `${API_URL}/clientes-frecuentes-filtrado?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error al obtener clientes frecuentes');
        return res.json();
    },

    // Modificar los demás métodos de manera similar
    async obtenerVentasPorDia(sucursalId: number | null, desde: Date, hasta: Date): Promise<VentasPorDiaDTO[]> {
        const params = new URLSearchParams({
            desde: formatearFecha(desde),
            hasta: formatearFecha(hasta),
        });

        if (sucursalId !== null) {
            params.append('sucursalId', sucursalId.toString());
        }

        const res = await fetch(`${API_URL}/ventas-por-dia?${params.toString()}`);
        if (!res.ok) throw new Error("Error al obtener ventas por día");
        return res.json();
    },

    async obtenerTicketPromedio(sucursalId: number | null, desde: Date, hasta: Date): Promise<TicketPromedioDTO[]> {
        const params = new URLSearchParams({
            desde: formatearFecha(desde), // backend espera solo fecha
            hasta: formatearFecha(hasta),
        });

        if (sucursalId !== null) {
            params.append('sucursalId', sucursalId.toString());
        }

        const url = `${API_URL}/ticket-promedio?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error al obtener ticket promedio");
        return res.json();
    },

    async obtenerPedidosPorDia(sucursalId: number | null, desde: Date, hasta: Date): Promise<PedidosPorDiaDTO[]> {
        const params = new URLSearchParams({
            desde: formatearFecha(desde),
            hasta: formatearFecha(hasta),
        });

        if (sucursalId !== null) {
            params.append('sucursalId', sucursalId.toString());
        }

        const res = await fetch(`${API_URL}/pedidos-por-dia?${params.toString()}`);
        if (!res.ok) throw new Error("Error al obtener pedidos por día");
        return res.json();
    },

    async obtenerPedidosPorTipo(sucursalId: number | null, desde: Date, hasta: Date): Promise<PedidosPorTipoDTO[]> {
        const params = new URLSearchParams({
            desde: formatearFecha(desde),
            hasta: formatearFecha(hasta),
        });

        if (sucursalId !== null) {
            params.append('sucursalId', sucursalId.toString());
        }

        const res = await fetch(`${API_URL}/pedidos-por-tipo?${params.toString()}`);
        if (!res.ok) throw new Error("Error al obtener pedidos por tipo");
        return res.json();
    }

};
