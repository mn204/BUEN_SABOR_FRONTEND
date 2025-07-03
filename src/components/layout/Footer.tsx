import '../../styles/footer.css';
import Twitter from '../../assets/footer/Twiter.svg';
import Instragram from '../../assets/footer/Instragram.svg';
import Facebook from '../../assets/footer/Facebook.svg';
import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto text-center">
                <Link to="/nuestra-compania" className="text-white text-decoration-none">
                <p className='fw-bold'>Nuestra Compañia</p>
                </Link>
                <Link to="/quienes-somos" className="text-white text-decoration-none">
                    <p>Quienes Somos</p>
                </Link>
                <Link to="/terminos-y-condiciones" className="text-white text-decoration-none">
                    <p>Terminos y Condiciones</p>
                </Link>
                <br />
                <p className='fw-bold'>Contacto</p>
                <p>Direccion: Calle falsa 1234, Mendoza, Argentina</p>
                <p>Email: elbuensabor@gmail.com</p>
                <p>Teléfono: +54 261 126 4124</p>
            </div>
            <div>
                <p className='fw-bold'>&copy; 2025 El Buen Sabor. Todos los derechos reservados.</p>
            </div>
            <div className='tercerDiv'>
                <div className='RedesSociales'>
                    <span className='fw-bold'>Redes Sociales</span>
                    <a href="https://twitter.com"><img src={Twitter} alt="Twitter" /></a>
                    <a href="https://instagram.com"><img src={Instragram} alt="Instagram" /></a>
                    <a href="https://facebook.com"><img src={Facebook} alt="Facebook" /></a>
                </div>
                <div className="DefensaAlConsumidor">
                    <p className='fw-bold'>Defensa al consumidor</p>
                    <Link to="/defensa-consumidor" className="text-white text-decoration-none">
                        <p>Defensa a los consumidores ingresa acá</p>
                    </Link>
                    <p>Ley N° 24.240 de Defensa a Consumidor Ver contratos de Adhesión</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;