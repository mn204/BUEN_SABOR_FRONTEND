export interface ProductoMasVendidoDTO {
    nombreProducto: string;
    cantidadVendida: number;
}

export interface ClienteFrecuenteDTO {
    clienteId: number;
    nombreCliente: string;
    cantidadPedidos: number;
}

export interface EstadisticaSucursalDTO {
    sucursalId: number;
    nombreSucursal: string;
    cantidadPedidos: number;
    totalVentas: number;
    gananciaNeta?: number;
    pedidosCancelados?: number;
    tiempoPromedioEntrega?: number;
}

export interface VentasPorDiaDTO {
    fecha: string;
    totalVentas: number;
}

export interface TicketPromedioDTO {
    sucursalId: number;
    nombreSucursal: string | null;
    totalVentas: number;
}

export interface PedidosPorDiaDTO {
    fecha: string;
    cantidadPedidos: number;
}

export interface PedidosPorTipoDTO {
    tipoPedido: string;
    cantidad: number;
}