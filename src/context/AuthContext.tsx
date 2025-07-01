import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../components/auth/firebase';
import Usuario from '../models/Usuario';
import Cliente from '../models/Cliente';
import Empleado from '../models/Empleado';
import Rol from '../models/enums/Rol';
import { obtenerUsuarioPorFirebaseUid, obtenerUsuarioPorEmail } from '../services/UsuarioService';
import { obtenerClientePorUsuarioId } from '../services/ClienteService';
import { obtenerEmpleadoPorUsuarioId } from '../services/EmpleadoService';

interface AuthContextType {
    user: User | null;
    usuario: Usuario | null;
    cliente: Cliente | null;
    setCliente: (cliente: Cliente | null) => void;
    empleado: Empleado | null;
    setEmpleado: (empleado: Empleado | null) => void;
    loading: boolean;
    requiresGoogleRegistration: boolean;
    isOfflineMode: boolean;
    setIsOfflineMode: (offline: boolean) => void;
    login: (email: string, password: string) => Promise<void>;
    loginOffline: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    completeGoogleRegistration: () => void;
    isAuthenticated: boolean;
    hasRole: (roles: Rol[]) => boolean;
    getUserDisplayName: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [empleado, setEmpleado] = useState<Empleado | null>(null);
    const [loading, setLoading] = useState(true);
    const [requiresGoogleRegistration, setRequiresGoogleRegistration] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // Función para cargar datos del usuario desde el backend
    const loadUserData = async (firebaseUser: User) => {
        try {
            setLoading(true);
            const usuarioData = await obtenerUsuarioPorFirebaseUid(firebaseUser.uid);

            if (!usuarioData || !usuarioData.id) {
                throw new Error('Usuario no encontrado en el backend');
            }

            if (usuarioData.eliminado) {
                alert("Tu cuenta está inactiva. Si creés que esto es un error, escribinos a buensabor@gmail.com");
                await signOut(auth);
                setUser(null);
                setUsuario(null);
                setCliente(null);
                setEmpleado(null);
                setRequiresGoogleRegistration(false);
                return;
            }
            setUsuario(usuarioData);

            // Dependiendo del rol, cargar datos específicos
            if (usuarioData.rol === Rol.CLIENTE) {
                try {
                    const clienteData = await obtenerClientePorUsuarioId(usuarioData.id);
                    setCliente(clienteData);
                    setEmpleado(null);
                    setRequiresGoogleRegistration(false);
                } catch (error) {
                    console.error('Error al cargar datos del cliente:', error);
                }
            } else {
                try {
                    const empleadoData = await obtenerEmpleadoPorUsuarioId(usuarioData.id);
                    setEmpleado(empleadoData);
                    setCliente(null);
                    setRequiresGoogleRegistration(false);
                } catch (error) {
                    console.error('Error al cargar datos del empleado:', error);
                }
            }
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);

            if (firebaseUser.providerData[0]?.providerId === 'google.com') {
                console.log('Usuario de Google nuevo, requiere registro completo');
                setRequiresGoogleRegistration(true);
                setUsuario(null);
                setCliente(null);
                setEmpleado(null);
            } else {
                setUsuario(null);
                setCliente(null);
                setEmpleado(null);
            }
        } finally {
            setLoading(false);
        }
    };
    const loadUserDataOffline = async (email: string) => {
        try {
            setLoading(true);
            // Buscar usuario por email directamente en la base de datos local
            const usuarioData = await obtenerUsuarioPorEmail(email);

            if (!usuarioData || !usuarioData.id) {
                throw new Error('Usuario no encontrado en la base de datos local');
            }

            if (usuarioData.eliminado) {
                throw new Error('Usuario inactivo');
            }

            setUsuario(usuarioData);

            // Cargar datos específicos según el rol
            if (usuarioData.rol === Rol.CLIENTE) {
                try {
                    const clienteData = await obtenerClientePorUsuarioId(usuarioData.id);
                    setCliente(clienteData);
                    setEmpleado(null);
                } catch (error) {
                    console.error('Error al cargar datos del cliente:', error);
                }
            } else {
                try {
                    const empleadoData = await obtenerEmpleadoPorUsuarioId(usuarioData.id);
                    setEmpleado(empleadoData);
                    setCliente(null);
                } catch (error) {
                    console.error('Error al cargar datos del empleado:', error);
                }
            }
        } catch (error) {
            console.error('Error al cargar datos del usuario offline:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };
    // Escuchar cambios en el estado de autenticación de Firebase
    useEffect(() => {
        if (isOfflineMode) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                await loadUserData(firebaseUser);
            } else {
                setUsuario(null);
                setCliente(null);
                setEmpleado(null);
                setRequiresGoogleRegistration(false);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [isOfflineMode]);

    const login = async (email: string, password: string) => {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = credential.user;

        const usuarioData = await obtenerUsuarioPorFirebaseUid(firebaseUser.uid);
        if (!usuarioData || !usuarioData.id) {
            throw new Error("Usuario no encontrado");
        }

        if (usuarioData.eliminado) {
            await signOut(auth);
            throw new Error("inactivo");
        }

        setUser(firebaseUser);
        setUsuario(usuarioData);

        if (usuarioData.rol === Rol.CLIENTE) {
            const clienteData = await obtenerClientePorUsuarioId(usuarioData.id);
            setCliente(clienteData);
            setEmpleado(null);
        } else {
            const empleadoData = await obtenerEmpleadoPorUsuarioId(usuarioData.id);
            setEmpleado(empleadoData);
            setCliente(null);
        }
    };
    const loginOffline = async (email: string) => {
        // Crear un objeto user simulado para modo offline
        const mockUser = {
            uid: `offline_${email}`,
            email: email,
            displayName: null,
            emailVerified: true,
        } as User;

        setUser(mockUser);
        await loadUserDataOffline(email);
    };

    const logout = async () => {
        if (!isOfflineMode) {
            await signOut(auth);
        }
        setUser(null);
        setUsuario(null);
        setCliente(null);
        setEmpleado(null);
        setRequiresGoogleRegistration(false);
    };

    const completeGoogleRegistration = () => {
        setRequiresGoogleRegistration(false);
        // Recargar datos después del registro
        if (user  && !isOfflineMode) {
            loadUserData(user);
        }
    };

    const hasRole = (roles: Rol[]): boolean => {
        return usuario ? roles.includes(usuario.rol) : false;
    };

    const getUserDisplayName = (): string => {
        if (cliente) {
            return `${cliente.nombre} ${cliente.apellido}`;
        }
        if (empleado) {
            return `${empleado.nombre} ${empleado.apellido}`;
        }
        if (usuario) {
            return usuario.email;
        }
        if (user) {
            return user.displayName || user.email || 'Usuario';
        }
        return 'Usuario';
    };

    const value = {
        user,
        usuario,
        cliente,
        setCliente,
        empleado,
        setEmpleado,
        loading,
        requiresGoogleRegistration,
        isOfflineMode,
        setIsOfflineMode,
        login,
        loginOffline,
        logout,
        completeGoogleRegistration,
        isAuthenticated: !!user,
        hasRole,
        getUserDisplayName
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};