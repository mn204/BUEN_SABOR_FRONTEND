import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.tsx';

const Redireccion = () => {
    const { isAuthenticated, usuario } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const rutaActual = location.pathname;

        if (
            isAuthenticated &&
            usuario?.rol &&
            usuario.rol !== "CLIENTE" &&
            (rutaActual === '/' || rutaActual === '/home' || rutaActual === '/empleado')
        ) {
            // Redirección según rol
            switch (usuario.rol) {
                case "ADMINISTRADOR":
                    navigate("/empleado/dashboard");
                    break;
                case "COCINERO":
                    navigate("/empleado/cocina");
                    break;
                case "CAJERO":
                    navigate("/empleado/pedidos");
                    break;
                case "DELIVERY":
                    navigate("/empleado/delivery");
                    break;
                default:
                    navigate("/home"); // fallback seguro
                    break;
            }
        }
    }, [isAuthenticated, usuario, location]);

    return null;
};

export default Redireccion;
