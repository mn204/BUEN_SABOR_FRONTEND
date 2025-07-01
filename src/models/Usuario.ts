import Rol from "./enums/Rol";

export default class Usuario {
    id?: number;
    email: string = "";
    firebaseUid: string = "";
    rol: Rol = Rol.CLIENTE;
    providerId: string = "";
    photoUrl?: string = "";
    eliminado: boolean = false;
}
