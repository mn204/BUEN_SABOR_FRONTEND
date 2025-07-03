import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Articulo from "../models/Articulo";
import Pedido from "../models/Pedido";
import PedidoDetalle from "../models/DetallePedido";
import PedidoService from "../services/PedidoService";
import Estado from "../models/enums/Estado";
import type Domicilio from "../models/Domicilio";
import Promocion from "../models/Promocion";
import ArticuloManufacturadoService from "../services/ArticuloManufacturadoService";
import TipoEnvio from "../models/enums/TipoEnvio";

interface CarritoContextProps {
  pedido: Pedido;
  preferenceId: string;
  agregarAlCarrito: (articulo: Articulo, cantidad: number) => void;
  agregarPromocionAlCarrito: (promocion: Promocion) => void;
  quitarPromocionCompleta: (promocionId: number) => void;
  quitarDelCarrito: (idArticulo: number) => void;
  restarDelCarrito: (idArticulo: number) => void;
  limpiarCarrito: () => void;
  enviarPedido: () => Promise<Pedido | null | undefined>;
  AgregarPreferenceId: (id: string) => void;
  guardarPedidoYObtener: () => Promise<Pedido | null>;
  limpiarPreferenceId: () => void;
  // Función mejorada para manejar cambio de sucursal
  cambiarSucursal: (nuevaSucursalId: number, promocionesDisponibles: Promocion[]) => Promise<{
    promocionesEliminadas: Promocion[],
    promocionesRestauradas: Promocion[],
    mensaje: string
  }>;
}

// Interfaz para guardar promociones por sucursal
interface PromocionPorSucursal {
  sucursalId: number;
  promociones: Array<{
    promocion: Promocion;
    cantidad: number;
    subTotal: number;
  }>;
}

export const carritoContext = createContext<CarritoContextProps | undefined>(undefined);

export function CarritoProvider({ children }: { children: ReactNode }) {
  // Estado para guardar promociones por sucursal
  const [promocionesPorSucursal, setPromocionesPorSucursal] = useState<PromocionPorSucursal[]>(() => {
    const guardadas = localStorage.getItem("promocionesPorSucursal");
    return guardadas ? JSON.parse(guardadas) : [];
  });
  // Agregar después de la línea de promocionesPorSucursal
  const [showModalCambioSucursal, setShowModalCambioSucursal] = useState(false);
  const [datosModalCambioSucursal, setDatosModalCambioSucursal] = useState<{
    promocionesEliminadas: Promocion[],
    promocionesRestauradas: Promocion[],
    mensaje: string
  }>({
    promocionesEliminadas: [],
    promocionesRestauradas: [],
    mensaje: ""
  });

  const [pedido, setPedido] = useState<Pedido>(() => {
    const pedidoGuardado = localStorage.getItem("carritoPedido");
    if (pedidoGuardado) {
      const json = JSON.parse(pedidoGuardado);
      const pedido = Object.assign(new Pedido(), json);
      pedido.detalles = (json.detalles || []).map((detalle: any) =>
        Object.assign(new PedidoDetalle(), {
          ...detalle,
          articulo: detalle.articulo ? Object.assign(new Articulo(), detalle.articulo) : null,
          promocion: detalle.promocion ? Object.assign(new Promocion(), detalle.promocion) : null,
        })
      );
      return pedido;
    }

    const nuevoPedido = new Pedido();
    nuevoPedido.detalles = [];
    nuevoPedido.total = 0;
    nuevoPedido.estado = Estado.PENDIENTE;
    return nuevoPedido;
  });

  const [preferenceId, setIdPreference] = useState<string>("");

  // Guardar promociones por sucursal en localStorage
  useEffect(() => {
    localStorage.setItem("promocionesPorSucursal", JSON.stringify(promocionesPorSucursal));
  }, [promocionesPorSucursal]);

  const AgregarPreferenceId = (id: string) => {
    setIdPreference(id);
  };

  // Función para guardar promociones de la sucursal actual
  const guardarPromocionesSucursalActual = (sucursalId: number) => {
    const promocionesActuales = pedido.detalles.filter(detalle => detalle.promocion);

    if (promocionesActuales.length > 0) {
      setPromocionesPorSucursal(prev => {
        const nuevasPromociones = prev.filter(p => p.sucursalId !== sucursalId);
        console.log(`Guardando ${promocionesActuales.length} promociones para sucursal ${sucursalId}`);
        return [...nuevasPromociones, {
          sucursalId,
          promociones: promocionesActuales.map(detalle => ({
            promocion: detalle.promocion!,
            cantidad: detalle.cantidad,
            subTotal: detalle.subTotal
          }))
        }];
      });
    } else {
      // Si no hay promociones actuales, limpiar las guardadas para esta sucursal
      setPromocionesPorSucursal(prev => prev.filter(p => p.sucursalId !== sucursalId));
    }
  };

  // Función principal para manejar cambio de sucursal
  const cambiarSucursal = async (nuevaSucursalId: number, promocionesDisponibles: Promocion[]) => {
    const sucursalActualId = pedido.sucursal?.id;

    // Validar que realmente estamos cambiando de sucursal
    if (sucursalActualId === nuevaSucursalId) {
      return {
        promocionesEliminadas: [],
        promocionesRestauradas: [],
        mensaje: ""
      };
    }

    console.log(`Cambiando de sucursal ${sucursalActualId} a ${nuevaSucursalId}`);

    // Guardar promociones de la sucursal actual si existe
    if (sucursalActualId) {
      guardarPromocionesSucursalActual(sucursalActualId);
    }

    // Obtener promociones actuales en el carrito
    const promocionesEnCarrito = pedido.detalles.filter(detalle => detalle.promocion);
    const promocionesEliminadas: Promocion[] = [];

    // Eliminar promociones no disponibles en la nueva sucursal
    promocionesEnCarrito.forEach(detalle => {
      const promocionDisponible = promocionesDisponibles.find(
        promo => promo.id === detalle.promocion?.id
      );

      if (!promocionDisponible) {
        promocionesEliminadas.push(detalle.promocion!);
        quitarPromocionCompleta(detalle.promocion!.id!);
      }
    });

    // Buscar promociones guardadas de la nueva sucursal
    const promocionesGuardadas = promocionesPorSucursal.find(
      p => p.sucursalId === nuevaSucursalId
    );

    const promocionesRestauradas: Promocion[] = [];

    // Restaurar promociones de la nueva sucursal si existen y están disponibles
    if (promocionesGuardadas) {
      console.log(`Encontradas ${promocionesGuardadas.promociones.length} promociones guardadas para sucursal ${nuevaSucursalId}`);

      for (const promoGuardada of promocionesGuardadas.promociones) {
        const promocionDisponible = promocionesDisponibles.find(
          promo => promo.id === promoGuardada.promocion.id
        );

        if (promocionDisponible) {
          // Verificar que la promoción no esté ya en el carrito
          const yaEnCarrito = pedido.detalles.find(
            detalle => detalle.promocion?.id === promocionDisponible.id
          );

          if (!yaEnCarrito) {
            // Restaurar la promoción con la cantidad guardada
            for (let i = 0; i < promoGuardada.cantidad; i++) {
              agregarPromocionAlCarrito(promocionDisponible);
            }
            promocionesRestauradas.push(promocionDisponible);
            console.log(`Restaurada promoción ${promocionDisponible.id} con cantidad ${promoGuardada.cantidad}`);
          }
        }
      }
    }

    // Generar mensaje informativo
    let mensaje = "";
    if (promocionesEliminadas.length > 0 && promocionesRestauradas.length > 0) {
      mensaje = `Se eliminaron ${promocionesEliminadas.length} promoción(es) no disponible(s) en esta sucursal y se restauraron ${promocionesRestauradas.length} promoción(es) anterior(es).`;
    } else if (promocionesEliminadas.length > 0) {
      mensaje = `Se eliminaron ${promocionesEliminadas.length} promoción(es) no disponible(s) en esta sucursal.`;
    } else if (promocionesRestauradas.length > 0) {
      mensaje = `Se restauraron ${promocionesRestauradas.length} promoción(es) anterior(es) de esta sucursal.`;
    }

    // Crear el objeto resultado
    const resultado = {
      promocionesEliminadas,
      promocionesRestauradas,
      mensaje
    };

    // Si hay cambios, mostrar el modal
    if (promocionesEliminadas.length > 0 || promocionesRestauradas.length > 0) {
      setDatosModalCambioSucursal(resultado);
      setShowModalCambioSucursal(true);
    }

    return resultado;
  };

  const cerrarModalCambioSucursal = () => {
    setShowModalCambioSucursal(false);
    setDatosModalCambioSucursal({
      promocionesEliminadas: [],
      promocionesRestauradas: [],
      mensaje: ""
    });
  };
  const agregarAlCarrito = (articulo: Articulo, cantidad: number) => {
    if (!articulo.id) {
      console.warn("El artículo no tiene ID");
      return;
    }

    setPedido((prevPedido) => {
      const detallesExistente = prevPedido.detalles.find(
        (d) => d.articulo && d.articulo.id === articulo.id
      );

      let nuevosdetalles: PedidoDetalle[];
      if (detallesExistente) {
        nuevosdetalles = prevPedido.detalles.map((d) => {
          if (d.articulo && d.articulo.id === articulo.id && !d.promocion) {
            const nuevaCantidad = d.cantidad + cantidad;
            return {
              ...d,
              cantidad: nuevaCantidad,
              subTotal: articulo.precioVenta! * nuevaCantidad,
            };
          }
          return d;
        });
      } else {
        const nuevoDetalles = new PedidoDetalle();
        nuevoDetalles.articulo = articulo;
        nuevoDetalles.cantidad = cantidad;
        nuevoDetalles.subTotal = articulo.precioVenta! * cantidad;
        nuevosdetalles = [...prevPedido.detalles, nuevoDetalles];
      }

      const nuevoTotal = nuevosdetalles.reduce((acc, d) => acc + d.subTotal, 0);
      return { ...prevPedido, detalles: nuevosdetalles, total: nuevoTotal };
    });
  };

  const agregarPromocionAlCarrito = (promocion: Promocion) => {
    if (!promocion.id) {
      console.warn("La promoción no tiene ID");
      return;
    }
    setPedido((prevPedido) => {
      const detallesExistente = prevPedido.detalles.find(
        (d) => d.promocion?.id === promocion.id
      );

      let nuevosdetalles: PedidoDetalle[];
      if (detallesExistente) {
        nuevosdetalles = prevPedido.detalles.map((d) => {
          if (d.promocion?.id === promocion.id) {
            const nuevaCantidad = d.cantidad + 1;
            return {
              ...d,
              cantidad: nuevaCantidad,
              subTotal: promocion.precioPromocional * nuevaCantidad,
            };
          }
          return d;
        });
      } else {
        const nuevoDetalles = new PedidoDetalle();
        nuevoDetalles.promocion = promocion;
        nuevoDetalles.cantidad = 1;
        nuevoDetalles.subTotal = promocion.precioPromocional;
        nuevosdetalles = [...prevPedido.detalles, nuevoDetalles];
      }

      const nuevoTotal = nuevosdetalles.reduce((acc, d) => acc + d.subTotal, 0);
      return { ...prevPedido, detalles: nuevosdetalles, total: nuevoTotal };
    });
  };

  const quitarPromocionCompleta = (promocionId: number) => {
    if (!promocionId) {
      console.warn("La promoción no tiene ID");
      return;
    }
    setPedido((prevPedido) => {
      const nuevosdetalles = prevPedido.detalles.filter(
        (d) => !(d.promocion?.id === promocionId)
      );
      const nuevoTotal = nuevosdetalles.reduce((acc, d) => acc + d.subTotal, 0);
      return { ...prevPedido, detalles: nuevosdetalles, total: nuevoTotal };
    });
  };

  const obtenerFechaArgentina = () => {
    const ahora = new Date();
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const fechaString = formatter.format(ahora).replace(' ', 'T');
    const fecha = new Date(fechaString);
    fecha.setHours(fecha.getHours() - 3);
    return fecha.toISOString().slice(0, 19);
  };

  useEffect(() => {
    localStorage.setItem("carritoPedido", JSON.stringify(pedido));
  }, [pedido]);

  const obtenerHoraArgentina = () => {
    const fechaArgentina = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    return fechaArgentina.toTimeString().split(' ')[0];
  };

  const restarDelCarrito = (idArticulo: number) => {
    if (!idArticulo) {
      console.warn("El artículo no tiene ID");
      return;
    }
    setPedido((prevPedido) => {
      const nuevosdetalles = prevPedido.detalles
        .map((d) => {
          // Solo afectar artículos SIN promoción
          if (d.articulo && d.articulo.id && d.articulo!.id === idArticulo && !d.promocion) {
            const nuevaCantidad = d.cantidad - 1;
            if (nuevaCantidad <= 0) return null;
            return {
              ...d,
              cantidad: nuevaCantidad,
              subTotal: nuevaCantidad * d.articulo!.precioVenta!,
            };
          } else if (d.promocion?.id === idArticulo) {
            const nuevaCantidad = d.cantidad - 1;
            if (nuevaCantidad <= 0) return null;
            return {
              ...d,
              cantidad: nuevaCantidad,
              subTotal: nuevaCantidad * d.promocion.precioPromocional,
            };
          }
          return d;
        })
        .filter((d): d is PedidoDetalle => d !== null);

      const nuevoTotal = nuevosdetalles.reduce((acc, d) => acc + d.subTotal, 0);
      return { ...prevPedido, detalles: nuevosdetalles, total: nuevoTotal };
    });
  };

  const limpiarPreferenceId = () => {
    setIdPreference(undefined as any);
  };

  const quitarDelCarrito = (idArticulo: number) => {
    if (!idArticulo) {
      console.warn("El artículo no tiene ID");
      return;
    }
    setPedido((prevPedido) => {
      const nuevosdetalles = prevPedido.detalles.filter(
        (d) => !(d.articulo && d.articulo.id && d.articulo.id === idArticulo && !d.promocion)
      );
      const nuevoTotal = nuevosdetalles.reduce((acc, d) => acc + d.subTotal, 0);
      return { ...prevPedido, detalles: nuevosdetalles, total: nuevoTotal };
    });
  };

  const limpiarCarrito = () => {
    const nuevoPedido = new Pedido();
    nuevoPedido.fechaPedido = "";
    nuevoPedido.detalles = [];
    nuevoPedido.total = 0;
    setPedido(nuevoPedido);
    localStorage.removeItem("carritoPedido");
    localStorage.removeItem("promocionesPorSucursal");
    setPromocionesPorSucursal([]);
    setIdPreference("");
  };

  const enviarPedido = async () => {
    if (pedido.detalles.length === 0) {
      alert("El carrito está vacío. No se puede enviar el pedido.");
      return;
    }

    try {
      pedido.horaEstimadaFinalizacion = obtenerHoraArgentina();
      if (pedido.domicilio == null) {
        pedido.domicilio = { id: 6 } as Domicilio
      }
      const res = PedidoService.create(pedido)
      return res
    } catch (error) {
      console.error(error);
      alert("Hubo un error al enviar el pedido.");
    }
  };

  const guardarPedidoYObtener = async (): Promise<Pedido | null> => {
    if (pedido.detalles.length === 0) {
      alert("El carrito está vacío. No se puede guardar el pedido.");
      return null;
    }

    try {
      const calcularTiempoPreparacion = async (pedido: Pedido): Promise<number> => {
        let tiempoTotalMinutos = 0;
        if (pedido.tipoEnvio === TipoEnvio.DELIVERY) {
          tiempoTotalMinutos += 15;
        }

        // Mapa para acumular cantidades por artículo manufacturado
        const articulosCantidad: Record<number, number> = {};

        if (pedido.detalles) {
          for (const det of pedido.detalles) {
            if (det.articulo) {
              const id = det.articulo.id!;
              articulosCantidad[id] = (articulosCantidad[id] || 0) + det.cantidad;
            }
            if (det.promocion) {
              for (const deta of det.promocion.detalles) {
                if (deta.articulo) {
                  const id = deta.articulo.id!;
                  // Multiplica por la cantidad de la promoción
                  articulosCantidad[id] = (articulosCantidad[id] || 0) + (det.cantidad * (deta.cantidad || 1));
                }
              }
            }
          }
        }

        // Sumar tiempos estimados de preparación por artículo, sumando la cantidad
        for (const idStr in articulosCantidad) {
          const id = Number(idStr);
          try {
            const prod = await ArticuloManufacturadoService.getById(id);
            const tiempo = (prod.tiempoEstimadoMinutos ?? 0) + articulosCantidad[id];
            tiempoTotalMinutos += tiempo;
          } catch (error) {
            console.error("Error al obtener artículo manufacturado:", error);
          }
        }

        return tiempoTotalMinutos;
      };

      const obtenerHoraFinalizacion = async (pedido: Pedido): Promise<string> => {
        const tiempoPreparacionMinutos = await calcularTiempoPreparacion(pedido);
        const ahora = new Date();
        const horaArgentina = new Date(
          ahora.toLocaleString("en-US", {
            timeZone: "America/Argentina/Buenos_Aires",
          })
        );
        horaArgentina.setMinutes(horaArgentina.getMinutes() + tiempoPreparacionMinutos);
        return horaArgentina.toTimeString().split(" ")[0];
      };

      pedido.horaEstimadaFinalizacion = await obtenerHoraFinalizacion(pedido);
      pedido.fechaPedido = obtenerFechaArgentina();
      pedido.estado = Estado.PENDIENTE;
      const exito = await PedidoService.create(pedido);
      if (exito) {
        return exito;
      } else {
        console.log("❌ Entrando en rama FAILURE - Stock insuficiente");
        alert("No se pudo procesar el pedido. Verifique el stock disponible.");
        return null;
      }
    } catch (error) {
      console.error(error);
      alert("Hubo un error al guardar el pedido.");
      return null;
    }
  };

  return (
    <carritoContext.Provider
      value={{
        pedido,
        preferenceId,
        limpiarPreferenceId,
        agregarAlCarrito,
        agregarPromocionAlCarrito,
        quitarPromocionCompleta,
        restarDelCarrito,
        quitarDelCarrito,
        limpiarCarrito,
        enviarPedido,
        AgregarPreferenceId,
        guardarPedidoYObtener,
        cambiarSucursal,
        showModalCambioSucursal,
        datosModalCambioSucursal,
        cerrarModalCambioSucursal,
      }}
    >
      {children}
    </carritoContext.Provider>
  );
}