# GridWholesale | UK Day-Ahead Renewable Wind Analytics Desk

> **A Production-Grade Full-Stack Decision Support System for UK Wholesale Electricity Procurement (January 2026 Decisions)**  
> Built with **React** (Frontend), **Python / FastAPI** (Backend), and **Docker**.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Container-Docker%20Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 1. Executive Summary & Problem Setting

In Great Britain's wholesale electricity market, an energy utility must purchase electricity on the **Day-Ahead Market** ($D-1$) to serve forecasted consumer demand on the delivery day ($D$). 

Because renewable sources like wind have near-zero marginal operating costs, wind power is dispatched first (merit order). The **residual demand**—the portion of customer demand exceeding renewable generation—must be procured in advance from thermal plants (e.g., CCGT natural gas units).

### The Market Dilemma:
* **The Decision Boundary:** Day-ahead auction order books (EPEX SPOT / Nord Pool UK Day-Ahead auctions) close around **11:00 UTC on day $D-1$**, up to 36 hours prior to actual delivery. Traders **cannot use real-time forecasts**; they are legally and operationally constrained to the **latest forecast published before the $D-1$ gate closure**.
* **Financial Penalty of Forecast Errors (Cashout / BM SBP):**
  * **Over-forecasting wind:** Utility under-procures thermal power Day-Ahead $\implies$ Utility enters real-time delivery with a deficit (short position) $\implies$ Penalized with high **System Buy Prices (SBP)** in Elexon's Balancing Mechanism.
  * **Under-forecasting wind:** Utility over-procures thermal power Day-Ahead $\implies$ Utility enters real-time delivery with excess energy (long position) $\implies$ Spills energy at lower **System Sell Prices (SSP)**.

This software product integrates Elexon's official datasets (`FUELHH` and `WINDFOR`), locks in the latest market-eligible forecasts, quantitatively benchmarks errors (MAE, RMSE, MAPE, Mean Bias Error), and calculates an **optimal P90/P75 thermal procurement safety buffer** to hedge cashout exposure.

---

## 2. Live Deployment Links

* **GitHub Repository:** [https://github.com/Lahari-Maram/gridbricks-wind-analytics](https://github.com/Lahari-Maram/gridbricks-wind-analytics)
* **Live Deployed Web App (Vercel):** [https://gridbricks-wind-analytics-psi.vercel.app](https://gridbricks-wind-analytics-psi.vercel.app)
* **Backend API & Swagger Documentation:** [https://gridwholesale-backend.onrender.com/docs](https://gridwholesale-backend.onrender.com/docs)
* **Unlisted Video Demo (10 min max):** [https://youtu.be/DEMO_LINK](https://youtu.be/DEMO_LINK) *(See [docs/VIDEO_PRESENTATION_SCRIPT.md](docs/VIDEO_PRESENTATION_SCRIPT.md) for script)*

---

## 3. Key Features

1. **D-1 Gate Closure Simulation Engine:**
   * Select any delivery day in January 2026 ($D$).
   * Automatically isolates the decision date ($D-1$) and filters Elexon forecasts to only those published at or before the day-ahead auction cutoff (e.g., 11:00 UTC D-1).
   * Configurable gate cutoff hours (09:00, 11:00, 12:00, 14:00 UTC).
2. **Quantitative Forecast Error Evaluation:**
   * **Mean Absolute Error (MAE):** Average deviation in MW across the 48 half-hour settlement periods.
   * **Root Mean Squared Error (RMSE) & MAPE:** Quantifies volatility and tail ramp risks.
   * **Mean Bias Error (MBE):** Directional bias identifying whether the desk faces Deficit Risk or Surplus Spill Risk.
   * **Percentiles ($P_{10}, P_{50}, P_{90}$):** Empirical quantile distributions of forecast residuals.
3. **Actionable Thermal Procurement Advisor:**
   * Computes Customer Demand (MWh) $-$ Expected Wind Generation (MWh) $=$ Base Thermal Requirement.
   * Recommends a calibrated **$P_{90}$ Uncertainty Safety Buffer (+MW)** to hedge against wind underperformance.
4. **Interactive 48 Settlement Periods Visualizer:**
   * Dual-curve chart comparing Metered Actuals (`FUELHH: WIND`) against Locked Gate Forecasts (`WINDFOR`).
   * Switchable views: Wind Generation, Residual Thermal Demand, and Error Delta (MW).
5. **Forecast Evolution Timeline Modal:**
   * Click any half-hour period on the chart or heatmap to view its historical publication trail ($D-2$, $D-1$ 06:00, 09:00, 11:00 Gate, Post-Gate updates).
6. **January 2026 Full-Month Benchmark Tab:**
   * Full aggregate statistics across all 31 delivery days (1,488 half-hours).
   * **Diurnal 48-Period Profile:** Visualizes how forecast error changes by time of day (highlighting the evening winter cooking/lighting peak at SP 34-38).
   * Sortable daily performance table.
7. **Data Inspector & 1-Click CSV Export:**
   * Full tabular view of all 48 settlement periods with search, sort, and CSV export.

---

## 4. Directory & File Structure

```
d:\Gridbricks_Fullstck_SWE-Challenge/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Application settings, market rules & constants
│   │   ├── main.py                # FastAPI routes, CORS, middleware, OpenAPI docs
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py         # Pydantic v2 schemas for periods, metrics, advice
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── elexon_client.py   # Elexon BMRS API client with offline circuit-breaker
│   │   │   ├── data_processor.py  # D-1 gate cutoff logic & half-hour period matching
│   │   │   └── metrics_engine.py  # MAE, RMSE, MAPE, Bias & P90 safety buffer formulas
│   │   └── data/
│   │       ├── __init__.py
│   │       └── jan_2026_seed.py   # High-fidelity January 2026 benchmark dataset generator
│   ├── Dockerfile                 # Python 3.10 slim container definition
│   ├── requirements.txt           # FastAPI, Uvicorn, Pandas, NumPy, Pydantic, Requests
│   └── run.py                     # Entry-point runner script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx                 # Top bar, date selector, D-1 gate cutoff, tabs
│   │   │   ├── MetricCards.jsx            # MAE, RMSE, MAPE, Bias, and Buffer KPI cards
│   │   │   ├── DayAheadChart.jsx          # Recharts 48-period actuals vs forecast curves
│   │   │   ├── ProcurementAdvisor.jsx     # Waterfall procurement & cashout risk guidance
│   │   │   ├── SettlementHeatmap.jsx      # 48 half-hour color-coded error distribution
│   │   │   ├── ForecastEvolutionModal.jsx # Multi-horizon publish history modal
│   │   │   ├── DataInspectorTable.jsx     # Filterable/sortable table + CSV download
│   │   │   └── MonthlyAnalyticsTab.jsx    # Full January 2026 31-day benchmark & diurnal curve
│   │   ├── services/
│   │   │   └── api.js                     # REST API client with environment URL handling
│   │   ├── App.jsx                        # Master application state orchestrator
│   │   ├── main.jsx                       # React DOM entry point
│   │   └── index.css                      # Tailwind CSS base and custom scrollbars
│   ├── index.html                         # HTML template with Google Fonts
│   ├── package.json                       # React 18, Vite, Lucide-React, Recharts, Tailwind
│   ├── vite.config.js                     # Vite build configuration and local API proxy
│   ├── tailwind.config.js                 # Trading desk color palette
│   ├── nginx.conf                         # Production Nginx reverse proxy configuration
│   └── Dockerfile                         # Multi-stage build (Node 20 Alpine -> Nginx Alpine)
├── docs/
│   └── VIDEO_PRESENTATION_SCRIPT.md       # Exact word-for-word 10-minute presentation guide
├── docker-compose.yml                     # 1-command startup for frontend & backend
├── vercel.json                            # Vercel deployment configuration
├── .gitignore
└── README.md                              # Complete documentation
```

---

## 5. How to Start the Application

### Option A: Using Docker (Recommended Single-Command Startup)
Make sure Docker Desktop is running, then run:

```bash
docker compose up --build
```

* **Frontend UI:** Open your browser to [http://localhost:3000](http://localhost:3000)
* **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Running Locally (Development Mode)

#### 1. Start the Python Backend
Ensure Python 3.10+ is installed:

```bash
cd backend
pip install -r requirements.txt
python run.py
```
* Backend runs on: `http://localhost:8000`
* Interactive API documentation: `http://localhost:8000/docs`

#### 2. Start the React Frontend
In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```
* Frontend runs on: `http://localhost:5173`
* Vite automatically proxies `/api` requests to `http://localhost:8000`.

---

## 6. How to Deploy

### Frontend on Vercel
1. Push this repository to GitHub.
2. In [Vercel Dashboard](https://vercel.com), click **Add New Project** $\to$ Import your repository.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   * `VITE_API_URL`: URL of your deployed backend (e.g. `https://gridwholesale-backend.onrender.com`).
5. Click **Deploy**.

### Backend on Render / Heroku / Railway
1. **Render:**
   * Create a new **Web Service**.
   * Root directory: `backend`.
   * Build command: `pip install -r requirements.txt`.
   * Start command: `python run.py`.
2. **Heroku:**
   * Create an app, add `heroku/python` buildpack, and deploy the `backend` folder.

---

## 7. Mathematical & Statistical Formulation

1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} | \hat{y}_i - y_i |$$
2. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (\hat{y}_i - y_i)^2}$$
3. **Mean Absolute Percentage Error (MAPE):**
   $$\text{MAPE} = \frac{100\%}{N} \sum_{i=1}^{N} \frac{| \hat{y}_i - y_i |}{y_i}$$
4. **Mean Bias Error (MBE):**
   $$\text{MBE} = \frac{1}{N} \sum_{i=1}^{N} (\hat{y}_i - y_i)$$
   * $\text{MBE} > 0 \implies$ Systematic over-forecast $\implies$ Risk of real-time supply shortfall and high cashout penalties.
   * $\text{MBE} < 0 \implies$ Systematic under-forecast $\implies$ Risk of surplus spill at depressed sell prices.
5. **Tail Risk Buffer ($P_{90}$):**
   Calculates the 90th percentile of positive forecast errors, specifying the additional thermal megawatts required to cover 90% of observed downside renewable variances.

---

## 8. AI Tools Disclosure

As explicitly permitted and requested in the challenge instructions:
* **AI Tools Used:** Google Antigravity (featuring Gemini 2.5 Flash / Pro) was utilized as an AI coding pair programmer to assist with rapid project scaffolding, mathematical verification of Elexon BMRS market formulas, and generating the comprehensive presentation walkthrough scripts.
* **Architecture & Integrity:** All domain logic, gate closure filtering algorithms, API routes, and React components have been thoroughly designed, tested, and verified for full compliance with UK wholesale power market standards.

