import DetallePromocion from "./DetallePromocion";
import type  TipoPromocion from "./enums/TipoPromocion";
import type ImagenPromocion from "./ImagenPromocion";
import type Sucursal from "./Sucursal";
export default class Promocion {
    id?: number;
    denominacion: string = "";
    fechaDesde: Date = new Date();
    fechaHasta: Date = new Date();
    horaDesde: string = "";
    horaHasta: string = "";
    descripcionDescuento: string = "";
    precioPromocional: number = 0;
    tipoPromocion!: TipoPromocion;
    imagenes: ImagenPromocion[] = [];
    detalles: DetallePromocion[] = [];
    activa: boolean = false;
    sucursales!: Sucursal[];
    eliminado!: boolean;
}