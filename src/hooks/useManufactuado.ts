import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ArticuloManufacturadoService from "../services/ArticuloManufacturadoService";
import DetalleArticuloManufacturado from "../models/DetalleArticuloManufacturado";
import ImagenArticulo from "../models/ImagenArticulo";

export function useManufacturado() {
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get("id");
  const [denominacion, setDenominacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tiempoEstimadoMinutos, setTiempoEstimadoMinutos] = useState(0);
  const [preparacion, setPreparacion] = useState("");
  const [unidad, setUnidad] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [detalles, setDetalles] = useState<DetalleArticuloManufacturado[]>([]);
  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenArticulo[]>([]);
  const [eliminado, setEliminado] = useState(false);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState(0);
  const [imagenes, setImagenes] = useState<File[]>([]);
  
  
  const limpiarFormulario = () => {
    setDenominacion("");
    setDescripcion("");
    setTiempoEstimadoMinutos(0);
    setPreparacion("");
    setCategoria("");
    setDetalles([]);
    setPorcentajeGanancia(0);
    setImagenes([]);
    setUnidad("");
  };
  useEffect(() => {
    if (idFromUrl) {
      ArticuloManufacturadoService.getById(Number(idFromUrl)).then(art => {
        setDenominacion(art.denominacion ?? "");
        setDescripcion(art.descripcion ?? "");
        setTiempoEstimadoMinutos(art.tiempoEstimadoMinutos ?? 0);
        setPreparacion(art.preparacion ?? "");
        setCategoria(art.categoria?.id?.toString() ?? "");
        setUnidad(art.unidadMedida?.id?.toString() ?? "");
        setDetalles(art.detalles ?? []);
        setImagenesExistentes(art.imagenes ?? []);
        setEliminado(art.eliminado ?? false);
        setPorcentajeGanancia(art.ganancia ?? 0)
      });
    }
  }, [idFromUrl]);

  const eliminarImagenExistente = (idx: number) => {
    setImagenesExistentes(prev =>
      prev.map((img, i) => (i === idx ? { ...img, eliminado: true } : img))
    );
  };

  const EliminarDetalle = (index: number) => {
    setDetalles(prev => prev.filter((_, i) => i !== index));
  };

  const eliminarImagenNueva = (idx: number) => {
    setImagenes(prev => prev.filter((_, i) => i !== idx));
  };

  const CambiarCantidadDetalle = (index: number, cantidad: number) => {
    setDetalles(prev =>
      prev.map((det, i) =>
        i === index ? { ...det, cantidad } : det
      )
    );
  };
  return {
    idFromUrl,
    denominacion, setDenominacion,
    descripcion, setDescripcion,
    tiempoEstimadoMinutos, setTiempoEstimadoMinutos,
    preparacion, setPreparacion,
    unidad, setUnidad,
    categoria, setCategoria,
    detalles, setDetalles,
    imagenesExistentes, setImagenesExistentes,
    eliminado, setEliminado,
    porcentajeGanancia, setPorcentajeGanancia,
    eliminarImagenExistente,
    imagenes, setImagenes,
    limpiarFormulario,
    EliminarDetalle, eliminarImagenNueva
    , CambiarCantidadDetalle
  };
}