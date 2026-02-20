# Smart Inspects Platform

Este projeto é uma plataforma web para visualização e gerenciamento de inspeções técnicas e gêmeos digitais, integrando um frontend React, um backend Node.js e um serviço de Inteligência Artificial (YOLO) em Python para processamento de imagens.

## 🏗️ Estrutura do Projeto

A estrutura foi reorganizada para facilitar a manutenção e escalabilidade:

```text
smart_inspects/
├── frontend/             # Interface React (Vite) - Porta 5173
├── backend/              # API Node.js (Express) - Porta 3001
│   ├── db.json           # Banco de dados local (JSON Server)
│   ├── public/uploads/   # Arquivos enviados e processados
│   └── src/              # Código fonte da API
├── ai-service/           # Serviço de IA (Python/FastAPI) - Porta 8001
│   ├── models/           # Modelos YOLO (.pt)
│   └── main.py           # API de processamento de imagem
├── start.sh              # Script de inicialização rápida (Linux)
└── start.bat              # Script de inicialização rápida (Windows)
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
*   **Node.js** (v20+)
*   **Python** (v3.10+)
*   **Git**

---

### 🐧 No Linux (Ubuntu/Debian)

#### 1. Instalar Dependências
```bash
# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..

# AI Service
cd ai-service
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
cd ..
```

#### 2. Executar
Você pode usar o script automatizado que inicia os 3 serviços simultaneamente:
```bash
chmod +x start.sh
./start.sh
```

---

### 🪟 No Windows

#### 1. Instalar Dependências
Abra o Prompt de Comando (CMD) ou PowerShell:

**Frontend:**
```cmd
cd frontend
npm install
cd ..
```

**Backend:**
```cmd
cd backend
npm install
cd ..
```

**AI Service (Opção 1: Com Ambiente Virtual - Recomendado):**
```cmd
cd ai-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**AI Service (Opção 2: Sem Ambiente Virtual):**
Se preferir não usar pasta virtual, instale as dependências diretamente:
```cmd
cd ai-service
pip install -r requirements.txt
cd ..
```

#### 2. Executar
Basta clicar duas vezes no arquivo `start.bat` ou rodar via terminal:
```cmd
start.bat
```

---

## 🛠️ Comandos Manuais (Caso necessário)

Se preferir rodar cada serviço em um terminal separado:

| Serviço | Pasta | Comando | Porta |
| :--- | :--- | :--- | :--- |
| **IA (Python)** | `ai-service` | `uvicorn main:app --port 8001` | 8001 |
| **API (Node)** | `backend` | `npm run dev` | 3001 |
| **Web (React)** | `frontend` | `npm run dev` | 5173 |

---

## 📦 Dependências Principais

### Frontend
- **React 19 / Vite**: Framework e Build Tool.
- **Axios**: Requisições HTTP.
- **Bootstrap 5**: Estilização e componentes.
- **React Router Dom**: Navegação entre páginas.

### Backend
- **Express**: Framework Web.
- **Multer**: Upload de arquivos.
- **Bcryptjs / JWT**: Autenticação e segurança.
- **Puppeteer**: Geração de relatórios PDF.
- **JSON Database**: Armazenamento em `db.json`.

### IA Service
- **FastAPI / Uvicorn**: Framework para API de alta performance.
- **Ultralytics (YOLOv8)**: Detecção de objetos nas imagens.
- **OpenCV**: Manipulação de imagens.

---

## 📝 Notas Importantes
- O banco de dados `db.json` **não deve ser apagado**, pois contém as configurações e cadastros do sistema.
- Certifique-se de que as portas **3001, 5173 e 8001** estão liberadas em seu sistema.
