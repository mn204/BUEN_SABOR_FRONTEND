import { Modal, Button } from "react-bootstrap";

interface Props {
  show: boolean;
  onHide: () => void;
  mensaje: string;
  titulo?: string;
  variante?: "primary" | "success" | "danger" | "warning" | "info" | "secondary";
}

function ModalMensaje({ show, onHide, mensaje, titulo = "Mensaje", variante = "primary" }: Props) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{titulo}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="m-0">{mensaje}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant={variante} onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ModalMensaje;
