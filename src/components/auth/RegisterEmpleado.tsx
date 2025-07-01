import {useEffect, useState} from "react";
import { Button, Form } from "react-bootstrap";
import { createUserWithEmailAndPassword,updateProfile, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import  Rol  from "../../models/enums/Rol.ts";
import type Empleado from "../../models/Empleado.ts";
import type Pais from "../../models/Pais.ts";
import type Provincia from "../../models/Provincia.ts";
import type Localidad from "../../models/Localidad.ts";
import {obtenerLocalidades, obtenerPaises, obtenerProvincias} from "../../services/LocalizacionService.ts";
import {Eye, EyeSlash} from "react-bootstrap-icons";
import { obtenerUsuarioPorEmail} from "../../services/UsuarioService.ts"; // Ajustá según tu estructura
import {registrarEmpleado, obtenerEmpleadoPorDni} from "../../services/EmpleadoService.ts";
import { useAuth } from "../../context/AuthContext";
import type Sucursal from "../../models/Sucursal.ts";
import { obtenerSucursales } from "../../services/SucursalService";
import ModalMensaje from "../empleados/modales/ModalMensaje";



const RegisterEmpleado = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [dniError, setDniError] = useState<string | null>(null);
    const [telefonoError, setTelefonoError] = useState('');
    const { user: currentUser } = useAuth();
// POR variables de estado del modal (agregar después de la línea 88):
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");
    // Campos
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");
    const [dni, setDni] = useState("");
    const [imagenEmpleado, setImagenEmpleado] = useState<File | null>(null);
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [rolEmpleado, setRolEmpleado] = useState<Rol>(Rol.CAJERO);
    const [telefono, setTelefono] = useState(""); // solo números
    const [telefonoFormateado, setTelefonoFormateado] = useState("");
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [sucursalSeleccionadaId, setSucursalSeleccionadaId] = useState<number | undefined>(undefined);

    const [pais, setPais] = useState("");
    const [provincia, setProvincia] = useState("");
    const [localidadId, setLocalidadId] = useState<number | undefined>(undefined)

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

    const [modalMensaje, setModalMensaje] = useState({
        show: false,
        mensaje: "",
        titulo: "Mensaje",
        variante: "success" as "primary" | "success" | "danger" | "warning" | "info" | "secondary"
    });

    const mostrarModalMensaje = (mensaje: string, variante: typeof modalMensaje.variante = "success", titulo = "Mensaje") => {
        setModalMensaje({ show: true, mensaje, variante, titulo });
    };

    useEffect(() => {
        const cargarDatos = async () => {
            const [paisesData, provinciasData, localidadesData,sucursaleData] = await Promise.all([
                obtenerPaises(),
                obtenerProvincias(),
                obtenerLocalidades(),
                obtenerSucursales()
            ]);
            setPaises(paisesData);
            setProvincias(provinciasData);
            setLocalidades(localidadesData);
            setSucursales(sucursaleData);
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

    const esTelefonoValido = (telefono: string): boolean => {
        const soloNumeros = telefono.replace(/\D/g, "");
        return soloNumeros.length === 10;
    };
    const formatearTelefono = (valor: string): string => {
        // Elimina cualquier cosa que no sea número
        const soloNumeros = valor.replace(/\D/g, "").slice(0, 10); // máx 10 dígitos

        if (soloNumeros.length <= 3) return soloNumeros;
        if (soloNumeros.length <= 6) {
            return `${soloNumeros.slice(0, 3)}-${soloNumeros.slice(3)}`;
        }
        return `${soloNumeros.slice(0, 3)}-${soloNumeros.slice(3, 6)}-${soloNumeros.slice(6)}`;
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

    const handleRegister = async () => {
        if (!nombre || !apellido || !email || !contrasena || !confirmarContrasena || !dni || !fechaNacimiento || !telefono || !pais || !provincia || !localidadId || !codigoPostal || !calle || !numero || !detalles || !rolEmpleado || !sucursalSeleccionadaId) {
            setFormError("Por favor completá todos los campos.");
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


        // POR:
        setShowPasswordModal(true);
        setLoading(false);

    };

    const handleRegisterContinue = async () => {
        // Guardar datos del admin actual
        const adminEmail = currentUser?.email;


        try {
            const usuarioPorEmail = await obtenerUsuarioPorEmail(email);
            if (usuarioPorEmail) {
                setFormError(null);
                mostrarModalMensaje("El email ya está registrado.", "danger", "Error");
                setLoading(false);
                return;
            }

            const empleadoPorDni = await obtenerEmpleadoPorDni(dni.toString());
            if (empleadoPorDni) {
                setFormError(null);
                mostrarModalMensaje("El DNI ya está registrado.", "danger", "Error");
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, contrasena);

            // Opcional: actualizar el nombre de usuario en Firebase
            await updateProfile(userCredential.user, {
                displayName: `${nombre} ${apellido}`
            });

            console.log("Empleado registrado en firebases con éxito:");

            console.log(JSON.stringify(userCredential.user, null, 2));

            let fotoUrl = "";
            if (imagenEmpleado) {
                const data = new FormData();
                data.append("file", imagenEmpleado);
                data.append("upload_preset", "buen_sabor"); // o el nombre correcto del preset

                try {
                    const res = await fetch("https://api.cloudinary.com/v1_1/dvyjtb1ns/image/upload", {
                        method: "POST",
                        body: data
                    });
                    const file = await res.json();
                    fotoUrl = file.secure_url;
                } catch (error) {
                    console.error("Error al subir imagen a Cloudinary:", error);
                    setFormError(null);
                    mostrarModalMensaje("Error al subir la imagen del empleado.", "danger", "Error");
                    setLoading(false);
                    return;
                }
            }


            const empleado: Empleado = {
                nombre: nombre,
                apellido: apellido,
                telefono: telefono,
                dni: dni.toString(),
                fechaNacimiento: new Date(fechaNacimiento),
                eliminado: false,
                domicilio:
                    {
                        calle: calle,
                        numero: parseInt(numero),
                        codigoPostal: codigoPostal,
                        piso: piso,
                        nroDepartamento: departamento,
                        detalles: detalles,
                        eliminado: false,
                        localidad: {
                            id: localidadId
                        }
                    },
                usuario: {
                    email: email,
                    firebaseUid: userCredential.user.uid,
                    rol: rolEmpleado,
                    providerId: userCredential.user.providerData[0].providerId || "password",
                    photoUrl: fotoUrl,
                    eliminado: false
                },
                sucursal: {
                    id: sucursalSeleccionadaId,
                }
            };
            console.log("Empleado a enviar:", JSON.stringify(empleado, null, 2));

            const response = await registrarEmpleado(empleado);

            if (!response.ok) {
                // Si falla el backend, eliminar el usuario de Firebase
                await userCredential.user.delete();
                throw new Error("Error al registrar empleado en el backend. Usuario Firebase eliminado.");
            }

            if (!response.ok) throw new Error("Error al registrar empleado en el backend");

            await signOut(auth);

            // Esperar un momento y luego re-loguear al admin
            setTimeout(async () => {
                try {
                    if (adminEmail) {
                        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
                        console.log("Sesión de administrador restaurada")
                        mostrarModalMensaje(
                            "¡Empleado registrado exitosamente!",
                            "success",
                            "Éxito"
                        );
                        window.location.href = "/admin/nuevo-empleado";
                    }
                } catch (error) {
                    console.error("Error al restaurar sesión del admin:", error);
                    mostrarModalMensaje(
                        "Empleado creado exitosamente, pero hubo un problema al restaurar tu sesión. Por favor, inicia sesión nuevamente.",
                        "warning",
                        "Atención"
                    );
                }
            }, 500);


            setNombre("");
            setApellido("");
            setEmail("");
            setContrasena("");
            setConfirmarContrasena("");
            setDni("");
            setFechaNacimiento("");
            setTelefono("");
            setSucursales("")
            setPais("");
            setProvincia("");
            setLocalidadId(undefined);
            setCodigoPostal("");
            setCalle("");
            setNumero("");
            setPiso("");
            setDepartamento("");
            setDetalles("");
        } catch (error: any) {
            console.error("Error al registrar:", error);
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email !== adminEmail) {
                try {
                    await currentUser.delete();
                    console.log("Usuario Firebase eliminado por error en el proceso.");
                } catch (deleteError) {
                    console.error("Error al eliminar usuario de Firebase:", deleteError);
                }
            }
            if (adminEmail && adminPassword) {
                try {
                    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
                } catch (restoreError) {
                    console.error("Error al restaurar sesión:", restoreError);
                }
            }
            setFormError(null);
            mostrarModalMensaje(error.message || "Error desconocido durante el registro.", "danger", "Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4" style={{width: "600px", margin: "0 auto", border: "1px solid #ccc", borderRadius: "10px"}}>
            <div className="d-flex align-items-center justify-content-between mb-5">
                <button
                    className="btn btn-outline-secondary"
                    onClick={() => window.location.href = "/empleado/empleados"}
                >
                    Volver
                </button>

                <h3 className="text-center flex-grow-1 fw-bold m-0" style={{ marginRight: "48px" }}>
                    Nuevo Empleado
                </h3>
            </div>

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
                                    required
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
                                    required
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

                        <Form.Group controlId="rolEmpleado" className="mb-3">
                            <div className="d-flex gap-4 p-1 align-items-end" style={{width: "100%"}}>
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
                            </div>
                        </Form.Group>

                        <Form.Group controlId="fotoEmpleado" className="mb-3">
                            <div className="d-flex gap-4 p-1 align-items-end" style={{width: "100%"}}>
                            <Form.Label>Foto: </Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImagenEmpleado(e.target.files?.[0] || null)}
                            />
                            </div>
                        </Form.Group>
                        <Form.Group controlId="sucursalEmpleado" className="mb-3">
                            <div className="d-flex gap-4 p-1 align-items-end" style={{ width: "100%" }}>
                                <Form.Label>Sucursal:</Form.Label>
                                <Form.Select
                                    value={sucursalSeleccionadaId ?? ""}
                                    onChange={(e) => setSucursalSeleccionadaId(Number(e.target.value))}
                                    required
                                >
                                    <option value="">Seleccioná una sucursal...</option>
                                    {sucursales.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </Form.Group>

                        <Form.Group controlId="pais" className="mb-2">
                            <Form.Select value={pais} onChange={e => {
                                setPais(e.target.value);
                                setProvincia("");
                                setLocalidadId(undefined);  // ✅ importante
                                }
                            }
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
                                setLocalidadId(undefined);  // ✅ importante
                            }}
                         required
                        >
                                <option value="">Seleccioná una provincia...</option>
                                {provinciasFiltradas.map(p => (
                                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group controlId="localidad" className="mb-2">
                            <Form.Select
                                value={localidadId?.toString() ?? ""} // ✅ value debe ser string
                                onChange={e => {
                                    const value = e.target.value;
                                    setLocalidadId(value ? parseInt(value) : undefined); // ✅ conversión segura
                                }}
                                disabled={!localidadesFiltradas.length}
                            >
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

                        <div className="d-flex justify-content-between p-3">
                            <Button
                                variant="dark"
                                onClick={handleRegister}
                                disabled={loading}
                            >
                                {loading ? "Registrando..." : "Registrar Nuevo Empleado"}
                            </Button>
                        </div>
                    </>
            </Form>
            {formError && <div className="alert alert-danger mt-3">{formError}</div>}

            {/* Modal para contraseña de administrador */}
            <div className={`modal fade ${showPasswordModal ? 'show d-block' : ''}`} style={{backgroundColor: showPasswordModal ? 'rgba(0,0,0,0.5)' : 'transparent'}}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Confirmar Identidad</h5>
                        </div>
                        <div className="modal-body">
                            <p>Por favor, ingresa tu contraseña de administrador para continuar:</p>
                            <Form.Control
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="Contraseña de administrador"
                            />
                        </div>
                        <div className="modal-footer">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setAdminPassword("");
                                    setLoading(false);
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    if (!adminPassword) {
                                        setFormError("Se requiere la contraseña del administrador para crear el empleado.");
                                        return;
                                    }
                                    setShowPasswordModal(false);
                                    setLoading(true);
                                    // Continuar con el proceso de registro aquí
                                    handleRegisterContinue();
                                }}
                            >
                                Continuar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ModalMensaje
                show={modalMensaje.show}
                onHide={() => setModalMensaje({ ...modalMensaje, show: false })}
                mensaje={modalMensaje.mensaje}
                titulo={modalMensaje.titulo}
                variante={modalMensaje.variante}
            />
        </div>
    );
};

export default RegisterEmpleado;