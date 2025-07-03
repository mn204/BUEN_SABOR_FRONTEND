import { useEffect, useState } from "react";
import type Categoria from "../../../models/Categoria";
import { useSearchParams } from "react-router-dom";
import categoriaService from "../../../services/CategoriaService";
import { Button } from "react-bootstrap";
import "../../../styles/Categoria.css";
import { subirACloudinary } from "../../../funciones/funciones";
import ModalMensaje from "../modales/ModalMensaje";

function FormCategoria() {
    const [denominacion, setDenominacion] = useState("");
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [searchParams] = useSearchParams();
    const idFromUrl = searchParams.get("id");
    const [categoriaPadreId, setCategoriaPadreId] = useState<string>("");
    const [eliminado, setEliminado] = useState(false);
    
    // Estados para manejo de imagen (solo una)
    const [imagenExistente, setImagenExistente] = useState<string>("");
    const [eliminarImagenExistente, setEliminarImagenExistente] = useState(false);
    const [nuevaImagen, setNuevaImagen] = useState<File | null>(null);

    // Estados para el modal de mensaje
    const [showModalMensaje, setShowModalMensaje] = useState(false);
    const [mensajeModal, setMensajeModal] = useState("");
    const [tituloModal, setTituloModal] = useState("Mensaje");
    const [varianteModal, setVarianteModal] = useState<"primary" | "success" | "danger" | "warning" | "info" | "secondary">("primary");

    // Función para mostrar el modal de mensaje
    const mostrarMensaje = (mensaje: string, titulo = "Mensaje", variante: typeof varianteModal = "primary") => {
        setMensajeModal(mensaje);
        setTituloModal(titulo);
        setVarianteModal(variante);
        setShowModalMensaje(true);
    };

    useEffect(() => {
        if (idFromUrl) {
            categoriaService.getById(Number(idFromUrl))
                .then(categoria => {
                    setDenominacion(categoria.denominacion);
                    setCategoriaPadreId(categoria.categoriaPadre?.id?.toString() || "");
                    setEliminado(!!categoria.eliminado);
                    if (categoria.urlImagen) {
                        setImagenExistente(categoria.urlImagen);
                    }
                });
        }
    }, [idFromUrl]);

    useEffect(() => {
        categoriaService.getAll().then(setCategorias).catch(() => setCategorias([]));
    }, []);

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const archivo = e.target.files[0];
            setNuevaImagen(archivo);
            // Al seleccionar nueva imagen, marcar la existente como eliminada
            if (imagenExistente) {
                setEliminarImagenExistente(true);
            }
        }
    };

    const removerImagenExistente = () => {
        setEliminarImagenExistente(true);
    };

    const restaurarImagenExistente = () => {
        setEliminarImagenExistente(false);
        // Al restaurar la imagen existente, quitar la nueva imagen
        setNuevaImagen(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const removerNuevaImagen = () => {
        setNuevaImagen(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
        // Al remover la nueva imagen, restaurar la existente si había una
        if (imagenExistente) {
            setEliminarImagenExistente(false);
        }
    };

    const Guardar = async () => {
        let urlImagenFinal = "";

        // Lógica simplificada para una sola imagen
        if (nuevaImagen) {
            urlImagenFinal = await subirACloudinary(nuevaImagen);
        } else if (imagenExistente && !eliminarImagenExistente) {
            urlImagenFinal = imagenExistente;
        }

        const categoria: Categoria = {
            id: idFromUrl ? Number(idFromUrl) : undefined,
            denominacion,
            eliminado,
            categoriaPadre: categoriaPadreId
                ? categorias.find(cat => cat.id === Number(categoriaPadreId))
                : undefined,
            urlImagen: urlImagenFinal
        };

        try {
            if (idFromUrl) {
                await categoriaService.update(Number(idFromUrl), categoria);
            } else {
                await categoriaService.create(categoria);
            }
            mostrarMensaje("Categoría guardada exitosamente", "Éxito", "success");
            setTimeout(() => {
                window.location.href = "/empleado/categorias";
            }, 1200);
        } catch (error) {
            console.error("Error al guardar la categoría:", error);
            mostrarMensaje("Error al guardar la categoría", "Error", "danger");
        }
    }

    return (
        <>
            <h2 className="mt-5">{idFromUrl ? "Actualizar" : "Crear"} Categoria</h2>
            <form className="formContainer container d-flex flex-column gap-3 text-start" onSubmit={e => e.preventDefault()}>
                <div>
                    <label>Denominación:</label>
                    <input 
                        className="form-control" 
                        value={denominacion} 
                        onChange={e => setDenominacion(e.target.value)} 
                    />
                </div>
                
                <div>
                    <label>Categoría:</label>
                    <select
                        className="form-control"
                        value={categoriaPadreId}
                        onChange={e => setCategoriaPadreId(e.target.value)}
                    >
                        <option value="">Seleccione una opción</option>
                        {categorias
                            .filter(cat => !idFromUrl || cat.id !== Number(idFromUrl))
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
                        className="form-control"
                        value={eliminado ? "eliminado" : "activo"}
                        onChange={e => setEliminado(e.target.value === "eliminado")}
                    >
                        <option value="activo">Activo</option>
                        <option value="eliminado">Eliminado</option>
                    </select>
                </div>

                {/* Sección de imagen */}
                <div>
                    <label>Imagen:</label>
                    
                    {/* Imagen existente */}
                    {idFromUrl && imagenExistente && !eliminarImagenExistente && (
                        <div className="mb-3">
                            <h6>Imagen actual:</h6>
                            <div className="d-flex align-items-center gap-3">
                                <img 
                                    src={imagenExistente} 
                                    alt="Imagen actual" 
                                    style={{ 
                                        width: '100px', 
                                        height: '100px', 
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd'
                                    }} 
                                />
                                <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={removerImagenExistente}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Mensaje de imagen eliminada */}
                    {idFromUrl && imagenExistente && eliminarImagenExistente && (
                        <div className="mb-3">
                            <div className="alert alert-warning d-flex justify-content-between align-items-center">
                                <span>Imagen marcada para eliminación</span>
                                <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={restaurarImagenExistente}
                                >
                                    Restaurar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Input para nueva imagen */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImagenChange}
                        className="form-control"
                    />

                    {/* Vista previa de nueva imagen */}
                    {nuevaImagen && (
                        <div className="mt-3">
                            <h6>Nueva imagen:</h6>
                            <div className="d-flex align-items-center gap-3">
                                <img 
                                    src={URL.createObjectURL(nuevaImagen)} 
                                    alt="Nueva imagen" 
                                    style={{ 
                                        width: '100px', 
                                        height: '100px', 
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd'
                                    }} 
                                />
                                <div>
                                    <p className="mb-1 text-muted small">{nuevaImagen.name}</p>
                                    <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={removerNuevaImagen}
                                    >
                                        Remover
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    variant="success"
                    className="mt-4"
                    onClick={Guardar}
                    disabled={!denominacion}
                >
                    {idFromUrl ? "Actualizar" : "Crear"}
                </Button>
            </form>

            <ModalMensaje
                show={showModalMensaje}
                onHide={() => setShowModalMensaje(false)}
                mensaje={mensajeModal}
                titulo={tituloModal}
                variante={varianteModal}
            />
        </>
    );
}

export default FormCategoria;