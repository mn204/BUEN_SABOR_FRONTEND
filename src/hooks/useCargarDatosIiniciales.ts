import { useEffect, useState } from "react";
import UnidadMedidaService from "../services/UnidadMedidaService";
import CategoriaService from "../services/CategoriaService";
import  UnidadMedida  from "../models/UnidadMedida";
import  Categoria  from "../models/Categoria";
export function useCargaDatosIniciales(){
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    UnidadMedidaService.getAll().then(setUnidadesMedida).catch(() => setUnidadesMedida([]));
    CategoriaService.getAll().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  return { unidadesMedida, categorias };
}

