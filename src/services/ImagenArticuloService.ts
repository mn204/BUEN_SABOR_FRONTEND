const API_URL = "http://localhost:8080/api/imagenArticuloManu";

const ImagenArticuloService = {
  getAll: async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Error al obtener imágenes");
    return await res.json();
  },
  getById: async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("Error al obtener imagen");
    return await res.json();
  },
  create: async (data: any) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear imagen");
    return await res.json();
  },
  update: async (id: number, data: any) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar imagen");
    return await res.json();
  },
  delete: async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar imagen");
    return true;
  },
};

export default ImagenArticuloService;