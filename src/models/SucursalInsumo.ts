import type ArticuloInsumo from "./ArticuloInsumo";
import type Sucursal from "./Sucursal";

export default class SucursalInsumo {
    id?: number;
    stockMinimo: number = 0;
    stockMaximo: number = 0;
    stockActual: number = 0;
    sucursal!: Sucursal;
    articuloInsumo!: ArticuloInsumo;
    eliminado!: boolean;
}