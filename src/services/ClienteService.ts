// src/service/clienteService.ts

import  Cliente  from "../models/Cliente"
const API_URL = "http://localhost:8080/api/cliente";


export const registrarCliente = async (cliente: Cliente): Promise<Response> => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cliente)
    });

    return response;
};

// Obtener todos los clientes
export const obtenerTodosLosClientes = async (): Promise<Cliente[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error("Error al obtener los clientes");
    }
    return await response.json();
};

// obtener clientes filtrados
export const getClientesFiltrados = async (
    filtros: {
        busqueda?: string; // Busca en nombre, apellido y email
        email?: string;    // Parámetro adicional para email específico
        ordenar?: string;  // "asc", "desc" para ordenar por nombre
        ordenarPorPedidos?: string; // "asc", "desc", "mas_pedidos", "menos_pedidos"
        eliminado?: boolean;
    },
    page: number = 0,
    size: number = 10
): Promise<{ content: Cliente[]; totalPages: number; totalElements: number; number: number; size: number }> => {
    const params = new URLSearchParams();

    if (filtros.busqueda) {
        params.append("busqueda", filtros.busqueda);
    }
    if (filtros.email) {
        params.append("email", filtros.email);
    }
    if (filtros.ordenar) {
        params.append("ordenar", filtros.ordenar);
    }
    // NUEVO: Parámetro para ordenar por cantidad de pedidos
    if (filtros.ordenarPorPedidos) {
        params.append("ordenarPorPedidos", filtros.ordenarPorPedidos);
    }
    // Solo agregar eliminado si está definido (no es undefined)
    if (filtros.eliminado !== undefined) {
        params.append("eliminado", filtros.eliminado.toString());
    }

    params.append("page", page.toString());
    params.append("size", size.toString());

    const response = await fetch(`${API_URL}/filtrados?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Error al obtener clientes filtrados");
    }
    return await response.json();
};


// Obtener solo clientes que no están eliminados
export const obtenerClientesNoEliminados = async (): Promise<Cliente[]> => {
    const response = await fetch(`${API_URL}/noEliminado`);
    if (!response.ok) {
        throw new Error("Error al obtener los clientes no eliminados");
    }
    return await response.json();
};
export const obtenerClientePorUsuarioId = async (usuarioId: number) => {
    const response = await fetch(`${API_URL}/usuario/${usuarioId}`);
    if (!response.ok) {
        throw new Error('Cliente no encontrado');
    }
    return response.json();
};

// Obtener cliente por ID
export const obtenerClientePorId = async (id: number) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error('Cliente no encontrado');
    }
    return response.json();
};

export const actualizarCliente = async (id: number, cliente: Cliente): Promise<Cliente | null> => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(cliente),
        });

        if (!response.ok) {
            console.error("Error al actualizar el cliente:", response.statusText);
            return null;
        }

        const clienteActualizado: Cliente = await response.json();
        return clienteActualizado;
    } catch (error) {
        console.error("Error en la solicitud PUT:", error);
        return null;
    }
};

//eliminar domicilios del cliente
export const eliminarDomiciliosCliente = async (idCliente: number, idDomicilio: number): Promise<void> => {
    const response = await fetch(`${API_URL}/${idCliente}/domicilio/${idDomicilio}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Error al eliminar el domicilio");
    }

}


// DELETE - Baja lógica del cliente
export const eliminarCliente = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/eliminar/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Error al eliminar el cliente");
    }
};

// PUT - Dar de alta a un cliente eliminado
export const darDeAltaCliente = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/darAltaCliente/${id}`, {
        method: "PUT",
    });
    if (!response.ok) {
        throw new Error("Error al dar de alta el cliente");
    }
};