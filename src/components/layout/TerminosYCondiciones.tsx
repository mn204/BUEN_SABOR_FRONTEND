import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import LogoEmpresa from '../../assets/LogoEmpresa.png';

const QuienesSomos: React.FC = () => {
    const familia = [
        {
            id: 1,
            nombre: "Roberto González",
            cargo: "Fundador y Chef Principal",
            descripcion: "Con más de 20 años de experiencia culinaria, Roberto fundó El Buen Sabor con la visión de compartir las recetas familiares tradicionales."
        },
        {
            id: 2,
            nombre: "María González",
            cargo: "Gerente General",
            descripcion: "Encargada de supervisar todas las sucursales y mantener los estándares de calidad que caracterizan a nuestro restaurante familiar."
        },
        {
            id: 3,
            nombre: "Carlos González",
            cargo: "Chef de Sucursales",
            descripcion: "Responsable de entrenar a los equipos de cocina en cada sucursal para mantener la consistencia en todos nuestros platos."
        }
    ];

    return (
        <Container className="py-5">
            <Row className="mb-5">
                <Col lg={12} className="text-center">
                    <img
                        src={LogoEmpresa}
                        alt="El Buen Sabor Logo"
                        className="mb-4"
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '4px solid #F28500'
                        }}
                    />
                    <h1 className="display-4 mb-4" style={{ color: '#F28500' }}>
                        Quiénes Somos
                    </h1>
                    <p className="lead text-muted">
                        Conoce a la familia detrás del mejor sabor casero de Mendoza
                    </p>
                </Col>
            </Row>

            <Row className="mb-5">
                <Col lg={8} className="mx-auto">
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5">
                            <h2 className="h3 mb-4" style={{ color: '#F28500' }}>
                                Nuestra Historia Familiar
                            </h2>
                            <p className="text-muted mb-4">
                                El Buen Sabor nació del amor por la cocina tradicional y el deseo de compartir
                                las recetas que han pasado de generación en generación en la familia González.
                                Lo que comenzó como una pequeña mesa familiar se ha convertido en un restaurante
                                con múltiples sucursales, pero sin perder nunca nuestras raíces.
                            </p>
                            <p className="text-muted mb-4">
                                Desde 2009, hemos trabajado día a día para ofrecer comida casera de calidad,
                                preparada con ingredientes frescos y técnicas tradicionales que aprendimos
                                de nuestros abuelos. Cada plato que servimos lleva el sello distintivo
                                de la cocina familiar argentina.
                            </p>
                            <p className="text-muted">
                                Hoy, con 8 sucursales en Mendoza, seguimos siendo una empresa familiar
                                comprometida con mantener la calidad, el sabor auténtico y la calidez
                                en el trato que nos caracteriza desde nuestros inicios.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={12}>
                    <h2 className="text-center mb-5" style={{ color: '#F28500' }}>
                        Nuestra Familia
                    </h2>
                </Col>
                {familia.map((miembro) => (
                    <Col lg={4} md={6} key={miembro.id} className="mb-4">
                        <Card className="h-100 shadow border-0 text-center">
                            <Card.Body className="p-4">
                                <div className="mb-3">
                                    <img
                                        src={LogoEmpresa}
                                        alt={miembro.nombre}
                                        className="rounded-circle"
                                        style={{
                                            width: '100px',
                                            height: '100px',
                                            objectFit: 'cover',
                                            border: '3px solid #F28500'
                                        }}
                                    />
                                </div>
                                <Card.Title className="h5" style={{ color: '#F28500' }}>
                                    {miembro.nombre}
                                </Card.Title>
                                <Card.Subtitle className="mb-3 text-muted">
                                    {miembro.cargo}
                                </Card.Subtitle>
                                <Card.Text className="text-muted">
                                    {miembro.descripcion}
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="mt-5">
                <Col lg={8} className="mx-auto text-center">
                    <Card className="border-0" style={{ backgroundColor: '#F28500', color: 'white' }}>
                        <Card.Body className="p-4">
                            <h3 className="h4 mb-3">¿Quieres conocer más sobre nosotros?</h3>
                            <p className="mb-3">
                                Te invitamos a visitarnos en cualquiera de nuestras sucursales
                                y experimentar el auténtico sabor casero.
                            </p>
                            <p className="mb-0">
                                <strong>Email:</strong> elbuensabor@gmail.com |
                                <strong> Teléfono:</strong> +54 261 126 4124
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default QuienesSomos;