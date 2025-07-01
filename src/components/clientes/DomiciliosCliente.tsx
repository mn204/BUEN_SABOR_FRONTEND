// DomiciliosCliente.tsx
import { useState } from "react";
import { Container, Row, Col, Button, Card, Modal } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaMapMarkerAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Domicilio from "../../models/Domicilio";
import ModalDomicilio from "./ModalDomicilio";
import { eliminarDomiciliosCliente } from "../../services/ClienteService.ts";

const DomiciliosCliente = () => {
    const { cliente, setCliente } = useAuth();
    const domicilios: Domicilio[] = cliente?.domicilios || [];

    const [modalVisible, setModalVisible] = useState(false);
    const [domicilioSeleccionado, setDomicilioSeleccionado] = useState<Domicilio | null>(null);

    // Estados para modal de confirmación y resultado - NUEVOS
    const [showModalConfirmacion, setShowModalConfirmacion] = useState(false);
    const [showModalResultado, setShowModalResultado] = useState(false);
    const [domicilioAEliminar, setDomicilioAEliminar] = useState<Domicilio | null>(null);
    const [mensajeResultado, setMensajeResultado] = useState("");
    const [tipoResultado, setTipoResultado] = useState<'success' | 'error'>('success');
    const [procesando, setProcesando] = useState(false);

    const handleAgregar = () => {
        setDomicilioSeleccionado(null);
        setModalVisible(true);
    };

    const handleEditar = (domicilio: Domicilio) => {
        setDomicilioSeleccionado(domicilio);
        setModalVisible(true);
    };

    // Función para mostrar confirmación de eliminación - NUEVA
    const mostrarConfirmacionEliminar = (domicilio: Domicilio) => {
        setDomicilioAEliminar(domicilio);
        setShowModalConfirmacion(true);
    };

    // Función para mostrar resultado - NUEVA
    const mostrarResultado = (mensaje: string, tipo: 'success' | 'error') => {
        setMensajeResultado(mensaje);
        setTipoResultado(tipo);
        setShowModalResultado(true);
    };

    // Función para ejecutar eliminación - ACTUALIZADA
    const ejecutarEliminacion = async () => {
        if (!cliente || !domicilioAEliminar?.id) return;

        setProcesando(true);
        setShowModalConfirmacion(false);

        try {
            await eliminarDomiciliosCliente(cliente.id, domicilioAEliminar.id);

            // Filtrar domicilio eliminado del estado actual del cliente
            const nuevosDomicilios = cliente.domicilios?.filter(d => d.id !== domicilioAEliminar.id) || [];

            // Actualizar cliente sin el domicilio eliminado
            setCliente({
                ...cliente,
                domicilios: nuevosDomicilios
            });

            mostrarResultado("Domicilio eliminado correctamente", 'success');
        } catch (error) {
            console.error("Error al eliminar domicilio:", error);
            mostrarResultado("Ocurrió un error al intentar eliminar el domicilio", 'error');
        } finally {
            setProcesando(false);
            setDomicilioAEliminar(null);
        }
    };

    // Función para cancelar eliminación - NUEVA
    const cancelarEliminacion = () => {
        setShowModalConfirmacion(false);
        setDomicilioAEliminar(null);
    };

    // Función handleEliminar actualizada - ACTUALIZADA
    const handleEliminar = (domicilio: Domicilio) => {
        mostrarConfirmacionEliminar(domicilio);
    };

    const handleModalSubmit = (clienteActualizado: any) => {
        setCliente(clienteActualizado);
    };

    // Función para obtener el nombre del domicilio - NUEVA
    const getNombreDomicilio = (domicilio: Domicilio, index: number) => {
        return domicilio.detalles || `Dirección ${index + 1}`;
    };

    return (
        <Container className="mt-5 mb-5">
            {/* Header Section */}
            <div className="text-center mb-5">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle p-3 mb-3">
                    <FaMapMarkerAlt size={32} className="text-primary" />
                </div>
                <h2 className="fw-bold text-dark mb-2" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
                    Mis Domicilios
                </h2>
                <p className="text-muted fs-6 mb-0">
                    Gestiona tus direcciones de entrega de forma fácil y rápida
                </p>
            </div>

            {/* Add Button */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <span className="text-muted small">
                        {domicilios.length} {domicilios.length === 1 ? 'dirección registrada' : 'direcciones registradas'}
                    </span>
                </div>
                <Button
                    variant="primary"
                    className="px-4 py-2 rounded-pill shadow-sm"
                    style={{
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        border: 'none',
                        transition: 'all 0.3s ease'
                    }}
                    onClick={handleAgregar}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 123, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                    }}
                >
                    <FaPlus className="me-2" />
                    Agregar dirección
                </Button>
            </div>

            {/* Content Section */}
            {domicilios.length === 0 ? (
                <div className="text-center py-5">
                    <div className="bg-light rounded-4 p-5 mx-auto" style={{ maxWidth: '500px' }}>
                        <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center p-4 mb-4 shadow-sm">
                            <FaMapMarkerAlt size={40} className="text-muted" />
                        </div>
                        <h4 className="text-dark mb-3">No tenés domicilios registrados</h4>
                        <p className="text-muted mb-4">
                            Agregá tu primera dirección para facilitar tus pedidos
                        </p>
                        <Button
                            variant="primary"
                            className="px-4 py-2 rounded-pill"
                            onClick={handleAgregar}
                        >
                            <FaPlus className="me-2" />
                            Agregar primera dirección
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="row g-3">
                    {domicilios.map((domicilio, index) => (
                        <div key={domicilio.id} className="col-12">
                            <Card
                                className="shadow-sm h-100"
                                style={{
                                    transition: 'all 0.3s ease',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                                }}
                            >
                                <Card.Body className="p-4">
                                    <Row className="align-items-start">
                                        <Col xs={1} className="d-flex justify-content-center">
                                            <div
                                                className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '40px', height: '40px' }}
                                            >
                                                <FaMapMarkerAlt className="text-primary" size={16} />
                                            </div>
                                        </Col>
                                        <Col xs={12} md={8} className="ps-3">
                                            <div className="mb-2">
                                                <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '1.1rem' }}>
                                                    {getNombreDomicilio(domicilio, index)}
                                                </h6>
                                                <div className="d-flex align-items-center">
                                                    <span
                                                        className="badge bg-light text-dark px-2 py-1 rounded-pill me-2"
                                                        style={{ fontSize: '0.75rem', fontWeight: '500' }}
                                                    >
                                                        Principal
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                <div className="mb-1">
                                                    <strong>{domicilio.calle} {domicilio.numero}</strong>
                                                    {domicilio.piso && (
                                                        <span className="ms-1">• Piso {domicilio.piso}</span>
                                                    )}
                                                    {domicilio.nroDepartamento && (
                                                        <span className="ms-1">• Dpto. {domicilio.nroDepartamento}</span>
                                                    )}
                                                </div>
                                                <div className="d-flex align-items-center text-muted">
                                                    <small>
                                                        CP {domicilio.codigoPostal} • {domicilio.localidad?.nombre}
                                                    </small>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={12} md={3} className="text-md-end mt-3 mt-md-0">
                                            <div className="d-flex flex-column flex-md-row justify-content-md-end gap-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="rounded-pill px-3"
                                                    style={{
                                                        transition: 'all 0.3s ease',
                                                        borderWidth: '1.5px'
                                                    }}
                                                    onClick={() => handleEditar(domicilio)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                        e.currentTarget.style.backgroundColor = '#007bff';
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#007bff';
                                                    }}
                                                >
                                                    <FaEdit className="me-1" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="rounded-pill px-3"
                                                    style={{
                                                        transition: 'all 0.3s ease',
                                                        borderWidth: '1.5px'
                                                    }}
                                                    onClick={() => handleEliminar(domicilio)}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.05)';
                                                        e.currentTarget.style.backgroundColor = '#dc3545';
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#dc3545';
                                                    }}
                                                >
                                                    <FaTrash className="me-1" />
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para agregar/editar */}
            {cliente && (
                <ModalDomicilio
                    show={modalVisible}
                    onHide={() => setModalVisible(false)}
                    onSubmit={handleModalSubmit}
                    domicilioActual={domicilioSeleccionado}
                    cliente={cliente}
                />
            )}

            {/* Modal de Confirmación para Eliminación - NUEVO */}
            <Modal
                show={showModalConfirmacion}
                onHide={cancelarEliminacion}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <div className="mb-3 text-danger">
                            <FaTrash size={48} />
                        </div>
                        <h5>¿Estás seguro que querés eliminar este domicilio?</h5>
                        {domicilioAEliminar && (
                            <div className="mt-3 p-3 bg-light rounded">
                                <p className="text-muted mb-1">
                                    <strong>{getNombreDomicilio(domicilioAEliminar, 0)}</strong>
                                </p>
                                <p className="small text-muted mb-0">
                                    {domicilioAEliminar.calle} {domicilioAEliminar.numero}
                                    {domicilioAEliminar.piso && `, Piso ${domicilioAEliminar.piso}`}
                                    {domicilioAEliminar.nroDepartamento && `, Dpto. ${domicilioAEliminar.nroDepartamento}`}
                                </p>
                                <p className="small text-muted mb-0">
                                    CP {domicilioAEliminar.codigoPostal} • {domicilioAEliminar.localidad?.nombre}
                                </p>
                            </div>
                        )}
                        <p className="small text-muted mt-3">
                            Esta acción no se puede deshacer.
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cancelarEliminacion} disabled={procesando}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={ejecutarEliminacion}
                        disabled={procesando}
                    >
                        {procesando ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <FaTrash className="me-2" />
                                Eliminar Domicilio
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Resultado - NUEVO */}
            <Modal
                show={showModalResultado}
                onHide={() => setShowModalResultado(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {tipoResultado === 'success' ? 'Operación Exitosa' : 'Error'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center">
                        <div className={`mb-3 ${tipoResultado === 'success' ? 'text-success' : 'text-danger'}`}>
                            {tipoResultado === 'success' ? (
                                <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-check-circle-fill" style={{ fontSize: '2rem' }}></i>
                                </div>
                            ) : (
                                <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 rounded-circle p-3">
                                    <i className="bi bi-x-circle-fill" style={{ fontSize: '2rem' }}></i>
                                </div>
                            )}
                        </div>
                        <h5>{mensajeResultado}</h5>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant={tipoResultado === 'success' ? 'success' : 'danger'}
                        onClick={() => setShowModalResultado(false)}
                    >
                        Aceptar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default DomiciliosCliente;