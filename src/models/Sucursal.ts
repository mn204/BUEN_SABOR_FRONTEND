import Empresa from "./Empresa";
import Domicilio from "./Domicilio";

export default class Sucursal {
    id?: number;
    nombre!: string;
    horarioApertura!: string;
    horarioCierre!: string;
    casaMatriz!: boolean;
    empresa!: Empresa;
    domicilio!: Domicilio;
    eliminado!: boolean;
}