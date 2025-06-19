import React, {  useState } from "react";
import { useNavigate } from "react-router-dom";
import "../.././styles/cardArticulo.css"; // Archivo CSS para estilos
import Categoria from "../../models/Categoria";

interface Props {
  categoria: Categoria;
}

const CategoriaCard: React.FC<Props> = ({ categoria }) => {
  console.log(categoria)
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    // Navegar a la vista de categoría o productos de esa categoría
    navigate(`/categoria/${categoria.id}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="card-categoria"
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-articulo__image-container">
        {imageError ? (
          <div className="card-articulo__placeholder">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            <span>Sin imagen</span>
          </div>
        ) : (
          <img
            src={!imageError && categoria.urlImagen ? categoria.urlImagen : "/placeholder-categoria.png"}
            alt={categoria.denominacion || "Categoría"}
            className="card-articulo__image"
            onError={handleImageError}
            loading="lazy"
            style={{ height: "100%" }}
          />

        )}
      </div>

      <div className="card-articulo__content">
        <h3 className="card-articulo__title">
          {categoria.denominacion}
        </h3>

        {/* Mostrar categoría padre si existe */}
        {categoria.categoriaPadre && (
          <div className="card-articulo__parent-category">
            <span className="card-articulo__parent-text">
              Subcategoría de: {categoria.categoriaPadre.denominacion}
            </span>
          </div>
        )}

        {/* Indicador visual de que es una categoría */}
        <div className="card-articulo__category-indicator">
          <span className="card-articulo__category-badge">
            Categoría
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoriaCard;