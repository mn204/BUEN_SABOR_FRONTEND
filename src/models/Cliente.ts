import Usuario from "./Usuario";
import Domicilio from "./Domicilio";
export default class Cliente {
    id?: number;
    nombre: string = "";
    apellido: string = "";
    telefono: string = "";
    fechaNacimiento: Date = new Date();
    usuario!: Usuario;
    domicilios: Domicilio[] = [];
    eliminado!: boolean;
}