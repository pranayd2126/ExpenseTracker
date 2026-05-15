# Expense Tracker 💰

A full-stack web application designed to help users efficiently track, manage, and analyze their expenses. Built with a modern tech stack featuring React, Node.js, Express, MongoDB, and Tailwind CSS.

## 🌟 Features

- **User Authentication:** Secure signup and login using JWT (JSON Web Tokens) and bcrypt password hashing.
- **Expense Management:** Add, edit, view, and delete expenses.
- **Visual Analytics:** Interactive charts and graphs powered by Chart.js to visualize spending habits.
- **AI Integration:** Leverage OpenAI for smart expense categorization and insights.
- **File Uploads:** Support for file uploads using Multer (e.g., receipt images or user avatars).
- **Scheduled Tasks:** Automated background tasks handled via node-cron.
- **Responsive UI:** A beautiful, responsive user interface built with React, Vite, and Tailwind CSS.
- **Notifications:** Real-time feedback using React Toastify.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 powered by Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **State Management & Data Fetching:** Axios
- **Charts:** Chart.js & react-chartjs-2
- **Icons & UI:** React Icons, React Toastify

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (jsonwebtoken), bcrypt / bcryptjs, cookie-parser
- **File Uploads:** Multer
- **AI / Extra:** OpenAI, node-cron
- **Development:** Nodemon

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd ExpenseTracker-new
   ```

2. **Backend Setup:**
   Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   OPENAI_API_KEY=your_openai_api_key
   ```
   Start the backend development server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   Open a new terminal, navigate to the frontend directory, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

4. **Access the Application:**
   Open your browser and navigate to the URL provided by Vite (usually `http://localhost:5173`).

## 📁 Project Structure

```text
ExpenseTracker-new/
├── backend/               # Node.js Express backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middlewares (auth, upload, etc.)
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── server.js          # Entry point for backend
│   └── .env               # Backend environment variables
├── frontend/              # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # React components, pages, and hooks
│   ├── vite.config.js     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS configuration
└── README.md              # Project documentation
```

## 📜 Scripts

- **Backend:**
  - `npm start`: Runs the server using node.
  - `npm run dev`: Runs the server using nodemon for automatic reloads.
- **Frontend:**
  - `npm run dev`: Starts the Vite development server.
  - `npm run build`: Builds the app for production.
  - `npm run preview`: Locally preview the production build.
  - `npm run lint`: Runs ESLint for code formatting.

## 📄 License

This project is licensed under the ISC License.
