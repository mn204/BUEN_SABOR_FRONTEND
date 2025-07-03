// NuestraCompania.tsx - Modificado para restaurante con sucursales
import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import LogoEmpresa from '../../assets/LogoEmpresa.png';

const NuestraCompania: React.FC = () => {
    const valores = [
        {
            titulo: "Calidad",
            descripcion: "Nos comprometemos a ofrecer solo los mejores ingredientes y sabores auténticos en todas nuestras sucursales.",
            icono: "🍽️"
        },
        {
            titulo: "Tradición",
            descripcion: "Mantenemos la receta familiar original en cada plato que servimos, sin importar la sucursal.",
            icono: "👨‍🍳"
        },
        {
            titulo: "Frescura",
            descripcion: "Preparamos todos nuestros platos con ingredientes frescos del día en cada una de nuestras cocinas.",
            icono: "🥬"
        },
        {
            titulo: "Servicio",
            descripcion: "Brindamos atención personalizada y el mismo nivel de excelencia en todas nuestras ubicaciones.",
            icono: "⭐"
        }
    ];

    const estadisticas = [
        { numero: "2", descripcion: "Sucursales en Mendoza" },
        { numero: "25,000+", descripcion: "Clientes Satisfechos" },
        { numero: "100,000+", descripcion: "Platos Servidos" },
        { numero: "15", descripcion: "Años de Experiencia" }
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
                        Nuestra Compañía
                    </h1>
                    <p className="lead text-muted">
                        Sabor auténtico, tradición familiar en cada bocado
                    </p>
                </Col>
            </Row>

            <Row className="mb-5">
                <Col lg={8} className="mx-auto">
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5">
                            <h2 className="h3 mb-4" style={{ color: '#F28500' }}>
                                Sobre El Buen Sabor
                            </h2>
                            <p className="text-muted mb-4">
                                El Buen Sabor es un restaurante familiar fundado en Mendoza, Argentina,
                                con más de 15 años de experiencia brindando la mejor comida casera y
                                platos tradicionales. Lo que comenzó como un pequeño local familiar
                                se ha expandido a múltiples sucursales en toda la provincia.
                            </p>
                            <p className="text-muted mb-4">
                                Nos especializamos en mantener el sabor auténtico de nuestras recetas
                                familiares, utilizando ingredientes frescos y técnicas tradicionales
                                de cocina en cada una de nuestras sucursales. Cada plato es preparado
                                con el mismo amor y dedicación que nos caracteriza desde nuestros inicios.
                            </p>
                            <p className="text-muted">
                                Con 8 sucursales estratégicamente ubicadas en Mendoza, llevamos nuestro
                                sabor único más cerca de nuestros clientes, manteniendo siempre la
                                calidad y calidez que nos distingue como restaurante familiar.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-5">
                <Col lg={12}>
                    <h2 className="text-center mb-5" style={{ color: '#F28500' }}>
                        Nuestros Valores
                    </h2>
                </Col>
                {valores.map((valor, index) => (
                    <Col lg={3} md={6} key={index} className="mb-4">
                        <Card className="h-100 shadow border-0 text-center">
                            <Card.Body className="p-4">
                                <div className="mb-3" style={{ fontSize: '3rem' }}>
                                    {valor.icono}
                                </div>
                                <Card.Title className="h5" style={{ color: '#F28500' }}>
                                    {valor.titulo}
                                </Card.Title>
                                <Card.Text className="text-muted">
                                    {valor.descripcion}
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="mb-5">
                <Col lg={12}>
                    <Card className="border-0" style={{ backgroundColor: '#F28500' }}>
                        <Card.Body className="p-5 text-center text-white">
                            <h2 className="h3 mb-5">Nuestros Números</h2>
                            <Row>
                                {estadisticas.map((stat, index) => (
                                    <Col lg={3} md={6} key={index} className="mb-3">
                                        <div className="display-4 fw-bold mb-2">{stat.numero}</div>
                                        <p className="mb-0">{stat.descripcion}</p>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="mb-5">
                <Col lg={8} className="mx-auto">
                    <Card className="shadow border-0">
                        <Card.Body className="p-5">
                            <h2 className="h3 mb-4 text-center" style={{ color: '#F28500' }}>
                                Nuestra Visión
                            </h2>
                            <p className="text-muted text-center mb-4">
                                Ser el restaurante familiar de referencia en Mendoza, expandiendo
                                nuestras sucursales sin perder la esencia y calidad que nos caracteriza,
                                llevando el auténtico sabor casero a cada rincón de la provincia.
                            </p>
                            <div className="text-center">
                                <Badge
                                    pill
                                    className="px-3 py-2 fs-6"
                                    style={{ backgroundColor: '#F28500', color: 'white' }}
                                >
                                    Tradición Familiar desde 2009
                                </Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={12} className="text-center">
                    <Card className="border-0 bg-light">
                        <Card.Body className="p-4">
                            <h3 className="h4 mb-3" style={{ color: '#F28500' }}>
                                ¿Quieres conocer nuestras sucursales?
                            </h3>
                            <p className="text-muted mb-3">
                                Visita cualquiera de nuestras ubicaciones en Mendoza o haz tu pedido
                                online para delivery y takeaway.
                            </p>
                            <p className="mb-0">
                                <strong>Contáctanos:</strong> elbuensabor@gmail.com | +54 261 126 4124
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default NuestraCompania;
