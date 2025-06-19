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
import {obtenerUsuarioPorDni, obtenerUsuarioPorEmail} from "../../services/UsuarioService.ts"; // Ajustá según tu estructura
import {registrarEmpleado} from "../../services/EmpleadoService.ts";
import { useAuth } from "../../context/AuthContext";
import type Sucursal from "../../models/Sucursal.ts";
import { obtenerSucursales } from "../../services/SucursalService";



const RegisterEmpleado = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [dniError, setDniError] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

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
    const [telefono, setTelefono] = useState("");
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

        setLoading(true);
        setFormError(null);

        // Guardar datos del admin actual
        const adminEmail = currentUser?.email;
        const adminPassword = prompt("Por favor, ingresa tu contraseña de administrador para continuar:");

        if (!adminPassword) {
            setFormError("Se requiere la contraseña del administrador para crear el empleado.");
            setLoading(false);
            return;
        }


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
                    setFormError("Error al subir la imagen del empleado.");
                    setLoading(false);
                    return;
                }
            }


            const empleado: Empleado = {
                nombre: nombre,
                apellido: apellido,
                telefono: telefono,
                fechaNacimiento: new Date(fechaNacimiento),
                eliminado: false,
                domicilio:
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
                    },
                usuario: {
                    email: email,
                    firebaseUid: userCredential.user.uid,
                    rol: rolEmpleado,
                    dni: dni.toString(),
                    providerId: userCredential.user.providerData[0].providerId || "password",
                    photoUrl: fotoUrl,
                    eliminado: false
                },
                pedidos: [], // si tu clase no lo requiere aún, podés omitir este campo
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
                        window.location.href = "/admin/nuevo-empleado";
                    }
                } catch (error) {
                    console.error("Error al restaurar sesión del admin:", error);
                    alert("Empleado creado exitosamente, pero hubo un problema al restaurar tu sesión. Por favor, inicia sesión nuevamente.");
                }
            }, 500);


            alert("¡Empleado registrado exitosamente!");
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

            // Eliminar usuario si ya fue creado pero el backend no estaba corriendo
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.email !== adminEmail) {
                try {
                    await currentUser.delete();
                    console.log("Usuario Firebase eliminado por error en el proceso.");
                } catch (deleteError) {
                    console.error("Error al eliminar usuario de Firebase:", deleteError);
                }
            }

            // Intentar restaurar sesión del admin en caso de error
            if (adminEmail && adminPassword) {
                try {
                    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
                } catch (restoreError) {
                    console.error("Error al restaurar sesión:", restoreError);
                }
            }

            setFormError(error.message || "Error desconocido durante el registro.");
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
        </div>
    );
};

export default RegisterEmpleado;