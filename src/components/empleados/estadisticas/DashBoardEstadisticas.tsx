import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, ResponsiveContainer, PieChart, Pie, Legend, Cell, type TooltipProps
} from 'recharts';
import {
    type TicketPromedioDTO,
    type PedidosPorDiaDTO,
    type PedidosPorTipoDTO,
    type VentasPorDiaDTO,
} from '../../../models/Estadisticas';
import dayjs from 'dayjs';
import { EstadisticaService } from '../../../services/EstadisticasService';
import { useSucursal } from '../../../context/SucursalContextEmpleado';
import { Spinner } from 'react-bootstrap';

const COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    dark: '#1f2937',
    light: '#f8fafc',
    gray: '#6b7280',
    gradient: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1']
};



const DashboardEstadisticas: React.FC = () => {

    const { sucursales, cambiarSucursal, loading, esModoTodasSucursales, sucursalIdSeleccionada } = useSucursal();
    const [desde, setDesde] = useState<Date>(dayjs().startOf('month').toDate());
    const [hasta, setHasta] = useState<Date>(dayjs().endOf('day').toDate());

    const [resumenSucursal, setResumenSucursal] = useState<any[]>([]);
    const [productosMasVendidos, setProductosMasVendidos] = useState<any[]>([]);
    const [clientesFrecuentes, setClientesFrecuentes] = useState<any[]>([]);
    const [tipoPedido, setTipoPedido] = useState<string>('');
    const [ventasPorDia, setVentasPorDia] = useState<VentasPorDiaDTO[]>([]);
    const [ticketPromedio, setTicketPromedio] = useState<TicketPromedioDTO[]>([]);
    const [pedidosPorDia, setPedidosPorDia] = useState<PedidosPorDiaDTO[]>([]);
    const [pedidosPorTipo, setPedidosPorTipo] = useState<PedidosPorTipoDTO[]>([]);

    const [isLoading, setIsLoading] = useState(false);

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };

    const cargarDatos = async () => {
        if (loading || isLoading) return; // Evitar múltiples cargas simultáneas

        setIsLoading(true);
        try {
            const sucursalId = esModoTodasSucursales ? null : sucursalIdSeleccionada;
            const [resumen, productos, clientes, ventas, ticketProm, pedidosDia, pedidosTipo] =
                await Promise.all([
                    EstadisticaService.obtenerResumenSucursales(desde, hasta),
                    EstadisticaService.obtenerProductosMasVendidosFiltrados(
                        sucursalId, desde, hasta
                    ),
                    EstadisticaService.obtenerClientesFrecuentesFiltrados(
                        sucursalId, desde, hasta, tipoPedido
                    ),
                    EstadisticaService.obtenerVentasPorDia(sucursalId, desde, hasta),
                    EstadisticaService.obtenerTicketPromedio(sucursalId, desde, hasta),
                    EstadisticaService.obtenerPedidosPorDia(sucursalId, desde, hasta),
                    EstadisticaService.obtenerPedidosPorTipo(sucursalId, desde, hasta),
                ]);

            setResumenSucursal(resumen);
            setProductosMasVendidos(productos);
            setClientesFrecuentes(clientes);
            setVentasPorDia(ventas);
            setTicketPromedio(ticketProm);
            setPedidosPorDia(pedidosDia);
            setPedidosPorTipo(pedidosTipo);
        } catch (error) {
            console.error('Error al cargar los datos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTipoPedidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTipoPedido(e.target.value);
    };

    const handleSucursalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'all') {
            cambiarSucursal(null);
        } else {
            const sucursal = sucursales.find(s => s.id === Number(value));
            if (sucursal) cambiarSucursal(sucursal);
        }
    };

    const handleDateChange = (newDate: Date, isStart: boolean) => {
        if (isStart) {
            setDesde(newDate);
        } else {
            setHasta(newDate);
        }
    };

    const resetearFiltros = () => {
        setDesde(dayjs().startOf('month').toDate());
        setHasta(dayjs().endOf('day').toDate());
        setTipoPedido('');
        cambiarSucursal(null);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            cargarDatos();
        }, 400); // Pequeño debounce para evitar múltiples llamadas

        return () => clearTimeout(timer);
    }, [desde, hasta, sucursalIdSeleccionada, tipoPedido, esModoTodasSucursales]);


    if (loading) return <Spinner animation="border" variant="primary" />;

    const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb'
                }}>
                    <p style={{
                        fontWeight: '600',
                        color: COLORS.dark,
                        marginBottom: '8px',
                        fontSize: '14px'
                    }}>
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{
                            color: entry.color,
                            fontSize: '13px',
                            margin: '4px 0',
                            fontWeight: '500'
                        }}>
                            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const cardStyle = {
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: 'none',
        marginBottom: '24px',
        overflow: 'hidden'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        borderRadius: '12px',
        backgroundColor: '#f1f5f9',
        fontSize: '14px',
        fontWeight: '500',
        outline: 'none'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: COLORS.gray,
        marginBottom: '8px'
    };

    return (
        <div style={{
            backgroundColor: COLORS.light,
            minHeight: '100vh',
            padding: '0',
            opacity: isLoading ? 0.7 : 1,
            transition: 'opacity 0.3s ease'
        }}>
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000
                }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            )}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '800',
                        color: COLORS.dark,
                        marginBottom: '8px',
                        letterSpacing: '-0.025em',
                        background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Panel de Estadísticas
                    </h1>
                    <p style={{
                        fontSize: '18px',
                        color: COLORS.gray,
                        marginBottom: '0',
                        fontWeight: '400'
                    }}>
                        Panel de control de estadísticas y métricas de rendimiento
                    </p>
                </div>

                {/* Filtros Globales */}
                <div style={cardStyle}>
                    <div style={{ padding: '32px' }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: COLORS.dark,
                            marginBottom: '24px'
                        }}>
                            🎯 Filtros Globales
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '20px',
                            alignItems: 'end'
                        }}>
                            <div>
                                <label style={labelStyle}>Desde</label>
                                <input
                                    type="date"
                                    value={formatDate(desde)}
                                    onChange={e => handleDateChange(new Date(e.target.value), true)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Hasta</label>
                                <input
                                    type="date"
                                    value={formatDate(hasta)}
                                    onChange={e => handleDateChange(new Date(e.target.value), false)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Sucursal</label>
                                <select
                                    value={sucursalIdSeleccionada || 'all'}
                                    onChange={handleSucursalChange}
                                    style={{
                                        ...inputStyle,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="all">🏢 Todas las sucursales</option>
                                    {sucursales.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={resetearFiltros}
                                style={{
                                    padding: '12px 24px',
                                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                🔄 Ver Todos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resumen por Sucursal */}
                <div style={cardStyle}>
                    <div style={{ padding: '32px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '32px'
                        }}>
                            <div>
                                <h3 style={{
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    color: COLORS.dark,
                                    marginBottom: '4px'
                                }}>
                                    📊 Resumen por Sucursal
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: COLORS.gray,
                                    margin: '0'
                                }}>
                                    Comparativo de ventas y ganancias netas
                                </p>
                            </div>
                            <div style={{
                                background: `linear-gradient(135deg, ${COLORS.primary}20, ${COLORS.secondary}20)`,
                                padding: '10px 20px',
                                borderRadius: '25px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: COLORS.dark
                            }}>
                                {resumenSucursal.length} sucursales activas
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={resumenSucursal} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="nombreSucursal"
                                    tick={{ fontSize: 12, fill: COLORS.gray }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: COLORS.gray }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar
                                    dataKey="totalVentas"
                                    fill={COLORS.primary}
                                    name="💰 Total Ventas"
                                    radius={[6, 6, 0, 0]}
                                />
                                <Bar
                                    dataKey="gananciaNeta"
                                    fill={COLORS.success}
                                    name="📈 Ganancia Neta"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grid de gráficos */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                    gap: '24px',
                    marginBottom: '24px'
                }}>
                    {/* Productos Más Vendidos */}
                    <div style={cardStyle}>
                        <div style={{ padding: '32px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '24px'
                            }}>
                                <div>
                                    <h3 style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color: COLORS.dark,
                                        marginBottom: '4px'
                                    }}>
                                        🏆 Top Productos
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: COLORS.gray,
                                        margin: '0'
                                    }}>
                                        Más vendidos del período
                                    </p>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={productosMasVendidos}
                                        dataKey="cantidadVendida"
                                        nameKey="nombreProducto"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    >
                                        {productosMasVendidos.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.gradient[index % COLORS.gradient.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Clientes Frecuentes */}
                    <div style={cardStyle}>
                        <div style={{ padding: '32px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '24px'
                            }}>
                                <div>
                                    <h3 style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color: COLORS.dark,
                                        marginBottom: '4px'
                                    }}>
                                        👥 Clientes Frecuentes
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: COLORS.gray,
                                        margin: '0'
                                    }}>
                                        Top clientes por cantidad de pedidos
                                    </p>
                                </div>
                                <div style={{ minWidth: '180px' }}>
                                    <select
                                        value={tipoPedido}
                                        onChange={handleTipoPedidoChange}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            backgroundColor: '#f1f5f9',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="">🎯 Todos los tipos</option>
                                        <option value="DELIVERY">🚚 Delivery</option>
                                        <option value="TAKEAWAY">📦 Para llevar</option>

                                    </select>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={clientesFrecuentes}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" />
                                    <YAxis
                                        type="category"
                                        dataKey="nombreCliente"
                                        tick={{ fontSize: 12 }}
                                        width={100}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="cantidadPedidos"
                                        fill={COLORS.secondary}
                                        radius={[0, 6, 6, 0]}
                                    >
                                        {clientesFrecuentes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.gradient[index % COLORS.gradient.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Ticket Promedio */}
                <div style={cardStyle}>
                    <div style={{ padding: '32px' }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: COLORS.dark,
                            marginBottom: '4px'
                        }}>
                            💰 Ticket Promedio
                        </h3>
                        <p style={{
                            fontSize: '14px',
                            color: COLORS.gray,
                            margin: '0 0 24px 0'
                        }}>
                            Promedio de ventas por sucursal
                        </p>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={ticketPromedio}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="nombreSucursal"
                                    tick={{ fontSize: 12, fill: COLORS.gray }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: COLORS.gray }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="totalVentas"
                                    fill={COLORS.info}
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pedidos por Día */}
                <div style={cardStyle}>
                    <div style={{ padding: '32px' }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '700',
                            color: COLORS.dark,
                            marginBottom: '4px'
                        }}>
                            📅 Pedidos por Día
                        </h3>
                        <p style={{
                            fontSize: '14px',
                            color: COLORS.gray,
                            margin: '0 0 24px 0'
                        }}>
                            Evolución diaria de pedidos
                        </p>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={pedidosPorDia}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="fecha"
                                    tick={{ fontSize: 12, fill: COLORS.gray }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: COLORS.gray }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="cantidadPedidos"
                                    stroke={COLORS.success}
                                    strokeWidth={3}
                                    dot={{ fill: COLORS.success }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ventas por Día */}
                <div style={cardStyle}>
                    <div style={{ padding: '32px' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: COLORS.dark,
                                marginBottom: '4px'
                            }}>
                                📈 Evolución de Ventas
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: COLORS.gray,
                                margin: '0'
                            }}>
                                Tendencia diaria de ventas en el período seleccionado
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={ventasPorDia} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="fecha"
                                    tick={{ fontSize: 12, fill: COLORS.gray }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: COLORS.gray }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="totalVentas"
                                    stroke={COLORS.info}
                                    strokeWidth={4}
                                    dot={{ fill: COLORS.info, strokeWidth: 2, r: 6 }}
                                    activeDot={{ r: 8, stroke: COLORS.info, strokeWidth: 2, fill: 'white' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribución de Pedidos por Tipo */}
                <div style={cardStyle}>
                    <div style={{ padding: '32px' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                color: COLORS.dark,
                                marginBottom: '4px'
                            }}>
                                🎯 Distribución por Tipo de Pedido
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: COLORS.gray,
                                margin: '0'
                            }}>
                                Proporción de pedidos según modalidad de entrega
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={pedidosPorTipo}
                                    dataKey="cantidad"
                                    nameKey="tipoPedido"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    innerRadius={60}
                                    label={({ tipoPedido, percent }) => `${tipoPedido}: ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pedidosPorTipo.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={[COLORS.warning, COLORS.danger, COLORS.success][index]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardEstadisticas;