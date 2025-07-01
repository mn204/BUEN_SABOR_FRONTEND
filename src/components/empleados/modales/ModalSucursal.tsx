import React, { useEffect, useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import Sucursal from "../../../models/Sucursal.ts";
import Empresa from "../../../models/Empresa.ts";
import Pais from "../../../models/Pais.ts";
import Provincia from "../../../models/Provincia.ts";
import Localidad from "../../../models/Localidad.ts";
import SucursalService from "../../../services/SucursalService.ts";
import EmpresaService from "../../../services/EmpresaService.ts";
import { obtenerPaises, obtenerProvincias, obtenerLocalidades } from "../../../services/LocalizacionService.ts";

interface ModalSucursalProps {
    show: boolean;
    onHide: () => void;
    sucursalId?: number | null; // null para crear, number para editar
    onSucursalGuardada: () => void; // Callback para recargar datos
    sucursales: Sucursal[]; // Para verificar casa matriz
}

const ModalSucursal: React.FC<ModalSucursalProps> = ({
                                                         show,
                                                         onHide,
                                                         sucursalId,
                                                         onSucursalGuardada,
                                                         sucursales
                                                     }) => {
    // Estados básicos del componente
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [guardando, setGuardando] = useState(false);
// Agregar este estado con los otros estados del formulario
    const [domicilioId, setDomicilioId] = useState<number | null>(null);
    // Estados del formulario - sucursal
    const [nombre, setNombre] = useState("");
    const [horarioApertura, setHorarioApertura] = useState("");
    const [horarioCierre, setHorarioCierre] = useState("");
    const [casaMatriz, setCasaMatriz] = useState(false);

    // Estados del formulario - domicilio
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

    // Estados para empresa
    const [empresa, setEmpresa] = useState<Empresa | null>(null);

    // Provincias filtradas por país seleccionado
    const provinciasFiltradas = provincias.filter(p => p.pais.nombre === pais);

    // Localidades filtradas por provincia seleccionada
    const localidadesFiltradas = localidades.filter(l => l.provincia.nombre === provincia);

    // Verificar si se puede mostrar el campo casa matriz
    const puedeSeleccionarCasaMatriz = () => {
        const casaMatrizActual = sucursales.find(s => s.casaMatriz && !s.eliminado);

        // Si no hay casa matriz, se puede seleccionar
        if (!casaMatrizActual) return true;

        // Si estamos editando y la sucursal actual es la casa matriz, se puede cambiar
        if (sucursalId && casaMatrizActual.id === sucursalId) return true;

        // Si no, no se puede seleccionar
        return false;
    };

    // Cargar datos iniciales
    useEffect(() => {
        if (show) {
            cargarDatosIniciales();
        }
    }, [show, sucursalId]);

    const cargarDatosIniciales = async () => {
        try {
            setLoading(true);
            setError("");

            // Cargar empresa (siempre ID 1)
            const empresaData = await EmpresaService.getEmpresaById(1);
            setEmpresa(empresaData);

            // Cargar datos de ubicación
            const paisesData = await obtenerPaises();
            const provinciasData = await obtenerProvincias();
            const localidadesData = await obtenerLocalidades();

            setPaises(paisesData);
            setProvincias(provinciasData);
            setLocalidades(localidadesData);

            // Si estamos editando, cargar datos de la sucursal
            if (sucursalId) {
                await cargarSucursal(sucursalId);
            } else {
                // Si estamos creando, limpiar formulario
                limpiarFormulario();
            }
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            setError("Error al cargar los datos iniciales");
        } finally {
            setLoading(false);
        }
    };

    const cargarSucursal = async (id: number) => {
        try {
            const sucursal = await SucursalService.getById(id);

            // Cargar datos básicos
            setNombre(sucursal.nombre || "");
            setHorarioApertura(sucursal.horarioApertura || "");
            setHorarioCierre(sucursal.horarioCierre || "");
            setCasaMatriz(sucursal.casaMatriz || false);

            // Cargar datos del domicilio
            if (sucursal.domicilio) {
                // *** AGREGAR ESTA LÍNEA ***
                setDomicilioId(sucursal.domicilio.id || null);

                setCalle(sucursal.domicilio.calle || "");
                setNumero(sucursal.domicilio.numero?.toString() || "");
                setCodigoPostal(sucursal.domicilio.codigoPostal?.toString() || "");
                setPiso(sucursal.domicilio.piso || "");
                setDepartamento(sucursal.domicilio.nroDepartamento || "");
                setDetalles(sucursal.domicilio.detalles || "");

                // Cargar ubicación
                if (sucursal.domicilio.localidad) {
                    const localidad = sucursal.domicilio.localidad;
                    setLocalidadId(localidad.id || "");

                    if (localidad.provincia) {
                        setProvincia(localidad.provincia.nombre || "");

                        if (localidad.provincia.pais) {
                            setPais(localidad.provincia.pais.nombre || "");
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error al cargar sucursal:", error);
            setError("Error al cargar los datos de la sucursal");
        }
    };

    const limpiarFormulario = () => {
        setNombre("");
        setHorarioApertura("");
        setHorarioCierre("");
        setCasaMatriz(false);
        setCalle("");
        setNumero("");
        setCodigoPostal("");
        setPiso("");
        setDepartamento("");
        setDetalles("");
        setPais("");
        setProvincia("");
        setLocalidadId("");
        setError("");
        // *** AGREGAR ESTA LÍNEA ***
        setDomicilioId(null);
    };

    const validarFormulario = (): string | null => {
        // Validar campos obligatorios
        if (!nombre.trim()) return "El nombre es obligatorio";
        if (!horarioApertura) return "El horario de apertura es obligatorio";
        if (!horarioCierre) return "El horario de cierre es obligatorio";
        if (!calle.trim()) return "La calle es obligatoria";
        if (!numero.trim()) return "El número es obligatorio";
        if (!codigoPostal.trim()) return "El código postal es obligatorio";
        if (!pais) return "El país es obligatorio";
        if (!provincia) return "La provincia es obligatoria";
        if (!localidadId) return "La localidad es obligatoria";

        // Validar que los horarios no sean iguales
        if (horarioApertura === horarioCierre) {
            return "El horario de apertura no puede ser igual al horario de cierre";
        }

        return null;
    };

    const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Solo permitir números
        if (/^\d*$/.test(value)) {
            setNumero(value);
        }
    };

    const handlePisoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Permitir números y letras para pisos como "1A", "PB", etc.
        if (/^[a-zA-Z0-9]*$/.test(value)) {
            setPiso(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errorValidacion = validarFormulario();
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        try {
            setGuardando(true);
            setError("");

            // Construir objeto domicilio
            const domicilioData: any = {
                calle: calle.trim(),
                numero: parseInt(numero),
                codigoPostal: parseInt(codigoPostal),
                piso: piso.trim() || null,
                nroDepartamento: departamento.trim() || null,
                detalles: detalles.trim() || null,
                localidad: {
                    id: Number(localidadId)
                }
            };

            // *** INCLUIR ID DEL DOMICILIO SI EXISTE ***
            if (domicilioId) {
                domicilioData.id = domicilioId;
            }

            // Construir objeto sucursal
            const sucursalData: Sucursal = {
                nombre: nombre.trim(),
                horarioApertura,
                horarioCierre,
                casaMatriz,
                empresa: empresa!,
                domicilio: domicilioData,
                eliminado: false
            };

            // *** INCLUIR ID DE LA SUCURSAL SI EXISTE ***
            if (sucursalId) {
                sucursalData.id = sucursalId;
                await SucursalService.update(sucursalId, sucursalData);
            } else {
                await SucursalService.create(sucursalData);
            }

            // Cerrar modal y recargar datos
            onSucursalGuardada();
            handleClose();
        } catch (error) {
            console.error("Error al guardar sucursal:", error);
            setError("Error al guardar la sucursal. Intente nuevamente.");
        } finally {
            setGuardando(false);
        }
    };

    const handleClose = () => {
        if (!guardando) {
            limpiarFormulario();
            onHide();
        }
    };

    const esEdicion = sucursalId !== null && sucursalId !== undefined;
    const titulo = esEdicion ? "Editar Sucursal" : "Nueva Sucursal";

    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered
            size="lg"
            backdrop="static"
            keyboard={!guardando}
        >
            <Modal.Header closeButton={!guardando}>
                <Modal.Title>{titulo}</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && (
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                    )}

                    {loading ? (
                        <div className="text-center p-4">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                            <p className="mt-2">Cargando datos...</p>
                        </div>
                    ) : (
                        <>
                            {/* Información de la empresa */}
                            {empresa && (
                                <div className="mb-4 p-3 bg-light rounded">
                                    <h6>Empresa: {empresa.nombre}</h6>
                                    <small className="text-muted">
                                        {empresa.razonSocial} - CUIL: {empresa.cuil}
                                    </small>
                                </div>
                            )}

                            {/* Datos básicos de la sucursal */}
                            <h6 className="mb-3">Datos de la Sucursal</h6>

                            <Form.Group controlId="nombre" className="mb-3">
                                <Form.Label>Nombre *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Nombre de la sucursal"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    disabled={guardando}
                                    required
                                />
                            </Form.Group>

                            {puedeSeleccionarCasaMatriz() && (
                                <Form.Group controlId="casaMatriz" className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="¿Es casa matriz?"
                                        checked={casaMatriz}
                                        onChange={(e) => setCasaMatriz(e.target.checked)}
                                        disabled={guardando}
                                    />
                                    <Form.Text className="text-muted">
                                        Solo puede haber una casa matriz activa
                                    </Form.Text>
                                </Form.Group>
                            )}

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <Form.Label>Horario de Apertura *</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={horarioApertura}
                                        onChange={(e) => setHorarioApertura(e.target.value)}
                                        disabled={guardando}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <Form.Label>Horario de Cierre *</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={horarioCierre}
                                        onChange={(e) => setHorarioCierre(e.target.value)}
                                        disabled={guardando}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Datos del domicilio */}
                            <h6 className="mb-3 mt-4">Domicilio</h6>

                            <Form.Group controlId="pais" className="mb-2">
                                <Form.Label>País *</Form.Label>
                                <Form.Select
                                    value={pais}
                                    onChange={e => {
                                        setPais(e.target.value);
                                        setProvincia("");
                                        setLocalidadId("");
                                    }}
                                    disabled={guardando}
                                    required
                                >
                                    <option value="">Seleccioná un país...</option>
                                    {paises.map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group controlId="provincia" className="mb-2">
                                <Form.Label>Provincia *</Form.Label>
                                <Form.Select
                                    value={provincia}
                                    onChange={e => {
                                        setProvincia(e.target.value);
                                        setLocalidadId("");
                                    }}
                                    disabled={guardando || !provinciasFiltradas.length}
                                    required
                                >
                                    <option value="">Seleccioná una provincia...</option>
                                    {provinciasFiltradas.map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group controlId="localidad" className="mb-2">
                                <Form.Label>Localidad *</Form.Label>
                                <Form.Select
                                    value={localidadId}
                                    onChange={e => setLocalidadId(parseInt(e.target.value))}
                                    disabled={guardando || !localidadesFiltradas.length}
                                    required
                                >
                                    <option value="">Seleccioná una localidad...</option>
                                    {localidadesFiltradas.map(l => (
                                        <option key={l.id} value={l.id}>{l.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group controlId="codigoPostal" className="mb-2">
                                <Form.Label>Código Postal *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Código Postal"
                                    value={codigoPostal}
                                    onChange={(e) => setCodigoPostal(e.target.value)}
                                    disabled={guardando}
                                    required
                                />
                            </Form.Group>

                            <Form.Group controlId="calle" className="mb-2">
                                <Form.Label>Calle *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Calle"
                                    value={calle}
                                    onChange={(e) => setCalle(e.target.value)}
                                    disabled={guardando}
                                    required
                                />
                            </Form.Group>

                            <div className="d-flex gap-2 mb-2">
                                <div className="flex-fill">
                                    <Form.Label>Número *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Número"
                                        value={numero}
                                        onChange={handleNumeroChange}
                                        disabled={guardando}
                                        required
                                    />
                                </div>
                                <div className="flex-fill">
                                    <Form.Label>Piso</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Piso"
                                        value={piso}
                                        onChange={handlePisoChange}
                                        disabled={guardando}
                                    />
                                </div>
                                <div className="flex-fill">
                                    <Form.Label>Departamento</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Número Departamento"
                                        value={departamento}
                                        onChange={(e) => setDepartamento(e.target.value)}
                                        disabled={guardando}
                                    />
                                </div>
                            </div>

                            <Form.Group controlId="detalles" className="mb-2">
                                <Form.Label>Detalles adicionales</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Detalles adicionales de la dirección"
                                    value={detalles}
                                    onChange={(e) => setDetalles(e.target.value)}
                                    disabled={guardando}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={guardando}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="warning"
                        type="submit"
                        disabled={guardando || loading}
                    >
                        {guardando ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                {esEdicion ? 'Actualizando...' : 'Creando...'}
                            </>
                        ) : (
                            esEdicion ? 'Actualizar Sucursal' : 'Crear Sucursal'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalSucursal;