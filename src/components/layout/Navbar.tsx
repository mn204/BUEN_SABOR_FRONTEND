import '../../styles/navbar.css'
import LogoEmpresa from '../../assets/LogoEmpresa.png';
import Vector from '../../assets/Carrito.svg';
import Buscador from './Buscador';
import { useEffect, useMemo, useState } from 'react';
import { Dropdown, Modal, Form } from 'react-bootstrap'; // <- Agregado Form aquí
import LoginUsuario from '../auth/LoginUsuario.tsx';
import { Link, useNavigate } from 'react-router-dom';
import RegisterCliente from '../auth/RegisterCliente.tsx';
import { useAuth } from "../../context/AuthContext.tsx";
import { useSucursal } from "../../context/SucursalContextEmpleado.tsx";
import { useCarrito } from '../../hooks/useCarrito.ts';
import { useSucursalUsuario } from '../../context/SucursalContext.tsx';

function Navbar() {
    const carritoCtx = useCarrito();
    const [showModal, setShowModal] = useState(false);
    const [isLoginView, setIsLoginView] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const navigate = useNavigate();
    const { isAuthenticated, getUserDisplayName, logout, usuario, user, empleado } = useAuth();
    const { sucursalActual, sucursales, cambiarSucursal, esModoTodasSucursales } = useSucursal();
    const { sucursalActualUsuario, sucursalesUsuario, cambiarSucursalUsuario, esSucursalAbierta, mostrarModalCerrada, setMostrarModalCerrada } = useSucursalUsuario();
    const cantidadArticulos = useMemo(() => {
        return carritoCtx.pedido.detalles.reduce((total, item) => total + item.cantidad, 0);
    }, [carritoCtx.pedido.detalles]);
    const sucursalEstaAbierta = sucursalActualUsuario ? esSucursalAbierta(sucursalActualUsuario) : true;


    const handleOpenLogin = () => {
        setIsLoginView(true);
        setShowModal(true);
    };

    const handleOpenRegister = () => {
        setIsLoginView(false);
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    function handleBuscar(nuevaBusqueda: string) {
        if (nuevaBusqueda.trim() !== "") {
            navigate(`/busqueda?q=${encodeURIComponent(nuevaBusqueda)}`);
            setBusqueda("");
        }
    }

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    const handleCambiarSucursal = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const valor = event.target.value;

        if (valor === "todas") {
            cambiarSucursal(null); // Modo "Todas las sucursales"
        } else {
            const sucursalId = parseInt(valor);
            const sucursalSeleccionada = sucursales.find(s => s.id === sucursalId);
            if (sucursalSeleccionada) {
                cambiarSucursal(sucursalSeleccionada);
            }
        }
    };


    return (
        <>
            <nav
                style={
                    isAuthenticated && usuario?.rol !== "CLIENTE"
                        ? { backgroundColor: "#000" }
                        : {}
                }
            >
                <div className="navContainer">
                    <div className="navLeft">
                        <Link className="homeNav" to="/">
                            <img className="logoEmpresa" src={LogoEmpresa} alt="Icono Empresa" style={{borderRadius: 100}}/>
                            <span>EL BUEN SABOR</span>
                        </Link>
                    </div>
                    <div className="navCenter">
                    {!empleado && 
                    <div className="sucursal text-white d-flex align-items-center">
                        <label htmlFor="selectSucursalUsuario" className="me-2 spanSucursalUsuario">Sucursal:</label>
                        <Form.Select
                            id="selectSucursalUsuario"
                            value={sucursalActualUsuario?.id || ""}
                            onChange={(e) => {
                                const id = parseInt(e.target.value);
                                const sucursal = sucursalesUsuario.find(s => s.id === id);
                                if (sucursal) cambiarSucursalUsuario(sucursal);
                            }}
                            style={{ width: 'auto', minWidth: '200px' }}
                        >
                            {sucursalesUsuario.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </Form.Select>
                    </div>
                    }
                        {(!isAuthenticated || usuario?.rol === "CLIENTE") ? (
                            <Buscador
                                onBuscar={handleBuscar}
                                valorInicial={busqueda}
                                setValor={setBusqueda}
                            />
                        ) : (
                            <>
                                {usuario?.rol === "ADMINISTRADOR" ? (
                                    // Select para administradores
                                    <div className="d-flex align-items-center">
                                        <label htmlFor="sucursal-select" className="me-2 text-white">
                                            Sucursal:
                                        </label>
                                        <Form.Select
                                            id="sucursal-select"
                                            value={esModoTodasSucursales ? "todas" : (sucursalActual?.id || "")}
                                            onChange={handleCambiarSucursal}
                                            style={{ width: 'auto', minWidth: '200px' }}
                                        >
                                            <option value="todas">Todas las sucursales</option>
                                            {sucursales.map(sucursal => (
                                                <option key={sucursal.id} value={sucursal.id}>
                                                    {sucursal.nombre}
                                                </option>
                                            ))}
                                        </Form.Select>

                                    </div>
                                ) : (
                                    // Mostrar sucursal fija para empleados regulares
                                    empleado?.sucursal?.nombre && (
                                        <span className="homeNav text-white">
                                            Sucursal: {empleado.sucursal.nombre}
                                        </span>
                                    )
                                )}
                            </>
                        )}
                    </div>

                    <div className="navRight navButtons">
                        {isAuthenticated ? (
                            <Dropdown>
                                <Dropdown.Toggle variant="light" id="dropdown-user" className="userDropdown">
                                    { usuario?.photoUrl ? (
                                        <img
                                            src={usuario.photoUrl}
                                            width="30"
                                            height="30"
                                            className="rounded-circle"
                                            alt="Foto de perfil del usuario"
                                        />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 16 20" fill="none">
                                            <path
                                                d="M15 19V17C15 15.9391 14.5786 14.9217 13.8284 14.1716C13.0783 13.4214 12.0609 13 11 13H5C3.93913 13 2.92172 13.4214 2.17157 14.1716C1.42143 14.9217 1 15.9391 1 17V19M12 5C12 7.20914 10.2091 9 8 9C5.79086 9 4 7.20914 4 5C4 2.79086 5.79086 1 8 1C10.2091 1 12 2.79086 12 5Z"
                                                stroke="black"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                    <span className="ms-2">{getUserDisplayName()}</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Header>
                                        {usuario?.rol && usuario?.rol !== "CLIENTE" && (
                                            <small className="text-muted">Rol: {usuario.rol}</small>
                                        )}
                                    </Dropdown.Header>
                                    <Dropdown.Item as={Link} to="/perfil">Mi Perfil</Dropdown.Item>
                                    <Dropdown.Divider />
                                    {usuario?.rol === "CLIENTE" && (
                                        <>
                                            <Dropdown.Item as={Link} to="/domicilios">Mis Domicilios</Dropdown.Item>
                                            <Dropdown.Divider />
                                            <Dropdown.Item as={Link} to="/pedidos">Mis Pedidos</Dropdown.Item>
                                            <Dropdown.Divider />
                                        </>
                                    )}
                                    <Dropdown.Item onClick={handleLogout}>Cerrar Sesión</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        ) : (
                            <button className="btnLogin" onClick={handleOpenLogin}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 16 20" fill="none">
                                    <path d="M15 19V17C15 15.9391 14.5786 14.9217 13.8284 14.1716C13.0783 13.4214 12.0609 13 11 13H5C3.93913 13 2.92172 13.4214 2.17157 14.1716C1.42143 14.9217 1 15.9391 1 17V19M12 5C12 7.20914 10.2091 9 8 9C5.79086 9 4 7.20914 4 5C4 2.79086 5.79086 1 8 1C10.2091 1 12 2.79086 12 5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Iniciar Sesión</span>
                            </button>
                        )}

                        {(!isAuthenticated || usuario?.rol === "CLIENTE") && sucursalEstaAbierta && (
                            <Link to="/carrito" className="btnCarrito position-relative" style={{ textDecoration: "none" }}>
                                {cantidadArticulos > 0 &&
                                    <span className='position-absolute text-white' style={{ bottom: 0, left: 0, backgroundColor: "red", borderRadius: 100, padding: "1px 6px", fontSize: 10 }}>{cantidadArticulos}</span>
                                }
                                <img className="carrito" src={Vector} alt="logoCarrito" />
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton className="modal-header-custom">
                    <img className='logoEmpresa' src={LogoEmpresa} alt="Icono Empresa" />
                    <Modal.Title className="modal-title-custom">{isLoginView ? 'EL BUEN SABOR' : 'EL BUEN SABOR'}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {isLoginView ? (
                        <LoginUsuario
                            onRegisterClick={handleOpenRegister}
                            onClose={handleClose}
                        />
                    ) : (
                        <RegisterCliente onBackToLogin={handleOpenLogin} />
                    )}
                </Modal.Body>
            </Modal>

            {/* Modal de sucursal cerrada */}
            <Modal
                show={mostrarModalCerrada}
                onHide={() => setMostrarModalCerrada(false)}
                centered
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header className="modal-header-custom">
                    <img className='logoEmpresa' src={LogoEmpresa} alt="Icono Empresa" style={{ width: '40px', height: '40px' }} />
                    <Modal.Title className="modal-title-custom">SUCURSAL CERRADA</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-clock text-warning" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                    </div>
                    <h5>Lo sentimos, la sucursal está cerrada</h5>
                    <p className="text-muted">
                        <strong>{sucursalActualUsuario?.nombre}</strong><br/>
                        Horario de atención: {sucursalActualUsuario?.horarioApertura?.slice(0, 5)} - {sucursalActualUsuario?.horarioCierre?.slice(0, 5)}
                    </p>
                    <p>Los pedidos no están disponibles fuera del horario de atención.</p>
                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <button
                        className="btn btn-primary"
                        onClick={() => setMostrarModalCerrada(false)}
                    >
                        Entendido
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default Navbar;