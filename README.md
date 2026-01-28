# 🧠 Interview Trainer AI

> **Master your technical interviews with an AI-powered simulator.**
> _Performance-audited, Latency-optimized, and Service-oriented._

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-v20%2B-green.svg)
![React](https://img.shields.io/badge/react-v19-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-v5-blue.svg)

## 📖 Overview

**Interview Trainer AI** is a full-stack MERN application designed to simulate high-pressure technical interviews. Leveraging the **Groq LPU** engine, it delivers near-instant API responses to generate context-aware questions and personalized feedback in real-time.

It features a modern "Avant-Garde" UI built with **React 19** & **Tailwind v4**, ensuring a premium user experience while maintaining robust performance.

---

## ⚡ Key Features

- 🤖 **AI-Driven Simulations:** Dynamic question generation based on role and seniority.
- 🚀 **Performance Optimized:** Route-level code splitting and WebP asset optimization for instant loading.
- ☁️ **Cloud Native Storage:** Profile images securely stored on **Cloudinary**.
- 🔐 **Robust Security:** HttpOnly Cookies, JWT (Access + Refresh tokens).
- 📊 **Session Tracking:** Save progress, review answers, and **Pin** key questions.
- 🌍 **Bilingual & Lightweight:** Dual language support with zero-dependency date formatting (Native Intl).

---

## 🛠️ Tech Stack

### **Frontend**

- **Core:** React 19, Vite 7, React Router 7
- **Styling:** Tailwind CSS v4, Framer Motion
- **State:** Context API, Axios

### **Backend**

- **Runtime:** Node.js (ESM), Express v5
- **Database:** MongoDB, Mongoose v9
- **AI:** Groq API (Llama/Mixtral models)
- **Storage:** Cloudinary (via Multer)

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- MongoDB Instance (Local or Atlas)
- Groq API Key
- Cloudinary Account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/interview-trainer-ai.git
cd interview-trainer-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

_Edit `.env` with your API keys (MongoDB, Groq, Cloudinary)._

### 3. Frontend Setup

```bash
cd ../frontend/interview-prep-ai
npm install
cp .env.example .env
```

### 4. Run Locally

```bash
# Terminal 1 (Backend)
cd backend && npm run dev

# Terminal 2 (Frontend)
cd frontend/interview-prep-ai && npm run dev
```

---

The project follows a modular **Service-Controller** pattern with a strict separation of concerns, optimized for scalability and bundle size.

- **Services**: Encapsulate business logic and data orchestration.
- **Controllers**: Lean request handlers.
- **Optimizations**: Code-splitting, WebP assets, and native API usage (Intl).

👉 **[Read the full ARCHITECTURE.md](./ARCHITECTURE.md)** for a deep dive into the system design, testing strategy (Pyramid), and deployment guidelines.

---

## 🧪 Testing

We maintain a high standard of quality with **140+ automated tests**.

```bash
# Run Backend Tests
cd backend && npm test

# Run Frontend Tests
cd frontend/interview-prep-ai && npm test
```

---

## 📄 License

This project is licensed under the **MIT License**.
