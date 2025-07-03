import { useState, useEffect } from "react";
import { Button, Form, Modal, Alert } from "react-bootstrap";
import type Empleado from "../../../models/Empleado.ts";
import type Pais from "../../../models/Pais.ts";
import type Provincia from "../../../models/Provincia.ts";
import type Localidad from "../../../models/Localidad.ts";
import { actualizarEmpleado, obtenerEmpleadoPorDni } from "../../../services/EmpleadoService.ts";
import { obtenerPaises, obtenerProvincias, obtenerLocalidades } from "../../../services/LocalizacionService.ts";
import {obtenerSucursales} from "../../../services/SucursalService.ts"
import  Rol  from "../../../models/enums/Rol.ts";
import type Sucursal from "../../../models/Sucursal.ts";


interface Props {
    show: boolean;
    onHide: () => void;
    empleado: Empleado;
    onEmpleadoActualizado: (empleadoActualizado: Empleado) => void;
    editableAdmin?: boolean;
}

const FormDatosEmpleado = ({ show, onHide, empleado, onEmpleadoActualizado, editableAdmin = false }: Props) => {
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [dniError, setDniError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [telefonoError, setTelefonoError] = useState('');


    // Estados del formulario - datos personales
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [dni, setDni] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [telefono, setTelefono] = useState(""); // solo números
    const [telefonoFormateado, setTelefonoFormateado] = useState("");

    const [rolEmpleado, setRolEmpleado] = useState<Rol>(empleado.usuario.rol);
    const [sucursalSeleccionadaId, setSucursalSeleccionadaId] = useState<number | null>(empleado.sucursal?.id || null);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);

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

    // Provincias filtradas por país seleccionado
    const provinciasFiltradas = provincias.filter(p => p.pais.nombre === pais);

    // Localidades filtradas por provincia seleccionada
    const localidadesFiltradas = localidades.filter(l => l.provincia.nombre === provincia);

    const formatearTelefono = (valor: string): string => {
        // Elimina cualquier cosa que no sea número
        const soloNumeros = valor.replace(/\D/g, "").slice(0, 10); // máx 10 dígitos

        if (soloNumeros.length <= 3) return soloNumeros;
        if (soloNumeros.length <= 6) {
            return `${soloNumeros.slice(0, 3)}-${soloNumeros.slice(3)}`;
        }
        return `${soloNumeros.slice(0, 3)}-${soloNumeros.slice(3, 6)}-${soloNumeros.slice(6)}`;
    };

    const esTelefonoValido = (telefono: string): boolean => {
        const soloNumeros = telefono.replace(/\D/g, "");
        return soloNumeros.length === 10;
    };

    // Cargar datos de ubicación
    useEffect(() => {
        const cargarDatos = async () => {
            const [paisesData, provinciasData, localidadesData] = await Promise.all([
                obtenerPaises(),
                obtenerProvincias(),
                obtenerLocalidades()
            ]);
            setPaises(paisesData);
            setProvincias(provinciasData);
            setLocalidades(localidadesData);
        };

        cargarDatos();
    }, []);

    useEffect(() => {
        if (editableAdmin) {
            obtenerSucursales().then(setSucursales).catch(console.error);
        }
    }, [editableAdmin]);

    // Cargar datos iniciales del empleado
    useEffect(() => {
        if (empleado && show) {
            // Datos personales
            setNombre(empleado.nombre || "");
            setApellido(empleado.apellido || "");
            setDni(empleado.dni || "");

            // Formatear teléfono
            if (empleado.telefono) {
                const telefonoLimpio = empleado.telefono.replace(/\D/g, "");
                setTelefono(telefonoLimpio);
                setTelefonoFormateado(formatearTelefono(telefonoLimpio));

                // Validar teléfono inicial
                if (telefonoLimpio.length < 10) {
                    setTelefonoError("El número debe tener exactamente 10 dígitos.");
                } else {
                    setTelefonoError('');
                }
            } else {
                setTelefono("");
                setTelefonoFormateado("");
                setTelefonoError('');
            }

            // Formatear fecha para el input date
            if (empleado.fechaNacimiento) {
                const fecha = new Date(empleado.fechaNacimiento);
                const fechaFormateada = fecha.toISOString().split('T')[0];
                setFechaNacimiento(fechaFormateada);
            } else {
                setFechaNacimiento("");
            }

            // Datos del domicilio
            if (empleado.domicilio) {
                setCalle(empleado.domicilio.calle || "");
                setNumero(empleado.domicilio.numero?.toString() || "");
                setCodigoPostal(empleado.domicilio.codigoPostal?.toString() || "");
                setPiso(empleado.domicilio.piso || "");
                setDepartamento(empleado.domicilio.nroDepartamento || "");
                setDetalles(empleado.domicilio.detalles || "");

                // Datos de ubicación
                if (empleado.domicilio.localidad) {
                    setLocalidadId(empleado.domicilio.localidad.id || "");
                    setProvincia(empleado.domicilio.localidad.provincia?.nombre || "");
                    setPais(empleado.domicilio.localidad.provincia?.pais?.nombre || "");
                }
            }

            // Rol y sucursal (solo si lo usa el admin)
            if (editableAdmin) {
                setRolEmpleado(empleado.usuario?.rol || Rol.CAJERO);
                setSucursalSeleccionadaId(empleado.sucursal?.id || null);
            }
        }
    }, [empleado, show]);

    // Limpiar mensajes cuando se abre el modal
    useEffect(() => {
        if (show) {
            setFormError(null);
            setDniError(null);
            setSuccessMessage(null);
        }
    }, [show]);

    // 1. Agregar función de validación de DNI después de la función esTelefonoValido
    const esDniValido = (dni: string): boolean => {
        const soloNumeros = dni.replace(/\D/g, "");
        return soloNumeros.length >= 7 && soloNumeros.length <= 8;
    };

// 2. Modificar la función handleDniChange para incluir validación de longitud
    const handleDniChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Solo permitir dígitos
        if (!/^\d*$/.test(value)) return;

        // Limitar a máximo 8 dígitos
        const dniLimitado = value.slice(0, 8);
        setDni(dniLimitado);
        setDniError(null);

        // Validar longitud del DNI
        if (dniLimitado.length > 0 && dniLimitado.length < 7) {
            setDniError("El DNI debe tener entre 7 y 8 dígitos");
            return;
        }

        // Si tiene valor válido, verificar disponibilidad en la base de datos
        if (dniLimitado.length >= 7) {
            try {
                const empleadoExistente = await obtenerEmpleadoPorDni(dniLimitado);
                if (empleadoExistente) {
                    setDniError("DNI ya está en uso");
                }
            } catch (error) {
                console.error("Error al verificar DNI:", error);
                // Opcional: mostrar error si la validación falla
                // setDniError("Error al verificar disponibilidad del DNI");
            }
        }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        if (!nombre || !apellido || !dni || !fechaNacimiento || !telefono) {
            setFormError("Por favor completá todos los campos personales.");
            return;
        }

        if (!calle || !numero || !codigoPostal || !localidadId) {
            setFormError("Por favor completá todos los campos del domicilio.");
            return;
        }

        if (dniError) {
            setFormError("No podés guardar con errores en el DNI.");
            return;
        }
        if (!esTelefonoValido(telefono)) {
            setTelefonoError("El número debe tener exactamente 10 dígitos.");
            return;
        }
        // Validar DNI
        if (!esDniValido(dni)) {
            setFormError("El DNI debe tener entre 7 y 8 dígitos.");
            return;
        }
        setLoading(true);
        setFormError(null);
        setSuccessMessage(null);

        try {
            // Verificar DNI solo si cambió
            if (dni !== empleado.dni) {
                const empleadoPorDni = await obtenerEmpleadoPorDni(dni);
                if (empleadoPorDni) {
                    setFormError("El DNI ya está registrado.");
                    setLoading(false);
                    return;
                }
            }

            // Buscar la localidad seleccionada
            const localidadSeleccionada = localidades.find(l => l.id === localidadId);
            if (!localidadSeleccionada) {
                setFormError("Por favor seleccioná una localidad válida.");
                setLoading(false);
                return;
            }

            const empleadoActualizado: Empleado = {
                ...empleado,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                telefono: telefono.trim(),
                dni: dni.trim(),
                fechaNacimiento: new Date(fechaNacimiento),
                usuario: {
                    ...empleado.usuario!,
                    ...(editableAdmin && { rol: rolEmpleado }) // ← solo si es editable
                },
                domicilio: {
                    ...empleado.domicilio!,
                    calle: calle.trim(),
                    numero: parseInt(numero),
                    codigoPostal: parseInt(codigoPostal),
                    piso: piso.trim(),
                    nroDepartamento: departamento.trim(),
                    detalles: detalles.trim(),
                    localidad: localidadSeleccionada
                },
                ...(editableAdmin && { sucursal: sucursales.find(s => s.id === sucursalSeleccionadaId) })
            };

            const response = await actualizarEmpleado(empleado.id!, empleadoActualizado);

            if (response) {
                setSuccessMessage("¡Datos actualizados correctamente!");
                onEmpleadoActualizado(response);

                // Cerrar modal después de 1.5 segundos
                setTimeout(() => {
                    onHide();
                }, 1500);
            } else {
                setFormError("Error al actualizar los datos. Intentá nuevamente.");
            }

        } catch (error: any) {
            console.error("Error al actualizar empleado:", error);
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
                    <h5 className="mb-3">Datos Personales</h5>

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
                            maxLength={8} // Limitar visualmente también
                        />
                        <Form.Control.Feedback type="invalid">
                            {dniError}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                            El DNI debe tener entre 7 y 8 dígitos numéricos.
                        </Form.Text>
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
                            value={telefonoFormateado}
                            onChange={(e) => {
                                const input = e.target.value;
                                const soloNumeros = input.replace(/\D/g, "").slice(0, 10); // Solo 10 dígitos

                                setTelefono(soloNumeros); // Guardamos sin formato
                                setTelefonoFormateado(formatearTelefono(soloNumeros)); // Mostramos formateado

                                // Validamos longitud
                                if (soloNumeros.length < 10) {
                                    setTelefonoError("El número debe tener exactamente 10 dígitos.");
                                } else {
                                    setTelefonoError('');
                                }
                            }}
                            isInvalid={!!telefonoError}
                            disabled={loading}
                        />
                        <Form.Control.Feedback type="invalid">
                            {telefonoError}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                            El número debe tener 10 dígitos, sin el 15 y con el código de área.
                        </Form.Text>
                    </Form.Group>

                    {editableAdmin && (
                        <>
                            <Form.Group controlId="sucursalEmpleado" className="mb-3">
                                <Form.Label>Sucursal:</Form.Label>
                                <Form.Select
                                    value={sucursalSeleccionadaId ?? ""}
                                    onChange={(e) => setSucursalSeleccionadaId(Number(e.target.value))}
                                    required
                                >
                                    <option value="">Seleccioná una sucursal...</option>
                                    {sucursales.map((s) => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group controlId="rolEmpleado" className="mb-3">
                                <Form.Label>Rol:</Form.Label>
                                <Form.Select
                                    value={rolEmpleado}
                                    onChange={e => setRolEmpleado(e.target.value as Rol)}
                                    required
                                >
                                    {Object.values(Rol)
                                        .filter(rol => rol !== Rol.CLIENTE)
                                        .map((rol) => (
                                            <option key={rol} value={rol}>{rol}</option>
                                        ))}
                                </Form.Select>
                            </Form.Group>
                        </>
                    )}

                    <h5 className="mb-3 mt-4">Domicilio</h5>

                    <Form.Group controlId="pais" className="mb-2">
                        <Form.Label>País</Form.Label>
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

                    <Form.Group controlId="provincia" className="mb-2">
                        <Form.Label>Provincia</Form.Label>
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

                    <Form.Group controlId="localidad" className="mb-2">
                        <Form.Label>Localidad</Form.Label>
                        <Form.Select
                            value={localidadId}
                            onChange={e => setLocalidadId(parseInt(e.target.value))}
                            disabled={loading || !localidadesFiltradas.length}
                            required
                        >
                            <option value="">Seleccioná una localidad...</option>
                            {localidadesFiltradas.map(l => (
                                <option key={l.id} value={l.id}>{l.nombre}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="codigoPostal" className="mb-2">
                        <Form.Label>Código Postal</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Código Postal"
                            value={codigoPostal}
                            onChange={(e) => setCodigoPostal(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="calle" className="mb-2">
                        <Form.Label>Calle</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Calle"
                            value={calle}
                            onChange={(e) => setCalle(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </Form.Group>

                    <div className="d-flex gap-2 mb-2">
                        <div className="flex-fill">
                            <Form.Label>Número</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Número"
                                value={numero}
                                onChange={handleNumeroChange}
                                disabled={loading}
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
                                disabled={loading}
                            />
                        </div>
                        <div className="flex-fill">
                            <Form.Label>Departamento</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Número Departamento"
                                value={departamento}
                                onChange={(e) => setDepartamento(e.target.value)}
                                disabled={loading}
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
                            disabled={loading}
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

export default FormDatosEmpleado;