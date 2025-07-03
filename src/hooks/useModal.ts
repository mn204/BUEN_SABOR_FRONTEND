import { useEffect, useState } from "react";
import ArticuloInsumo from "../models/ArticuloInsumo";
import ArticuloInsumoService from "../services/ArticuloInsumoService";
export function useModal(){
  const [showModal, setShowModal] = useState(false);
  const [articulosInsumo, setArticulosInsumo] = useState<ArticuloInsumo[]>([]);

  useEffect(() => {
    if (showModal) {
      ArticuloInsumoService.getAllParaElaborar().then(setArticulosInsumo);
    }
  }, [showModal]);
  return { showModal, setShowModal, articulosInsumo };
}