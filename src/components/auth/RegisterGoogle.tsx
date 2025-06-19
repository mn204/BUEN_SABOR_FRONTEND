import {useEffect, useState} from "react";
import { auth } from "./firebase";
import {Button, Form} from "react-bootstrap";
import type Cliente from "../../models/Cliente.ts";
import Rol from "../../models/enums/Rol.ts";
import type Pais from "../../models/Pais.ts";
import type Provincia from "../../models/Provincia.ts";
import type Localidad from "../../models/Localidad.ts";
import {obtenerLocalidades, obtenerPaises, obtenerProvincias} from "../../services/LocalizacionService.ts";
import {obtenerUsuarioPorDni} from "../../services/UsuarioService.ts";
import {registrarCliente} from "../../services/ClienteService.ts";
import {useAuth} from "../../context/AuthContext.tsx";


const RegisterGoogle = ({ onFinish }: { onFinish: () => void }) => {

    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [dniError, setDniError] = useState<string | null>(null);

    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [dni, setDni] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [telefono, setTelefono] = useState("");
    const [pais, setPais] = useState("");
    const [provincia, setProvincia] = useState("");
    const [localidadId, setLocalidadId] = useState<number | "">("");

    const [paises, setPaises] = useState<Pais[]>([]);
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);

    const { completeGoogleRegistration,logout } = useAuth();

    // Provincias filtradas por país seleccionado
    const provinciasFiltradas = provincias.filter(p => p.pais.nombre === pais);

    // Localidades filtradas por provincia seleccionada
    // @ts-ignore
    const localidadesFiltradas = localidades.filter(l => l.provincia.nombre === provincia);

    const [codigoPostal, setCodigoPostal] = useState("");
    const [calle, setCalle] = useState("");
    const [numero, setNumero] = useState("");
    const [piso, setPiso] = useState("");
    const [departamento, setDepartamento] = useState("");
    const [detalles, setDetalles] = useState("");

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

    const handleDniChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Solo permitir dígitos (sin puntos, comas ni negativos)
        if (!/^\d*$/.test(value)) return;

        setDni(value);
        setDniError(null);

        // Si tiene algún valor, consultamos al backend
        if (value) {
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
    //numeor calle
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

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };


    const handleSubmit = async () => {

        if (!nombre || !apellido || !dni || !fechaNacimiento || !telefono || !pais || !provincia || !localidadId || !codigoPostal || !calle || !numero || !detalles) {
            setFormError("Te faltan campos obligatorios");
            return;
        }
        const usuarioPorDni = await obtenerUsuarioPorDni(dni.toString());
        if (usuarioPorDni) {
            setFormError("El DNI ya está registrado.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setFormError(null);

        const user = auth.currentUser;
        if (!user) {
            setFormError("Error: Usuario no autenticado");
            setLoading(false);
            return;
        }
        try {
            // Verificar DNI una vez más antes de enviar
            const usuarioPorDni = await obtenerUsuarioPorDni(dni.toString());
            if (usuarioPorDni) {
                setFormError("El DNI ya está registrado.");
                setLoading(false);
                return;
            }
        } catch (error) {
            // Si el DNI no existe, podemos continuar
        }


        const cliente: Cliente = {
            nombre: nombre,
            apellido: apellido,
            telefono: telefono,
            fechaNacimiento: new Date(fechaNacimiento),
            eliminado: false,
            domicilios: [
                {
                    calle: calle,
                    numero: parseInt(numero),
                    codigoPostal: codigoPostal,
                    piso: piso,
                    departamento: departamento,
                    detalles: detalles,
                    eliminado: false,
                    localidad: {
                        id: localidadId
                    }
                }
            ],
            usuario:{
                email: user.email ?? "",
                rol: Rol.CLIENTE,
                firebaseUid: user.uid,
                dni: dni.toString(),
                providerId: user.providerData[0]?.providerId || "google.com",
                eliminado: false
            },
            pedidos: [] // si tu clase no lo requiere aún, podés omitir este campo
        };
        try {
            console.log("Cliente a enviar:", JSON.stringify(cliente, null, 2));

            const response = await registrarCliente(cliente);
            console.log("Respuesta del backend:", response);

            alert("¡Registro completo! Bienvenido/a a El Buen Sabor");
            completeGoogleRegistration(); // Esto actualizará el contexto
            onFinish(); // Esto cerrará el modal
        } catch (error) {
            console.error("Error al registrar cliente:", error);
            setFormError("Error al completar el registro. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }


    };

    return (
        <div className="p-4">
            <div>
                <div className="d-flex justify-content-end mb-3">
                    <Button variant="outline-danger" onClick={handleLogout}>
                        Cerrar sesión
                    </Button>
                </div>
                <h3 className="text-center fw-bold">Finaliza el Registro!</h3>
            </div>
            <p className="text-center text-muted mb-4">
                Para continuar, necesitamos algunos datos adicionales
            </p>

            <Form>
                <>
                    <Form.Group controlId="nombre" className="mb-3">
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
                        <Form.Control
                            type="text"
                            placeholder="Apellido"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </Form.Group>
                    <Form.Group controlId="dni" className="mb-2">
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

                    <Form.Group controlId="fechaNacimiento" className="mb-2">
                        <div className="d-flex p-1 align-items-end" style={{ width: "100%" }}>
                            <Form.Label style={{ width: "300px" }}> Fecha de nacimiento: </Form.Label>
                            <Form.Control
                                type="date"
                                value={fechaNacimiento}
                                onChange={(e) => setFechaNacimiento(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                                disabled={loading}
                                required
                            />
                        </div>
                    </Form.Group>


                    <Form.Group controlId="telefono" className="mb-2">
                        <Form.Control
                            type="text"
                            placeholder="Teléfono"
                            value={telefono}
                            onChange={handleTelefonoChange}
                            disabled={loading}
                            required
                        />
                    </Form.Group>

                    <Form.Group controlId="pais" className="mb-2">
                        <Form.Select value={pais} onChange={e => {
                            setPais(e.target.value);
                            setProvincia("");
                            setLocalidadId("");
                        }}>
                            <option value="">Seleccioná un país...</option>
                            {paises.map(p => (
                                <option key={p.id} value={p.nombre}>{p.nombre}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="provincia" className="mb-2">
                        <Form.Select value={provincia} onChange={e => {
                            setProvincia(e.target.value);
                            setLocalidadId("");
                        }}>
                            <option value="">Seleccioná una provincia...</option>
                            {provinciasFiltradas.map(p => (
                                <option key={p.id} value={p.nombre}>{p.nombre}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="localidad" className="mb-2">
                        <Form.Select value={localidadId} onChange={e => setLocalidadId(parseInt(e.target.value))} disabled={!localidadesFiltradas.length}
                        required>
                            <option value="">Seleccioná una localidad...</option>
                            {localidadesFiltradas.map(l => (
                                <option key={l.id} value={l.id}>{l.nombre}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="codigoPostal" className="mb-2">
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
                        <Form.Control
                            type="text"
                            placeholder="Número"
                            value={numero}
                            onChange={handleNumeroChange}
                            disabled={loading}
                            required
                        />
                        <Form.Control
                            type="text"
                            placeholder="Piso Departamento"
                            value={piso}
                            onChange={handlePisoChange}
                            disabled={loading}
                            required
                        />
                        <Form.Control
                            type="text"
                            placeholder="Número Departamento"
                            value={departamento}
                            onChange={(e) => setDepartamento(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <Form.Group controlId="detalles" className="mb-2">
                        <Form.Control
                            type="text"
                            placeholder="Detalles adicionales de la dirección"
                            value={detalles}
                            onChange={(e) => setDetalles(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </Form.Group>
                    <div className="d-flex justify-content-center">

                        <Button
                            variant="dark"
                            size="lg"
                            onClick={handleSubmit}
                            disabled={loading || !!dniError}
                        >
                            {loading ? "Completando registro..." : "Completar Registro"}
                        </Button>


                    </div>

                </>
            </Form>
            {formError && <div className="alert alert-danger mt-3">{formError}</div>}

        </div>
    );
};

export default RegisterGoogle;
