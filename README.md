# AI-Powered MERN Expense Tracker 💰

A modern, highly functional full-stack web application designed to help users track, manage, and analyze their expenses. It features advanced **AI capabilities** (receipt scanning, auto-categorization, financial suggestions), a robust **recurring transactions engine**, **multi-format data exports** (PDF, Excel, CSV, JSON), and interactive **visual analytics**.

---

## 🌟 Key Features

### 👤 User Management & Hardened Security
- **Secure Authentication:** Secure sign-up and login using JSON Web Tokens (JWT) stored in secure, HttpOnly cookies, with password hashing handled by `bcrypt`.
- **Profile Customization:** Customize regional formats, choose regional currencies, and toggle dark/light theme preferences.
- **Hardened Settings:** Separate general app settings from profile management. Sensitive data like email addresses are securely locked and non-editable after registration.

### 🤖 Intelligent AI Capabilities
- **Vision Receipt Scanner:** Scan and upload physical or digital receipts. A Vision LLM automatically parses merchant names, transaction dates, total amounts, notes, and maps them to the best-fitting category.
- **AI Financial Advisor:** Evaluates the last 3 months of transactions to deliver targeted observations, savings goals, category breakdowns, and next-month expense predictions.
- **CSV Auto-Categorization:** Import transaction spreadsheets up to 100 rows at once. The AI parses columns, extracts details, auto-assigns matching category IDs, and inserts them directly into the database.
- **Cost-Saving Cache System:** Caches AI advice and predictions in MongoDB based on transaction signatures, eliminating redundant API requests, speeding up performance, and minimizing API billing costs.
- **Plug-and-Play LLM Engines:** Built-in auto-detection for OpenAI, Groq, and OpenRouter API keys.

### 🔄 Recurring Transactions Engine
- **Open-Ended Series:** Set up transactions that repeat weekly, monthly, or yearly. A daily midnight cron engine automatically processes and logs them as their next dates are reached.
- **Finite Pre-Generation:** Providing an end-date automatically pre-generates all scheduled occurrences, letting users visualize their future expense timeline immediately.
- **Series Management:** Supports converting recurring series into standard transactions, editing occurrences individually, or deleting schedules.

### 📊 Reports & Visual Analytics
- **Interactive Dashboards:** Dynamic charts (Pie Charts and Bar Charts) powered by Chart.js and `react-chartjs-2` showcasing monthly, weekly, daily, or custom history trends.
- **Customizable Filters:** Drill down into expenses/income by categories, custom date ranges, specific months, or entire years.
- **Custom Categories:** Manage up to 10 personalized private categories, alongside default global categories.

### 📥 Multi-Format Exports
- **Styled PDF Reports:** Generate clean, print-ready PDF reports with PDFKit, including alternating row styling and net income/expense calculations.
- **Formatted Excel Spreadsheets:** Export transactions as stylish `.xlsx` files using ExcelJS, featuring custom column widths, bold headers, and slate fills.
- **CSV & JSON Backups:** High-fidelity raw data backups for local offline copies or easy migrations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS v4 (@tailwindcss/postcss)
- **Routing:** React Router DOM v7
- **HTTP client:** Axios
- **Charts:** Chart.js & `react-chartjs-2`
- **Feedback & Icons:** React Icons, React Toastify

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Database:** MongoDB with Mongoose 9 (ODM)
- **Authentication:** JWT, cookie-parser, bcryptjs
- **File Uploads:** Multer (using secure in-memory buffers)
- **Cron Jobs:** `node-cron` (runs recurring engines daily)
- **Exports:** PDFKit (PDFs), ExcelJS (Excel)
- **AI Integration:** OpenAI SDK (OpenAI-compatible)

---

## 📁 Project Structure

```text
ExpenseTracker/
├── backend/                  # Node.js & Express API Server
│   ├── controllers/          # Business logic (users, transactions, AI, categories)
│   ├── middleware/           # Token verification & file upload filtering
│   ├── models/               # MongoDB models (User, Transaction, Category, AICache, Budget)
│   ├── routes/               # API endpoints
│   ├── server.js             # Express application and database entry point
│   └── .env                  # Backend configuration & API keys
├── frontend/                 # React 19 Frontend Web App
│   ├── public/               # Static public assets
│   ├── src/
│   │   ├── components/       # Visual components (charts, receipt scanner, headers/footers)
│   │   ├── context/          # Global authentication & theme context states
│   │   ├── pages/            # View pages (Dashboard, Reports, Settings, Profile, Auth)
│   │   ├── services/         # Axios API connection layer
│   │   └── index.css         # Styling styles & Tailwind entries
│   ├── vite.config.js        # Vite compilation configuration
│   └── postcss.config.js     # CSS compilation config
└── README.md                 # Project guide
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas instance)

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ExpenseTracker
   ```

2. **Backend Configuration:**
   Navigate into the `backend` directory:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file inside the `backend` folder:
   ```env
   PORT=5000
   MONGO_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:5173

   # AI Configuration (supports OpenAI, Groq, or OpenRouter)
   AI_API_KEY=your_primary_ai_key

   # Optional specific LLM models/endpoints (defaults to gpt-4o-mini and gpt-4o)
   TEXT_LLM_API_KEY=optional_override_key
   TEXT_LLM_BASE_URL=optional_override_endpoint
   TEXT_LLM_MODEL=gpt-4o-mini
   VISION_LLM_API_KEY=optional_vision_override_key
   VISION_LLM_BASE_URL=optional_vision_override_endpoint
   VISION_LLM_MODEL=gpt-4o
   ```
   Start the backend in development mode (using nodemon):
   ```bash
   npm run dev
   ```

3. **Frontend Configuration:**
   Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

4. **Access the Application:**
   Open your browser and navigate to the local address output by Vite (typically `http://localhost:5173`).

---

## 📜 Scripts

### Backend
- `npm start`: Runs the server with standard Node.
- `npm run dev`: Starts the server with Nodemon for hot-reloading.

### Frontend
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Generates the production bundle.
- `npm run preview`: Previews the production bundle locally.
- `npm run lint`: Runs ESLint check.

---
