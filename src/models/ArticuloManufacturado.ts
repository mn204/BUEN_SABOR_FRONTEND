import Articulo from "./Articulo";
import DetalleArticuloManufacturado from "./DetalleArticuloManufacturado";
export default class ArticuloManufacturado extends Articulo {
    descripcion: string = "";
    tiempoEstimadoMinutos: number = 0;
    preparacion: string = "";
    detalles: DetalleArticuloManufacturado[] = [];
}