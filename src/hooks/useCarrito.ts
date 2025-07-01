import { useContext } from 'react'
import { carritoContext } from '../context/CarritoContext'

export function useCarrito() {
  const ctx = useContext(carritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  return {
    pedido: ctx.pedidoActual, // <-- importante
    ...ctx
  };
}