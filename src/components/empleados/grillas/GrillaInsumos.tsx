import { useState, useEffect } from "react";
import InsumoService from "../../../services/ArticuloInsumoService.ts";
import CategoriaService from "../../../services/CategoriaService.ts";
import Insumo from "../../../models/ArticuloInsumo.ts";
import Categoria from "../../../models/Categoria.ts";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { ReusableTable } from "../../Tabla";
import BotonVer from "../../layout/BotonVer.tsx";
import BotonEliminar from "../../layout/BotonEliminar.tsx";
import BotonModificar from "../../layout/BotonModificar.tsx";
import BotonAlta from "../../layout/BotonAlta.tsx";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import ArticuloInsumoService from "../../../services/ArticuloInsumoService.ts";
import type ArticuloInsumo from "../../../models/ArticuloInsumo.ts";

interface PageResponse {
  content: Insumo[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
}

function GrillaInsumos() {
  const [insumos, setInsumos] = useState<ArticuloInsumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);



  // Modal Ver
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [showModalInfo, setShowModalInfo] = useState(false);
  const [showModalConfirmacion, setShowModalConfirmacion] = useState(false);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<Insumo | null>(null);
  const [modalTitulo, setModalTitulo] = useState("");
  const [modalMensaje, setModalMensaje] = useState("");
  const [accionConfirmada, setAccionConfirmada] = useState<(() => void) | null>(null);

  // Filtros
  const [filtroDenominacion, setFiltroDenominacion] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPrecioMin, setFiltroPrecioMin] = useState("");
  const [filtroPrecioMax, setFiltroPrecioMax] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    cargarInsumos();
    CategoriaService.getAll().then(data => {
      // Filtrar solo categorías de insumos (id padre: 3) y bebidas hijas (id padre: 2)
      const categoriasFiltradas = data.filter(categoria =>
          categoria.categoriaPadre?.id === 3 || categoria.categoriaPadre?.id === 2
      );
      setCategorias(categoriasFiltradas);
    });
  }, []);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setPage(0);
  }, [filtroDenominacion, filtroCategoria, filtroEstado, filtroPrecioMin, filtroPrecioMax]);

  const handleVer = (ins: Insumo) => {
    setInsumoSeleccionado(ins);
    setShowModalDetalle(true);
  };

  const mostrarInfo = (titulo: string, mensaje: string) => {
    setModalTitulo(titulo);
    setModalMensaje(mensaje);
    setShowModalInfo(true);
  };

  const cargarInsumos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ArticuloInsumoService.getAll();
      setInsumos(data);
    } catch (err) {
      setError("Error al cargar los artículos insumos.");
    } finally {
      setLoading(false);
    }
  };

  // Filtro local (puedes reemplazar por API si tienes endpoints específicos)
  const insumosFiltrados = insumos.filter(a =>
    (!filtroDenominacion || a.denominacion.toLowerCase().includes(filtroDenominacion.toLowerCase())) &&
    (!filtroCategoria || String(a.categoria?.id) === filtroCategoria) &&
    (!filtroEstado ||
      (filtroEstado === "activo" && !a.eliminado) ||
      (filtroEstado === "eliminado" && a.eliminado)
    ) &&
    (!filtroPrecioMin || a.precioVenta >= Number(filtroPrecioMin)) &&
    (!filtroPrecioMax || a.precioVenta <= Number(filtroPrecioMax))
  );

  // Calcular páginas totales basado en los elementos filtrados
  const totalPages = Math.ceil(insumosFiltrados.length / size);

  // Aplicar paginación a los elementos filtrados
  const insumosPaginados = insumosFiltrados.slice(page * size, (page + 1) * size);

  const pedirConfirmacionEliminacion = (id: number) => {
    setModalTitulo("Confirmar eliminación de insumo");
    setModalMensaje("¿Seguro que desea eliminar este insumo?");
    setAccionConfirmada(() => () => eliminarInsumo(id));
    setShowModalConfirmacion(true);
  };

  const pedirConfirmacionAlta = (id: number) => {
    setModalTitulo("Confirmar Alta de Insumo");
    setModalMensaje("¿Seguro que desea dar de Alta este insumo?");
    setAccionConfirmada(() => () => activarInsumo(id));
    setShowModalConfirmacion(true);
  };

  const eliminarInsumo = async (id: number) => {
    try {
      const response = await InsumoService.delete(id);

      if (response.ok) {
        mostrarInfo(
          "Insumo eliminado",
          "El insumo fue eliminado correctamente. También se dio de baja lógica a todo su stock en sucursales."
        );
        await cargarInsumos();
      } else {
        const error = await response.text();
        if (error.includes("está en uso")) {
          mostrarInfo(
            "No se puede eliminar el insumo",
            "Este insumo no se puede eliminar porque está siendo utilizado por un artículo manufacturado."
          );
        } else {
          mostrarInfo(
            "Error",
            "Ocurrió un error al intentar eliminar el insumo."
          );
        }
      }
    } catch (err) {
      mostrarInfo(
        "Error de red",
        "Ocurrió un error inesperado al intentar eliminar el insumo."
      );
    }
  };

  const activarInsumo = async (id: number) => {
    try {
      const response = await InsumoService.alta(id);

      if (response.ok) {
        mostrarInfo(
          "Insumo reactivado",
          "El insumo fue activado correctamente. También se reactivó su stock asociado en las sucursales."
        );
        await cargarInsumos();
      } else {
        mostrarInfo(
          "Error al reactivar",
          "Ocurrió un error al intentar reactivar el insumo."
        );
      }
    } catch (err) {
      mostrarInfo(
        "Error de red",
        "Ocurrió un error inesperado al intentar reactivar el insumo."
      );
    }
  };


  const handleActualizar = (ins: Insumo) => {
    window.location.href = `/FormularioInsumo?id=${ins.id}`;
  };

  const columns = [
    {
      key: "imagen",
      label: "Imagen",
      render: (_: any, row: Insumo) => {
        const imagenUrl = row.imagenes?.[0]?.denominacion;
        return imagenUrl ? (
          <img
            src={imagenUrl}
            alt="Imagen insumo"
            style={{
              width: "50px",
              height: "50px",
              objectFit: "cover",
              borderRadius: "8px"
            }}
          />
        ) : (
          "Sin imagen"
        );
      }
    },
    {
      key: "id",
      label: "ID",
      render: (_: any, row: Insumo) => row.id?.toString() || "-",
    },
    { key: "denominacion", label: "Denominación" },
    {
      key: "categoria",
      label: "Categoría",
      render: (_: any, row: Insumo) => row.categoria?.denominacion || "-",
    },
    {
      key: "unidadMedida",
      label: "Unidad de Medida",
      render: (_: any, row: Insumo) => row.unidadMedida?.denominacion || "-",
    },
    {
      key: "precioCompra",
      label: "Precio Compra",
      render: (value: number) => `$${value}`,
    },
    {
      key: "precioVenta",
      label: "Precio Venta",
      render: (value: number) => `$${value}`,
    },
    {
      key: "eliminado",
      label: "Estado",
      render: (value: boolean) => (value ? "Eliminado" : "Activo"),
    },
    {
      key: "acciones",
      label: "Acciones",
      render: (_: any, row: Insumo) => (
        <div className="d-flex justify-content-center">
          <BotonVer onClick={() => handleVer(row)} />
          <BotonModificar onClick={() => handleActualizar(row)} />
          {!row.eliminado ? (
            <BotonEliminar onClick={() => pedirConfirmacionEliminacion(row.id)} />
          ) : (
            <BotonAlta onClick={() => pedirConfirmacionAlta(row.id!)} />
          )}
        </div>
      ),
    },
  ];

  if (loading) return <div>Cargando insumos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="position-relative">
      <h2>Insumos</h2>
      <div className="filtros-container bg-light p-4 rounded mb-4 shadow-sm">
        <div className="row g-3 align-items-center">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por denominación"
              value={filtroDenominacion}
              onChange={e => setFiltroDenominacion(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.denominacion}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="eliminado">Eliminado</option>
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Precio mín."
              value={filtroPrecioMin}
              onChange={e => setFiltroPrecioMin(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Precio máx."
              value={filtroPrecioMax}
              onChange={e => setFiltroPrecioMax(e.target.value)}
            />
          </div>
          <div className="col-md-1 d-flex justify-content-center">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm w-100"
              style={{ minHeight: '38px' }}
              onClick={() => {
                setFiltroDenominacion("");
                setFiltroCategoria("");
                setFiltroEstado("");
                setFiltroPrecioMin("");
                setFiltroPrecioMax("");
                setPage(0);
              }}
            >
              Ver Todos
            </button>
          </div>
        </div>
        <div className="text-center mt-4">
          <Link to="/FormularioInsumo" className="btn btn-success">
            Crear Insumo
          </Link>
        </div>
      </div>
      {/* Tabla */}
      <div className="p-3 border rounded bg-white shadow-sm">
        {insumosFiltrados.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">
              No hay insumos para mostrar
            </p>
          </div>
        ) : (
          <>
            {/* Tabla */}
            <div className="table-responsive">
              <ReusableTable columns={columns} data={insumosPaginados} />
            </div>

            {/* Paginación */}
            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <div className="text-muted">
                Mostrando {page * size + 1}-{Math.min((page + 1) * size, insumosFiltrados.length)} de {insumosFiltrados.length} insumos
              </div>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft />
                </Button>
                <span className="px-2">
                  Página {page + 1} de {totalPages || 1}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={page >= totalPages - 1 || totalPages === 0}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal detalle */}
      <Modal show={showModalDetalle} onHide={() => setShowModalDetalle(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>🧾 Detalle del Insumo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {insumoSeleccionado && (
            <div className="text-center">
              <img
                src={insumoSeleccionado.imagenes?.[0]?.denominacion || ""}
                alt="Imagen del insumo"
                className="img-thumbnail rounded mb-3 shadow-sm"
                style={{ maxHeight: "150px", objectFit: "cover" }}
              />
              <div className="text-start px-2">
                <p className="mb-2"><strong>🧪 Denominación:</strong> {insumoSeleccionado.denominacion}</p>
                <p className="mb-2"><strong>📂 Categoría:</strong> {insumoSeleccionado.categoria?.denominacion || "-"}</p>
                <p className="mb-2"><strong>⚖️ Unidad de Medida:</strong> {insumoSeleccionado.unidadMedida?.denominacion || "-"}</p>
                <p className="mb-2"><strong>💰 Precio Compra:</strong> ${insumoSeleccionado.precioCompra.toFixed(2)}</p>
                <p className="mb-2"><strong>🛒 Precio Venta:</strong> ${insumoSeleccionado.precioVenta.toFixed(2)}</p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModalDetalle(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Información */}
      <Modal show={showModalInfo} onHide={() => setShowModalInfo(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitulo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{modalMensaje}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowModalInfo(false)}>
            Aceptar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmación */}
      <Modal show={showModalConfirmacion} onHide={() => setShowModalConfirmacion(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitulo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMensaje}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalConfirmacion(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => {
            if (accionConfirmada) {
              accionConfirmada();
              setShowModalConfirmacion(false);
            }
          }}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default GrillaInsumos;