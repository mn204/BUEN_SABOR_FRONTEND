import ImagenArticulo from "./ImagenArticulo";
import UnidadMedida from "./UnidadMedida";
import Categoria from "./Categoria";
import type TipoArticulo from "./enums/TipoArticulo";

export default class Articulo {
    id?: number;
    denominacion: string = "";
    precioVenta?: number | null;
    imagenes: ImagenArticulo[] = [];
    unidadMedida!: UnidadMedida;
    categoria!: Categoria;
    tipoArticulo!: TipoArticulo;
    eliminado!: boolean;
}