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
import type Sucursal from "../../../models/Sucursal";
import SucursalService from "../../../services/SucursalService";

function FormStock() {
  const [searchParams] = useSearchParams();
  const idFromUrl = searchParams.get("id");
  const { sucursalActual, esModoTodasSucursales } = useSucursal();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalesSeleccionadas, setSucursalesSeleccionadas] = useState<number[]>([]);
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
        // Cargar todos los insumos y sucursales
        const insumosData = await ArticuloInsumoService.getAll();
        const sucursalesData = await SucursalService.getAll();
        setInsumos(insumosData);
        setSucursales(sucursalesData);

        // Si es modo edición, cargar datos del SucursalInsumo
        if (isEditMode && idFromUrl) {
          try {
            const sucursalInsumoData = await SucursalInsumoService.getById(Number(idFromUrl));
            setSucursalInsumo(sucursalInsumoData);

            // Setear valores del formulario
            setSelectedId(sucursalInsumoData.articuloInsumo.id!);
            setStockMinimo(sucursalInsumoData.stockMinimo);
            setStockMaximo(sucursalInsumoData.stockMaximo);
            setStockActual(sucursalInsumoData.stockActual);

            // En modo edición, seleccionar solo la sucursal actual
            setSucursalesSeleccionadas([sucursalInsumoData.sucursal.id!]);

            // En modo edición, mostrar todos los insumos (incluyendo el actual)
            setInsumosDisponibles(insumosData);
          } catch (editError) {
            setError("No se pudo cargar la información del stock para editar");
            console.error("Error al cargar SucursalInsumo:", editError);
          }
        } else {
          // Modo creación: configurar sucursales seleccionadas
          if (esModoTodasSucursales) {
            // Si está en modo todas las sucursales, no seleccionar ninguna por defecto
            setSucursalesSeleccionadas([]);
          } else if (sucursalActual) {
            // Si hay una sucursal específica, seleccionarla por defecto
            setSucursalesSeleccionadas([sucursalActual.id!]);
          }

          // Filtrar insumos disponibles
          await filtrarInsumosDisponibles(insumosData, sucursalesData);
        }
      } catch (err) {
        setError("Error al cargar los datos necesarios");
        console.error("Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idFromUrl, isEditMode, sucursalActual, esModoTodasSucursales]);

  const filtrarInsumosDisponibles = async (insumosData: ArticuloInsumo[], sucursalesData: Sucursal[]) => {
    if (esModoTodasSucursales) {
      // En modo todas las sucursales, mostrar todos los insumos inicialmente
      setInsumosDisponibles(insumosData);
    } else if (sucursalActual) {
      // Modo sucursal específica: filtrar insumos que ya tienen stock
      try {
        const stocksExistentes = await SucursalInsumoService.getBySucursal(sucursalActual.id!);
        const insumosConStock = stocksExistentes
          .filter(stock => !stock.eliminado)
          .map(stock => stock.articuloInsumo.id);

        const insumosDisponiblesData = insumosData.filter(
          insumo => !insumosConStock.includes(insumo.id)
        );

        setInsumosDisponibles(insumosDisponiblesData);

        if (insumosDisponiblesData.length === 0) {
          setError("Todos los insumos ya tienen stock configurado en esta sucursal");
        }
      } catch (stockError) {
        console.error("Error al obtener stocks existentes:", stockError);
        setInsumosDisponibles(insumosData);
      }
    } else {
      setInsumosDisponibles(insumosData);
    }
  };

  // Actualizar insumos disponibles cuando cambien las sucursales seleccionadas
  useEffect(() => {
    if (!isEditMode && esModoTodasSucursales && sucursalesSeleccionadas.length > 0) {
      const actualizarInsumosDisponibles = async () => {
        try {
          const insumosConStockPromises = sucursalesSeleccionadas.map(async (sucursalId) => {
            const stocksExistentes = await SucursalInsumoService.getBySucursal(sucursalId);
            return stocksExistentes
              .filter(stock => !stock.eliminado)
              .map(stock => stock.articuloInsumo.id);
          });

          const insumosConStockArrays = await Promise.all(insumosConStockPromises);
          const todosLosInsumosConStock = [...new Set(insumosConStockArrays.flat())];

          const insumosDisponiblesData = insumos.filter(
            insumo => !todosLosInsumosConStock.includes(insumo.id)
          );

          setInsumosDisponibles(insumosDisponiblesData);
        } catch (error) {
          console.error("Error al filtrar insumos:", error);
          setInsumosDisponibles(insumos);
        }
      };

      actualizarInsumosDisponibles();
    }
  }, [sucursalesSeleccionadas, insumos, isEditMode, esModoTodasSucursales]);

  const handleSucursalChange = (sucursalId: number, checked: boolean) => {
    if (checked) {
      setSucursalesSeleccionadas(prev => [...prev, sucursalId]);
    } else {
      setSucursalesSeleccionadas(prev => prev.filter(id => id !== sucursalId));
    }
  };

  const handleSelectAllSucursales = (selectAll: boolean) => {
    if (selectAll) {
      setSucursalesSeleccionadas(sucursales.map(s => s.id!));
    } else {
      setSucursalesSeleccionadas([]);
    }
  };

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
      return "El stock máximo debe ser mayor al stock mínimo";
    }
    if (stockMaximo == stockMinimo) {
      return "El stock máximo no puede ser igual al stock mínimo";
    }
    if (esModoTodasSucursales && sucursalesSeleccionadas.length === 0) {
      return "Debe seleccionar al menos una sucursal";
    }
    if (!esModoTodasSucursales && !sucursalActual) {
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
    if (!insumoSeleccionado) {
      setError("Error en la selección de datos");
      return;
    }

    setLoadingForm(true);

    try {
      if (isEditMode) {
        // Modo edición: actualizar un solo SucursalInsumo
        const sucursalParaActualizar = sucursales.find(s => s.id === sucursalesSeleccionadas[0]);
        if (!sucursalParaActualizar) {
          setError("Error al encontrar la sucursal");
          return;
        }

        const sucursalInsumoData: SucursalInsumo = {
          id: sucursalInsumo!.id,
          stockMinimo,
          stockMaximo,
          stockActual,
          eliminado: false,
          articuloInsumo: insumoSeleccionado,
          sucursal: sucursalParaActualizar
        };

        await SucursalInsumoService.update(sucursalInsumoData, Number(idFromUrl));
        setSuccess("Stock actualizado correctamente");
      } else {
        // Modo creación: crear SucursalInsumo para cada sucursal seleccionada
        const sucursalesParaCrear = esModoTodasSucursales 
          ? sucursales.filter(s => sucursalesSeleccionadas.includes(s.id!))
          : [sucursalActual!];

        const promesasCreacion = sucursalesParaCrear.map(async (sucursal) => {
          const sucursalInsumoData: SucursalInsumo = {
            stockMinimo,
            stockMaximo,
            stockActual,
            eliminado: false,
            articuloInsumo: insumoSeleccionado,
            sucursal: sucursal
          };

          return SucursalInsumoService.create(sucursalInsumoData);
        });

        await Promise.all(promesasCreacion);
        
        const mensaje = esModoTodasSucursales 
          ? `Stock creado correctamente en ${sucursalesParaCrear.length} sucursal(es)`
          : "Stock creado correctamente";
        
        setSuccess(mensaje);

        // Limpiar formulario después de crear
        setSelectedId(null);
        setStockMinimo(0);
        setStockMaximo(0);
        setStockActual(0);
        setSucursalesSeleccionadas(esModoTodasSucursales ? [] : [sucursalActual?.id!]);
        navigate(-1);
      }

      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        if (isEditMode) {
          navigate(-1);
        }
      }, 1);

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
          <div className="col-md-8 col-lg-7">
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

                <Form onSubmit={handleSubmit}>
                  {/* Selección de sucursales - Solo en modo creación y cuando está en modo todas las sucursales */}
                  {!isEditMode && esModoTodasSucursales && (
                    <Form.Group className="mb-4" controlId="sucursalesSelect">
                      <Form.Label className="fw-semibold">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9,22 9,12 15,12 15,22"></polyline>
                        </svg>
                        Sucursales donde crear el stock *
                      </Form.Label>
                      <div className="border p-3 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <div className="mb-2">
                          <Form.Check
                            type="checkbox"
                            id="selectAllSucursales"
                            label="Seleccionar todas"
                            checked={sucursalesSeleccionadas.length === sucursales.length && sucursales.length > 0}
                            onChange={(e) => handleSelectAllSucursales(e.target.checked)}
                            className="fw-bold"
                          />
                        </div>
                        <hr className="my-2" />
                        {sucursales.map(sucursal => (
                          <div key={sucursal.id} className="mb-1">
                            <Form.Check
                              type="checkbox"
                              id={`sucursal-${sucursal.id}`}
                              label={sucursal.nombre}
                              checked={sucursalesSeleccionadas.includes(sucursal.id!)}
                              onChange={(e) => handleSucursalChange(sucursal.id!, e.target.checked)}
                            />
                          </div>
                        ))}
                      </div>
                      {sucursalesSeleccionadas.length === 0 && (
                        <Form.Text className="text-danger">
                          Debe seleccionar al menos una sucursal
                        </Form.Text>
                      )}
                      {sucursalesSeleccionadas.length > 0 && (
                        <Form.Text className="text-success">
                          {sucursalesSeleccionadas.length} sucursal(es) seleccionada(s)
                        </Form.Text>
                      )}
                    </Form.Group>
                  )}

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
                        {esModoTodasSucursales 
                          ? "Seleccione sucursales para ver insumos disponibles"
                          : "Todos los insumos ya tienen stock en esta sucursal"
                        }
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
                      disabled={
                        loadingForm || 
                        (esModoTodasSucursales ? sucursalesSeleccionadas.length === 0 : !sucursalActual) ||
                        (insumosDisponibles.length === 0 && !isEditMode) || 
                        stockMinimo == stockMaximo
                      }
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
                  {esModoTodasSucursales ? (
                    <>
                      <strong>Modo:</strong> Todas las sucursales
                      <br />
                      <strong>Sucursales seleccionadas:</strong> {sucursalesSeleccionadas.length} de {sucursales.length}
                      {!isEditMode && (
                        <>
                          <br />
                          <strong>Insumos disponibles:</strong> {insumosDisponibles.length} de {insumos.length}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <strong>Sucursal actual:</strong> {sucursalActual?.nombre || 'No seleccionada'}
                      {!isEditMode && (
                        <>
                          <br />
                          <strong>Insumos disponibles:</strong> {insumosDisponibles.length} de {insumos.length}
                        </>
                      )}
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