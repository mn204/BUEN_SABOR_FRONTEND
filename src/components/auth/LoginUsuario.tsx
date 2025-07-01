// LoginUsuario.tsx
import { signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { auth, googleProvider } from "./firebase.ts";
import { useState } from "react";
import {Form, Button, InputGroup} from "react-bootstrap";
import {Eye, EyeSlash} from "react-bootstrap-icons";
import { useAuth } from "../../context/AuthContext.tsx";

interface Props {
    onRegisterClick: () => void;
    onClose?: () => void;
}

const LoginUsuario = ({ onRegisterClick , onClose}: Props) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [confirmEmail, setConfirmEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [offlineMode, setOfflineMode] = useState(false);

    const { login, loginOffline,  setIsOfflineMode } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step !== 1) return;

        if (!email) {
            setError("Por favor ingresá tu email.");
            return;
        }

        // En modo offline no necesitamos contraseña
        if (!offlineMode && !password) {
            setError("Por favor ingresá tu contraseña.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Establecer el modo offline en el contexto
            setIsOfflineMode(offlineMode);

            if (offlineMode) {
                // Login offline - solo con email
                await loginOffline(email);
                setMessage("¡Inicio de sesión offline exitoso!");
            } else {
                // Login normal con Firebase
                await login(email, password);
                setMessage("¡Inicio de sesión exitoso!");
            }

            setTimeout(() => {
                if (onClose) onClose();
            }, 1000);
        } catch (err: any) {
            console.error("Error en login:", err);

            if (offlineMode) {
                setError("Usuario no encontrado en la base de datos local. Verificá el email.");
            } else {
                if (err.message === "inactivo") {
                    setError("Tu cuenta está inactiva. Si creés que esto es un error, escribinos a buensabor@gmail.com");
                } else {
                    setError("Credenciales incorrectas. Verificá tu email y contraseña.");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (offlineMode) {
            setError("El login con Google no está disponible en modo offline.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            console.log("Usuario Google logueado:", user);

            if (onClose) onClose();
        } catch (err: any) {
            console.error("Error con Google login", err);
            setError("Error al iniciar sesión con Google");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email || !confirmEmail) {
            setError("Por favor completá ambos campos.");
            return;
        }

        if (email !== confirmEmail) {
            setError("Los emails no coinciden.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Te enviamos un correo para restablecer tu contraseña.");
            setError(null);
        } catch (error) {
            setError("No se pudo enviar el correo. Verificá que el email esté registrado.");
            setMessage(null);
        }
    };

    const handleOfflineModeChange = (checked: boolean) => {
        setOfflineMode(checked);
        setError(null);
        setMessage(null);
    };

    return (
        <Form onSubmit={handleSubmit}>
            {step === 1 && (
                <>
                    {/* Checkbox para modo offline para pruebas */}
                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            id="offline-mode"
                            label="Modo Offline (Sin conexión a internet- Pruebas)"
                            checked={offlineMode}
                            onChange={(e) => handleOfflineModeChange(e.target.checked)}
                            disabled={loading}
                        />
                        {offlineMode && (
                            <Form.Text className="text-muted">
                                En modo offline solo necesitás tu email. No se requiere contraseña.
                            </Form.Text>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </Form.Group>

                    {/* Solo mostrar campo de contraseña si no está en modo offline */}
                    {!offlineMode && (
                        <Form.Group controlId="password" className="mb-3">
                            <Form.Label>Contraseña</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeSlash /> : <Eye />}
                                </Button>
                            </InputGroup>
                        </Form.Group>
                    )}

                    {error && <div className="alert alert-danger">{error}</div>}
                    {message && <div className="alert alert-success">{message}</div>}

                    <Button
                        type="submit"
                        variant="dark"
                        className="w-100 mb-2"
                        disabled={loading}
                    >
                        {loading ?
                            (offlineMode ? "Conectando offline..." : "Iniciando sesión...") :
                            (offlineMode ? "Entrar Offline" : "Iniciar Sesión")
                        }
                    </Button>

                    {/* Solo mostrar Google login si no está en modo offline */}
                    {!offlineMode && (
                        <button
                            type="button"
                            className="btn btn-outline-dark w-100 mb-2"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <img
                                src="https://developers.google.com/identity/images/g-logo.png"
                                alt="Google"
                                width="20"
                                className="me-2"
                            />
                            {loading ? "Conectando..." : "Continuar con Google"}
                        </button>
                    )}

                    {/* Solo mostrar recuperar contraseña si no está en modo offline */}
                    {!offlineMode && (
                        <div className="text-center mt-2">
                            <Button variant="link" size="sm" onClick={() => setStep(2)}>
                                ¿Olvidaste tu contraseña?
                            </Button>
                        </div>
                    )}

                    <hr />

                    <div className="text-center mt-3">
                        <span>¿No tenés cuenta?</span><br />
                        <Button variant="link" onClick={onRegisterClick}>
                            Registrate
                        </Button>
                    </div>
                </>
            )}

            {step === 2 && (
                <>
                    <h5 className="text-center mb-3">Recuperar Contraseña</h5>

                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Confirmar Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                        />
                    </Form.Group>

                    <div className="d-grid gap-2">
                        <Button variant="dark" onClick={handlePasswordReset}>
                            Enviar correo de recuperación
                        </Button>
                        <Button variant="secondary" onClick={() => setStep(1)}>
                            ← Volver al login
                        </Button>
                    </div>

                    {error && <div className="text-danger text-center mt-2">{error}</div>}
                    {message && <div className="text-success text-center mt-2">{message}</div>}
                </>
            )}
        </Form>
    );
};

export default LoginUsuario;