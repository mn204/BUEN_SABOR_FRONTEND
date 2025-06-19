import { useEffect, useState } from "react";
import ArticuloManufacturadoService from "../../../services/ArticuloManufacturadoService.ts";
import "../../../styles/ArticuloManufacturado.css";
import Button from "react-bootstrap/Button";
import ImagenArticulo from "../../../models/ImagenArticulo.ts";
import { subirACloudinary } from "../../../funciones/funciones.tsx";
import TipoPromocion from "../../../models/enums/TipoPromocion.ts";
import DetallePromocion from "../../../models/DetallePromocion.ts";
import type Articulo from "../../../models/Articulo.ts";
import Promocion from "../../../models/Promocion.ts";
import type ImagenPromocion from "../../../models/ImagenPromocion.ts";
import { useSearchParams } from "react-router-dom";
import PromocionService from "../../../services/PromocionService.ts";
import ModalAgregarArticulo from "../modales/ModalAgregarArticulo.tsx";
import ArticuloInsumoService from "../../../services/ArticuloInsumoService.ts";
import { useSucursal } from "../../../context/SucursalContextEmpleado.tsx";
import type Sucursal from "../../../models/Sucursal.ts";
import DetalleInsumosTable from "../grillas/DetalleInsumosTable.tsx";
import { Link } from "react-router-dom";
import DetalleArticulosTable from "../grillas/DetalleArticulosTable.tsx";

function FormPromocion() {
    const { sucursalActual } = useSucursal();
    const [showModal, setShowModal] = useState(false);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    const [porcentajeDescuento, setPorcentajeDescuento] = useState<number>(0);

    // Estados principales
    const [articuloSeleccionado, setArticuloSeleccionado] = useState<Articulo | null>(null);
    const [cantidadInsumo, setCantidadInsumo] = useState<number>(1);
    const [denominacion, setDenominacion] = useState<string>("");
    const [descripcion, setDescripcion] = useState<string>("");
    const [fechaDesde, setFechaDesde] = useState<Date>(new Date());
    const [fechaHasta, setFechaHasta] = useState<Date>(new Date());
    const [horaDesde, setHoraDesde] = useState<string>("");
    const [horaHasta, setHoraHasta] = useState<string>("");
    const [precio, setPrecio] = useState<number>(0);
    const [activa, setActiva] = useState<boolean>(true);
    const [tipo, setTipo] = useState<TipoPromocion>(TipoPromocion.PROMOCION);
    const [detalles, setDetalles] = useState<DetallePromocion[]>([]);
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [imagenesExistentes, setImagenesExistentes] = useState<ImagenPromocion[]>([]);
    const [searchParams] = useSearchParams();
    const idFromUrl = searchParams.get("id");

    useEffect(() => {
        if (showModal) {
            cargarArticulos();
        }
    }, [showModal]);

    const cargarArticulos = () => {
        ArticuloInsumoService.getAllNoParaElaborar().then(setArticulos);
        ArticuloManufacturadoService.getAll().then((art) => setArticulos(prev => [...prev, ...art]));
    }

    const limpiarFormulario = () => {
        setArticuloSeleccionado(null)
        setCantidadInsumo(0)
        setDenominacion("")
        setDescripcion("")
        setFechaDesde(new Date())
        setFechaHasta(new Date())
        setPrecio(0)
        setTipo(TipoPromocion.PROMOCION)
        setDetalles([])
        setImagenes([])
        setPorcentajeDescuento(0)
    }

    // Calcular el precio total de los artículos sin descuento
    const totalArticulos = detalles.reduce((acc, det) => {
        const precio = det.articulo?.precioVenta ?? 0;
        return acc + precio * det.cantidad;
    }, 0);

    // Calcular el precio con descuento aplicado
    const precioConDescuento = totalArticulos * (1 - porcentajeDescuento / 100);

    // Actualizar el precio cuando cambie el descuento o los artículos
    useEffect(() => {
        setPrecio(precioConDescuento);
    }, [precioConDescuento]);

    // Handlers
    const handleImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const nuevosArchivos = Array.from(e.target.files as FileList);

            // Filtra para evitar duplicados por nombre y tamaño
            const archivosFiltrados = nuevosArchivos.filter(nuevo =>
                !imagenes!.some(img => img.name === nuevo.name && img.size === nuevo.size)
            );

            if (archivosFiltrados.length < nuevosArchivos.length) {
                alert("Algunas imágenes ya fueron seleccionadas y no se agregarán de nuevo.");
            }

            setImagenes(prev => [...prev, ...archivosFiltrados]);
        }
    };

    const AgregarInsumo = () => {
        if (articuloSeleccionado) {
            setDetalles(prev => {
                const index = prev.findIndex(
                    det => det.articulo?.id === articuloSeleccionado.id
                );
                if (index !== -1) {
                    // Si ya existe, suma la cantidad
                    const nuevosDetalles = [...prev];
                    nuevosDetalles[index] = {
                        ...nuevosDetalles[index],
                        cantidad: nuevosDetalles[index].cantidad + cantidadInsumo,
                    };
                    return nuevosDetalles;
                } else {
                    // Si no existe, lo agrega
                    const detallePromocion = new DetallePromocion();
                    detallePromocion.cantidad = cantidadInsumo;
                    detallePromocion.articulo = articuloSeleccionado;
                    detallePromocion.eliminado = false;
                    return [
                        ...prev, detallePromocion
                    ];
                }
            });
            setShowModal(false);
            setArticuloSeleccionado(null);
            setCantidadInsumo(1);
            requestAnimationFrame(() => {
                const detallesSection = document.querySelector('.detalles-insumos-section');
                if (detallesSection) {
                    detallesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }
    };

    useEffect(() => {
        if (idFromUrl) {
            const fetchPromocion = async () => {
                try {
                    const promocion = await PromocionService.getById(Number(idFromUrl));
                    console.log(promocion);
                    setDenominacion(promocion.denominacion);
                    setDescripcion(promocion.descripcionDescuento);
                    setFechaDesde(new Date(promocion.fechaDesde));
                    setFechaHasta(new Date(promocion.fechaHasta));
                    setHoraDesde(promocion.horaDesde);
                    setHoraHasta(promocion.horaHasta);
                    setPrecio(promocion.precioPromocional);
                    setTipo(promocion.tipoPromocion);
                    setActiva(promocion.activa);
                    setDetalles(promocion.detalles || []);
                    setImagenesExistentes(promocion.imagenes || []);

                    // Calcular el porcentaje de descuento correctamente
                    const totalArticulosPromocion = promocion.detalles.reduce((acc, det) => {
                        return acc + (det.articulo.precioVenta * det.cantidad);
                    }, 0);

                    if (totalArticulosPromocion > 0) {
                        const descuentoCalculado = ((totalArticulosPromocion - promocion.precioPromocional) / totalArticulosPromocion) * 100;
                        setPorcentajeDescuento(Math.round(descuentoCalculado * 100) / 100); // Redondear a 2 decimales
                    }
                } catch (error) {
                    console.error("Error al cargar la promoción:", error);
                }
            };

            fetchPromocion();
        }
    }, [idFromUrl]);

    // Factoriza la creación del objeto promoción
    const buildPromocion = async (): Promise<Promocion | null> => {
        const promocion = new Promocion();
        promocion.denominacion = denominacion;
        promocion.descripcionDescuento = descripcion;
        promocion.fechaDesde = fechaDesde;
        promocion.fechaHasta = fechaHasta;
        promocion.horaDesde = horaDesde;
        promocion.horaHasta = horaHasta;
        promocion.precioPromocional = precio; // Usar el precio calculado con descuento
        promocion.tipoPromocion = tipo;
        promocion.activa = activa;
        setSucursales([...sucursales!, sucursalActual!])
        promocion.sucursales = [sucursalActual!];
        console.log(sucursalActual)
        promocion.detalles = detalles.map(det => ({
            id: det.id ?? undefined,
            cantidad: det.cantidad,
            articulo: det.articulo,
            eliminado: false,
        }));

        // 🔄 Subir imágenes nuevas a Cloudinary
        const nuevasImagenes = await Promise.all(
            imagenes.map(async (file) => {
                const url = await subirACloudinary(file);
                const imagen = new ImagenArticulo();
                imagen.denominacion = url; // Usamos URL en lugar de base64
                imagen.eliminado = false;
                return imagen;
            })
        );

        const imagenesNoEliminadas = imagenesExistentes.filter(img => !img.eliminado);

        promocion.imagenes = [
            ...imagenesNoEliminadas,
            ...nuevasImagenes,
        ];

        return promocion;
    };

    const guardarOModificar = async () => {
        try {
            const promocion = await buildPromocion();
            if (!promocion) return;
            console.log(promocion.detalles)
            if (idFromUrl) {
                await PromocionService.update(Number(idFromUrl), promocion);
                alert("Promocion actualizada correctamente");
            } else {
                await PromocionService.create(promocion);
                alert("Promocion creada correctamente");
            }
            limpiarFormulario();
            window.location.href = "/empleado/promociones";
        } catch (error) {
            console.error(error);
            alert("Error al guardar o actualizar la promocion");
        }
    };

    const EliminarDetalle = (index: number) => {
        setDetalles(prev => prev.filter((_, i) => i !== index));
    };

    const CambiarCantidadDetalle = (index: number, cantidad: number) => {
        setDetalles(prev =>
            prev.map((det, i) =>
                i === index ? { ...det, cantidad } : det
            )
        );
    };

    const eliminarImagenExistente = (idx: number) => {
        setImagenesExistentes(prev =>
            prev.map((img, i) => (i === idx ? { ...img, eliminado: true } : img))
        );
    };

    const eliminarImagenNueva = (idx: number) => {
        setImagenes(prev => prev.filter((_, i) => i !== idx));
    };

    // Manejar cambios manuales en el precio
    const handlePrecioChange = (nuevoPrecio: number) => {
        setPrecio(nuevoPrecio);
        // Recalcular el porcentaje de descuento basado en el nuevo precio
        if (totalArticulos > 0) {
            const nuevoDescuento = ((totalArticulos - nuevoPrecio) / totalArticulos) * 100;
            setPorcentajeDescuento(Math.max(0, Math.round(nuevoDescuento * 100) / 100));
        }
    };

    // Manejar cambios en el porcentaje de descuento
    const handleDescuentoChange = (nuevoDescuento: number) => {
        setPorcentajeDescuento(Math.max(0, Math.min(100, nuevoDescuento)));
        // El precio se actualizará automáticamente por el useEffect
    };

    const modalProps = {
        show: showModal,
        onHide: () => {
            setShowModal(false);
            setArticuloSeleccionado(null);
            setCantidadInsumo(1);
        },
        articulos: articulos,
        articuloSeleccionado: articuloSeleccionado,
        setArticuloSeleccionado: setArticuloSeleccionado,
        cantidadInsumo: cantidadInsumo,
        setCantidadInsumo: setCantidadInsumo,
        onAgregar: AgregarInsumo
    };

    const tableProps = {
        detalles: detalles,
        onEliminar: EliminarDetalle,
        onCantidadChange: CambiarCantidadDetalle,
        totalInsumos: totalArticulos
    };

    return (
        <div className="formArticuloManufacturado">
            <div className="d-flex align-items-center mb-4 position-relative">
                <h2
                    className="mb-0 position-absolute"
                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                >
                    {idFromUrl ? "Editar Promoción" : "Nueva Promoción"}
                </h2>
                <Link to="/empleado/promociones" className="btn btn-outline-secondary ms-auto">
                    Volver a Promociones
                </Link>
            </div>

            <div className="row">
                <div className="col-12">
                    <form className="d-flex flex-column gap-3 text-start" onSubmit={e => e.preventDefault()}>
                        {/* Denominación */}
                        <div className="d-flex flex-column">
                            <label>Denominación:</label>
                            <input
                                type="text"
                                onChange={e => setDenominacion(e.target.value)}
                                className="form-control"
                                required
                                value={denominacion}
                            />
                        </div>

                        {/* Descripción */}
                        <div className="d-flex flex-column">
                            <label>Descripción:</label>
                            <textarea
                                onChange={e => setDescripcion(e.target.value)}
                                className="form-control"
                                rows="3"
                                required
                                value={descripcion}
                            />
                        </div>

                        {/* Fechas */}
                        <div className="d-flex flex-column">
                            <label>Período de Vigencia:</label>
                            <div className="row">
                                <div className="col-md-6">
                                    <label className="form-label small">Fecha Desde:</label>
                                    <input
                                        type="date"
                                        name="fechaDesde"
                                        id="fechaDesde"
                                        className="form-control"
                                        value={fechaDesde.toISOString().split("T")[0]}
                                        onChange={(e) => setFechaDesde(new Date(e.target.value))}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small">Fecha Hasta:</label>
                                    <input
                                        type="date"
                                        name="fechaHasta"
                                        id="fechaHasta"
                                        className="form-control"
                                        value={fechaHasta.toISOString().split("T")[0]}
                                        onChange={(e) => setFechaHasta(new Date(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Horarios */}
                        <div className="d-flex flex-column">
                            <label>Horario de Aplicación:</label>
                            <div className="row">
                                <div className="col-md-6">
                                    <label className="form-label small">Hora Desde:</label>
                                    <input
                                        type="time"
                                        name="horaDesde"
                                        id="horaDesde"
                                        className="form-control"
                                        value={horaDesde}
                                        onChange={e => setHoraDesde(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label small">Hora Hasta:</label>
                                    <input
                                        type="time"
                                        name="horaHasta"
                                        id="horaHasta"
                                        className="form-control"
                                        value={horaHasta}
                                        onChange={e => setHoraHasta(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tipo de Promoción */}
                        <div className="d-flex flex-column">
                            <label>Tipo de Promoción:</label>
                            <select
                                name="tipo"
                                className="form-select"
                                value={tipo}
                                onChange={e => setTipo(e.target.value as TipoPromocion)}
                            >
                                <option value="PROMOCION">PROMOCIÓN</option>
                                <option value="HAPPYHOUR">HAPPY HOUR</option>
                            </select>
                        </div>

                        {/* Imágenes */}
                        <div className="d-flex flex-column">
                            <label>Imágenes:</label>

                            {/* Imágenes existentes */}
                            {imagenesExistentes.length > 0 && (
                                <div className="preview-imagenes mt-2 d-flex gap-2 flex-wrap">
                                    {imagenesExistentes.map((img, idx) =>
                                        !img.eliminado && (
                                            <div key={img.id || idx} style={{ position: "relative", display: "inline-block" }}>
                                                <img
                                                    src={img.denominacion}
                                                    alt={`img-existente-${idx}`}
                                                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarImagenExistente(idx)}
                                                    style={{
                                                        position: "absolute",
                                                        top: -5,
                                                        right: -5,
                                                        background: "red",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "50%",
                                                        width: 20,
                                                        height: 20,
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Imágenes nuevas */}
                            <div className="preview-imagenes mt-2 d-flex gap-2 flex-wrap">
                                {imagenes.map((img, idx) => (
                                    <div key={idx} style={{ position: "relative", display: "inline-block" }}>
                                        <img
                                            src={URL.createObjectURL(img)}
                                            alt={`preview-${idx}`}
                                            style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => eliminarImagenNueva(idx)}
                                            style={{
                                                position: "absolute",
                                                top: -5,
                                                right: -5,
                                                background: "red",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "50%",
                                                width: 20,
                                                height: 20,
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImagenesChange}
                                className="form-control mt-2"
                            />
                        </div>
                    </form>
                </div>
            </div>

            {/* Artículos de la promoción */}
            <div className="d-flex justify-content-center my-4">
                <Button
                    variant="primary"
                    onClick={() => setShowModal(true)}
                    size="lg"
                >
                    Agregar Articulo
                </Button>
            </div>
            <div className="detalles-insumos-section mt-4">
                <DetalleArticulosTable {...tableProps} />
            </div>

            {/* Resumen y botón guardar */}
            <div className="row justify-content-center mt-4">
                <div className="col-md-6">
                    <div className="card p-4">
                        <h5 className="text-center mb-3">Resumen de Promoción</h5>
                        <div className="d-flex justify-content-between mb-3">
                            <span className="fs-6">Tipo:</span>
                            <strong className="fs-6">{tipo === 'PROMOCION' ? 'Promoción' : 'Happy Hour'}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-3">
                            <span className="fs-6">Artículos incluidos:</span>
                            <strong className="fs-6">{detalles.length}</strong>
                        </div>
                        <div className="d-flex justify-content-between mb-3">
                            <span className="fs-6">Vigencia:</span>
                            <strong className="fs-6">
                                {fechaDesde.toLocaleDateString()} - {fechaHasta.toLocaleDateString()}
                            </strong>
                        </div>
                        {/* Control de descuento */}
                        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                            <span className="fs-6">% Descuento:</span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={porcentajeDescuento}
                                onChange={e => handleDescuentoChange(Number(e.target.value))}
                                className="form-control form-control-sm"
                                style={{ maxWidth: '100px' }}
                            />
                        </div>

                        {/* Control de precio final */}
                        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                            <span className="fs-5 fw-bold">Precio Final:</span>
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={precio}
                                onChange={e => handlePrecioChange(Number(e.target.value))}
                                className="form-control form-control-sm fw-bold"
                                style={{ maxWidth: '120px', fontSize: '1.1rem' }}
                            />
                        </div>
                        <Button
                            variant={idFromUrl ? "warning" : "success"}
                            className="w-100"
                            size="lg"
                            onClick={guardarOModificar}
                            disabled={
                                !denominacion ||
                                !descripcion ||
                                detalles.length === 0 ||
                                !precio ||
                                precio <= 0
                            }
                        >
                            {idFromUrl ? "Actualizar Promoción" : "Guardar Promoción"}
                        </Button>
                    </div>
                </div>
            </div>
            <ModalAgregarArticulo {...modalProps} />
        </div>
    );
}

export default FormPromocion;