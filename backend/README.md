# Expense Tracker Backend API 🖥️

A robust, enterprise-grade Node.js/Express.js backend designed to power the AI-Powered Expense Tracker application. Built using the MVC (Model-View-Controller) architecture, it interfaces with MongoDB Atlas via Mongoose, handles asynchronous background crons, manages multi-format reports exporting, and implements intelligent AI models with an automated cost-saving cache layer.

---

## 📁 Directory Structure & MVC Architecture

The backend code is modularized into distinct, focused components:

```text
backend/
├── controllers/              # Business logic & controller handlers
│   ├── aiController.js       # AI OCR scanning, CSV parsing, recommendations, caching
│   ├── categoryController.js # Custom categories management & seeding
│   ├── expenseController.js  # Transaction CRUD, filters, and recurring transactions
│   └── userController.js     # Auth, profiles, and PDF/Excel report exports
├── middleware/               # Express global/route middlewares
│   └── verifyToken.js        # JSON Web Token verification & authentication protection
├── models/                   # Mongoose Database Schemas
│   ├── AICacheModel.js       # MongoDB schema for caching AI recommendations
│   ├── BudgetModel.js        # Schema for monthly financial budgets
│   ├── categorySchema.js     # Schema for default & user custom categories
│   ├── TransactionModel.js   # Schema for income and expense transactions
│   └── UserModel.js          # Schema for user credentials, regional formats, and theme
├── routes/                   # Routing configuration maps
│   ├── aiRoutes.js           # Routes for AI scans, suggestions, predictions, and CSV imports
│   ├── categoryRoutes.js     # Routes for category management
│   ├── expenseRoutes.js      # Routes for transaction CRUD and dashboard analytics
│   └── userRoutes.js         # Routes for auth, profiles, and file backup exports
├── server.js                 # App entry point, middleware registration, database connection
└── package.json              # Script definitions and package dependencies
```

---

## ⚙️ Core Engines & Systems

### 1. Cost-Saving AI Caching Layer 🧠
To prevent expensive, redundant API requests to LLM endpoints and speed up the user experience, the system implements a custom caching engine inside [aiController.js](file:///c:/Users/kanni/OneDrive/Desktop/Expense-tracker/ExpenseTracker/backend/controllers/aiController.js):
- **Transaction Signature:** When a user requests suggestions or predictions, the system computes a unique hash using `getTransactionSignature()`:
  $$\text{Signature} = \text{Transaction Count} + \text{":"} + \text{Last Updated Date Timestamp}$$
- **Cache Match:** It queries `AICache` for a cached document matching the user's ID, the request type, and this signature.
- **Cache Invalidation:** Any transaction creation, update, or deletion automatically triggers `invalidateUserAICache()`, instantly wiping the cached records for that user so their AI dashboard suggestions are always calculated with the freshest transaction data.

### 2. Multi-Provider AI Client Auto-Detection 🤖
The backend supports multiple OpenAI-compatible API providers (OpenAI, Groq, OpenRouter). It automatically configures its base URLs based on the format of your `AI_API_KEY`:
- Keys starting with `gsk_` are directed to the **Groq API** (`https://api.groq.com/openai/v1`).
- Keys starting with `sk-or-` are directed to the **OpenRouter API** (`https://openrouter.ai/api/v1`).
- Other formats route directly to the standard **OpenAI API**.
- Key settings are divided into `TEXT_LLM` and `VISION_LLM` environments, allowing you to use a cost-effective text model (like `gpt-4o-mini` or `llama-3.1-8b`) alongside a visual OCR model (like `gpt-4o` or `llama-3.2-11b-vision`).

### 3. Dual-Engine Recurring Transactions System 🔄
Located in [expenseController.js](file:///c:/Users/kanni/OneDrive/Desktop/Expense-tracker/ExpenseTracker/backend/controllers/expenseController.js), the system seamlessly switches between two methods of logging scheduled expenses:
- **Daily Cron Engine (Open-Ended):** A daily cron job scheduled via `node-cron` triggers every midnight (`0 0 * * *`). It scans for active recurring transactions where `nextRecurringDate` is on or before today and `recurringEndDate` is open-ended (null), clones the transaction, saves it, and advances the parent transaction's `nextRecurringDate` weekly, monthly, or yearly.
- **Finite Pre-Generation:** If the user creates a recurring transaction with a specific `recurringEndDate`, the system uses `insertMany` to pre-generate all scheduled occurrences up to the end date immediately, so future transactions are displayed instantly in analytics calendars and charts.

### 4. Custom Report Generator Engines 📥
- **Styled PDF Kit Generator:** The PDF exporter builds highly structured financial ledgers. It creates a title header, calculates net totals (Income, Expense, Net Balance), draws tables using custom vertical column alignment, applies alternating row fills (`#f1f5f9` vs `#ffffff`), and tracks coordinate heights to insert page breaks (`doc.addPage()`) before overlapping pages.
- **ExcelJS Spreadsheet Engine:** Compiles transactional tables inside stylized grids. It configures column widths based on expected lengths, styles header cells with white text on dark Slate gray fills (`#334155`), and parses numerical values appropriately for spreadsheet calculations.

---

## 🔑 Environment Configuration

Create a `.env` file in the root of the `backend/` folder:

```env
# Server Setup
PORT=5000
MONGO_URL=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173

# Unified Primary AI Provider (OpenAI, Groq, or OpenRouter)
AI_API_KEY=your_ai_api_key

# Specific Model Overrides (Optional)
TEXT_LLM_API_KEY=override_text_api_key
TEXT_LLM_BASE_URL=override_text_api_endpoint
TEXT_LLM_MODEL=gpt-4o-mini

VISION_LLM_API_KEY=override_vision_api_key
VISION_LLM_BASE_URL=override_vision_api_endpoint
VISION_LLM_MODEL=gpt-4o
```

---

## 🛣️ API Endpoints

### 1. User & Profiles (`/api/users`)
| Method | Endpoint | Auth | Description | Parameters / Payload |
| :--- | :--- | :---: | :--- | :--- |
| **POST** | `/register` | Public | Create new account | `{ firstName, email, password }` |
| **POST** | `/login` | Public | Log into account & set cookie | `{ email, password }` |
| **POST** | `/logout` | Public | Clear JWT session cookies | None |
| **POST** | `/changePassword` | Private | Change account password | `{ currentPassword, newPassword }` |
| **GET** | `/profile` | Private | Fetch details of logged-in user | None |
| **PUT** | `/profile` | Private | Edit profile (Excluding email) | `{ firstName, lastName, region, ... }` |
| **GET** | `/backup` | Private | Export user history reports | Query: `?format=json \| csv \| pdf \| excel` |

### 2. Expenses & Transactions (`/api/expenses`)
| Method | Endpoint | Auth | Description | Parameters / Payload |
| :--- | :--- | :---: | :--- | :--- |
| **POST** | `/` | Private | Add new transaction | `{ amount, category, type, date, title, note, ... }` |
| **GET** | `/` | Private | Get all filtered transactions | Queries: `?type,category,startDate,endDate,year,month` |
| **GET** | `/analytics` | Private | Fetch analytics reports | Queries: `?timeframe=day \| week \| month \| year \| history` |
| **GET** | `/:id` | Private | Get transaction details by ID | Route Param: `id` |
| **PUT** | `/:id` | Private | Update transaction | `{ amount, category, type, title, isRecurring, ... }` |
| **DELETE** | `/:id` | Private | Delete transaction | Route Param: `id` |

### 3. Categories (`/api/categories`)
| Method | Endpoint | Auth | Description | Parameters / Payload |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/` | Private | Get default and custom categories | None |
| **POST** | `/` | Private | Create private custom category | `{ name, type }` |
| **DELETE** | `/:id` | Private | Delete custom category | Route Param: `id` |

### 4. AI Assitant (`/api/ai`)
| Method | Endpoint | Auth | Description | Parameters / Payload |
| :--- | :--- | :---: | :--- | :--- |
| **POST** | `/scan-receipt` | Private | Scan receipt using Vision OCR | Multipart Form Data: `receipt` (image) |
| **GET** | `/suggestions` | Private | Fetch AI money tips & savings advice | None (Reads cache or LLM) |
| **GET** | `/predict` | Private | Forecast next-month expenses | None |
| **POST** | `/import` | Private | Auto-categorize CSV transactions | Multipart Form Data: `file` (CSV) |

---

## 🛠️ Atlas Database & SSL/TLS Troubleshooting

When deploying or connecting to MongoDB Atlas, developers might encounter handshake or authentication issues. Follow this guide to resolve them:

### 1. SSL/TLS Handshake Error (`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`)
If Mongoose fails to complete the TLS handshake, verify the following options:
* **IP Whitelisting:** Navigate to MongoDB Atlas -> **Network Access**. Click **Add IP Address** and add your current IP. If you are developing locally with a dynamic IP, select **Allow Access From Anywhere (0.0.0.0/0)** temporarily to check if the error resolves.
* **Network Filters / Proxies:** Secure corporate firewalls, VPNs, or antivirus software (e.g., Kaspersky, McAfee) may intercept SSL traffic by injecting custom root certificates. Try disabling your VPN, adding an exception in your antivirus SSL configurations, or switching to a mobile hotspot.
* **SSL Options in Mongoose:** If required, you can force Mongoose TLS settings by modifying the connection options in [server.js](file:///c:/Users/kanni/OneDrive/Desktop/Expense-tracker/ExpenseTracker/backend/server.js).

### 2. Atlas Authentication Failures (Error Code `8000`)
If Atlas rejects your authentication credentials:
* **Password Encoding:** If your MongoDB Atlas password contains special characters (like `@`, `:`, `/`, `?`, `#`), Mongoose will fail to parse the URI. You **MUST** URL-encode these characters (e.g., replace `@` with `%40`, `#` with `%23`).
* **User Roles:** Verify in MongoDB Atlas -> **Database Access** that your user has the proper roles. The user needs at least `readWriteAnyDatabase` or targeted `readWrite` access to the database specified in your connection string.
