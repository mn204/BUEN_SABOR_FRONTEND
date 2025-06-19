import {useEffect, useState} from "react";
import {Button, Form} from "react-bootstrap";
import {createUserWithEmailAndPassword, updateProfile, signOut} from "firebase/auth";
import {auth} from "./firebase";
import type Cliente from "../../models/Cliente.ts";
import Rol from "../../models/enums/Rol.ts";
import { Eye, EyeSlash } from "react-bootstrap-icons";
import type Pais from "../../models/Pais.ts";
import type Provincia from "../../models/Provincia.ts";
import type Localidad from "../../models/Localidad.ts";
import {obtenerLocalidades, obtenerPaises, obtenerProvincias} from "../../services/LocalizacionService.ts";
import { registrarCliente } from "../../services/ClienteService.ts"; // ajusta la ruta si es necesario
import { obtenerUsuarioPorDni, obtenerUsuarioPorEmail } from "../../services/UsuarioService";

interface Props {
    onBackToLogin: () => void;
}

const RegisterCliente = ({ onBackToLogin }: Props) => {
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [dniError, setDniError] = useState<string | null>(null);

    // Primer paso
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");

    // Segundo paso
    const [dni, setDni] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [telefono, setTelefono] = useState("");
    const [pais, setPais] = useState("");
    const [provincia, setProvincia] = useState("");
    const [localidadId, setLocalidadId] = useState<number | "">("");

    const [paises, setPaises] = useState<Pais[]>([]);
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);
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
    //Pais prov localida
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

    //Verificacioness
    const passwordValida = (password: string): boolean => {
        const tieneLongitudMinima = password.length >= 8;
        const tieneMayuscula = /[A-Z]/.test(password);
        const tieneMinuscula = /[a-z]/.test(password);
        const tieneSimbolo = /[^A-Za-z0-9]/.test(password);

        return tieneLongitudMinima && tieneMayuscula && tieneMinuscula && tieneSimbolo;
    };

    const esEmailValido = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        setEmailError(null);

        if (!esEmailValido(newEmail)) {
            setEmailError("Ingresá un email válido");
            return;
        }

        try {
            const usuario = await obtenerUsuarioPorEmail(newEmail);
            if (usuario) {
                setEmailError("El email ya está en uso");
            }
        } catch (error) {
            console.error("Error al verificar email:", error);
        }
    };

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


    const validateStep1 = async () => {
        if (!nombre || !apellido || !email || !contrasena || !confirmarContrasena) {
            setFormError("Por favor completá todos los campos.");
            return;
        }
        if (!esEmailValido(email)) {
            setFormError("Ingresá un email válido.");
            return;
        }

        if (contrasena !== confirmarContrasena) {
            setFormError("Las contraseñas no coinciden.");
            return;
        }
        if (!passwordValida(contrasena)) {
            setFormError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un símbolo.");
            return;
        }

        const usuarioPorEmail = await obtenerUsuarioPorEmail(email);
        if (usuarioPorEmail) {
            setFormError("El email ya está registrado.");
            setLoading(false);
            return;
        }

        setFormError(null);
        setStep(2);
    };


    const handleRegister = async () => {

        if (!dni || !fechaNacimiento || !telefono || !pais || !provincia || !localidadId || !codigoPostal || !calle || !numero || !detalles) {
            setFormError("Te faltan campos obligatorios");
            return;
        }

        setLoading(true);
        setFormError(null);
        try {

            const usuarioPorEmail = await obtenerUsuarioPorEmail(email);
            if (usuarioPorEmail) {
                setFormError("El email ya está registrado.");
                setLoading(false);
                return;
            }

            const usuarioPorDni = await obtenerUsuarioPorDni(dni.toString());
            if (usuarioPorDni) {
                setFormError("El DNI ya está registrado.");
                setLoading(false);
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, contrasena);

            // Opcional: actualizar el nombre de usuario en Firebase
            await updateProfile(userCredential.user, {
                displayName: `${nombre} ${apellido}`
            });

            console.log("Usuario registrado en firebases con éxito:");

            console.log(JSON.stringify(userCredential.user, null, 2));

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
                usuario: {
                    email: email,
                    firebaseUid: userCredential.user.uid,
                    rol: Rol.CLIENTE,
                    dni: dni.toString(),
                    providerId: userCredential.user.providerData[0].providerId,
                    eliminado: false
                },
                pedidos: [] // si tu clase no lo requiere aún, podés omitir este campo
            };
            console.log("Cliente a enviar:", JSON.stringify(cliente, null, 2));

            const response = await registrarCliente(cliente);

            if (!response.ok) {
                // Si falla el backend, eliminar el usuario de Firebase
                await userCredential.user.delete();
                throw new Error("Error al registrar cliente en el backend. Usuario Firebase eliminado.");
              }

            if (!response.ok) throw new Error("Error al registrar cliente en el backend");

            // IMPORTANTE: Cerrar sesión del cliente recién creado
            await signOut(auth);

            alert("¡Registro exitoso! Ahora podés iniciar sesión con tu cuenta.");
            onBackToLogin(); // Vuelve al login

        } catch (error: any) {
            console.error("Error al registrar:", error);

            // Eliminar usuario si ya fue creado pero el backend no estaba corriendo
            const currentUser = auth.currentUser;
            if (currentUser) {
                try {
                    await currentUser.delete();
                    console.log("Usuario Firebase eliminado por error en el proceso.");
                } catch (deleteError) {
                    console.error("Error al eliminar usuario de Firebase:", deleteError);
                }
            }

            alert(error.message || "Error desconocido durante el registro.");
        }
    };


    return (
        <div className="p-4">
            <h3 className="text-center fw-bold">Registrate !!!</h3>
            <hr style={{ width: "150px", borderTop: "3px solid orange", margin: "0 auto 20px" }} />

            <Form>
                {step === 1 && (
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

                        <Form.Group controlId="email" className="mb-3">
                            <Form.Control
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={handleEmailChange}
                                isInvalid={!!emailError}
                                disabled={loading}
                                required
                            />
                            <Form.Control.Feedback type="invalid">
                                {emailError}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group controlId="contrasena" className="mb-3">
                            <div className="input-group">
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Contraseña"
                                    value={contrasena}
                                    onChange={(e) => setContrasena(e.target.value)}
                                    disabled={loading}
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                                </Button>
                            </div>
                            <Form.Text className="text-muted">
                                La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula y un símbolo.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group controlId="confirmarContrasena" className="mb-3">
                            <div className="input-group">
                                <Form.Control
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirmar Contraseña"
                                    value={confirmarContrasena}
                                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                                    disabled={loading}
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={loading}
                                >
                                    {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                                </Button>
                            </div>
                        </Form.Group>

                        <div className="d-grid gap-2 mb-2">
                            <Button variant="dark" onClick={validateStep1} disabled={loading}>
                                Siguiente →
                            </Button>
                            <Button variant="dark" onClick={onBackToLogin} disabled={loading}>
                                Salir
                            </Button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
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
                            }}
                            required
                            >
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
                                placeholder="Detalles adicionales de la dirección
"
                                value={detalles}
                                onChange={(e) => setDetalles(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-between">
                            <Button
                                variant="dark"
                                onClick={() => setStep(1)}
                                disabled={loading}
                            >
                                ← Atrás
                            </Button>
                            <Button
                                variant="dark"
                                onClick={handleRegister}
                                disabled={loading}
                            >
                                {loading ? "Registrando..." : "Registrarse"}
                            </Button>
                        </div>
                    </>
                )}
            </Form>

            {formError && <div className="alert alert-danger mt-3">{formError}</div>}

            <div className="text-center mt-3">
                <button
                    onClick={onBackToLogin}
                    className="btn btn-link"
                    disabled={loading}
                >
                    ¿Ya tenés cuenta? Iniciar sesión
                </button>
            </div>
        </div>
    );
};

export default RegisterCliente;
