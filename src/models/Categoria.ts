export default class Categoria {
    id?: number;
    denominacion: string = "";
    categoriaPadre?: Categoria;
    urlImagen?: string;
    eliminado!: boolean;
}