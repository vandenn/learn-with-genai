<div align="center">

# Learn with GenAI

![python](https://img.shields.io/badge/python-3.11-blue)
![node](https://img.shields.io/badge/node.js-20+-green)

<img width="955" height="477" alt="learn_with_genai" src="https://github.com/user-attachments/assets/638e6778-74a2-4b32-b35f-11e79a339f0f" />

"Cursor for learning", or an "open-source NotebookLM"

A GenAI-powered learning application that helps you learn faster through AI-powered note-taking, RAG-based question answering, and pedagogical agents for reviewing. Inspired by NotebookLM, Cursor, and Obsidian.

</div>

# 🛠 Setup

## Frontend

Navigate to the frontend module:
```bash
cd frontend
```

Navigate to the frontend directory and start the development server:
```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Backend

Navigate to the backend module:
```bash
cd backend
```

Create a local `.env` based on the `.env.example` file and fill it with the corresponding API keys:
```bash
cp -i .env.example .env
```

Make sure you have `uv` installed in your system, then run:
```bash
make init
make run
```

## Development

To activate pre-commits, make sure to run the following in the root directory:
```bash
make setup-dev
```

The backend server will be available at `http://localhost:8000`.
