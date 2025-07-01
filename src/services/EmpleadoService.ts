import  Empleado  from "../models/Empleado";
import Usuario from "../models/Usuario.ts";

const API_URL = "http://localhost:8080/api/empleado";


export const registrarEmpleado = async (empleado: Empleado): Promise<Response> => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(empleado)
    });

    return response;
};

// Obtener todos los empleados
export const obtenerTodosLosEmpleados = async (): Promise<Empleado[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error("Error al obtener los empleados");
    }
    return await response.json();
};

// Obtener solo empleados que no están eliminados
export const obtenerEmpleadosNoEliminados = async (): Promise<Empleado[]> => {
    const response = await fetch(`${API_URL}/noEliminado`);
    if (!response.ok) {
        throw new Error("Error al obtener los empleados no eliminados");
    }
    return await response.json();
};

export const obtenerEmpleadoPorUsuarioId = async (usuarioId: number) => {
    const response = await fetch(`${API_URL}/usuario/${usuarioId}`);
    if (!response.ok) {
        throw new Error('Empleado no encontrado');
    }
    return response.json();
};

export const obtenerEmpleadoPorDni = async (dni: string): Promise<Empleado | null> => {
    try {
        const response = await fetch(`${API_URL}/dni/${dni}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Error al verificar DNI:", error);
        return null;
    }
};

// Obtener empleado por ID
export const obtenerEmpleadoPorId = async (id: number) => {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error('Empleado no encontrado');
    }
    return response.json();
};

// Actualizar empleado
export const actualizarEmpleado = async (id: number, empleado: Empleado): Promise<Empleado | null> => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(empleado),
        });

        if (!response.ok) {
            console.error("Error al actualizar el empleado:", response.statusText);
            return null;
        }

        const empleadoActualizado: Empleado = await response.json();
        return empleadoActualizado;
    } catch (error) {
        console.error("Error en la solicitud PUT:", error);
        return null;
    }
};

//eliminar empleado
export const eliminarEmpleado = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/eliminar/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Error al eliminar el empleado");
    }
}

//dar de alta empleado eliminado
export const darDeAltaEmpleado = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/darAltaEmpleado/${id}`, {
        method: "PUT",
    });
    if (!response.ok) {
        throw new Error("Error al dar de alta el empleado");
    }
}

// obtener empleados filtrados
export const getEmpleadosFiltrados = async (
    idSucursal: number | null,
    filtros: {
        busqueda?: string; // Cambiar de nombre y email separados a un solo campo búsqueda
        rol?: string;
        ordenar?: string;
        eliminado?: boolean;
    },
    page: number = 0,
    size: number = 10
): Promise<{ content: Empleado[]; totalPages: number; totalElements: number; number: number; size: number }> => {
    const params = new URLSearchParams();

    // Solo agregar idSucursal si no es null
    if (idSucursal !== null) {
        params.append("idSucursal", idSucursal.toString());
    }

    // Cambio clave: enviar búsqueda como nombre (el backend ya busca en nombre, apellido y email)
    if (filtros.busqueda) {
        params.append("nombre", filtros.busqueda);
    }

    if (filtros.rol) {
        params.append("rol", filtros.rol);
    }

    if (filtros.ordenar) {
        params.append("ordenar", filtros.ordenar);
    }

    // Solo agregar eliminado si está definido (no es undefined)
    if (filtros.eliminado !== undefined) {
        params.append("eliminado", filtros.eliminado.toString());
    }

    params.append("page", page.toString());
    params.append("size", size.toString());

    const response = await fetch(`${API_URL}/filtrados?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Error al obtener empleados filtrados");
    }
    return await response.json();
};