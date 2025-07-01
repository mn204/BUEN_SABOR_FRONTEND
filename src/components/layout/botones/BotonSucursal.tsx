import Button from "react-bootstrap/Button";
import iconSucursal from "../../../assets/botones/sucursal.svg";
interface BotonSucursalProps {
  onClick?: () => void;
}

const BotonSucursal: React.FC<BotonSucursalProps> = ({ onClick }) => {
    return (
        <Button
            onClick={onClick}
            variant="info"
            size="sm"
            className="me-2"
        >
            <img src={iconSucursal} alt="darAlta" style={{width: "16px", height: "16px"}}/>
        </Button>

    );
}

export default BotonSucursal;