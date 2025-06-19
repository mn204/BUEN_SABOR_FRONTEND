import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import Card from "react-bootstrap/Card";
import ArticuloInsumo from "../../../models/ArticuloInsumo";
import SucursalInsumo from "../../../models/SucursalInsumo";
import ArticuloInsumoService from "../../../services/ArticuloInsumoService";
import SucursalInsumoService from "../../../services/SucursalInsumoService";
import { useSucursal } from "../../../context/SucursalContextEmpleado";
import { useNavigate, useSearchParams } from "react-router-dom";

function FormStock() {
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get("id");
  const { sucursalActual } = useSucursal();
  const navigate = useNavigate();

  // Estados para datos
  const [insumos, setInsumos] = useState<ArticuloInsumo[]>([]);
  const [insumosDisponibles, setInsumosDisponibles] = useState<ArticuloInsumo[]>([]);
  const [sucursalInsumo, setSucursalInsumo] = useState<SucursalInsumo | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Estados para formulario
  const [stockMinimo, setStockMinimo] = useState(0);
  const [stockMaximo, setStockMaximo] = useState(0);
  const [stockActual, setStockActual] = useState(0);

  // Estados para UI
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Determinar si es modo edición
  const isEditMode = !!idFromUrl;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Cargar todos los insumos
        const insumosData = await ArticuloInsumoService.getAll();
        setInsumos(insumosData);

        // Si es modo edición, cargar datos del SucursalInsumo
        if (isEditMode && idFromUrl) {
          try {
            const sucursalInsumoData = await SucursalInsumoService.getById(Number(idFromUrl));
            setSucursalInsumo(sucursalInsumoData);
            console.log(sucursalInsumoData)

            // Setear valores del formulario
            setSelectedId(sucursalInsumoData.articuloInsumo.id);
            setStockMinimo(sucursalInsumoData.stockMinimo);
            setStockMaximo(sucursalInsumoData.stockMaximo);
            setStockActual(sucursalInsumoData.stockActual);

            // En modo edición, mostrar todos los insumos (incluyendo el actual)
            setInsumosDisponibles(insumosData);
          } catch (editError) {
            setError("No se pudo cargar la información del stock para editar");
            console.error("Error al cargar SucursalInsumo:", editError);
          }
        } else {
          // Modo creación: filtrar insumos que ya tienen stock en la sucursal actual
          if (sucursalActual) {
            try {
              // Obtener todos los stocks de la sucursal actual
              const stocksExistentes = await SucursalInsumoService.getBySucursal(sucursalActual!.id!);
              
              // Obtener los IDs de los insumos que ya tienen stock
              const insumosConStock = stocksExistentes
                .filter(stock => !stock.eliminado) // Solo considerar stocks no eliminados
                .map(stock => stock.articuloInsumo.id);
              console.log(stocksExistentes)
              // Filtrar insumos disponibles (excluir los que ya tienen stock)
              const insumosDisponiblesData = insumosData.filter(
                insumo => !insumosConStock.includes(insumo.id)
              );

              setInsumosDisponibles(insumosDisponiblesData);

              // Si no hay insumos disponibles, mostrar mensaje informativo
              if (insumosDisponiblesData.length === 0) {
                setError("Todos los insumos ya tienen stock configurado en esta sucursal");
              }
            } catch (stockError) {
              console.error("Error al obtener stocks existentes:", stockError);
              // En caso de error, mostrar todos los insumos
              setInsumosDisponibles(insumosData);
            }
          } else {
            // Si no hay sucursal seleccionada, mostrar todos los insumos
            setInsumosDisponibles(insumosData);
          }
        }
      } catch (err) {
        setError("Error al cargar los datos necesarios");
        console.error("Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idFromUrl, isEditMode, sucursalActual]);

  const validateForm = (): string | null => {
    if (!selectedId) {
      return "Debe seleccionar un insumo";
    }
    if (stockMinimo < 0) {
      return "El stock mínimo no puede ser negativo";
    }
    if (stockMaximo < 0) {
      return "El stock máximo no puede ser negativo";
    }
    if (stockActual < 0) {
      return "El stock actual no puede ser negativo";
    }
    if (stockMaximo < stockMinimo) {
      return "El stock máximo debe ser mayor o igual al stock mínimo";
    }
    if (!sucursalActual) {
      return "No se ha seleccionado una sucursal";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar mensajes previos
    setError(null);
    setSuccess(null);

    // Validar formulario
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const insumoSeleccionado = insumos.find(i => i.id === selectedId);
    if (!insumoSeleccionado || !sucursalActual) {
      setError("Error en la selección de datos");
      return;
    }

    setLoadingForm(true);

    try {
      const sucursalInsumoData: SucursalInsumo = {
        ...(isEditMode && sucursalInsumo ? { id: sucursalInsumo.id } : {}),
        stockMinimo,
        stockMaximo,
        stockActual,
        eliminado: false,
        articuloInsumo: insumoSeleccionado,
        sucursal: sucursalActual
      };

      if (isEditMode) {
        // Actualizar
        await SucursalInsumoService.update(sucursalInsumoData, Number(idFromUrl));
        setSuccess("Stock actualizado correctamente");
      } else {
        // Crear
        await SucursalInsumoService.create(sucursalInsumoData);
        setSuccess("Stock creado correctamente");

        // Limpiar formulario después de crear
        setSelectedId(null);
        setStockMinimo(0);
        setStockMaximo(0);
        setStockActual(0);
        navigate(-1);
      }

      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        if (isEditMode) {
          navigate(-1); // Volver a la página anterior
        }
      }, 2000);

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Error al procesar la solicitud";
      setError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el stock: ${errorMessage}`);
      console.error("Error en submit:", err);
    } finally {
      setLoadingForm(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Calcular alertas de stock
  const getStockAlert = () => {
    if (stockMinimo > 0 && stockMaximo > 0 && stockActual > 0) {
      if (stockActual < stockMinimo) {
        return { type: "danger", message: "⚠️ Stock actual por debajo del mínimo" };
      } else if (stockActual > stockMaximo) {
        return { type: "warning", message: "⚠️ Stock actual por encima del máximo" };
      } else {
        return { type: "success", message: "✅ Stock dentro del rango óptimo" };
      }
    }
    return null;
  };

  const stockAlert = getStockAlert();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "50vh" }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="bg-black"></nav>
      <button
        onClick={()=>navigate(-1)}
        className="promocion-detalle__back-button mt-5"
        style={{marginLeft:  "5em"}}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="15,18 9,12 15,6"></polyline>
        </svg>
        Volver
      </button>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0 d-flex align-items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"></path>
                  </svg>
                  {isEditMode ? 'Editar Stock' : 'Crear Stock'}
                </h4>
              </Card.Header>

              <Card.Body>
                {/* Mensajes de estado */}
                {error && (
                  <Alert variant="danger" className="d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" className="d-flex align-items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                      <path d="M9 12l2 2 4-4"></path>
                      <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                      <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                    </svg>
                    {success}
                  </Alert>
                )}

                {/* Alerta de stock */}
                {stockAlert && (
                  <Alert variant={stockAlert.type} className="mb-3">
                    {stockAlert.message}
                  </Alert>
                )}

                {/* Mostrar mensaje informativo si no hay insumos disponibles en modo creación */}
                {!isEditMode && insumosDisponibles.length === 0 && !error && (
                  <Alert variant="info" className="mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    No hay insumos disponibles para crear stock. Todos los insumos ya tienen stock configurado en esta sucursal.
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="insumoSelect">
                    <Form.Label className="fw-semibold">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"></path>
                      </svg>
                      Insumo *
                    </Form.Label>
                    <Form.Select
                      value={selectedId ?? ""}
                      onChange={(e) => setSelectedId(Number(e.target.value))}
                      required
                      disabled={isEditMode || insumosDisponibles.length === 0}
                      className={isEditMode ? "bg-light" : ""}
                    >
                      <option value="" disabled>
                        {insumosDisponibles.length === 0 && !isEditMode 
                          ? "-- No hay insumos disponibles --" 
                          : "-- Seleccionar Insumo --"
                        }
                      </option>
                      {insumosDisponibles.map((insumo) => (
                        <option key={insumo.id} value={insumo.id}>
                          {insumo.denominacion}
                        </option>
                      ))}
                    </Form.Select>
                    {isEditMode && (
                      <Form.Text className="text-muted">
                        El insumo no puede modificarse en modo edición
                      </Form.Text>
                    )}
                    {!isEditMode && insumosDisponibles.length === 0 && (
                      <Form.Text className="text-warning">
                        Todos los insumos ya tienen stock en esta sucursal
                      </Form.Text>
                    )}
                  </Form.Group>

                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3" controlId="stockMinimo">
                        <Form.Label className="fw-semibold">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          Stock Mínimo *
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={stockMinimo}
                          onChange={(e) => setStockMinimo(Number(e.target.value))}
                          min={0}
                          required
                          placeholder="Ej: 10"
                          disabled={insumosDisponibles.length === 0 && !isEditMode}
                        />
                      </Form.Group>
                    </div>

                    <div className="col-md-6">
                      <Form.Group className="mb-3" controlId="stockMaximo">
                        <Form.Label className="fw-semibold">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                          </svg>
                          Stock Máximo *
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={stockMaximo}
                          onChange={(e) => setStockMaximo(Number(e.target.value))}
                          min={stockMinimo}
                          required
                          placeholder="Ej: 100"
                          disabled={insumosDisponibles.length === 0 && !isEditMode}
                        />
                      </Form.Group>
                    </div>
                  </div>

                  <Form.Group className="mb-4" controlId="stockActual">
                    <Form.Label className="fw-semibold">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                        <path d="M9 11H1l6-6 6 6zm-6 0h8M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"></path>
                      </svg>
                      Stock Actual *
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={stockActual}
                      onChange={(e) => setStockActual(Number(e.target.value))}
                      min={0}
                      required
                      placeholder="Ej: 50"
                      disabled={insumosDisponibles.length === 0 && !isEditMode}
                    />
                    <Form.Text className="text-muted">
                      Cantidad actual disponible en inventario
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <Button
                      variant="outline-secondary"
                      onClick={handleCancel}
                      disabled={loadingForm}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loadingForm || !sucursalActual || (insumosDisponibles.length === 0 && !isEditMode)}
                      className="d-flex align-items-center"
                    >
                      {loadingForm ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          {isEditMode ? 'Actualizando...' : 'Creando...'}
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17,21 17,13 7,13 7,21"></polyline>
                            <polyline points="7,3 7,8 15,8"></polyline>
                          </svg>
                          {isEditMode ? 'Actualizar Stock' : 'Crear Stock'}
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Información adicional */}
            <Card className="mt-3 bg-light">
              <Card.Body className="py-2">
                <small className="text-muted">
                  <strong>Sucursal actual:</strong> {sucursalActual?.nombre || 'No seleccionada'}
                  {!isEditMode && (
                    <>
                      <br />
                      <strong>Insumos disponibles:</strong> {insumosDisponibles.length} de {insumos.length}
                    </>
                  )}
                </small>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default FormStock;