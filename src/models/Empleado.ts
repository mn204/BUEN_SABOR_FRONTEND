import Domicilio from "./Domicilio";
import type Sucursal from "./Sucursal.ts";
import  Usuario from "./Usuario.ts";

export default class Empleado {
    id?: number;
    nombre: string = "";
    apellido: string = "";
    telefono: string = "";
    fechaNacimiento: Date = new Date();
    dni: string = "";
    usuario!: Usuario;
    domicilio?: Domicilio;
    sucursal!: Sucursal
    eliminado!: boolean;
}