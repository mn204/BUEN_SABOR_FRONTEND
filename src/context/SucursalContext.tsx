// 1. MODIFICAR SucursalContext.tsx - Agregar función para verificar si está abierta

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Sucursal from '../models/Sucursal';
import { obtenerSucursales } from '../services/SucursalService';
import SucursalService from "../services/SucursalService";

interface SucursalContextType {
    sucursalActualUsuario: Sucursal | null;
    sucursalesUsuario: Sucursal[];
    cambiarSucursalUsuario: (sucursal: Sucursal) => void;
    loading: boolean;
    esSucursalAbierta: (sucursal: Sucursal) => boolean; // NUEVA FUNCIÓN
    mostrarModalCerrada: boolean; // NUEVO ESTADO
    setMostrarModalCerrada: (mostrar: boolean) => void; // NUEVA FUNCIÓN
}

const SucursalContext = createContext<SucursalContextType | undefined>(undefined);

interface SucursalProviderProps {
    children: ReactNode;
}

export const SucursalProviderUsuario: React.FC<SucursalProviderProps> = ({ children }) => {
    const [sucursalActualUsuario, setSucursalActual] = useState<Sucursal | null>(null);
    const [sucursalesUsuario, setSucursales] = useState<Sucursal[]>([]);
    const [loading, setLoading] = useState(true);
    const [mostrarModalCerrada, setMostrarModalCerrada] = useState(false); // NUEVO ESTADO

    // NUEVA FUNCIÓN: Verificar si la sucursal está abierta
    const esSucursalAbierta = (sucursal: Sucursal): boolean => {
        if (!sucursal) return false;

        const ahora = new Date();
        const horaActual = ahora.getHours() * 60 + ahora.getMinutes(); // Minutos desde medianoche

        // Convertir horarios de la sucursal a minutos
        const [horaApertura, minApertura] = sucursal.horarioApertura.split(':').map(Number);
        const [horaCierre, minCierre] = sucursal.horarioCierre.split(':').map(Number);

        const minutosApertura = horaApertura * 60 + minApertura;
        const minutosCierre = horaCierre * 60 + minCierre;

        // Caso especial: si cierre es 00:00:00, significa que está abierto 24 horas
        if (minutosCierre === 0 && horaCierre === 0) {
            return true;
        }

        // Caso normal: verificar si está dentro del horario
        if (minutosApertura <= minutosCierre) {
            // Horario normal (no cruza medianoche)
            return horaActual >= minutosApertura && horaActual < minutosCierre;
        } else {
            // Horario que cruza medianoche
            return horaActual >= minutosApertura || horaActual < minutosCierre;
        }
    };

    const cargarSucursales = async () => {
        try {
            const sucursalesData = await SucursalService.getAllNoEliminadas();
            setSucursales(sucursalesData);
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
        }
    };

    // Inicializar el contexto de sucursal cuando el usuario se autentica
    useEffect(() => {
        const inicializarContextoSucursal = async () => {
            try {
                // Para administradores: cargar todas las sucursales y establecer por defecto la sucursal 1
                await cargarSucursales();
                const sucursalesData = await SucursalService.getAllNoEliminadas();
                const storedSucursal = localStorage.getItem('sucursalActualUsuario');
                if (storedSucursal) {
                    const sucursalGuardada: Sucursal = JSON.parse(storedSucursal);
                    const existe = sucursalesData.find(s => s.id === sucursalGuardada.id);
                    if (existe) {
                        setSucursalActual(sucursalGuardada);
                        return;
                    }
                }
                // Buscar sucursal con id 1 o la primera disponible
                const sucursalPorDefecto = sucursalesData.find(s => s.id === 1) || sucursalesData[0];
                if (sucursalPorDefecto) {
                    setSucursalActual(sucursalPorDefecto);
                }
            } catch (error) {
                console.error('Error al inicializar contexto de sucursal:', error);
            } finally {
                setLoading(false);
            }
        };

        inicializarContextoSucursal();
    }, []);

    // NUEVO EFECTO: Verificar horario cada vez que cambia la sucursal
    useEffect(() => {
        if (sucursalActualUsuario) {
            const verificarHorario = () => {
                const estaAbierta = esSucursalAbierta(sucursalActualUsuario);
                if (!estaAbierta) {
                    setMostrarModalCerrada(true);
                }
            };

            // Verificar inmediatamente
            verificarHorario();

            // Verificar cada minuto
            const interval = setInterval(verificarHorario, 60000);

            return () => clearInterval(interval);
        }
    }, [sucursalActualUsuario]);

    const cambiarSucursalUsuario = (sucursal: Sucursal) => {
        setSucursalActual(sucursal);
        localStorage.setItem('sucursalActualUsuario', JSON.stringify(sucursal));
        // Verificar horario de la nueva sucursal
        if (!esSucursalAbierta(sucursal)) {
            setMostrarModalCerrada(true);
        } else {
            setMostrarModalCerrada(false);
        }
    };

    const value = {
        sucursalActualUsuario,
        sucursalesUsuario,
        cambiarSucursalUsuario,
        loading,
        esSucursalAbierta, // NUEVA FUNCIÓN EXPORTADA
        mostrarModalCerrada, // NUEVO ESTADO EXPORTADO
        setMostrarModalCerrada // NUEVA FUNCIÓN EXPORTADA
    };

    return (
        <SucursalContext.Provider value={value}>
            {children}
        </SucursalContext.Provider>
    );
};

export const useSucursalUsuario = () => {
    const context = useContext(SucursalContext);
    if (context === undefined) {
        throw new Error('useSucursal debe ser usado dentro de un SucursalProvider');
    }
    return context;
};