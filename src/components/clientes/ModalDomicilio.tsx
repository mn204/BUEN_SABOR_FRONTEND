import { useState, useEffect } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import type Cliente from "../../models/Cliente";
import type Domicilio from "../../models/Domicilio";
import type Pais from "../../models/Pais";
import type Provincia from "../../models/Provincia";
import type Localidad from "../../models/Localidad";
import { obtenerPaises, obtenerProvincias, obtenerLocalidades } from "../../services/LocalizacionService";
import {actualizarDomicilio} from "../../services/DomicilioService.ts";
import {actualizarCliente} from "../../services/ClienteService.ts";


interface Props {
    show: boolean;
    onHide: () => void;
    onSubmit: (clienteActualizado: Cliente) => void;
    domicilioActual: Domicilio | null;
    cliente: Cliente;
}

const ModalDomicilio = ({ show, onHide, onSubmit, domicilioActual, cliente }: Props) => {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados del formulario
    const [calle, setCalle] = useState("");
    const [numero, setNumero] = useState("");
    const [codigoPostal, setCodigoPostal] = useState("");
    const [piso, setPiso] = useState("");
    const [departamento, setDepartamento] = useState("");
    const [detalles, setDetalles] = useState("");

    // Estados para ubicación
    const [pais, setPais] = useState("");
    const [provincia, setProvincia] = useState("");
    const [localidadId, setLocalidadId] = useState<number | "">("");

    // Estados para listas de ubicación
    const [paises, setPaises] = useState<Pais[]>([]);
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);

    // Provincias filtradas por país seleccionado
    const provinciasFiltradas = provincias.filter(p => p.pais.nombre === pais);

    // Localidades filtradas por provincia seleccionada
    // @ts-ignore
    const localidadesFiltradas = localidades.filter(l => l.provincia.nombre === provincia);

    const esEdicion = !!domicilioActual;

    // Cargar datos de ubicación
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [paisesData, provinciasData, localidadesData] = await Promise.all([
                    obtenerPaises(),
                    obtenerProvincias(),
                    obtenerLocalidades()
                ]);
                setPaises(paisesData);
                setProvincias(provinciasData);
                setLocalidades(localidadesData);
            } catch (error) {
                console.error("Error al cargar datos de ubicación:", error);
                setError("Error al cargar datos de ubicación.");
            }
        };

        if (show) {
            cargarDatos();
        }
    }, [show]);

    // Cargar datos del domicilio si es edición
    useEffect(() => {
        if (show) {
            if (domicilioActual) {
                // Cargar datos para edición
                setCalle(domicilioActual.calle || "");
                setNumero(domicilioActual.numero?.toString() || "");
                setCodigoPostal(domicilioActual.codigoPostal?.toString() || "");
                setPiso(domicilioActual.piso || "");
                setDepartamento(domicilioActual.nroDepartamento || "");
                setDetalles(domicilioActual.detalles || "");

                // Datos de ubicación
                if (domicilioActual.localidad) {
                    setLocalidadId(domicilioActual.localidad.id || "");
                    setProvincia(domicilioActual.localidad.provincia?.nombre || "");
                    setPais(domicilioActual.localidad.provincia?.pais?.nombre || "");
                }
            } else {
                // Limpiar formulario para nuevo domicilio
                limpiarFormulario();
            }
            setError(null);
        }
    }, [show, domicilioActual]);

    const limpiarFormulario = () => {
        setCalle("");
        setNumero("");
        setCodigoPostal("");
        setPiso("");
        setDepartamento("");
        setDetalles("");
        setPais("");
        setProvincia("");
        setLocalidadId("");
    };

    const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setNumero(value);
        }
    };

    const handlePisoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setPiso(value);
        }
    };

    const handleClose = () => {
        if (!loading) {
            limpiarFormulario();
            onHide();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (!calle || !numero || !codigoPostal || !localidadId) {
            setError("Por favor completá todos los campos obligatorios.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const localidadSeleccionada = localidades.find(l => l.id === localidadId);
            if (!localidadSeleccionada) {
                setError("Por favor seleccioná una localidad válida.");
                setLoading(false);
                return;
            }

            const domicilioData: Domicilio = {
                ...(domicilioActual || {}),
                calle: calle.trim(),
                numero: parseInt(numero),
                codigoPostal: codigoPostal,
                piso: piso.trim(),
                nroDepartamento: departamento.trim(),
                detalles: detalles.trim(),
                localidad: localidadSeleccionada,
                eliminado: false
            };

            let clienteActualizado: Cliente | null = null;

            if (esEdicion && domicilioActual?.id) {
                // Actualizar domicilio existente
                const actualizado = await actualizarDomicilio(domicilioActual.id, domicilioData);
                if (actualizado) {
                    // Reemplazar el domicilio en el array del cliente
                    const nuevosDomicilios = cliente.domicilios.map(d =>
                        d.id === actualizado.id ? actualizado : d
                    );
                    clienteActualizado = {...cliente, domicilios: nuevosDomicilios};
                }
            } else {
                // Agregar domicilio nuevo sin ID
                const nuevosDomicilios = [...cliente.domicilios, {...domicilioData, id: undefined}];
                clienteActualizado = await actualizarCliente(cliente.id!, {
                    ...cliente,
                    domicilios: nuevosDomicilios
                });
            }

            if (clienteActualizado) {
                onSubmit(clienteActualizado);
                limpiarFormulario();
                onHide();
            } else {
                setError(`Error al ${esEdicion ? 'actualizar' : 'agregar'} el domicilio. Intentá nuevamente.`);
            }

        } catch (error: any) {
            console.error("Error al procesar domicilio:", error);
            setError(error.message || `Error al ${esEdicion ? 'actualizar' : 'agregar'} el domicilio.`);
        } finally {
            setLoading(false);
        }
    };


        return (
            <Modal show={show} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton={!loading}>
                    <Modal.Title>
                        {esEdicion ? 'Editar Domicilio' : 'Agregar Nuevo Domicilio'}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="pais" className="mb-3">
                            <Form.Label>País *</Form.Label>
                            <Form.Select
                                value={pais}
                                onChange={e => {
                                    setPais(e.target.value);
                                    setProvincia("");
                                    setLocalidadId("");
                                }}
                                disabled={loading}
                                required
                            >
                                <option value="">Seleccioná un país...</option>
                                {paises.map(p => (
                                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group controlId="provincia" className="mb-3">
                            <Form.Label>Provincia *</Form.Label>
                            <Form.Select
                                value={provincia}
                                onChange={e => {
                                    setProvincia(e.target.value);
                                    setLocalidadId("");
                                }}
                                disabled={loading || !provinciasFiltradas.length}
                                required
                            >
                                <option value="">Seleccioná una provincia...</option>
                                {provinciasFiltradas.map(p => (
                                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group controlId="localidad" className="mb-3">
                            <Form.Label>Localidad *</Form.Label>
                            <Form.Select
                                value={localidadId}
                                onChange={e => setLocalidadId(parseInt(e.target.value) || "")}
                                disabled={loading || !localidadesFiltradas.length}
                                required
                            >
                                <option value="">Seleccioná una localidad...</option>
                                {localidadesFiltradas.map(l => (
                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group controlId="calle" className="mb-3">
                            <Form.Label>Calle *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nombre de la calle"
                                value={calle}
                                onChange={(e) => setCalle(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </Form.Group>

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <Form.Label>Número *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Número"
                                    value={numero}
                                    onChange={handleNumeroChange}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <Form.Label>Código Postal *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Código Postal"
                                    value={codigoPostal}
                                    onChange={(e) => setCodigoPostal(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <Form.Label>Piso</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Piso"
                                    value={piso}
                                    onChange={handlePisoChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <Form.Group controlId="departamento" className="mb-3">
                            <Form.Label>Número de Departamento</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Número de departamento"
                                value={departamento}
                                onChange={(e) => setDepartamento(e.target.value)}
                                disabled={loading}
                            />
                        </Form.Group>

                        <Form.Group controlId="detalles" className="mb-3">
                            <Form.Label>Detalles adicionales</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Referencias, instrucciones de entrega, etc."
                                value={detalles}
                                onChange={(e) => setDetalles(e.target.value)}
                                disabled={loading}
                            />
                        </Form.Group>

                        {error && (
                            <Alert variant="danger" className="mb-3">
                                {error}
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
                        disabled={loading}
                    >
                        {loading
                            ? (esEdicion ? "Actualizando..." : "Guardando...")
                            : (esEdicion ? "Actualizar" : "Guardar")
                        }
                    </Button>
                </Modal.Footer>
            </Modal>
        );

};
export default ModalDomicilio;