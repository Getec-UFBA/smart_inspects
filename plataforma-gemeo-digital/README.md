# Plataforma Gêmeo Digital

Este projeto é uma plataforma web para visualização e gerenciamento de projetos de gêmeos digitais, com um backend em Node.js e um serviço de processamento de imagem em Python (YOLO).

## Pré-requisitos

Para configurar e executar este projeto, você precisará ter os seguintes softwares instalados em seu ambiente:

*   **Git**: Para clonar o repositório.
*   **Node.js** (versão 20.x ou superior recomendada): Ambiente de execução para o frontend e backend Node.js.
    *   **npm** (geralmente vem com o Node.js): Gerenciador de pacotes para o Node.js.
*   **Python** (versão 3.8 ou superior recomendada): Ambiente de execução para o serviço YOLO.
    *   **pip** (geralmente vem com o Python): Gerenciador de pacotes para o Python.

## Instalação e Execução

Siga os passos abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento local.

### 1. Clonar o Repositório

Abra seu terminal e clone o repositório:

```bash
git clone https://github.com/Getec-UFBA/smart_inspects.git
cd smart_inspects/plataforma-gemeo-digital
```

### 2. Configurar o Frontend (Node.js)

Na pasta raiz do projeto (`plataforma-gemeo-digital/`), instale as dependências do frontend:

```bash
npm install
```

**Dependências do Frontend:**
*   `axios`: Cliente HTTP para fazer requisições.
*   `bootstrap`: Framework CSS para estilização.
*   `path-browserify`: Polifill para o módulo `path` do Node.js no navegador.
*   `react`: Biblioteca JavaScript para construção de interfaces de usuário.
*   `react-bootstrap`: Componentes Bootstrap reescritos para React.
*   `react-dom`: Pacote para renderização do React no DOM.
*   `react-icons`: Biblioteca de ícones populares para React.
*   `react-router-dom`: Roteamento declarativo para React.

**Dependências de Desenvolvimento do Frontend:**
*   `@eslint/js`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `typescript-eslint`: Ferramentas de linting e análise de código.
*   `@types/node`, `@types/react`, `@types/react-dom`: Tipagens para TypeScript.
*   `@vitejs/plugin-react`, `vite`: Ferramenta de build e servidor de desenvolvimento para o frontend.
*   `concurrently`: Utilitário para rodar múltiplos comandos npm em paralelo (usado para `npm start`).
*   `typescript`: Linguagem de programação.

### 3. Configurar o Backend (Node.js)

Navegue até a pasta `backend` dentro de `plataforma-gemeo-digital/` e instale suas dependências:

```bash
cd backend
npm install
cd .. # Volte para a pasta raiz do projeto
```

**Dependências do Backend:**
*   `axios`: Cliente HTTP (pode ser usado para chamadas internas do backend).
*   `bcryptjs`: Biblioteca para hash de senhas.
*   `cors`: Middleware para habilitar o CORS (Cross-Origin Resource Sharing).
*   `express`: Framework web para Node.js.
*   `form-data`: Para trabalhar com dados de formulário multipart/form-data.
*   `jsonwebtoken`: Para trabalhar com JSON Web Tokens (JWT).
*   `multer`: Middleware para lidar com uploads de arquivos.
*   `puppeteer`: Biblioteca para controle de navegador headless (usado para geração de PDF).
*   `uuid`: Para gerar IDs únicos.

**Dependências de Desenvolvimento do Backend:**
*   `@types/bcryptjs`, `@types/cors`, `@types/express`, `@types/jsonwebtoken`, `@types/multer`, `@types/node`, `@types/uuid`: Tipagens para TypeScript.
*   `ts-node-dev`: Para reiniciar o servidor automaticamente durante o desenvolvimento.
*   `typescript`: Linguagem de programação.

### 4. Configurar o Serviço Python (YOLO)

Navegue até a pasta `python_service` dentro de `backend/`:

```bash
cd backend/python_service
```

É altamente recomendável criar e ativar um ambiente virtual para as dependências Python:

```bash
python3 -m venv venv
source venv/bin/activate # No Linux/macOS
# .\venv\Scripts\activate # No Windows PowerShell
```

Instale as dependências Python:

```bash
pip install -r requirements.txt
```

**Dependências do Serviço Python:**
*   `fastapi`: Framework web para construir APIs com Python.
*   `uvicorn[standard]`: Servidor ASGI para aplicações Python.
*   `python-multipart`: Para lidar com requisições multipart/form-data no FastAPI.
*   `opencv-python-headless`: Biblioteca OpenCV para processamento de imagem (versão headless para servidores).
*   `ultralytics`: Biblioteca para modelos YOLO (You Only Look Once) de detecção de objetos.

**Arquivos de Modelo YOLO:**
Os modelos pré-treinados `best.pt` e `last.pt` devem estar disponíveis na raiz da pasta `plataforma-gemeo-digital/` (ou em um local configurado via variáveis de ambiente). Certifique-se de que esses arquivos estão presentes.

```bash
cd ../../ # Volte para a pasta raiz do projeto
```

### 5. Executar o Projeto

Você pode iniciar o projeto de duas maneiras:

#### Opção A: Iniciar Frontend e Backend Juntos (Recomendado para Desenvolvimento)

Na raiz do projeto (`plataforma-gemeo-digital/`), execute o script `start`. Este comando usa `concurrently` para iniciar o frontend e o backend Node.js simultaneamente. **No entanto, o serviço Python YOLO precisará ser iniciado separadamente.**

```bash
npm start
```

*   O frontend estará disponível em `http://localhost:5173` (ou outra porta, se a 5173 estiver ocupada).
*   O backend Node.js estará disponível em `http://localhost:3333`.

#### Opção B: Iniciar Componentes Separadamente

Se você preferir controlar cada parte do projeto individualmente, ou se estiver iniciando o serviço Python, siga estas instruções:

**1. Iniciar o Backend (Node.js)**

Abra um novo terminal, navegue até `plataforma-gemeo-digital/backend` e execute:

```bash
cd plataforma-gemeo-digital/backend
npm run dev
```
O backend Node.js estará ouvindo em `http://localhost:3333`.

**2. Iniciar o Serviço Python (YOLO)**

Abra outro novo terminal, navegue até `plataforma-gemeo-digital/backend/python_service`. Ative o ambiente virtual (se você o criou) e execute o servidor Uvicorn:

```bash
cd plataforma-gemeo-digital/backend/python_service
source venv/bin/activate # Ative o ambiente virtual (Linux/macOS)
# .\venv\Scripts\activate # Ative o ambiente virtual (Windows PowerShell)

# Execute o serviço YOLO.
# Opção 1: Com variáveis de ambiente para os modelos (recomendado para garantir que os modelos sejam encontrados)
# BEST_MODEL_PATH e LAST_MODEL_PATH são relativos à pasta 'smart_inspects'
BEST_MODEL_PATH=../../best.pt LAST_MODEL_PATH=../../last.pt uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Opção 2: Comando simplificado (se os modelos já estiverem configurados nas variáveis de ambiente do sistema)
# Este comando inicia o serviço Python (YOLO)
uvicorn backend.python_service.main:app --reload --port 8001
```
O serviço Python YOLO estará ouvindo em `http://localhost:8001`.

**3. Iniciar o Frontend (Node.js)**

Abra um terceiro novo terminal, navegue até a raiz do projeto `plataforma-gemeo-digital/` e execute:

```bash
cd plataforma-gemeo-digital/
npm run dev:frontend
```
O frontend estará disponível em `http://localhost:5173` (ou outra porta).

## Estrutura do Projeto

*   **`/`**: Contém os arquivos de configuração e o código-fonte do frontend (React + Vite).
*   **`/backend`**: Contém o código-fonte do backend (Node.js + Express) e o serviço Python YOLO.
    *   **`/backend/python_service`**: Serviço Python para processamento de imagens (YOLO).
*   **`/public`**: Arquivos estáticos do frontend.
*   **`/src`**: Código-fonte do frontend.
*   **`best.pt` / `last.pt`**: Modelos YOLO pré-treinados (devem estar na raiz de `plataforma-gemeo-digital/`).
