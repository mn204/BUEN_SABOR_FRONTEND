import "../../styles/perfil.css";
import LogoEmpresa from '../../assets/LogoEmpresa.png';
import { useAuth } from "../../context/AuthContext";
import { sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential  } from 'firebase/auth';
import {auth} from "./firebase.ts";
import {
    actualizarDatosUsuario, actualizarEmailEnUsuario,
    actualizarEmailPorFirebaseUid,
    obtenerUsuarioPorEmail
} from "../../services/UsuarioService.ts";
import {Button, Col, Container, Form, Modal, Row, Card, Badge} from "react-bootstrap";
import {useState} from "react";
import FormDatosCliente from "../clientes/FormDatosCliente.tsx";
import FormDatosEmpleado from "../empleados/formularios/FormDatosEmpleado.tsx";

function Perfil() {

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showImagenModal, setShowImagenModal] = useState(false);
    const [showFormDatos, setShowFormDatos] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false);
    const [showPasswordErrorModal, setShowPasswordErrorModal] = useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
    const [nuevaImagen, setNuevaImagen] = useState<File | null>(null);

    const handleAbrirModalImagen = () => setShowImagenModal(true);
    const handleCerrarModalImagen = () => setShowImagenModal(false);

    const handleAbrirModalEmail = () => setShowEmailModal(true);
    const handleCerrarModalEmail = () => setShowEmailModal(false);

    const [newEmail1, setNewEmail1] = useState('');
    const [newEmail2, setNewEmail2] = useState('');

    const [email1Error, setEmail1Error] = useState('');
    const [email2Error, setEmail2Error] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('')

    // Agregar setCliente y setEmpleado del contexto
    const { cliente, empleado, usuario,  logout, setCliente, setEmpleado } = useAuth();

    const esEmpleado = !!empleado;
    const esCliente = !!cliente;

    const nombre = esEmpleado ? empleado?.nombre : cliente?.nombre;
    const apellido = esEmpleado ? empleado?.apellido : cliente?.apellido;
    const telefono = esEmpleado ? empleado?.telefono : cliente?.telefono;
    const fechaNacimiento = esEmpleado ? empleado?.fechaNacimiento : cliente?.fechaNacimiento;
    // @ts-ignore
    const fechaFormateada = fechaNacimiento?.split('-').reverse().join('/');
    const dni = esEmpleado ? empleado?.dni :  null;
    const email = usuario?.email;
    const rol = usuario?.rol;
    const providerId = usuario?.providerId;

    const domicilio = esEmpleado ? empleado?.domicilio : null;
    const esEmailValido = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    const handleNewEmail1Change = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewEmail1(value);
        setEmail1Error('');

        if (!esEmailValido(value)) {
            setEmail1Error('Ingresá un email válido');
            return;
        }

        if (value === usuario?.email) {
            setEmail1Error('Este ya es tu email actual');
            return;
        }

        try {
            const usuarioExistente = await obtenerUsuarioPorEmail(value);
            if (usuarioExistente) {
                setEmail1Error('El email ya está en uso');
            }
        } catch (err) {
            console.error("Error verificando email:", err);
        }
    };
    const handleNewEmail2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewEmail2(value);
        setEmail2Error('');

        if (newEmail1 && value !== newEmail1) {
            setEmail2Error('Los emails no coinciden');
        }
    };
    const handleEmailChange = async () => {
        setError('');
        setSuccess('');

        // Validaciones básicas
        if (!newEmail1 || !newEmail2) {
            setError('Completá ambos campos de email.');
            return;
        }

        if (!esEmailValido(newEmail1)) {
            setEmail1Error('Ingresá un email válido');
            return;
        }

        if (newEmail1 !== newEmail2) {
            setEmail2Error('Los emails no coinciden');
            return;
        }

        if (email1Error || email2Error) {
            setError('Revisá los campos con error.');
            return;
        }

        const user = auth.currentUser;

        if (user && password && usuario) {
            try {
                const email = user.email ?? '';
                const credential = EmailAuthProvider.credential(email, password);

                // Reautenticación en Firebase
                await reauthenticateWithCredential(user, credential);

                // Actualizar email en backend (Firebase UID)
                const ok1 = await actualizarEmailPorFirebaseUid(usuario.firebaseUid, newEmail1);
                if (!ok1) {
                    setError("No se pudo actualizar el email en Firebase.");
                    return;
                }

                // Actualizar email en entidad Usuario (por ID)
                const usuarioActualizado = await actualizarEmailEnUsuario(usuario, newEmail1);
                if (!usuarioActualizado) {
                    setError("No se pudo actualizar el email en la base de datos.");
                    return;
                }

                setSuccess("Email actualizado correctamente.");
                window.location.reload();
            } catch (err: any) {
                console.error('Error en reautenticación:', err);
                setError(err.message || 'Error al reautenticar.');
            }
        }
    };
    const handleCambiarContrasena = () => {
        setShowPasswordModal(true);
    };

    const handleConfirmarCambioContrasena = async () => {
        setShowPasswordModal(false);
        if (usuario?.email) {
            try {
                await sendPasswordResetEmail(auth, usuario.email);
                setShowPasswordSuccessModal(true);
            } catch (error: any) {
                setPasswordErrorMessage(error.message);
                setShowPasswordErrorModal(true);
            }
        }
    };

    const handleCerrarSesion = () => {
        setShowLogoutModal(true);
    };

    const handleConfirmarCerrarSesion = async () => {
        setShowLogoutModal(false);
        await logout();
        window.location.href = '/';
    };
    const handleSubirImagen = async () => {
        if (!nuevaImagen || !usuario) return;

        const data = new FormData();
        data.append("file", nuevaImagen);
        data.append("upload_preset", "buen_sabor");

        try {
            const res = await fetch("https://api.cloudinary.com/v1_1/dvyjtb1ns/image/upload", {
                method: "POST",
                body: data,
            });

            const file = await res.json();
            const nuevaUrl = file.secure_url;

            // Actualizar el usuario
            const usuarioActualizado = { ...usuario, photoUrl: nuevaUrl };
            await actualizarDatosUsuario(usuario.id, usuarioActualizado);

            // Actualizá el contexto o recargá la página si es necesario
            window.location.reload();
        } catch (error) {
            console.error("Error al subir imagen:", error);
        }
    };

    return (
        <div className="bg-light min-vh-100 py-5">
            <Container className="perfil">
                {/* Header con gradiente */}
                <div className="text-center mb-5">
                    <div className="bg-primary text-white py-4 rounded-top" style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)'
                    }}>
                        <h1 className="display-5 fw-bold mb-0">
                            <i className="bi bi-person-circle me-3"></i>
                            Mi Perfil
                        </h1>
                        <p className="lead mb-0 opacity-75">Gestiona tu información personal</p>
                    </div>
                </div>

                {/* Card principal */}
                <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
                    <Card.Body className="p-0">
                        <Row className="g-0">
                            {/* Sección de información */}
                            <Col lg={8} className="p-4 p-lg-5">
                                <div className="mb-4">
                                    <h3 className="text-primary mb-3 fw-bold">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Información Personal
                                    </h3>
                                    
                                    <Row className="g-4">
                                        <Col md={6}>
                                            <div className="info-item p-3 bg-light rounded-3 h-100">
                                                <div className="d-flex align-items-center mb-2">
                                                    <i className="bi bi-person-fill text-primary me-2"></i>
                                                    <small className="text-muted fw-semibold">NOMBRE COMPLETO</small>
                                                </div>
                                                <p className="mb-0 fw-bold text-dark">{nombre} {apellido}</p>
                                            </div>
                                        </Col>
                                        {esEmpleado && (

                                        <Col md={6}>
                                            <div className="info-item p-3 bg-light rounded-3 h-100">
                                                <div className="d-flex align-items-center mb-2">
                                                    <i className="bi bi-card-text text-primary me-2"></i>
                                                    <small className="text-muted fw-semibold">DNI</small>
                                                </div>
                                                <p className="mb-0 fw-bold text-dark">{dni}</p>
                                            </div>
                                        </Col>
                                            )
                                        }

                                        <Col md={6}>
                                            <div className="info-item p-3 bg-light rounded-3 h-100">
                                                <div className="d-flex align-items-center mb-2">
                                                    <i className="bi bi-calendar-date text-primary me-2"></i>
                                                    <small className="text-muted fw-semibold">FECHA DE NACIMIENTO</small>
                                                </div>
                                                <p className="mb-0 fw-bold text-dark">{fechaFormateada}</p>
                                            </div>
                                        </Col>
                                        
                                        <Col md={6}>
                                            <div className="info-item p-3 bg-light rounded-3 h-100">
                                                <div className="d-flex align-items-center mb-2">
                                                    <i className="bi bi-telephone-fill text-primary me-2"></i>
                                                    <small className="text-muted fw-semibold">TELÉFONO</small>
                                                </div>
                                                <p className="mb-0 fw-bold text-dark">{telefono}</p>
                                            </div>
                                        </Col>
                                        
                                        <Col md={12}>
                                            <div className="info-item p-3 bg-light rounded-3 h-100">
                                                <div className="d-flex align-items-center mb-2">
                                                    <i className="bi bi-envelope-fill text-primary me-2"></i>
                                                    <small className="text-muted fw-semibold">EMAIL</small>
                                                </div>
                                                <p className="mb-0 fw-bold text-dark">{email}</p>
                                            </div>
                                        </Col>
                                        
                                        {esEmpleado && (
                                            <>
                                                <Col md={6}>
                                                    <div className="info-item p-3 bg-warning bg-opacity-10 rounded-3 h-100 border border-warning border-opacity-25">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="bi bi-shield-fill-check text-warning me-2"></i>
                                                            <small className="text-muted fw-semibold">ROL</small>
                                                        </div>
                                                        <div className="d-flex align-items-center">
                                                            <Badge bg="warning" text="dark" className="px-3 py-2 fs-6">
                                                                {rol}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </Col>
                                                
                                                <Col md={6}>
                                                    <div className="info-item p-3 bg-success bg-opacity-10 rounded-3 h-100 border border-success border-opacity-25">
                                                        <div className="d-flex align-items-center mb-2">
                                                            <i className="bi bi-building text-success me-2"></i>
                                                            <small className="text-muted fw-semibold">SUCURSAL</small>
                                                        </div>
                                                        <p className="mb-0 fw-bold text-success">{empleado?.sucursal?.nombre}</p>
                                                    </div>
                                                </Col>
                                                
                                                {domicilio && (
                                                    <Col md={12}>
                                                        <div className="info-item p-3 bg-light rounded-3">
                                                            <div className="d-flex align-items-center mb-2">
                                                                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                                                                <small className="text-muted fw-semibold">DOMICILIO</small>
                                                            </div>
                                                            <p className="mb-0 fw-bold text-dark">
                                                                {domicilio.calle} {domicilio.numero}, {domicilio.localidad.nombre}, {domicilio.localidad.provincia.nombre}, {domicilio.localidad.provincia.pais.nombre}
                                                            </p>
                                                        </div>
                                                    </Col>
                                                )}
                                            </>
                                        )}
                                    </Row>
                                </div>
                            </Col>

                            {/* Sección de imagen */}
                            <Col lg={4} className="bg-gradient p-4 p-lg-5 d-flex flex-column align-items-center justify-content-center text-center" style={{
                                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                            }}>
                                <div className="position-relative mb-4">
                                    <div className="position-relative">
                                        <img
                                            src={ usuario?.photoUrl || LogoEmpresa}
                                            alt="Imagen de perfil"
                                            className="rounded-circle shadow-lg border border-4 border-white"
                                            style={{ 
                                                width: '180px', 
                                                height: '180px', 
                                                objectFit: 'cover',
                                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                        {esCliente  && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="position-absolute bottom-0 end-0 rounded-circle p-2 shadow"
                                                onClick={handleAbrirModalImagen}
                                                style={{ 
                                                    width: '40px', 
                                                    height: '40px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <i className="bi bi-camera-fill"></i>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <h4 className="fw-bold text-dark mb-1">{nombre} {apellido}</h4>
                                    {esEmpleado && (
                                        <Badge bg="primary" className="mb-3 px-3 py-2">
                                            <i className="bi bi-briefcase-fill me-1"></i>
                                            {rol}
                                        </Badge>
                                    )}
                                    {esCliente && (
                                        <Badge bg="success" className="mb-3 px-3 py-2">
                                            <i className="bi bi-person-fill me-1"></i>
                                            Cliente
                                        </Badge>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Botones de acción */}
                <div className="mt-5">
                    <Card className="shadow border-0 rounded-4">
                        <Card.Body className="p-4">
                            <h4 className="text-primary mb-4 fw-bold">
                                <i className="bi bi-gear-fill me-2"></i>
                                Configuración de Cuenta
                            </h4>
                            
                            <Row className="g-3">
                                <Col lg={6}>
                                    <Button 
                                        variant="outline-primary" 
                                        size="lg" 
                                        className="w-100 py-3 fw-semibold rounded-3 border-2"
                                        onClick={() => setShowFormDatos(true)}
                                    >
                                        <i className="bi bi-person-gear me-2"></i>
                                        Cambiar Datos Personales
                                    </Button>
                                </Col>
                                
                                {esCliente && providerId === 'password' && (
                                    <Col lg={6}>
                                        <Button 
                                            variant="outline-info" 
                                            size="lg" 
                                            className="w-100 py-3 fw-semibold rounded-3 border-2"
                                            onClick={handleAbrirModalEmail}
                                        >
                                            <i className="bi bi-envelope-at me-2"></i>
                                            Cambiar Email
                                        </Button>
                                    </Col>
                                )}
                                
                                {((esCliente && providerId === 'password') || esEmpleado) && (
                                    <Col lg={6}>
                                        <Button 
                                            variant="outline-warning" 
                                            size="lg" 
                                            className="w-100 py-3 fw-semibold rounded-3 border-2"
                                            onClick={handleCambiarContrasena}
                                        >
                                            <i className="bi bi-key me-2"></i>
                                            Cambiar Contraseña
                                        </Button>
                                    </Col>
                                )}
                                
                                <Col lg={6}>
                                    <Button 
                                        variant="outline-danger" 
                                        size="lg" 
                                        className="w-100 py-3 fw-semibold rounded-3 border-2"
                                        onClick={handleCerrarSesion}
                                    >
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        Cerrar Sesión
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </div>
            </Container>

            {/* Modal FormDatosCliente - Solo para clientes */}
            {esCliente && cliente && (
                <FormDatosCliente
                    show={showFormDatos}
                    onHide={() => setShowFormDatos(false)}
                    cliente={cliente}
                    onClienteActualizado={(clienteActualizado) => {
                        setCliente(clienteActualizado);
                        setShowFormDatos(false);
                        window.location.reload();
                    }}
                />
            )}

            {/* Modal FormDatosEmpleado - Solo para empleados */}
            {esEmpleado && empleado && (
                <FormDatosEmpleado
                    show={showFormDatos}
                    onHide={() => setShowFormDatos(false)}
                    empleado={empleado}
                    onEmpleadoActualizado={(empleadoActualizado) => {
                        setEmpleado(empleadoActualizado);
                        setShowFormDatos(false);
                        window.location.reload();
                    }}
                />
            )}

            {/* Modal email */}
            <Modal show={showEmailModal} onHide={handleCerrarModalEmail} centered size="lg">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-primary fw-bold">
                        <i className="bi bi-envelope-at me-2"></i>
                        Cambiar Email
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    <div className="alert alert-info border-0 rounded-3 mb-4">
                        <i className="bi bi-info-circle me-2"></i>
                        Cambiar el email te pedirá que vuelvas a loguearte en la página.
                    </div>

                    <Form>
                        <Row className="g-4">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold text-dark">
                                        <i className="bi bi-envelope me-1"></i>
                                        Nuevo Email
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        size="lg"
                                        value={newEmail1}
                                        onChange={handleNewEmail1Change}
                                        placeholder="Ingresá tu nuevo email"
                                        isInvalid={!!email1Error}
                                        className="rounded-3"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {email1Error}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold text-dark">
                                        <i className="bi bi-envelope-check me-1"></i>
                                        Repetir Email
                                    </Form.Label>
                                    <Form.Control
                                        type="email"
                                        size="lg"
                                        value={newEmail2}
                                        onChange={handleNewEmail2Change}
                                        placeholder="Repetí tu nuevo email"
                                        isInvalid={!!email2Error}
                                        className="rounded-3"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {email2Error}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label className="fw-semibold text-dark">
                                        <i className="bi bi-lock me-1"></i>
                                        Contraseña Actual
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        size="lg"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Ingresá tu contraseña actual"
                                        className="rounded-3"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        
                        {error && (
                            <div className="alert alert-danger border-0 rounded-3 mt-3">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="alert alert-success border-0 rounded-3 mt-3">
                                <i className="bi bi-check-circle me-2"></i>
                                {success}
                            </div>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" size="lg" onClick={handleCerrarModalEmail} className="px-4 rounded-3">
                        <i className="bi bi-x-lg me-1"></i>
                        Cancelar
                    </Button>
                    <Button variant="primary" size="lg" onClick={handleEmailChange} className="px-4 rounded-3 fw-semibold">
                        <i className="bi bi-check-lg me-1"></i>
                        Cambiar Email
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal imagen */}
            <Modal show={showImagenModal} onHide={handleCerrarModalImagen} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-primary fw-bold">
                        <i className="bi bi-camera me-2"></i>
                        Actualizar Imagen de Perfil
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    <div className="text-center mb-4">
                        <div className="upload-area p-4 border border-2 border-dashed border-primary rounded-3 bg-light">
                            <i className="bi bi-cloud-upload display-4 text-primary mb-3"></i>
                            <p className="text-muted mb-3">Selecciona una nueva imagen para tu perfil</p>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                size="lg"
                                onChange={(e) => setNuevaImagen(e.target.files?.[0] || null)}
                                className="rounded-3"
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" size="lg" onClick={handleCerrarModalImagen} className="px-4 rounded-3">
                        <i className="bi bi-x-lg me-1"></i>
                        Cancelar
                    </Button>
                    <Button variant="primary" size="lg" onClick={handleSubirImagen} className="px-4 rounded-3 fw-semibold">
                        <i className="bi bi-upload me-1"></i>
                        Subir Imagen
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Modal Cambiar Contraseña */}
            <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-warning fw-bold">
                        <i className="bi bi-key me-2"></i>
                        Cambiar Contraseña
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    <div className="alert alert-info border-0 rounded-3 mb-4">
                        <i className="bi bi-info-circle me-2"></i>
                        Se enviará un correo electrónico a tu email registrado con las instrucciones para cambiar tu contraseña.
                    </div>
                    <div className="text-center">
                        <i className="bi bi-envelope-paper display-1 text-warning mb-3"></i>
                        <p className="text-muted">¿Deseas continuar con el cambio de contraseña?</p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" size="lg" onClick={() => setShowPasswordModal(false)} className="px-4 rounded-3">
                        <i className="bi bi-x-lg me-1"></i>
                        Cancelar
                    </Button>
                    <Button variant="warning" size="lg" onClick={handleConfirmarCambioContrasena} className="px-4 rounded-3 fw-semibold">
                        <i className="bi bi-check-lg me-1"></i>
                        Enviar Email
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Cerrar Sesión */}
            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-danger fw-bold">
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Cerrar Sesión
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    <div className="text-center">
                        <i className="bi bi-question-circle display-1 text-danger mb-3"></i>
                        <h5 className="mb-3">¿Estás seguro que quieres cerrar sesión?</h5>
                        <p className="text-muted">Tendrás que volver a iniciar sesión para acceder a tu cuenta.</p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" size="lg" onClick={() => setShowLogoutModal(false)} className="px-4 rounded-3">
                        <i className="bi bi-x-lg me-1"></i>
                        Cancelar
                    </Button>
                    <Button variant="danger" size="lg" onClick={handleConfirmarCerrarSesion} className="px-4 rounded-3 fw-semibold">
                        <i className="bi bi-check-lg me-1"></i>
                        Cerrar Sesión
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Éxito Cambio Contraseña */}
            <Modal show={showPasswordSuccessModal} onHide={() => setShowPasswordSuccessModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-success fw-bold">
                        <i className="bi bi-check-circle me-2"></i>
                        Email Enviado
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    <div className="text-center">
                        <i className="bi bi-check-circle display-1 text-success mb-3"></i>
                        <h5 className="mb-3">¡Email enviado correctamente!</h5>
                        <p className="text-muted">Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.</p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="success" size="lg" onClick={() => setShowPasswordSuccessModal(false)} className="px-4 rounded-3 fw-semibold">
                        <i className="bi bi-check-lg me-1"></i>
                        Entendido
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal Error Cambio Contraseña */}
            <Modal show={showPasswordErrorModal} onHide={() => setShowPasswordErrorModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-danger fw-bold">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Error
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 py-4">
                    <div className="text-center">
                        <i className="bi bi-exclamation-triangle display-1 text-danger mb-3"></i>
                        <h5 className="mb-3">Error al enviar el correo</h5>
                        <div className="alert alert-danger border-0 rounded-3">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            {passwordErrorMessage}
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="danger" size="lg" onClick={() => setShowPasswordErrorModal(false)} className="px-4 rounded-3 fw-semibold">
                        <i className="bi bi-check-lg me-1"></i>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
}

export default Perfil;