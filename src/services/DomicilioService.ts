import Domicilio from "../models/Domicilio";

export const actualizarDomicilio = async (id: number, domicilio: Domicilio): Promise<Domicilio | null> => {
    try {
        const response = await fetch(`http://localhost:8080/api/domicilio/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(domicilio),
        });

        if (!response.ok) {
            console.error("Error al actualizar domicilio:", response.statusText);
            return null;
        }

        const data: Domicilio = await response.json();
        return data;
    } catch (error) {
        console.error("Error en la solicitud PUT:", error);
        return null;
    }
};


export const getDomicilioPorId = async (id: number): Promise<Domicilio | null> => {
    try {
        const response = await fetch(`http://localhost:8080/api/domicilio/${id}`);

        if (!response.ok) {
            console.error(`Error al obtener el domicilio con ID ${id}:`, response.statusText);
            return null;
        }

        const data: Domicilio = await response.json();
        return data;
    } catch (error) {
        console.error("Error en la solicitud GET:", error);
        return null;
    }
};
