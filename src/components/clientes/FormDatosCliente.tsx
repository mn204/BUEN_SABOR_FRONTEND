import { useState, useEffect } from "react";
import { Button, Form, Modal, Alert } from "react-bootstrap";
import type Cliente from "../../models/Cliente.ts";
import { obtenerUsuarioPorDni } from "../../services/UsuarioService";
import { actualizarCliente } from "../../services/ClienteService.ts";

interface Props {
    show: boolean;
    onHide: () => void;
    cliente: Cliente;
    onClienteActualizado: (clienteActualizado: Cliente) => void;
}

const FormDatosCliente = ({ show, onHide, cliente, onClienteActualizado }: Props) => {
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [dniError, setDniError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Estados del formulario
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [dni, setDni] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [telefono, setTelefono] = useState("");

    // Cargar datos iniciales del cliente
    useEffect(() => {
        if (cliente && show) {
            setNombre(cliente.nombre || "");
            setApellido(cliente.apellido || "");
            setDni(cliente.usuario?.dni || "");
            setTelefono(cliente.telefono || "");
            
            // Formatear fecha para el input date
            if (cliente.fechaNacimiento) {
                const fecha = new Date(cliente.fechaNacimiento);
                const fechaFormateada = fecha.toISOString().split('T')[0];
                setFechaNacimiento(fechaFormateada);
            }
        }
    }, [cliente, show]);

    // Limpiar mensajes cuando se abre el modal
    useEffect(() => {
        if (show) {
            setFormError(null);
            setDniError(null);
            setSuccessMessage(null);
        }
    }, [show]);

    const handleDniChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Solo permitir dígitos
        if (!/^\d*$/.test(value)) return;

        setDni(value);
        setDniError(null);

        // Si tiene valor y es diferente al DNI actual, verificar disponibilidad
        if (value && value !== cliente.usuario?.dni) {
            try {
                const usuario = await obtenerUsuarioPorDni(value);
                if (usuario) {
                    setDniError("DNI ya está en uso");
                }
            } catch (error) {
                console.error("Error al verificar DNI:", error);
            }
        }
    };

    const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setTelefono(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nombre || !apellido || !dni || !fechaNacimiento || !telefono) {
            setFormError("Por favor completá todos los campos.");
            return;
        }

        if (dniError) {
            setFormError("No podés guardar con errores en el DNI.");
            return;
        }

        setLoading(true);
        setFormError(null);
        setSuccessMessage(null);

        try {
            // Verificar DNI solo si cambió
            if (dni !== cliente.usuario?.dni) {
                const usuarioPorDni = await obtenerUsuarioPorDni(dni);
                if (usuarioPorDni) {
                    setFormError("El DNI ya está registrado.");
                    setLoading(false);
                    return;
                }
            }

            const clienteActualizado: Cliente = {
                ...cliente,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim(),
                fechaNacimiento: new Date(fechaNacimiento),
                usuario: {
                    ...cliente.usuario!,
                    dni: dni.trim()
                }
            };

            const response = await actualizarCliente(cliente.id!, clienteActualizado);

            if (response) {
                setSuccessMessage("¡Datos actualizados correctamente!");
                onClienteActualizado(response);
                
                // Cerrar modal después de 1.5 segundos
                setTimeout(() => {
                    onHide();
                }, 1500);
            } else {
                setFormError("Error al actualizar los datos. Intentá nuevamente.");
            }

        } catch (error: any) {
            console.error("Error al actualizar cliente:", error);
            setFormError(error.message || "Error al actualizar los datos.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onHide();
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" centered>
            <Modal.Header closeButton={!loading}>
                <Modal.Title>Editar Datos Personales</Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="nombre" className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="apellido" className="mb-3">
                        <Form.Label>Apellido</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Apellido"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="dni" className="mb-3">
                        <Form.Label>DNI</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="DNI"
                            value={dni}
                            onChange={handleDniChange}
                            isInvalid={!!dniError}
                            disabled={loading}
                            required
                        />
                        <Form.Control.Feedback type="invalid">
                            {dniError}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="fechaNacimiento" className="mb-3">
                        <Form.Label>Fecha de Nacimiento</Form.Label>
                        <Form.Control
                            type="date"
                            value={fechaNacimiento}
                            onChange={(e) => setFechaNacimiento(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            disabled={loading}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="telefono" className="mb-3">
                        <Form.Label>Teléfono</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Teléfono"
                            value={telefono}
                            onChange={handleTelefonoChange}
                            disabled={loading}
                            required
                        />
                    </Form.Group>

                    {formError && (
                        <Alert variant="danger" className="mb-3">
                            {formError}
                        </Alert>
                    )}

                    {successMessage && (
                        <Alert variant="success" className="mb-3">
                            {successMessage}
                        </Alert>
                    )}
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button 
                    variant="secondary" 
                    onClick={handleClose}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSubmit}
                    disabled={loading || !!dniError}
                >
                    {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FormDatosCliente;