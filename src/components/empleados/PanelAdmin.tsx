import { Container, Row, Col, Nav } from 'react-bootstrap';
import '../../styles/panelAdmin.css';

import Computadora from '../../assets/svgAdmin/computadora.svg';
import Dashboard from '../../assets/svgAdmin/dashboard.svg';
import Pedidos from '../../assets/svgAdmin/pedidos.svg';
import Cocina from '../../assets/svgAdmin/cocina.svg';
import Delivery from '../../assets/svgAdmin/delivery.svg';
import Facturacion from '../../assets/svgAdmin/facturacion.svg';
import Productos from '../../assets/svgAdmin/productos.svg';
import Insumos from '../../assets/svgAdmin/insumos.svg';
import Categorias from '../../assets/svgAdmin/categorias.svg';
import Stock from '../../assets/svgAdmin/stock.svg';
import Estadisticas from '../../assets/svgAdmin/estadisticas.svg';
import Usuario from '../../assets/svgAdmin/usuario-black.svg';
import GrillaArticuloManufacturado from "./grillas/GrillaArticuloManufacturado.tsx";
import GrillaCliente from "./grillas/GrillaCliente.tsx";
import GrillaEmpleado from "./grillas/GrillaEmpleado.tsx";
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
        { nombre: 'Dashboard', icono: Dashboard, path: 'dashboard', rolesPermitidos: ['ADMINISTRADOR'] },
        { nombre: 'Pedidos', icono: Pedidos, path: 'pedidos', rolesPermitidos: ['ADMINISTRADOR', 'CAJERO'] },
        { nombre: 'Cocina', icono: Cocina, path: 'cocina', rolesPermitidos: ['ADMINISTRADOR', 'COCINERO'] },
        { nombre: 'Delivery', icono: Delivery, path: 'delivery', rolesPermitidos: ['ADMINISTRADOR', 'DELIVERY'] },
        { nombre: 'Clientes', icono: Usuario, path: 'clientes', rolesPermitidos: ['ADMINISTRADOR'] },
        { nombre: 'Productos', icono: Productos, path: 'productos', rolesPermitidos: ['ADMINISTRADOR'] },
        { nombre: 'Insumos', icono: Insumos, path: 'insumos', rolesPermitidos: ['ADMINISTRADOR'] },
        { nombre: 'Promociones', icono: Pedidos, path: 'promociones', rolesPermitidos: ['ADMINISTRADOR'] },
        { nombre: 'Stock', icono: Stock, path: 'stock', rolesPermitidos: ['ADMINISTRADOR'] },
        { nombre: 'Categorias', icono: Categorias, path: 'categorias', rolesPermitidos: ['ADMINISTRADOR'] },
        { nombre: 'Empleados', icono: Usuario, path: 'empleados', rolesPermitidos: ['ADMINISTRADOR'] },
        { nombre: 'Estadísticas', icono: Estadisticas, path: 'estadisticas', rolesPermitidos: ['ADMINISTRADOR'] },
        
    ];

    const botonesVisibles = botones.filter(btn =>
        btn.rolesPermitidos.includes(usuario!.rol)
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

        const requiereContextoSucursal = !['clientes', 'empleados'].includes(botonActual.path);

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
                        <GrillaStock/>
                    </div>
                )
            case 'Promociones':
                return(
                    <div>
                        <GrillaPromocion/>
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
