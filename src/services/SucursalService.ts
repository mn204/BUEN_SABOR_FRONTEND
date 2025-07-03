import type Promocion from "../models/Promocion.ts";
import  Sucursal from "../models/Sucursal.ts";

const API_BASE = "http://localhost:8080/api/sucursal";

export const obtenerSucursales = async (): Promise<Sucursal[]> => {
    const res = await fetch(`${API_BASE}`);
    return await res.json();
};
class SucursalService {
    async getAllBySucursalId(id: number): Promise<Promocion[]> {
        console.log(id)
        try {
            const res = await fetch(`${API_BASE}/promociones/${id}`);
            if (!res.ok) throw new Error("Error al obtener insumo");
            return await res.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    // CREAR - Crear nueva sucursal
    async create(sucursal: Sucursal): Promise<Sucursal> {
        try {
            const res = await fetch(`${API_BASE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sucursal),
            });

            if (!res.ok) {
                throw new Error(`Error al crear sucursal: ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            console.error("Error al crear sucursal:", error);
            throw error;
        }
    }

    // OBTENER POR ID - Obtener sucursal por ID
    async getById(id: number): Promise<Sucursal> {
        try {
            const res = await fetch(`${API_BASE}/${id}`);

            if (!res.ok) {
                throw new Error(`Error al obtener sucursal: ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            console.error("Error al obtener sucursal:", error);
            throw error;
        }
    }

    // OBTENER TODAS - Obtener todas las sucursales
    async getAll(): Promise<Sucursal[]> {
        try {
            const res = await fetch(`${API_BASE}`);

            if (!res.ok) {
                throw new Error(`Error al obtener sucursales: ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            console.error("Error al obtener sucursales:", error);
            throw error;
        }
    }

    // OBTENER NO ELIMINADAS - Obtener sucursales no eliminadas
    async getAllNoEliminadas(): Promise<Sucursal[]> {
        try {
            const res = await fetch(`${API_BASE}/noEliminado`);

            if (!res.ok) {
                throw new Error(`Error al obtener sucursales activas: ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            console.error("Error al obtener sucursales activas:", error);
            throw error;
        }
    }

    // ACTUALIZAR - Actualizar sucursal existente
    async update(id: number, sucursal: Sucursal): Promise<Sucursal> {
        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sucursal),
            });

            if (!res.ok) {
                throw new Error(`Error al actualizar sucursal: ${res.status}`);
            }

            return await res.json();
        } catch (error) {
            console.error("Error al actualizar sucursal:", error);
            throw error;
        }
    }

    // DAR DE ALTA - Cambiar estado eliminado (dar de alta)
    async darDeAlta(id: number): Promise<void> {
        try {
            const res = await fetch(`${API_BASE}/darAlta/${id}`, {
                method: 'PUT',
            });

            if (!res.ok) {
                throw new Error(`Error al dar de alta sucursal: ${res.status}`);
            }
        } catch (error) {
            console.error("Error al dar de alta sucursal:", error);
            throw error;
        }
    }

    // ELIMINAR - Eliminación lógica
    async eliminar(id: number): Promise<void> {
        try {
            const res = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error(`Error al eliminar sucursal: ${res.status}`);
            }
        } catch (error) {
            console.error("Error al eliminar sucursal:", error);
            throw error;
        }
    }


}
export default new SucursalService();
    