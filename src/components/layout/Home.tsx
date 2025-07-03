import Imagen1 from '../../assets/images/Imagen1Home.png';
import Imagen1Responsive from '../../assets/images/Image1Responsive.png';
import '../../styles/Home.css';
import Slider from './SliderCategorias';
import CardPromocion from '../articulos/CardPromocion';
import { useEffect, useState } from 'react';
import type Promocion from '../../models/Promocion';
import SucursalService from '../../services/SucursalService';
import { useSucursalUsuario } from '../../context/SucursalContext';
import PromocionService from '../../services/PromocionService';

function Home() {
    const [promocionConStock, setPromocionConStock] = useState<Promocion[]>([]);
    const { sucursalActualUsuario } = useSucursalUsuario();

    useEffect(() => {
        const fetchPromocion = async () => {
            setPromocionConStock([]);
            if (!sucursalActualUsuario) return;
            try {
                const promos = await SucursalService.getAllBySucursalId(sucursalActualUsuario.id!);
                const isCategoriaEliminada = (categoria: any): boolean => {
                    if (!categoria) return false;
                    if (categoria.eliminado) return true;
                    return isCategoriaEliminada(categoria.categoriaPadre);
                };

                // Filtrar promociones que tienen stock y cuyos artículos no tienen categoría eliminada
                const promosConStock = await Promise.all(
                    promos.map(async (promo) => {
                        // Verificar si algún detalle tiene artículo con categoría eliminada
                        const tieneCategoriaEliminada = promo.detalles?.some(
                            (detalle: any) => isCategoriaEliminada(detalle.articulo?.categoria)
                        );
                        if (tieneCategoriaEliminada) return null;

                        const tieneStock = await PromocionService.consultarStockPromocion(promo, 1, sucursalActualUsuario);
                        return tieneStock ? promo : null;
                    })
                );
                setPromocionConStock(promosConStock.filter(Boolean) as Promocion[]);
            } catch (error) {
                console.error("Error al buscar promoción:", error);
            }
        };

        fetchPromocion();
    }, [sucursalActualUsuario]);

    return (
        <div className="home">
            <img className='imagenHome' src={Imagen1} alt="" />
            <img className='imagenHomeResponsive' src={Imagen1Responsive} alt="" />

            <h2 className='categoriasTitle mt-5 mb-5 m-4'>Categorias</h2>
            <Slider />

            <h2 className='categoriasTitle mt-5 mb-5 m-4'>¡Nuestras Promos!</h2>
            {promocionConStock.length > 0 ? (
                <div className="promociones-container gap-2 m-5">
                    {promocionConStock.map((promo) => (
                        <CardPromocion key={promo.id} promocion={promo} />
                    ))}
                </div>
            ) : (
                <div className="sin-promos">Aún no tenemos promociones</div>
            )}

        </div>
    );
}

export default Home;
