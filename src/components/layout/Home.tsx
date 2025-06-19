import Imagen1 from '../../assets/images/Imagen1Home.png';
import Imagen1Responsive from '../../assets/images/Image1Responsive.png';
import '../../styles/Home.css';
import Slider from './SliderCategorias';
import CardPromocion from '../articulos/CardPromocion';
import { useEffect, useState } from 'react';
import type Promocion from '../../models/Promocion';
import SucursalService from '../../services/SucursalService';
import { useSucursalUsuario } from '../../context/SucursalContext';
import { Form } from 'react-bootstrap';

function Home() {
    const [promocion, setPromocion] = useState<Promocion[]>([]);
    const { sucursalActualUsuario, sucursalesUsuario, cambiarSucursalUsuario } = useSucursalUsuario();

    useEffect(() => {
        const fetchPromocion = async () => {
            console.log("sucursal: ", sucursalActualUsuario)
            try {
                const response = await SucursalService.getAllBySucursalId(sucursalActualUsuario!.id!)
                    .then((promos) => setPromocion(promos));
            } catch (error) {
                console.error("Error al buscar promoción:", error);
            }
        };

        fetchPromocion();
    }, [sucursalActualUsuario]);

    return (
        <div className="home">
            <div className="SelectSucursalHome sucursal text-white align-items-center justift-content-center" style={{ width: '100%'}}>
                <Form.Select
                    id="selectSucursalUsuario2"
                    value={sucursalActualUsuario?.id || ""}
                    onChange={(e) => {
                        const id = parseInt(e.target.value);
                        const sucursal = sucursalesUsuario.find(s => s.id === id);
                        if (sucursal) cambiarSucursalUsuario(sucursal);
                    }}
                    style={{ width: '100%', minWidth: '200px', margin: "1px 10px 10px 10px"}}
                >
                    {sucursalesUsuario.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                </Form.Select>
            </div>
            <img className='imagenHome' src={Imagen1} alt="" />
            <img className='imagenHomeResponsive' src={Imagen1Responsive} alt="" />

            <h2 className='categoriasTitle mt-5 mb-5 m-4'>Categorias</h2>
            <Slider />

            <h2 className='categoriasTitle mt-5 mb-5 m-4'>¡Nuestras Promos!</h2>
            {promocion.length > 0 ? (
                <div className="promociones-container gap-2 m-5">
                    {promocion.map((promo) => (
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
