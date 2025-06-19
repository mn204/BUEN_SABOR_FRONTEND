// Crear un componente wrapper para el carrito:
import React from 'react';
import { useSucursalUsuario } from './SucursalContext';
import { Navigate } from 'react-router-dom';
import{ Carrito }from '../components/articulos/Carrito.tsx'; // Ajusta la ruta según tu estructura

const CarritoProtegido: React.FC = () => {
    const { sucursalActualUsuario, esSucursalAbierta } = useSucursalUsuario();

    // Si no hay sucursal seleccionada o está cerrada, redirigir al home
    if (!sucursalActualUsuario || !esSucursalAbierta(sucursalActualUsuario)) {
        return <Navigate to="/" replace />;
    }

    return <Carrito />;
};

export default CarritoProtegido;