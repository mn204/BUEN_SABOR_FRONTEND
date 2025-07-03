import Pais from "../models/Pais";
import Provincia from "../models/Provincia";
import Localidad from "../models/Localidad";

const API_BASE = "http://localhost:8080/api";

export const obtenerPaises = async (): Promise<Pais[]> => {
    const res = await fetch(`${API_BASE}/pais`);
    return await res.json();
};

export const obtenerProvincias = async (): Promise<Provincia[]> => {
    const res = await fetch(`${API_BASE}/provincia`);
    return await res.json();
};

export const obtenerLocalidades = async (): Promise<Localidad[]> => {
    const res = await fetch(`${API_BASE}/localidad`);
    return await res.json();
};
