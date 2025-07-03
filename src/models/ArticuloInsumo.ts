import Articulo from "./Articulo";
export default class ArticuloInsumo extends Articulo {
    precioCompra: number = 0;
    esParaElaborar!: boolean;
}