import React, { useEffect, useState } from "react";
import { Button, Form, Row, Col, Spinner, Card } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pedido from "../../../models/Pedido.ts";
import Estado from "../../../models/enums/Estado.ts";
import PedidoDetalleModal from "../modales/PedidoDetalleModal.tsx";
import pedidoService from "../../../services/PedidoService.ts";
import { connectWebSocket } from "../../../services/WebSocketService.ts";
import { ReusableTable } from "../../Tabla";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import Cliente from "../../../models/Cliente.ts";
import { useAuth } from "../../../context/AuthContext.tsx";
import { useSucursal } from "../../../context/SucursalContextEmpleado.tsx";
import { obtenerSucursales } from "../../../services/SucursalService.ts";
import type Sucursal from "../../../models/Sucursal.ts";
import SelectDeliveryModal from '../modales/ModalDeliverySeleccion.tsx';
import Empleado from '../../../models/Empleado.ts';
import Rol from '../../../models/enums/Rol.ts';
import { es } from 'date-fns/locale';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import ModalMensaje from "../modales/ModalMensaje";

dayjs.extend(utc);
dayjs.extend(timezone);
interface Props {
    cliente?: Cliente;
}

function ajustarFechaHasta(date: Date | null): Date | null {
    if (!date) return null;
    // Si la hora es 00:00:00, setea a 23:59:59.999
    if (
        date.getHours() === 0 &&
        date.getMinutes() === 0 &&
        date.getSeconds() === 0 &&
        date.getMilliseconds() === 0
    ) {
        const finDia = new Date(date);
        finDia.setHours(23, 59, 59, 999);
        return finDia;
    }
    return date;
}

const GrillaPedidos: React.FC<Props> = ({ cliente }) => {
    const [loadingEstados, setLoadingEstados] = useState<Record<number, boolean>>({});
    const { sucursalActual, sucursalIdSeleccionada } = useSucursal();
    const { usuario } = useAuth();

    const getColorEstado = (estado: Estado): string => {
        switch (estado) {
            case Estado.PENDIENTE: return "warning";
            case Estado.PREPARACION: return "info";
            case Estado.LISTO: return "primary";
            case Estado.EN_DELIVERY: return "secondary";
            case Estado.ENTREGADO: return "success";
            case Estado.CANCELADO: return "danger";
            default: return "light";
        }
    };

    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [loading, setLoading] = useState(false);
    const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
    const [showDetalleModal, setShowDetalleModal] = useState(false);
    const [estadoSeleccionado, setEstadoSeleccionado] = useState<Record<number, Estado>>({});
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [empleadosDelivery, setEmpleadosDelivery] = useState<Empleado[]>([]);
    const [pedidoEnProceso, setPedidoEnProceso] = useState<Pedido | null>(null);


    // Estados para exportación a Excel (solo admin)
    const [pedidosSeleccionados, setPedidosSeleccionados] = useState<Map<number, Pedido>>(new Map());
    const [modoSeleccion] = useState(false);

    const [filtros, setFiltros] = useState({
        sucursalId: "",
        estados: [Estado.PENDIENTE, Estado.LISTO] as Estado[],
        desde: null as Date | null,
        hasta: null as Date | null,
        idPedido: "" as string,
        clienteNombre: "",
        pagado: "",
        tipoEnvio: ""
    });
    const [sortDesc, setSortDesc] = useState(true);


    const fetchPedidos = async () => {
        const sucursalId = usuario?.rol === 'ADMINISTRADOR' && filtros.sucursalId
            ? parseInt(filtros.sucursalId)
            : sucursalIdSeleccionada;

        try {
            setLoading(true);
            const filtrosConvertidos: any = {
                estados: filtros.estados && filtros.estados.length > 0 ? filtros.estados : undefined, clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : (filtros.clienteNombre || undefined),
                fechaDesde: filtros.desde ? dayjs(filtros.desde).tz("America/Argentina/Buenos_Aires").format() : undefined,
                fechaHasta: filtros.hasta ? dayjs(ajustarFechaHasta(filtros.hasta)!).tz("America/Argentina/Buenos_Aires").format() : undefined,
                pagado: filtros.pagado === "" ? undefined : filtros.pagado === "true",
                tipoEnvio: filtros.tipoEnvio || undefined,
                idPedido: filtros.idPedido ? Number(filtros.idPedido) : undefined
            };

            const sortParam = `fechaPedido,${sortDesc ? "DESC" : "ASC"}`;

            // Agregamos el parámetro de orden descendente por fecha
            const result = await pedidoService.getPedidosFiltrados(
                sucursalId,
                filtrosConvertidos,
                page,
                size,
                sortParam
            );
            setPedidos(result.content);
            setTotalPages(result.totalPages);
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            mostrarModalMensaje("Error al obtener pedidos", "danger", "Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchSucursales = async () => {
            if (usuario?.rol === 'ADMINISTRADOR') {
                try {
                    const sucursalesData = await obtenerSucursales();
                    setSucursales(sucursalesData);
                } catch (error) {
                    console.error("Error al cargar sucursales:", error);
                }
            }
        };

        if (usuario) {
            fetchSucursales();
        }
    }, [usuario]);

    useEffect(() => {
        if (usuario?.rol === 'ADMINISTRADOR' || sucursalActual?.id) {
            fetchPedidos();
        }
    }, [page, sucursalIdSeleccionada, filtros.estados, filtros.desde, filtros.hasta, filtros.idPedido, filtros.clienteNombre, filtros.sucursalId, filtros.pagado, filtros.tipoEnvio, sortDesc]);

    const handleVerDetalle = async (pedidoId: number) => {
        try {
            let detalle;
            if (cliente?.id) {
                detalle = await pedidoService.getDetallePedido(cliente.id, pedidoId);
            } else {
                const pedido = pedidos.find(p => p.id === pedidoId);
                if (pedido?.cliente?.id) {
                    detalle = await pedidoService.getDetallePedido(pedido.cliente.id, pedidoId);
                } else {
                    throw new Error("No se pudo determinar el cliente del pedido");
                }
            }
            setDetallePedido(detalle);
            setShowDetalleModal(true);
        } catch (error) {
            console.error("Error al obtener detalle:", error);
            mostrarModalMensaje("Error al obtener detalle del pedido", "danger", "Error");
        }
    };

    const handleCambiarEstado = async (pedidoId: number, nuevoEstado: Estado) => {
        const pedido = pedidos.find(p => p.id === pedidoId);
        if (!pedido) return;

        // Validación frontend: no permitir EN_DELIVERY si es TAKEAWAY
        if (nuevoEstado === Estado.EN_DELIVERY && pedido.tipoEnvio === "TAKEAWAY") {
            mostrarModalMensaje("No se puede cambiar a EN_DELIVERY un pedido con tipo de envío TAKEAWAY.", "warning", "Advertencia");
            return;
        }
        // Validación frontend: no permitir ENTREGADO si no está pagado
        if (nuevoEstado === Estado.ENTREGADO && !pedido.pagado) {
            mostrarModalMensaje("No se puede marcar como ENTREGADO un pedido que no está pagado.", "warning", "Advertencia");
            return;
        }
        // Verificar si el cambio es a EN_DELIVERY
        if (nuevoEstado === Estado.EN_DELIVERY) {
            // Para ADMIN: puede cambiar desde cualquier estado
            // Para CAJERO: solo puede cambiar desde LISTO
            if (usuario?.rol === 'ADMINISTRADOR' ||
                (usuario?.rol === 'CAJERO' && pedido.estado === Estado.LISTO)) {
                try {
                    if (!pedido.sucursal?.id) {
                        throw new Error('El pedido no tiene una sucursal válida asignada');
                    }

                    const deliverys = await pedidoService.obtenerEmpleadosPorSucursalYRol(
                        pedido.sucursal.id,
                        Rol.DELIVERY
                    );

                    if (deliverys.length === 0) {
                        throw new Error('No hay empleados delivery disponibles en esta sucursal');
                    }

                    setEmpleadosDelivery(deliverys);
                    setPedidoEnProceso(pedido);
                    setShowDeliveryModal(true);
                } catch (error: any) {
                    let mensaje = "Error al cambiar el estado del pedido";
                    if (error?.response && error.response.data?.errorMsg) {
                        mensaje = error.response.data.errorMsg;
                    } else if (error?.message) {
                        mensaje = error.message;
                    }
                    mostrarModalMensaje(mensaje, "danger", "Error");
                    console.error('Error al cambiar estado:', error);
                }
                return;
            } else {
                mostrarModalMensaje('No tienes permisos para cambiar a estado EN_DELIVERY desde este estado', "warning", "Advertencia");
                return;
            }
        }

        // Para otros cambios de estado que no sean a EN_DELIVERY
        try {
            setLoadingEstados(prev => ({
                ...prev,
                [pedidoId]: true
            }));

            const pedidoActualizado = {
                ...pedido,
                estado: nuevoEstado
            };

            await pedidoService.cambiarEstadoPedido(pedidoActualizado);

            // ✅ Actualizar estado local
            setPedidos(prev => prev.map(p =>
                p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
            ));

            // ✅ Resetear selección
            setEstadoSeleccionado(prev => {
                const nuevo = { ...prev };
                delete nuevo[pedidoId];
                return nuevo;
            });

        } catch (error) {
            console.error('Error al cambiar estado:', error);
            mostrarModalMensaje('Error al cambiar el estado del pedido', "danger", "Error");
        } finally {
            setLoadingEstados(prev => ({
                ...prev,
                [pedidoId]: false
            }));
        }
    };

    // Agregar función para procesar el cambio con delivery
    const handleConfirmarDelivery = async (empleadoDelivery: Empleado) => {
        if (!pedidoEnProceso) return;

        try {
            setLoadingEstados(prev => ({
                ...prev,
                [pedidoEnProceso.id!]: true
            }));

            const pedidoActualizado = {
                ...pedidoEnProceso,
                estado: Estado.EN_DELIVERY,
                empleado: empleadoDelivery
            };

            await pedidoService.cambiarEstadoPedido(pedidoActualizado);

            // Actualizar estado local
            setPedidos(prev => prev.map(p =>
                p.id === pedidoEnProceso.id
                    ? { ...p, estado: Estado.EN_DELIVERY, empleado: empleadoDelivery }
                    : p
            ));

            setShowDeliveryModal(false);
            setPedidoEnProceso(null);

        } catch (error: any) {
            let mensaje = "Error al cambiar el estado del pedido";
            if (error?.response && error.response.data?.errorMsg) {
                mensaje = error.response.data.errorMsg;
            } else if (error?.message) {
                mensaje = error.message;
            }
            mostrarModalMensaje(mensaje, "danger", "Error");
            console.error('Error al cambiar estado:', error);
        } finally {
            setLoadingEstados(prev => ({
                ...prev,
                [pedidoEnProceso.id!]: false
            }));
        }
    };


    const handleMarcarPagado = async (pedidoId: number) => {
        try {
            const pedidoActualizado = await pedidoService.marcarComoPagado(pedidoId);

            // Actualizar el estado local con el objeto devuelto
            setPedidos(prev =>
                prev.map(p =>
                    p.id === pedidoId ? { ...p, pagado: pedidoActualizado.pagado } : p
                )
            );
        } catch (error) {
            console.error("Error al marcar como pagado:", error);
            mostrarModalMensaje("Error al marcar el pedido como pagado", "danger", "Error");
        }
    };

    const handleDescargarFactura = async (pedidoId: number) => {
        try {
            let clienteId;
            if (cliente?.id) {
                clienteId = cliente.id;
            } else {
                const pedido = pedidos.find(p => p.id === pedidoId);
                clienteId = pedido?.cliente?.id;
            }

            if (!clienteId) {
                throw new Error("No se pudo determinar el cliente del pedido");
            }

            const blob = await pedidoService.descargarFactura(clienteId, pedidoId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `factura_pedido_${pedidoId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al descargar factura:", error);
            mostrarModalMensaje("Error al descargar la factura", "danger", "Error");
        }
    };

    // Función para limpiar todos los filtros
    const handleVerTodos = () => {
        setFiltros({
            sucursalId: "",
            estados: [],
            desde: null,
            hasta: null,
            idPedido: "",
            clienteNombre: "",
            pagado: "",
            tipoEnvio: ""
        });
        setPage(0);
    };

    // Funciones para exportación a Excel (solo admin)
    const handleToggleSeleccion = (pedidoId: number) => {
        setPedidosSeleccionados(prev => {
            const newMap = new Map(prev);
            if (newMap.has(pedidoId)) {
                newMap.delete(pedidoId);
            } else {
                const pedido = pedidos.find(p => p.id === pedidoId);
                if (pedido) {
                    newMap.set(pedidoId, pedido);
                }
            }
            return newMap;
        });
    };

    const handleExportarExcel = async () => {
        try {
            setLoading(true);
            // Exporta todos los pedidos filtrados (no solo los de la página actual)
            const sucursalId = usuario?.rol === 'ADMINISTRADOR' && filtros.sucursalId
                ? parseInt(filtros.sucursalId)
                : sucursalIdSeleccionada;

            const filtrosConvertidos = {
                estados: filtros.estados && filtros.estados.length > 0 ? filtros.estados : undefined,
                clienteNombre: cliente ? `${cliente.nombre} ${cliente.apellido}` : (filtros.clienteNombre || undefined),
                fechaDesde: filtros.desde ? dayjs(filtros.desde).tz("America/Argentina/Buenos_Aires").format() : undefined,
                fechaHasta: filtros.hasta ? dayjs(ajustarFechaHasta(filtros.hasta)!).tz("America/Argentina/Buenos_Aires").format() : undefined,
                pagado: filtros.pagado === "" ? undefined : filtros.pagado === "true",
                tipoEnvio: filtros.tipoEnvio === "DELIVERY" || filtros.tipoEnvio === "TAKEAWAY"
                    ? filtros.tipoEnvio as "DELIVERY" | "TAKEAWAY"
                    : undefined,
                idPedido: filtros.idPedido ? Number(filtros.idPedido) : undefined
            };

            // Llama a un método que exporte todos los pedidos filtrados (sin paginación)
            const blob = await pedidoService.exportarPedidosFiltrados(
                sucursalId,
                filtrosConvertidos,
            );
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "pedidos.xlsx";
            a.click();
            window.URL.revokeObjectURL(url);
            mostrarModalMensaje("Exportando pedidos filtrados a Excel...", "success", "Éxito");
        } catch (error) {
            console.error("Error al exportar Excel:", error);
            mostrarModalMensaje("Error al exportar a Excel", "danger", "Error");
        } finally {
            setLoading(false);
        }
    };

    /*
    const handleCancelarSeleccion = () => {
        setPedidosSeleccionados(new Map());
        setModoSeleccion(false);
    };
    */
    const getEstadosDisponibles = (estadoActual: Estado, pedido: Pedido): Estado[] => {
        let disponibles = Object.values(Estado);

        // No permitir EN_DELIVERY si es TAKEAWAY
        const filtrarEnDelivery = (arr: Estado[]) =>
            pedido.tipoEnvio === "TAKEAWAY" ? arr.filter(e => e !== Estado.EN_DELIVERY) : arr;
        // No permitir ENTREGADO si no está pagado
        const filtrarEntregado = (arr: Estado[]) =>
            !pedido.pagado ? arr.filter(e => e !== Estado.ENTREGADO) : arr;

        if (usuario?.rol === 'ADMINISTRADOR') {
            disponibles = filtrarEnDelivery(disponibles);
            disponibles = filtrarEntregado(disponibles);
            return disponibles;
        }

        if (usuario?.rol === 'CAJERO') {
            let arr: Estado[] = [];
            switch (estadoActual) {
                case Estado.PENDIENTE:
                    arr = [Estado.PENDIENTE, Estado.CANCELADO, Estado.PREPARACION, Estado.LISTO, Estado.EN_DELIVERY, Estado.ENTREGADO];
                    break;
                case Estado.PREPARACION:
                    arr = [Estado.PREPARACION, Estado.LISTO];
                    break;
                case Estado.LISTO:
                    arr = [Estado.LISTO, Estado.EN_DELIVERY, Estado.ENTREGADO];
                    break;
                case Estado.EN_DELIVERY:
                    arr = [Estado.EN_DELIVERY, Estado.ENTREGADO];
                    break;
                case Estado.ENTREGADO:
                case Estado.CANCELADO:
                default:
                    arr = [estadoActual];
            }
            arr = filtrarEnDelivery(arr);
            arr = filtrarEntregado(arr);
            return arr;
        }

        disponibles = filtrarEnDelivery(disponibles);
        disponibles = filtrarEntregado(disponibles);
        return disponibles.filter(e => e === estadoActual);
    };
    const isBotonCambioDeshabilitado = (estadoActual: Estado): boolean => {
        if (usuario?.rol === 'ADMINISTRADOR') {
            return false;
        }

        if (usuario?.rol === 'CAJERO') {
            return estadoActual === Estado.EN_DELIVERY || estadoActual === Estado.PREPARACION;
        }

        return true; // Por defecto, deshabilitado para otros roles
    };

    useEffect(() => {
        if (!usuario) return;

        const topic =
            usuario.rol === 'ADMINISTRADOR'
                ? '/topic/admin'
                : usuario.rol === 'CAJERO'
                    ? '/topic/cajero'
                    : null;

        if (!topic) return;

        const client = connectWebSocket(topic, (pedidoActualizado) => {
            setPedidos((prevPedidos) => {
                const index = prevPedidos.findIndex((p) => p.id === pedidoActualizado.id);

                const estadosInteres = [
                    "PENDIENTE",
                    "PREPARACION",
                    "LISTO",
                    "EN_DELIVERY",
                    "ENTREGADO",
                    "CANCELADO"
                ];

                if (!estadosInteres.includes(pedidoActualizado.estado)) {
                    return prevPedidos;
                }

                let nuevaLista: Pedido[];

                if (index !== -1) {
                    // Reemplaza el existente
                    nuevaLista = [...prevPedidos];
                    nuevaLista[index] = pedidoActualizado;
                } else {
                    // Inserta nuevo pedido
                    nuevaLista = [...prevPedidos, pedidoActualizado];
                }

                // Ordena según sortDesc
                return nuevaLista.sort((a, b) => {
                    const fechaA = new Date(a.fechaPedido).getTime();
                    const fechaB = new Date(b.fechaPedido).getTime();
                    return sortDesc ? fechaB - fechaA : fechaA - fechaB;
                });
            });

        });

        return () => {
            client.deactivate(); // ✅ Ahora es una función de limpieza síncrona
        };
    }, [usuario]);

    const columns = [
        // Columna de selección solo para admin en modo selección
        ...(usuario?.rol === 'ADMINISTRADOR' && modoSeleccion ? [{
            key: "seleccion",
            label: "",
            render: (_: any, row: Pedido) => (
                <Form.Check
                    type="checkbox"
                    checked={pedidosSeleccionados.has(row.id!)}
                    onChange={() => handleToggleSeleccion(row.id!)}
                />
            )
        }] : []),
        { key: "numero", label: "Número", render: (_: any, row: Pedido) => row.id },
        { key: "cliente", label: "Cliente", render: (_: any, row: Pedido) => `${row.cliente?.nombre} ${row.cliente?.apellido}` },
        { key: "fecha", label: "Fecha", render: (_: any, row: Pedido) => dayjs(row.fechaPedido).format("DD/MM/YYYY HH:mm") },
        { key: "total", label: "Total", render: (_: any, row: Pedido) => `$${row.total.toFixed(2)}` },
        { key: "tipoPago", label: "Medio de Pago", render: (_: any, row: Pedido) => row.formaPago },
        { key: "pagado", label: "Pagado", render: (_: any, row: Pedido) => row.pagado ? "SI" : "NO" },
        { key: "estado", label: "Estado", render: (_: any, row: Pedido) => row.estado },
        { key: "sucursal", label: "Sucursal", render: (_: any, row: Pedido) => row.sucursal.nombre },
        {
            key: "acciones",
            label: "Acciones",
            render: (_: any, row: Pedido) => {

                const estadosDisponibles = getEstadosDisponibles(row.estado, row);
                const estadoSeleccionadoValido = estadosDisponibles.includes(estadoSeleccionado[row.id!] || row.estado);
                const botonDeshabilitado = isBotonCambioDeshabilitado(row.estado);
                const isLoadingEstado = loadingEstados[row.id!] || false;
                return (
                    <div className="d-flex flex-column gap-1">
                        <div className="d-flex gap-2 align-items-center">
                            <Form.Select
                                size="sm"
                                className={`border-${getColorEstado(row.estado)}`}
                                value={estadoSeleccionado[row.id!] || row.estado}
                                onChange={(e) => setEstadoSeleccionado({ ...estadoSeleccionado, [row.id!]: e.target.value as Estado })}
                                disabled={botonDeshabilitado || !estadoSeleccionadoValido || estadoSeleccionado[row.id!] === row.estado || isLoadingEstado}
                            >
                                {estadosDisponibles.map((estado) => (
                                    <option key={estado} value={estado}>{estado}</option>
                                ))}
                            </Form.Select>
                            <Button
                                size="sm"
                                variant={getColorEstado(estadoSeleccionado[row.id!] || row.estado)}
                                onClick={() => handleCambiarEstado(row.id!, estadoSeleccionado[row.id!] || row.estado)}
                                disabled={botonDeshabilitado || !estadoSeleccionado[row.id!] || estadoSeleccionado[row.id!] === row.estado || isLoadingEstado}
                            >
                                {isLoadingEstado ? (
                                    <>
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Cambiando estado...</span>
                                        </div>
                                        Cambiando Estado...
                                    </>
                                ) : (
                                    'Cambiar'
                                )}
                            </Button>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="primary" size="sm" onClick={() => handleVerDetalle(row.id!)}>Detalle</Button>
                            <Button variant="outline-secondary" size="sm" onClick={() => handleDescargarFactura(row.id!)}>Factura</Button>
                            {!row.pagado && row.estado !== Estado.CANCELADO && (
                                <Button variant="success" size="sm" onClick={() => handleMarcarPagado(row.id!)}>Pagado ✓</Button>
                            )}
                        </div>
                    </div>
                );
            }
        }
    ];

    const [modalMensaje, setModalMensaje] = useState({
        show: false,
        mensaje: "",
        titulo: "Mensaje",
        variante: "danger" as "primary" | "success" | "danger" | "warning" | "info" | "secondary"
    });
    const mostrarModalMensaje = (mensaje: string, variante: typeof modalMensaje.variante = "danger", titulo = "Error") => {
        setModalMensaje({ show: true, mensaje, variante, titulo });
    };

    return (
        <>
            {/* Caja de filtros y gestión */}
            <Card className="mb-4 shadow-sm">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">
                            {cliente ? `Pedidos del Cliente #${cliente.id} - ${cliente.nombre} ${cliente.apellido}` : 'Gestión de Pedidos'}
                        </Card.Title>
                        {/* Botón de exportar Excel solo para admin y sin selección */}
                        {usuario?.rol === 'ADMINISTRADOR' && !cliente && (
                            <Button
                                variant="success"
                                size="sm"
                                onClick={handleExportarExcel}
                                disabled={pedidos.length === 0}
                            >
                                📊 Exportar Excel
                            </Button>
                        )}
                    </div>
                </Card.Header>
                <Card.Body>
                    <Form className="mb-0"> {/* Quitamos mb-5 para que no haya tanto espacio */}
                        <Row className="gy-2 align-items-center">
                            <Col xs={12} md={8} lg={9} className="d-flex flex-wrap align-items-center gap-3">
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Estados</Form.Label>
                                    <div className="d-inline-flex flex-wrap gap-2 align-items-center">
                                        {Object.values(Estado).map((est) => (
                                            <Form.Check
                                                key={est}
                                                type="checkbox"
                                                id={`estado-${est}`}
                                                label={<span style={{ fontSize: "0.85em" }}>{est}</span>}
                                                value={est}
                                                checked={filtros.estados.includes(est)}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    setFiltros((prev) => ({
                                                        ...prev,
                                                        estados: checked
                                                            ? [...prev.estados, est]
                                                            : prev.estados.filter((estado) => estado !== est)
                                                    }));
                                                }}
                                                className="mb-0"
                                                style={{ minWidth: "auto" }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {!cliente && (
                                    <div>
                                        <Form.Label className="fw-bold mb-0 me-2">Cliente</Form.Label>
                                        <Form.Control
                                            size="sm"
                                            style={{ width: 140, display: "inline-block" }}
                                            placeholder="Nombre del Cliente"
                                            value={filtros.clienteNombre}
                                            onChange={(e) => setFiltros({ ...filtros, clienteNombre: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">ID</Form.Label>
                                    <Form.Control
                                        size="sm"
                                        type="number"
                                        style={{ width: 90, display: "inline-block" }}
                                        placeholder="ID Pedido"
                                        value={filtros.idPedido}
                                        onChange={(e) => setFiltros({ ...filtros, idPedido: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Envío</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        style={{ width: 120, display: "inline-block" }}
                                        value={filtros.tipoEnvio}
                                        onChange={(e) => setFiltros({ ...filtros, tipoEnvio: e.target.value })}
                                    >
                                        <option value="">Todos</option>
                                        <option value="DELIVERY">Delivery</option>
                                        <option value="TAKEAWAY">Take Away</option>
                                    </Form.Select>
                                </div>
                                <div>
                                    <Form.Label className="fw-bold mb-0 me-2">Pagado</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        style={{ width: 120, display: "inline-block" }}
                                        value={filtros.pagado}
                                        onChange={(e) => setFiltros({ ...filtros, pagado: e.target.value })}
                                    >
                                        <option value="">Todos</option>
                                        <option value="true">SI</option>
                                        <option value="false">NO</option>
                                    </Form.Select>
                                </div>
                                <div className="d-flex align-items-end">
                                    <div>
                                        <Form.Label className="fw-bold mb-0 me-2">Fecha Desde</Form.Label>
                                        <DatePicker
                                            className="form-control form-control-sm d-inline-block"
                                            placeholderText="Desde"
                                            selected={filtros.desde}
                                            onChange={(date) => {
                                                setFiltros({ ...filtros, desde: date, hasta: filtros.hasta && date && filtros.hasta < date ? null : filtros.hasta });
                                            }}
                                            showTimeSelect
                                            dateFormat="dd/MM/yyyy HH:mm"
                                            locale={es}
                                            maxDate={filtros.hasta || undefined}
                                            isClearable
                                        />
                                    </div>
                                    <div className="ms-2">
                                        <Form.Label className="fw-bold mb-0 me-2">Fecha Hasta</Form.Label>
                                        <DatePicker
                                            className="form-control form-control-sm d-inline-block"
                                            placeholderText="Hasta"
                                            selected={filtros.hasta}
                                            onChange={(date) => setFiltros({ ...filtros, hasta: date })}
                                            showTimeSelect
                                            dateFormat="dd/MM/yyyy HH:mm"
                                            locale={es}
                                            minDate={filtros.desde || undefined}
                                            isClearable
                                        />
                                    </div>
                                </div>
                            </Col>
                            <Col xs={12} md={4} lg={3} className="d-flex flex-column align-items-end justify-content-center">
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleVerTodos}
                                    style={{ minWidth: 140, marginBottom: 6, height: 38 }}
                                >
                                    Limpiar
                                </Button>
                                <Button
                                    variant={sortDesc ? "outline-primary" : "outline-dark"}
                                    onClick={() => setSortDesc((prev) => !prev)}
                                    title="Alternar orden de fecha"
                                    style={{ minWidth: 140, height: 38 }}
                                >
                                    {sortDesc ? "⬇ Más nuevos" : "⬆ Más viejos"}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Caja de pedidos */}
            <Card className="mb-4 shadow-sm">
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <Card.Title className="mb-0">Pedidos</Card.Title>
                    </div>
                </Card.Header>
                <Card.Body>
                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : (
                        pedidos.length === 0 ? (
                            <p className="text-center">No hay pedidos</p>
                        ) : (
                            <>
                                <ReusableTable data={pedidos} columns={columns} />
                                <div className="d-flex justify-content-end mt-3">
                                    <Button variant="outline-secondary" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                                        <ChevronLeft />
                                    </Button>
                                    <span className="mx-2 align-self-center">Página {page + 1} de {totalPages}</span>
                                    <Button variant="outline-secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                                        <ChevronRight />
                                    </Button>
                                </div>
                            </>
                        )
                    )}
                </Card.Body>
            </Card>

            {detallePedido && (
                <PedidoDetalleModal
                    show={showDetalleModal}
                    onHide={() => setShowDetalleModal(false)}
                    pedido={detallePedido}
                />
            )}
            <SelectDeliveryModal
                show={showDeliveryModal}
                onHide={() => {
                    setShowDeliveryModal(false);
                    setPedidoEnProceso(null);
                }}
                onConfirm={handleConfirmarDelivery}
                pedido={pedidoEnProceso!}
                empleadosDelivery={empleadosDelivery}
            />
            <ModalMensaje
                show={modalMensaje.show}
                onHide={() => setModalMensaje({ ...modalMensaje, show: false })}
                mensaje={modalMensaje.mensaje}
                titulo={modalMensaje.titulo}
                variante={modalMensaje.variante}
            />
        </>
    );
};

export default GrillaPedidos;