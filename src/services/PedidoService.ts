import type Empleado from "../models/Empleado";
import type Rol from "../models/enums/Rol";
import Pedido from "../models/Pedido";

const API_URL = "http://localhost:8080/api/pedidos";

class PedidoService {
    async getAll(): Promise<Pedido[]> {
        try {
            const res = await fetch(`${API_URL}`);
            if (!res.ok) throw new Error("Error al obtener productos");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    async getPedidosClienteCount(clienteId: number): Promise<number> {
        try {
            const res = await fetch(`${API_URL}/cliente/${clienteId}/count`);
            if (!res.ok) throw new Error("Error al obtener cantidad de pedidos del cliente");
            const count = await res.json(); // el backend devuelve un número
            return count;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    async consultarStock(pedido: Pedido) {
        try {
            const response = await fetch('http://localhost:8080/api/pedidos/verificar-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pedido)
            });

            const stockDisponible: boolean = await response.json();
            console.log(stockDisponible)
            return stockDisponible;
        } catch (error) {
            alert(error)
        }z

    }

    async create(pedido: Pedido): Promise<Pedido | null> {
        try {
            const res = await fetch(`${API_URL}/verificar-y-procesar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedido)
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Error del servidor:', errorText);

                switch (res.status) {
                    case 400:
                        // Error de validación o stock insuficiente
                        if (errorText.includes('Stock insuficiente')) {
                            alert(`Stock insuficiente: ${errorText}`);
                        } else if (errorText.includes('no encontrado')) {
                            alert(`Artículo no encontrado: ${errorText}`);
                        } else if (errorText.includes('no hay')) {
                            alert(`Problema de disponibilidad: ${errorText}`);
                        } else {
                            alert(`Error de validación: ${errorText}`);
                        }
                        break;
                    case 404:
                        alert("Recurso no encontrado. Verifique que el pedido sea válido.");
                        break;
                    case 500:
                        alert("Error interno del servidor. Intente nuevamente más tarde.");
                        break;
                    default:
                        alert(`Error del servidor (${res.status}): ${errorText}`);
                }
                return null;
            }

            // Verificar el tipo de respuesta
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Respuesta no es JSON:', contentType);
                alert("Respuesta inesperada del servidor.");
                return null;
            }

            const resultado = await res.json();

            // Si el resultado es un boolean true, significa que se procesó correctamente
            if (resultado === true) {
                try {
                    const ultimoPedidoRes = await fetch(`${API_URL}/ultimo/cliente/${pedido.cliente.id}`, {
                        method: "GET",
                        headers: { "Content-Type": "application/json" },
                    });

                    if (!ultimoPedidoRes.ok) {
                        const errorText = await ultimoPedidoRes.text();
                        console.error('Error al obtener último pedido:', errorText);

                        switch (ultimoPedidoRes.status) {
                            case 404:
                                alert("No se encontró el último pedido del cliente.");
                                break;
                            case 500:
                                alert("Error al recuperar el pedido guardado.");
                                break;
                            default:
                                alert(`Error al obtener pedido (${ultimoPedidoRes.status}): ${errorText}`);
                        }
                        return null;
                    }

                    const ultimoPedido: Pedido = await ultimoPedidoRes.json();
                    console.log(ultimoPedido)
                    if (ultimoPedido && ultimoPedido.id) {
                        alert(`Pedido guardado exitosamente con ID: ${ultimoPedido.id}`);
                        return ultimoPedido;
                    } else {
                        alert("Pedido procesado pero no se pudo obtener la información completa.");
                        return null;
                    }

                } catch (fetchError) {
                    console.error("Error al obtener último pedido:", fetchError);
                    alert("Pedido procesado pero ocurrió un error al recuperar la información.");
                    return null;
                }
            }
            // Si el resultado es un pedido completo
            else if (resultado && typeof resultado === 'object' && resultado.id) {
                alert(`Pedido guardado exitosamente con ID: ${resultado.id}`);
                return resultado as Pedido;
            }
            // Si el resultado es false o null
            else if (resultado === false) {
                alert("No se pudo procesar el pedido. Verifique los datos e intente nuevamente.");
                return null;
            }
            // Respuesta inesperada
            else {
                console.error('Respuesta inesperada:', resultado);
                alert("Respuesta inesperada del servidor.");
                return null;
            }

        } catch (networkError) {
            console.error("Error de red o conexión:", networkError);

            if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
                alert("Error de conexión. Verifique su conexión a internet e intente nuevamente.");
            } else if (networkError instanceof SyntaxError) {
                alert("Error al procesar la respuesta del servidor.");
            } else {
                alert("Error inesperado. Intente nuevamente.");
            }

            return null;
        }
    }
    async getPedidoPorId(idPedido: number): Promise<Pedido> {
        try {
            const res = await fetch(`${API_URL}/${idPedido}`);
            if (!res.ok) throw new Error("Error al obtener pedido");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    async getPedidosCliente(clienteId: number, filtros: any, page: number, size: number): Promise<{ content: Pedido[]; totalPages: number }> {
        const params = new URLSearchParams();

        if (filtros.sucursal) params.append("sucursal", filtros.sucursal);
        if (filtros.estado) params.append("estado", filtros.estado);
        if (filtros.desde) params.append("desde", filtros.desde);
        if (filtros.hasta) params.append("hasta", filtros.hasta);
        if (filtros.articulo) params.append("articulo", filtros.articulo);

        params.append("page", page.toString());
        params.append("size", size.toString());

        // FIX: Usar la misma base URL que los otros métodos
        const response = await fetch(`${API_URL}/cliente/${clienteId}?${params.toString()}`);
        if (!response.ok) {
            throw new Error("Error al obtener pedidos del cliente");
        }

        return await response.json();
    }

    async getDetallePedido(clienteId: number, pedidoId: number): Promise<Pedido> {
        const res = await fetch(`${API_URL}/cliente/${clienteId}/pedido/${pedidoId}`);
        if (!res.ok) throw new Error("Error al obtener detalle del pedido");
        return await res.json();
    }

    async descargarFactura(clienteId: number, pedidoId: number): Promise<Blob> {
        const res = await fetch(`${API_URL}/cliente/${clienteId}/pedido/${pedidoId}/factura`);
        if (!res.ok) throw new Error("Error al descargar la factura");
        return await res.blob();
    }

    async getPedidosFiltrados(
        idSucursal: number | null,
        filtros: {
            estado?: string;
            clienteNombre?: string;
            idPedido?: number;
            idEmpleado?: number;
            pagado?: boolean;
            fechaDesde?: string;
            fechaHasta?: string;
        },
        page: number = 0,
        size: number = 10
    ): Promise<{ content: Pedido[]; totalPages: number }> {
        const params = new URLSearchParams();

        if (idSucursal !== null) {
            params.append("idSucursal", idSucursal.toString());
        }
        if (filtros.estado) params.append("estado", filtros.estado);
        if (filtros.clienteNombre) params.append("clienteNombre", filtros.clienteNombre);
        if (filtros.idPedido !== undefined) params.append("idPedido", filtros.idPedido.toString());
        if (filtros.idEmpleado !== undefined) params.append("idEmpleado", filtros.idEmpleado.toString());
        if (filtros.pagado !== undefined) params.append("pagado", filtros.pagado.toString());
        if (filtros.fechaDesde) params.append("fechaDesde", filtros.fechaDesde);
        if (filtros.fechaHasta) params.append("fechaHasta", filtros.fechaHasta);

        params.append("page", page.toString());
        params.append("size", size.toString());
        params.append("sort", "fechaPedido,DESC"); // <-- Agrega el ordenamiento aquí

        const response = await fetch(`${API_URL}/filtrados?${params.toString()}`);
        if (!response.ok) {
            throw new Error("Error al obtener pedidos filtrados");
        }

        return await response.json();
    }

    async cambiarEstadoPedido(pedido: Pedido): Promise<void> {
        const response = await fetch(`${API_URL}/estado`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(pedido),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("Error al cambiar el estado del pedido: " + errorText);
        }
    }

    obtenerEmpleadosPorSucursalYRol = async (sucursalId: number, rol: Rol): Promise<Empleado[]> => {
        const response = await fetch(`http://localhost:8080/api/empleado/sucursal/${sucursalId}/rol/${rol}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error('Error al obtener empleados: ' + errorText);
        }
        return await response.json();
    }

    async agregarCincoMinutos(pedido: Pedido): Promise<void> {
        if (!pedido.horaEstimadaFinalizacion) {
            throw new Error("El pedido no tiene una hora estimada.");
        }

        // Convertimos la hora a un objeto Date
        const fecha = new Date(`1970-01-01T${pedido.horaEstimadaFinalizacion}`);

        // Sumamos 5 minutos
        fecha.setMinutes(fecha.getMinutes() + 5);

        // Convertimos de nuevo a string en formato HH:mm:ss
        const nuevaHora = fecha.toTimeString().split(" ")[0]; // HH:mm:ss

        // Creamos el nuevo objeto pedido con la hora modificada
        const pedidoActualizado = {
            ...pedido,
            horaEstimadaFinalizacion: nuevaHora
        };

        const response = await fetch(`${API_URL}/${pedido.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(pedidoActualizado),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("Error al actualizar el pedido: " + errorText);
        }
    }

    async marcarComoPagado(id: number): Promise<Pedido> {
        const response = await fetch(`${API_URL}/${id}/pagar`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error("Error al marcar como pagado: " + errorText);
        }
        return await response.json();
    }

    async exportarPedidos(pedidosSeleccionados: Pedido[]): Promise<Blob> {
        const response = await fetch(`${API_URL}/excel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(pedidosSeleccionados),
        });

        if (!response.ok) {
            throw new Error("Error al exportar pedidos");
        }

        const blob = await response.blob();
        return blob;
    }

    async exportarPedidosFiltrados(
        idSucursal: number | null,
        filtros: {
            estado?: string;
            clienteNombre?: string;
            idPedido?: number;
            idEmpleado?: number;
            pagado?: boolean;
            fechaDesde?: string;
            fechaHasta?: string;
        },
    ): Promise<Blob> {
        const params = new URLSearchParams();

        if (idSucursal !== null) params.append("idSucursal", idSucursal.toString());
        if (filtros.estado) params.append("estado", filtros.estado);
        if (filtros.clienteNombre) params.append("clienteNombre", filtros.clienteNombre);
        if (filtros.idPedido !== undefined) params.append("idPedido", filtros.idPedido.toString());
        if (filtros.idEmpleado !== undefined) params.append("idEmpleado", filtros.idEmpleado.toString());
        if (filtros.pagado !== undefined) params.append("pagado", filtros.pagado.toString());
        if (filtros.fechaDesde) params.append("fechaDesde", filtros.fechaDesde);
        if (filtros.fechaHasta) params.append("fechaHasta", filtros.fechaHasta);


        // Sin paginación: trae todos los pedidos filtrados
        const response = await fetch(`${API_URL}/filtrados/excel?${params.toString()}`);
        if (!response.ok) {
            throw new Error("Error al exportar pedidos filtrados");
        }
        return await response.blob();
    }
}

export default new PedidoService();