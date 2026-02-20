import React, { useContext } from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';
import './style.css';
import getecLogoDark from '../../assets/images/getec.png'; // Logo para tema escuro
import getecLogoLight from '../../assets/images/Logo_GETEC_UFBA_preto.png'; // Logo para tema claro
import { ThemeContext } from '../../contexts/ThemeContext'; // Importa o ThemeContext

const Home: React.FC = () => {
  const { theme } = useContext(ThemeContext);
  const currentLogo = theme === 'light' ? getecLogoLight : getecLogoDark;

  return (
    <Container fluid className="home-container">
      {/* Primeiro Container: Logo + Frase */}
      <Row className="align-items-center text-center text-md-start mb-5 pb-5 border-bottom">
        <Col md={4} className="text-center">
          <Image src={currentLogo} alt="Logo GETEC" fluid className="mb-4 mb-md-0 home-logo" />
        </Col>
        <Col md={8}>
          <h1 className="display-4 fw-bold">Revolucionando a gestão na construção civil</h1>
          <p className="lead mt-3">
            Bem-vindo(a) à Plataforma Gêmeo Digital, a solução inovadora do GETEC para otimizar seus processos.
          </p>
        </Col>
      </Row>

      {/* Segundo Container: Sobre a Plataforma */}
      <Row className="my-5">
        <Col md={6}>
          <div className="about-platform-section">
            <h3>Sobre a Plataforma</h3>
            <p>
              {/* Espaço para o usuário inserir o texto sobre a plataforma */}
              A Plataforma Gêmeo Digital integra tecnologias avançadas para oferecer uma visão completa e interativa dos seus projetos. Com recursos de visualização 3D, simulação de processos e análise de dados em tempo real, nossa ferramenta permite que você tome decisões mais informadas, reduza custos e aumente a eficiência em todas as etapas da construção. Explore as funcionalidades e descubra como podemos transformar a gestão dos seus empreendimentos.
            </p>
          </div>
        </Col>
        <Col md={6}>
          {/* Pode ser usada para imagem ou deixada vazia */}
        </Col>
      </Row>

      {/* Terceiro Container: Link para o grupo de pesquisa */}
      <Row className="justify-content-center text-center mt-5">
        <Col md={8}>
          <p className="lead">Conheça mais sobre nosso grupo de pesquisa:</p>
          <a href="https://getec.eng.ufba.br/" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
            Visitar GETEC UFBA
          </a>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;

