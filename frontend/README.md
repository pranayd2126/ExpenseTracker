# Expense Tracker Frontend 🎨

A sleek, responsive, and feature-rich React 19 application built using Vite, styled with Tailwind CSS v4, and integrated with the Expense Tracker Backend. It provides an intuitive, high-fidelity interface for managing transactions, visualizing financial data with interactive charts, scanning receipts via Vision AI, setting app preferences, and importing/exporting database backups.

---

## 📁 Directory Structure & Components

The frontend client utilizes a modular architecture:

```text
frontend/
├── public/                   # Static assets
└── src/
    ├── components/           # Reusable widgets and UI panels
    │   ├── BarChart.jsx      # Canvas-based multi-bar financial comparison chart
    │   ├── PieChart.jsx      # Category expense distribution chart
    │   ├── BudgetProgress.jsx# Renders remaining budget progress bars
    │   ├── Header.jsx        # Premium responsive main navigation header
    │   ├── Footer.jsx        # standard copyright and branding footer
    │   ├── Insights.jsx      # Panel for displaying text-based AI financial suggestions
    │   ├── ReceiptScanner.jsx# Interactive drag-and-drop Vision AI scanner
    │   ├── SummaryCards.jsx  # Slate cards displaying total Income, Expense, and Balance
    │   ├── ProtectedRoute.jsx# Auth wrapper for private screens
    │   └── PublicRoute.jsx   # Redirects authenticated users away from login/register
    ├── context/              # React Context State Providers
    │   └── AuthContext.jsx   # Handles user auth sessions, automatic logins, and visual theme states
    ├── layouts/              # Screen skeleton frameworks
    │   └── RootLayout.jsx    # Structural shell registering main headers and footers
    ├── pages/                # Endpoint screens loaded by the Router
    │   ├── Dashboard.jsx     # Financial overview, charts, OCR scanning, and quick summary cards
    │   ├── AddTransaction.jsx# Form to log transactions, including a finite/open recurring schedule
    │   ├── Reports.jsx       # Searchable database of transactions with multi-filter parameters
    │   ├── Profile.jsx       # Account summary displaying non-editable hardened credentials
    │   ├── Settings.jsx      # App configurations, custom categories, backups exports, and CSV imports
    │   ├── Login.jsx         # Secure authentication entry form
    │   └── Register.jsx      # secure user signup registration screen
    ├── services/             # Axios API network connection helpers
    │   └── api.js            # Unified requests mapping to backend endpoints
    ├── index.css             # Main styling entry point utilizing Tailwind CSS v4 imports
    └── main.jsx              # React application mounting root
```

---

## 🎨 Key Features & Styling System

### 1. Tailwind CSS v4 Styling
This application uses Tailwind CSS v4 which features improved performance and native CSS variable integration:
- Configuration is loaded via `@tailwindcss/postcss` and native `@import` statements inside `index.css`.
- The theme system adapts cleanly between **Light** and **Dark** modes using Tailwind's standard `dark:` variant classes. Theme preferences are loaded directly from the authenticated User profile record, ensuring consistent cross-device synchronization.

### 2. Formatted Settings & Custom Categories
Managed inside [Settings.jsx](file:///c:/Users/kanni/OneDrive/Desktop/Expense-tracker/ExpenseTracker/frontend/src/pages/Settings.jsx):
- **Preferences:** Dropdowns to choose regional number layouts (`en-IN`, `en-US`, `en-GB`, etc.) and regional currency identifiers (`INR`, `USD`, `GBP`, etc.).
- **Categories Panel:** Add or delete custom private categories (limited to 10 per account) that automatically populate input forms.
- **CSV Data Imports:** Drag-and-drop file upload allowing you to upload CSV files. A backend AI auto-categorizes the items and loads them into your ledger.
- **Backup Downloads:** A custom format-selector panel allowing users to instantly download high-fidelity reports as stylized PDF, Excel `.xlsx`, raw CSV, or JSON backups.

### 3. Hardened Security Layout
- Separate tab systems clearly isolate application configurations from profile adjustments in the navigation flow.
- A **hardened email field** lock inside [Profile.jsx](file:///c:/Users/kanni/OneDrive/Desktop/Expense-tracker/ExpenseTracker/frontend/src/pages/Profile.jsx) ensures email identities remain frozen after sign-up, defending against credential takeover vectors.

---

## 🚀 Installation & Commands

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* A running Backend Server API (by default expected on `http://localhost:5000`)

### Getting Started

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run dev
   ```
   *The server starts on `http://localhost:5173`.*

3. **Compile for production:**
   ```bash
   npm run build
   ```
   *Compiles static build assets inside the `dist/` directory.*

4. **Preview production build locally:**
   ```bash
   npm run preview
   ```

5. **Linting check:**
   ```bash
   npm run lint
   ```
