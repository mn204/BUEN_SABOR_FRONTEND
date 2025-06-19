import Articulo from "./Articulo";
import type Promocion from "./Promocion";

export default class DetallePedido {
    id?: number;
    cantidad: number = 0;
    subTotal: number = 0;
    articulo?: Articulo;
    promocion?: Promocion
    eliminado!: boolean;

}