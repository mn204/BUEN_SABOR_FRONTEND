(window as any).global = window;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { CarritoProvider } from './context/CarritoContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CarritoProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </CarritoProvider>
  </StrictMode>
)
