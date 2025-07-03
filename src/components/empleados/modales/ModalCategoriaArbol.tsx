import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Categoria from "../../../models/Categoria.ts";

interface Props {
  show: boolean;
  onHide: () => void;
  categorias: Categoria[];
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: (id: string) => void;
}

function construirArbol(categorias: Categoria[]) {
  // Agrupa por padre
  const map = new Map<number | undefined, Categoria[]>();
  categorias.forEach(cat => {
    const padreId = cat.categoriaPadre?.id;
    if (!map.has(padreId)) map.set(padreId, []);
    map.get(padreId)!.push(cat);
  });
  return map;
}

const ModalCategoriaArbol: React.FC<Props> = ({
  show,
  onHide,
  categorias,
  categoriaSeleccionada,
  setCategoriaSeleccionada,
}) => {
  const [expanded, setExpanded] = useState<number[]>([]);

  const arbol = construirArbol(categorias);

  const toggleExpand = (id: number) => {
    setExpanded(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  // Recursivo: renderiza el árbol
  const renderTree = (padreId: number | undefined = undefined, nivel = 0) => {
    const hijos = arbol.get(padreId) || [];
    return (
      <ul style={{ listStyle: "none", paddingLeft: nivel * 16 }}>
        {hijos.map(cat => {
          const tieneHijos = !!arbol.get(cat.id)?.length;
          const isExpanded = expanded.includes(cat.id!);
          return (
            <li key={cat.id}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {tieneHijos && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(cat.id!)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      marginRight: 4,
                    }}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>
                )}
                <span
                  style={{
                    fontWeight: tieneHijos ? "bold" : "normal",
                    color: tieneHijos ? "#555" : "#222",
                    cursor: tieneHijos ? "default" : "pointer",
                    padding: "2px 4px",
                    borderRadius: 4,
                    background:
                      categoriaSeleccionada === String(cat.id) ? "#d1e7dd" : "transparent",
                  }}
                  onClick={() => {
                    if (!tieneHijos) setCategoriaSeleccionada(String(cat.id));
                  }}
                >
                  {cat.denominacion}
                </span>
              </div>
              {tieneHijos && isExpanded && renderTree(cat.id, nivel + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar Categoría</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {renderTree(undefined)}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={onHide}
          disabled={!categoriaSeleccionada}
        >
          Seleccionar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalCategoriaArbol;