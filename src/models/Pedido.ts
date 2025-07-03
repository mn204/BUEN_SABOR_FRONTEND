import type Cliente from "./Cliente";
import type DetallePedido from "./DetallePedido";
import type Empleado from "./Empleado";
import type  Estado  from "./enums/Estado";
import type  FormaPago  from "./enums/FormaPago";
import type TipoEnvio  from "./enums/TipoEnvio";
import type Factura from "./Factura";
import type Sucursal from "./Sucursal";
import type Domicilio from "./Domicilio.ts";

export default class Pedido {
    id?: number;
    horaEstimadaFinalizacion: string = "";
    total: number = 0;
    totalCosto: number = 0;
    pagado: boolean = false;
    estado!: Estado;
    tipoEnvio!: TipoEnvio;
    formaPago!: FormaPago;
    fechaPedido: string = "";
    sucursal!: Sucursal;
    cliente?: Cliente;
    domicilio!: Domicilio;
    empleado?: Empleado;
    factura?: Factura;
    detalles: DetallePedido[] = [];
    eliminado!: boolean;
}