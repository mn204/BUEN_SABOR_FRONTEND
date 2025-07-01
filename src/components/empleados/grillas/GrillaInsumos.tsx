import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InsumoService from "../../../services/ArticuloInsumoService.ts";
import CategoriaService from "../../../services/CategoriaService.ts";
import Insumo from "../../../models/ArticuloInsumo.ts";
import Categoria from "../../../models/Categoria.ts";
import { ReusableTable } from "../../Tabla";
import BotonVer from "../../layout/botones/BotonVer.tsx";
import BotonEliminar from "../../layout/botones/BotonEliminar.tsx";
import BotonModificar from "../../layout/botones/BotonModificar.tsx";
import BotonAlta from "../../layout/botones/BotonAlta.tsx";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import ArticuloInsumoService from "../../../services/ArticuloInsumoService.ts";
import type ArticuloInsumo from "../../../models/ArticuloInsumo.ts";
import { Card, Form, Col, Row, Button, Modal } from "react-bootstrap";
import UnidadMedidaService from "../../../services/UnidadMedidaService.ts";

interface PageResponse {
  content: ArticuloInsumo[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

function GrillaInsumos() {
  // const [insumos, setInsumos] = useState<ArticuloInsumo[]>([]);
  const [pageData, setPageData] = useState<PageResponse>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 10
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
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
  const [filtroPrecioVentaMin, setFiltroPrecioVentaMin] = useState("");
  const [filtroPrecioVentaMax, setFiltroPrecioVentaMax] = useState("");
  const [filtroUnidadMedida, setFiltroUnidadMedida] = useState("");
  const [unidadesMedida, setUnidadesMedida] = useState<{ id: number, denominacion: string }[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Debounce para evitar muchas llamadas al API
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    // Suponiendo que tenés un servicio UnidadMedidaService con getAll()
    const cargarUnidadesMedida = async () => {
      try {
        const data = await UnidadMedidaService.getAll();
        setUnidadesMedida(
          data
            .filter((um: any) => typeof um.id === "number" && um.denominacion)
            .map((um: any) => ({ id: um.id as number, denominacion: um.denominacion }))
        );
      } catch (err) {
        console.error("Error al cargar unidades de medida:", err);
      }
    };
    cargarUnidadesMedida();
  }, []);

  // TODO : Manejar errores de carga de categorias.
  // Cargar categorías
  const cargarCategorias = async () => {
    try {
      const data = await CategoriaService.getAll();

      // 1. Buscar la categoría padre "INSUMO"
      const padreInsumo = data.find(cat => cat.denominacion?.toUpperCase() === "INSUMOS");

      if (!padreInsumo) {
        setCategorias([]);
        console.warn('No se encontró la categoría padre "INSUMO"');
        return;
      }

      // 2. Función recursiva para armar el árbol de categorías
      const armarArbol = (padreId: number): Categoria[] => {
        return data
          .filter(cat => cat.categoriaPadre?.id === padreId && typeof cat.id === "number")
          .map(cat => ({
            ...cat,
            hijos: armarArbol(cat.id as number)
          }));
      };

      // 3. Construir el árbol desde la categoría padre "INSUMO"
      const categoriasArbol = [{
        ...padreInsumo,
        hijos: armarArbol(padreInsumo.id as number)
      }];

      setCategorias(categoriasArbol);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setCategorias([]);
    }
  };

  function flattenCategorias(categorias: any[], nivel = 0): { id: number, denominacion: string }[] {
    let result: { id: number, denominacion: string }[] = [];
    for (const cat of categorias) {
      result.push({
        id: cat.id,
        denominacion: `${"— ".repeat(nivel)}${cat.denominacion}`
      });
      if (cat.hijos && cat.hijos.length > 0) {
        result = result.concat(flattenCategorias(cat.hijos, nivel + 1));
      }
    }
    return result;
  }
  // Efecto para cargar insumos cuando cambie la página
  useEffect(() => {
    cargarInsumosFiltrados();
  }, [page]);

  // Efecto para los filtros con debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Crear nuevo timeout
    const newTimeoutId = setTimeout(() => {
      setPage(0); // Resetear a la primera página
      cargarInsumosFiltrados();
    }, 300); // Esperar 500ms después del último cambio

    setTimeoutId(newTimeoutId);

    // Cleanup
    return () => {
      if (newTimeoutId) {
        clearTimeout(newTimeoutId);
      }
    };
  }, [filtroDenominacion, filtroCategoria, filtroUnidadMedida, filtroEstado, filtroPrecioMin, filtroPrecioMax, sortAsc]);

  const cargarInsumosFiltrados = async () => {
    setLoading(true);
    setError(null);
    try {
      // Preparar parámetros de filtrado
      const filtros = {
        denominacion: filtroDenominacion || undefined,
        unidadMedidaId: filtroUnidadMedida ? Number(filtroUnidadMedida) : undefined,
        categoriaId: filtroCategoria ? Number(filtroCategoria) : undefined,
        eliminado: filtroEstado === "eliminado" ? true :
          filtroEstado === "activo" ? false : undefined,
        precioCompraMin: filtroPrecioMin ? Number(filtroPrecioMin) : undefined,
        precioCompraMax: filtroPrecioMax ? Number(filtroPrecioMax) : undefined,
        precioVentaMin: filtroPrecioVentaMin ? Number(filtroPrecioVentaMin) : undefined,
        precioVentaMax: filtroPrecioVentaMax ? Number(filtroPrecioVentaMax) : undefined,
        page: page,
        size: size,
        sort: `denominacion,${sortAsc ? "asc" : "desc"}`
      };

      const data = await ArticuloInsumoService.filtrar(filtros);

      setPageData(data);
      // setInsumos(data.content);
    } catch (err) {
      setError("Error al cargar los artículos insumos.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVer = (ins: Insumo) => {
    setInsumoSeleccionado(ins);
    setShowModalDetalle(true);
  };

  const mostrarInfo = (titulo: string, mensaje: string) => {
    setModalTitulo(titulo);
    setModalMensaje(mensaje);
    setShowModalInfo(true);
  };

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
        await cargarInsumosFiltrados(); // Recargar con filtros actuales
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
        await cargarInsumosFiltrados(); // Recargar con filtros actuales
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

  // Funciones para manejar cambios de página
  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pageData.totalPages - 1) {
      setPage(page + 1);
    }
  };

  function limpiarFiltros() {
    setFiltroDenominacion("");
    setFiltroUnidadMedida("");
    setFiltroCategoria("");
    setFiltroEstado("");
    setFiltroPrecioMin("");
    setFiltroPrecioMax("");
    setFiltroPrecioVentaMin("");
    setFiltroPrecioVentaMax("");
    setPage(0);
  }

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
      render: (value?: number) => value != null ? `$${value}` : "-",
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
            <BotonEliminar onClick={() => row.id !== undefined && pedirConfirmacionEliminacion(row.id)} />
          ) : (
            <BotonAlta onClick={() => pedirConfirmacionAlta(row.id!)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="position-relative">
      <h2>Insumos</h2>

      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <Card.Title className="mb-0">Gestión de Insumos</Card.Title>
            </div>
            <Button variant="success" size="sm" onClick={() => navigate('/FormularioInsumo')}>
              ➕ Crear Insumo
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          <Form className="mb-0">
            <Row className="gy-2 align-items-center">
              <Col xs={12} md={8} lg={9} className="d-flex flex-wrap align-items-center gap-3">
                <div>
                  <Form.Label className="fw-bold mb-0 me-2">Denominación</Form.Label>
                  <Form.Control
                    size="sm"
                    type="text"
                    style={{ width: 180, display: "inline-block" }}
                    placeholder="Buscar por denominación"
                    value={filtroDenominacion}
                    onChange={e => setFiltroDenominacion(e.target.value)}
                  />
                </div>
                <div>
                  <Form.Label className="fw-bold mb-0 me-2">Categoría</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: 180, display: "inline-block" }}
                    value={filtroCategoria}
                    onChange={e => setFiltroCategoria(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {flattenCategorias(categorias).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.denominacion}</option>
                    ))}
                  </Form.Select>
                </div>
                <div>
                  <Form.Label className="fw-bold mb-0 me-2">Unidad de Medida</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: 160, display: "inline-block" }}
                    value={filtroUnidadMedida}
                    onChange={e => setFiltroUnidadMedida(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {unidadesMedida.map(um => (
                      <option key={um.id} value={um.id}>{um.denominacion}</option>
                    ))}
                  </Form.Select>
                </div>
                <div>
                  <Form.Label className="fw-bold mb-0 me-2">Estado</Form.Label>
                  <Form.Select
                    size="sm"
                    style={{ width: 140, display: "inline-block" }}
                    value={filtroEstado}
                    onChange={e => setFiltroEstado(e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="activo">Activo</option>
                    <option value="eliminado">Eliminado</option>
                  </Form.Select>
                </div>
                <div>
                  <Form.Label className="fw-bold mb-0 me-2">Precio Compra</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    min="0"
                    style={{ width: 100, display: "inline-block" }}
                    placeholder="Mín."
                    value={filtroPrecioMin}
                    onChange={e => {
                      const val = e.target.value;
                      setFiltroPrecioMin(val === "" ? "" : Math.max(0, Number(val)).toString());
                    }}
                  />
                  <span className="mx-1">-</span>
                  <Form.Control
                    size="sm"
                    type="number"
                    min="0"
                    style={{ width: 100, display: "inline-block" }}
                    placeholder="Máx."
                    value={filtroPrecioMax}
                    onChange={e => {
                      const val = e.target.value;
                      setFiltroPrecioMax(val === "" ? "" : Math.max(0, Number(val)).toString());
                    }}
                  />

                  <Form.Label className="fw-bold mb-0 me-2">Precio Venta</Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    min="0"
                    style={{ width: 100, display: "inline-block" }}
                    placeholder="Mín."
                    value={filtroPrecioVentaMin}
                    onChange={e => {
                      const val = e.target.value;
                      setFiltroPrecioVentaMin(val === "" ? "" : Math.max(0, Number(val)).toString());
                    }}
                  />
                  <span className="mx-1">-</span>
                  <Form.Control
                    size="sm"
                    type="number"
                    min="0"
                    style={{ width: 100, display: "inline-block" }}
                    placeholder="Máx."
                    value={filtroPrecioVentaMax}
                    onChange={e => {
                      const val = e.target.value;
                      setFiltroPrecioVentaMax(val === "" ? "" : Math.max(0, Number(val)).toString());
                    }}
                  />
                </div>
              </Col>
              <Col xs={12} md={4} lg={3} className="d-flex flex-column align-items-end justify-content-center">
                <Button
                  variant="outline-secondary"
                  onClick={limpiarFiltros}
                  style={{ minWidth: 140, marginBottom: 6, height: 38 }}
                >
                  Limpiar
                </Button>
                <Button
                  type="button"
                  variant={sortAsc ? "outline-primary" : "outline-dark"}
                  onClick={() => setSortAsc((prev) => !prev)}
                  title="Alternar orden alfabético"
                  style={{ minWidth: 140, height: 38 }}
                >
                  {sortAsc ? "A → Z" : "Z → A"}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Tabla */}
      <div className="p-3 border rounded bg-white shadow-sm">
        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {!loading && !error && pageData.totalElements === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">
              No hay insumos para mostrar
            </p>
          </div>
        ) : (
          !loading && !error && (
            <>
              {/* Tabla */}
              <div className="table-responsive">
                <ReusableTable columns={columns} data={pageData.content} />
              </div>

              {/* Paginación */}
              <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <div className="text-muted">
                  Mostrando {page * size + 1}-{Math.min((page + 1) * size, pageData.totalElements)} de {pageData.totalElements} insumos
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={page === 0 || loading}
                    onClick={handlePreviousPage}
                  >
                    <ChevronLeft />
                  </Button>
                  <span className="px-2">
                    Página {page + 1} de {pageData.totalPages || 1}
                  </span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={page >= pageData.totalPages - 1 || pageData.totalPages === 0 || loading}
                    onClick={handleNextPage}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* Modal detalle */}
      < Modal show={showModalDetalle} onHide={() => setShowModalDetalle(false)
      } centered size="lg" >
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
                <p className="mb-2"><strong>🔧 Para elaborar:</strong> {insumoSeleccionado.esParaElaborar ? "Sí" : "No"}</p>
                <p className="mb-2"><strong>📂 Categoría:</strong> {insumoSeleccionado.categoria?.denominacion || "-"}</p>
                <p className="mb-2"><strong>⚖️ Unidad de Medida:</strong> {insumoSeleccionado.unidadMedida?.denominacion || "-"}</p>
                <p className="mb-2"><strong>💰 Precio Compra:</strong> ${insumoSeleccionado.precioCompra.toFixed(2)}</p>

                {!insumoSeleccionado.esParaElaborar && (
                  <p className="mb-2"><strong>🛒 Precio Venta:</strong> ${insumoSeleccionado.precioVenta?.toFixed(2)}</p>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModalDetalle(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal >


      {/* Modal de Información */}
      < Modal show={showModalInfo} onHide={() => setShowModalInfo(false)} centered >
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
      </Modal >

      {/* Modal de Confirmación */}
      < Modal show={showModalConfirmacion} onHide={() => setShowModalConfirmacion(false)} centered >
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
      </Modal >
    </div >
  );
}

export default GrillaInsumos;