# 🌾 AgriScore AI – Farmer Loan Readiness Assistant

AgriScore AI is an AI-powered web application that helps farmers evaluate their loan readiness before applying for agricultural loans. The system analyzes farm details, crop information, land records, and financial inputs to generate a credit readiness score, personalized recommendations, and a bank-ready PDF report.

---

## 🚀 Features

- 🌱 Farmer Loan Readiness Assessment
- 🤖 AI-Based Credit Scoring
- 📊 Smart Loan Eligibility Analysis
- 📄 Bank-Ready PDF Report Generation
- ☁️ Firebase Authentication & Firestore Database
- 📱 Responsive User Interface

---

## 🛠 Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML5
- CSS3

### Backend
- Node.js
- Express.js

### Database
- Firebase Firestore

### Authentication
- Firebase Authentication

### Cloud Services
- Firebase Admin SDK

### Libraries
- jsPDF
- html2canvas
- Axios
- Firebase SDK

---

## 📂 Project Structure

```
AgriScore-AI/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
│
├── src/
├── public/
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/kasifalam/AgriScore-AI.git
cd AgriScore-AI
```

### Install Frontend

```bash
npm install
```

### Install Backend

```bash
cd backend
npm install
```

---

## ▶️ Run Project

### Start Backend

```bash
cd backend
npm start
```

Backend runs on:

```
http://localhost:5000
```

### Start Frontend

Open another terminal:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔥 Environment Variables

Create a `.env` file inside the `backend` folder and add:

```env
PORT=5000

FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_CLIENT_EMAIL=YOUR_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY=YOUR_PRIVATE_KEY
```

---

## 📄 License

This project is developed for educational and hackathon purposes.