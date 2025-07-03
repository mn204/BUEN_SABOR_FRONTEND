import './App.css'
import LogoEmpresa from './assets/LogoEmpresa.png';
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import { Route, Routes } from 'react-router-dom'
import Home from './components/layout/Home'
import Perfil from './components/auth/Perfil'
import FormArticuloManufacturado from './components/empleados/formularios/FormArticuloManufacturado.tsx'
import RegisterEmpleado from "./components/auth/RegisterEmpleado.tsx";
import Busqueda from './components/articulos/Busqueda.tsx'
import VistaArticulo from './components/articulos/VistaArticulo.tsx'
import FormInsumos from './components/empleados/formularios/FormInsumos.tsx'
import { AuthProvider, useAuth } from './context/AuthContext.tsx'
import ProtectedRoute from './context/ProtectedRoute.tsx'
import Rol from './models/enums/Rol.ts'
import { Modal } from "react-bootstrap";
import 'bootstrap-icons/font/bootstrap-icons.css';
import Redireccion from './context/Redireccion.tsx';
import RegisterGoogle from "./components/auth/RegisterGoogle.tsx";
import PanelAdmin from "./components/empleados/PanelAdmin.tsx";
import DomiciliosCliente from "./components/clientes/DomiciliosCliente.tsx";
import { SucursalProvider } from './context/SucursalContextEmpleado.tsx'
import PedidoCliente from './components/clientes/PedidoCliente.tsx';
import { SucursalProviderUsuario } from './context/SucursalContext.tsx';
import FormCategoria from './components/empleados/formularios/FormCategoria.tsx';
import FormStock from './components/empleados/formularios/FormStock.tsx';
import FormPromocion from './components/empleados/formularios/FormPromocion.tsx';
import PedidoConfirmado from './components/articulos/PedidoConfirmado.tsx';
import PromocionDetalle from './components/articulos/PromocionDetalle.tsx';
import BusquedaCategoria from './components/articulos/BusquedaCategoria.tsx';
import CarritoProtegido from './context/CarritoProtected.tsx';
import QuienesSomos from './components/layout/QuienesSomos.tsx';
import NuestraCompania from "./components/layout/NuestraCompañia.tsx";
import TerminosYCondiciones from "./components/layout/TerminosYCondiciones.tsx";
import { SelectorSucursal } from './components/layout/SelectorSucursal.tsx';

function AppContent() {
  const { requiresGoogleRegistration, completeGoogleRegistration, isAuthenticated, usuario } = useAuth();

  const handleGoogleRegistrationFinish = () => {
    completeGoogleRegistration();
  };

  return (
    <>
      <Navbar />
      <Redireccion />
      <SelectorSucursal/>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/busqueda" element={<Busqueda />} />
        <Route path="/articulo/:id" element={<VistaArticulo />} />
        <Route path="/promocion/:id" element={<PromocionDetalle />} />
        <Route path="/categoria/:id" element={<BusquedaCategoria />} />

        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/nuestra-compania" element={<NuestraCompania />} />
        <Route path="/terminos-y-condiciones" element={<TerminosYCondiciones />} />

        {/* Rutas para clientes autenticados */}
        <Route path="/perfil" element={
          <ProtectedRoute requiredRoles={[Rol.CLIENTE, Rol.ADMIN, Rol.CAJERO, Rol.COCINERO, Rol.DELIVERY]}>
            <Perfil />
          </ProtectedRoute>
        } />

        <Route path="/domicilios" element={
          <ProtectedRoute requiredRoles={[Rol.CLIENTE]}>
            <DomiciliosCliente />
          </ProtectedRoute>
        } />

        <Route path="/pedidoConfirmado/:id" element={
          <ProtectedRoute requiredRoles={[Rol.CLIENTE]}>
            <PedidoConfirmado
              onContinuarComprando={()=>window.location.href='/'}
              onVerPedidos={()=>window.location.href='/pedidos'}
            />
          </ProtectedRoute>
        } />

        <Route path="/pedidos" element={
          <ProtectedRoute requiredRoles={[Rol.CLIENTE]}>
            <PedidoCliente />
          </ProtectedRoute>
        } />

        <Route path="/carrito" element={<CarritoProtegido />} />



        {/* Rutas para empleados y administradores */}

        <Route path="/empleado" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN, Rol.CAJERO, Rol.COCINERO, Rol.DELIVERY]}>
            <PanelAdmin />
          </ProtectedRoute>
        } />

        <Route path="/empleado/:modulo?" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN, Rol.CAJERO, Rol.COCINERO, Rol.DELIVERY]}>
            <PanelAdmin />
          </ProtectedRoute>
        } />

        <Route path="/empleado/FormularioManufacturado" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN]}>
            <FormArticuloManufacturado />
          </ProtectedRoute>
        } />

        <Route path="/empleado/FormularioCategoria" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN]}>
            <FormCategoria />
          </ProtectedRoute>
        } />

        <Route path="/empleado/FormularioInsumo" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN]}>
            <FormInsumos />
          </ProtectedRoute>
        } />

        <Route path="/empleado/FormularioStock" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN]}>
            <FormStock />
          </ProtectedRoute>
        } />

        <Route path="/empleado/FormularioPromocion" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN]}>
            <FormPromocion />
          </ProtectedRoute>
        } />

        <Route path="/admin/nuevo-empleado/" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN]}>
            <RegisterEmpleado />
          </ProtectedRoute>
        } />

        <Route path="/empleado/sucursal" element={
          <ProtectedRoute requiredRoles={[Rol.ADMIN]}>
            <PanelAdmin />
          </ProtectedRoute>
        } />


      </Routes>
      {(!isAuthenticated || usuario?.rol === "CLIENTE") && (
        <Footer />)}

      {/* Modal obligatorio para completar registro de Google */}
      <Modal
        show={requiresGoogleRegistration}
        backdrop="static"
        keyboard={false}
        size="lg"
        centered
      >
        <Modal.Header className="modal-header-custom">
          <img className='logoEmpresa' src={LogoEmpresa} alt="Icono Empresa" style={{ width: '40px', height: '40px' }} />
          <Modal.Title className="modal-title-custom">EL BUEN SABOR</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RegisterGoogle onFinish={handleGoogleRegistrationFinish} />
        </Modal.Body>
      </Modal>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <SucursalProvider>
        <SucursalProviderUsuario>
          <AppContent />
        </SucursalProviderUsuario>
      </SucursalProvider>
    </AuthProvider>
  );
}

export default App
