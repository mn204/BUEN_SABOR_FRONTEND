import { Container, Row, Col, Nav } from 'react-bootstrap';
import '../../styles/panelAdmin.css';

import Computadora from '../../assets/admin/computadora.svg';
import Dashboard from '../../assets/admin/dashboard.svg';
import Pedidos from '../../assets/admin/pedidos.svg';
import Cocina from '../../assets/admin/cocina.svg';
import Delivery from '../../assets/admin/delivery.svg';
import Productos from '../../assets/admin/productos.svg';
import Insumos from '../../assets/admin/insumos.svg';
import Categorias from '../../assets/admin/categorias.svg';
import Stock from '../../assets/admin/stock.svg';
import Estadisticas from '../../assets/admin/estadisticas.svg';
import Usuario from '../../assets/admin/usuario-black.svg';
import GrillaArticuloManufacturado from "./grillas/GrillaArticuloManufacturado.tsx";
import GrillaCliente from "./grillas/GrillaCliente.tsx";
import GrillaEmpleado from "./grillas/GrillaEmpleado.tsx";
import GrillaSucursal from "./grillas/GrillaSucursal.tsx"; // Importar la grilla de sucursales
import GrillaPedidos from './grillas/GrillaPedidos.tsx';
import { useAuth } from "../../context/AuthContext.tsx"
import { useSucursal } from "../../context/SucursalContextEmpleado.tsx";

import {useLocation} from "react-router-dom";
import {useNavigate} from "react-router-dom";
import GrillaCategorias from './grillas/GrillaCategorias.tsx';
import DashboardSection from './DashboardSection';
import GrillaDelivery from "./grillas/GrillaDelivery.tsx";
import {useEffect} from "react";
import GrillaInsumos from './grillas/GrillaInsumos.tsx';
import GrillaCocina from "./grillas/GrillaCocina.tsx";
import GrillaStock from './grillas/GrillaStock.tsx';
import { GrillaPromocion } from './grillas/GrillaPromociones.tsx';
import DashboardEstadisticas from './estadisticas/DashBoardEstadisticas.tsx';

function PanelAdmin() {

    const { usuario, user, empleado } = useAuth();
    const { sucursalActual, esModoTodasSucursales, sucursalIdSeleccionada } = useSucursal();
    const location = useLocation();
    const navigate = useNavigate();

    const botones = [
        { nombre: 'Dashboard', icono: Dashboard, path: 'dashboard', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        { nombre: 'Pedidos', icono: Pedidos, path: 'pedidos', rolesPermitidos: ['ADMINISTRADOR', 'CAJERO'], visible: true },
        { nombre: 'Cocina', icono: Cocina, path: 'cocina', rolesPermitidos: ['ADMINISTRADOR', 'COCINERO'], visible: true },
        { nombre: 'Delivery', icono: Delivery, path: 'delivery', rolesPermitidos: ['ADMINISTRADOR', 'DELIVERY'], visible: true },
        { nombre: 'Clientes', icono: Usuario, path: 'clientes', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        { nombre: 'Productos', icono: Productos, path: 'productos', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        { nombre: 'Insumos', icono: Insumos, path: 'insumos', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        { nombre: 'Promociones', icono: Pedidos, path: 'promociones', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        { nombre: 'Stock', icono: Stock, path: 'stock', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        { nombre: 'Categorias', icono: Categorias, path: 'categorias', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        { nombre: 'Empleados', icono: Usuario, path: 'empleados', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        { nombre: 'Estadísticas', icono: Estadisticas, path: 'estadisticas', rolesPermitidos: ['ADMINISTRADOR'], visible: true },
        // Ruta oculta para sucursales - no aparece en el sidebar pero funciona la navegación
        { nombre: 'Sucursales', icono: null, path: 'sucursal', rolesPermitidos: ['ADMINISTRADOR'], visible: false },
    ];

    // Filtrar solo los botones visibles para el sidebar
    const botonesVisibles = botones.filter(btn =>
        btn.rolesPermitidos.includes(usuario!.rol) && btn.visible
    );

    // Obtener la ruta activa desde la URL (ej: 'cocina')
    const rutaActual = location.pathname.split("/")[2] || "dashboard";
    const botonActual = botones.find(btn => btn.path === rutaActual);

    // Si el usuario no tiene permisos para la ruta actual, redirigilo al primero que sí tenga
    useEffect(() => {
        if (usuario && (!botonActual || !botonActual.rolesPermitidos.includes(usuario.rol))) {
            const primerPermitido = botonesVisibles[0];
            if (primerPermitido) {
                navigate(`/empleado/${primerPermitido.path}`, { replace: true });
            }
        }
    }, [usuario, botonActual, navigate]);

    const renderContent = () => {
        if (!botonActual || !botonActual.rolesPermitidos.includes(usuario!.rol)) {
            return <div>No tenés permiso para ver esta sección.</div>;
        }

        const requiereContextoSucursal = !['clientes', 'empleados', 'sucursal'].includes(botonActual.path);

        if (requiereContextoSucursal && !sucursalActual && !esModoTodasSucursales) {
            return (
                <div className="text-center p-4">
                    <p>Cargando información de la sucursal...</p>
                </div>
            );
        }

        const getTitulo = (nombreSeccion: string) => {
            if (esModoTodasSucursales) {
                return `${nombreSeccion} - Todas las sucursales`;
            }
            return `${nombreSeccion} - ${sucursalActual?.nombre}`;
        };

        switch (botonActual.nombre) {
            case 'Dashboard':
                return (
                    <DashboardSection
                        sucursalActual={sucursalActual}
                        esModoTodasSucursales={esModoTodasSucursales}
                        sucursalIdSeleccionada={sucursalIdSeleccionada}
                    />
                );

            case 'Productos':
                return (
                    <div>
                        <GrillaArticuloManufacturado />
                    </div>
                );
            case 'Clientes':
                return (
                    <div>
                        <GrillaCliente />
                    </div>
                );
            case 'Pedidos':
                return (
                    <div>
                        <h2>{getTitulo('Pedidos')}</h2>
                        <GrillaPedidos />
                    </div>
                );
            case 'Cocina':
                return (
                    <div>
                        <h2>{getTitulo('Cocina')}</h2>
                        <GrillaCocina/>
                    </div>
                );
            case 'Delivery':
                return (
                    <div>
                        <h2 className="mb-4">{getTitulo('Delivery')}</h2>
                        <GrillaDelivery/>
                    </div>
                );
            case 'Estadísticas':
                return (
                    <div>
                        <DashboardEstadisticas/>
                    </div>
                );
            case 'Empleados':
                return (
                    <div>
                        <GrillaEmpleado />
                    </div>
                );
            case 'Categorias':
                return (
                    <div>
                        <GrillaCategorias/>
                    </div>
                );
            case 'Insumos':
                return(
                    <div>
                        <GrillaInsumos/>
                    </div>
                )
            case 'Stock':
                return(
                    <div>
                        <h2>{getTitulo('Stock')}</h2>
                        <GrillaStock/>
                    </div>
                )
            case 'Promociones':
                return(
                    <div>
                        <h2>{getTitulo('Promociones')}</h2>
                        <GrillaPromocion/>
                    </div>
                )
            // Nuevo caso para Sucursales
            case 'Sucursales':
                return(
                    <div>
                        <GrillaSucursal/>
                    </div>
                )
            default:
                return <div>Bienvenido al panel de administración</div>;
        }
    };

    return (
        <Container fluid className="panel-admin-container p-0">
            <Row className="g-0">
                {/* Sidebar */}
                <Col md={2} className="sidebar d-none d-md-flex flex-column p-3" style={{ backgroundColor: '#F0F0F0', minHeight: '100vh' }}>
                    <div className="mb-4 text-center">
                        <img src={Computadora} alt="Icono Computadora" style={{ height: 40, width: 40 }} />
                        <h6 className="mt-2 mb-0">Panel de Administración</h6>
                        <small>El Buen Sabor</small>
                        {sucursalActual && usuario?.rol !== 'ADMINISTRADOR' && (
                            <div className="mt-2">
                                <small className="text-muted">
                                    <strong>{sucursalActual.nombre}</strong>
                                </small>
                            </div>
                        )}
                    </div>

                    <Nav className="flex-column">
                        {botonesVisibles.map((btn) => (
                            <Nav.Link
                                key={btn.nombre}
                                onClick={() => navigate(`/empleado/${btn.path}`)}
                                className={`d-flex align-items-center mb-2 ${rutaActual === btn.path ? 'fw-bold active' : ''}`}
                                style={{
                                    cursor: 'pointer',
                                    color: '#000',
                                    backgroundColor: rutaActual === btn.path ? '#e0e0e0' : 'transparent',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                }}
                            >
                                <img src={btn.icono} alt={`Icono ${btn.nombre}`} style={{ width: 20, height: 20, marginRight: 10 }} />
                                {btn.nombre}
                            </Nav.Link>
                        ))}
                    </Nav>
                </Col>

                {/* Main content */}
                <Col md={10} className="p-4">
                    {renderContent()}
                </Col>
            </Row>
        </Container>
    );
}

export default PanelAdmin;