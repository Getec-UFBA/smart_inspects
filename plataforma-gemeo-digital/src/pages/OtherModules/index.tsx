import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const OtherModules: React.FC = () => {
  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md="8" className="text-center">
          <h1>Página para Outros Módulos de Projeto</h1>
          <p>
            Este projeto não inclui o módulo de manutenção. 
            Informações específicas para os módulos selecionados (como progresso e segurança) 
            seriam exibidas aqui.
          </p>
          <p>
            Esta é uma página placeholder.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default OtherModules;
