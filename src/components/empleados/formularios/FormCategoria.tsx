import { useEffect, useState } from "react";
import type Categoria from "../../../models/Categoria";
import { useSearchParams } from "react-router-dom";
import categoriaService from "../../../services/CategoriaService";
import { Button } from "react-bootstrap";
import "../../../styles/Categoria.css";
import { subirACloudinary } from "../../../funciones/funciones";

function FormCategoria() {
    const [denominacion, setDenominacion] = useState("");
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [searchParams] = useSearchParams();
    const idFromUrl = searchParams.get("id");
    const [categoriaPadreId, setCategoriaPadreId] = useState<string>("");
    const [eliminado, setEliminado] = useState(false);
    const [imagen, setImagen] = useState<string>("");

    useEffect(() => {
        if (idFromUrl) {
            categoriaService.getById(Number(idFromUrl))
                .then(categoria => {
                    setDenominacion(categoria.denominacion);
                    setCategoriaPadreId(categoria.categoriaPadre?.id?.toString() || "");
                    setEliminado(!!categoria.eliminado);
                });
        }
    }, [idFromUrl]);

    useEffect(() => {
        categoriaService.getAll().then(setCategorias).catch(() => setCategorias([]));
    }, []);
    const handleImagenesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const archivo = e.target.files[0]; // tomamos solo el primero
            const url = await subirACloudinary(archivo);
            console.log(url)
            setImagen(url);
        }
    };

    const Guardar = async () => {
        const categoria: Categoria = {
            id: idFromUrl ? Number(idFromUrl) : undefined,
            denominacion,
            eliminado,
            categoriaPadre: categoriaPadreId
                ? categorias.find(cat => cat.id === Number(categoriaPadreId))
                : undefined,
            urlImagen: imagen
        };

        try {
            if (idFromUrl) {
                await categoriaService.update(Number(idFromUrl), categoria);
            } else {
                await categoriaService.create(categoria);
            }
            alert("Categoría guardada exitosamente");
            window.location.href = "/empleado/categorias"; // Redirige a la lista de categorías
        } catch (error) {
            console.error("Error al guardar la categoría:", error);
            alert("Error al guardar la categoría");
        }
    }

    return (
        <>
            <h2 className="mt-5">{idFromUrl ? "Actualizar" : "Crear"} Categoria</h2>
            <form className="formContainer container d-flex flex-column gap-3 text-start" onSubmit={e => e.preventDefault()}>
                <div>
                    <label>Denominación:</label>
                    <input className="form-control" value={denominacion} onChange={e => setDenominacion(e.target.value)} />
                </div>
                <div>
                    <label>Categoría:</label>
                    <select
                        value={categoriaPadreId}
                        onChange={e => setCategoriaPadreId(e.target.value)}
                    >
                        <option value="">Seleccione una opción</option>
                        {categorias
                            .filter(cat => !idFromUrl || cat.id !== Number(idFromUrl)) // Evita seleccionarse a sí misma
                            .map((cat: Categoria) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.denominacion}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label>Estado:</label>
                    <select
                        value={eliminado ? "eliminado" : "activo"}
                        onChange={e => setEliminado(e.target.value === "eliminado")}
                    >
                        <option value="activo">Activo</option>
                        <option value="eliminado">Eliminado</option>
                    </select>
                </div>
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImagenesChange}
                    className="form-control mt-2"
                />
                <Button
                    variant="success"
                    className="mt-3"
                    onClick={Guardar}
                    disabled={
                        !denominacion
                    }>
                    {idFromUrl ? "Actualizar" : "Crear"}
                </Button>
            </form>
        </>
    );
}

export default FormCategoria;