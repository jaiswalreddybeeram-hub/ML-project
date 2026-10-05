TAIWANESE BANKRUPTCY PREDICTION & CORRELATION HEATMAP PLATFORM
================================================================

This project includes the official Taiwanese Bankruptcy Prediction dataset
(Taiwan Economic Journal / UCI Machine Learning Repository), full interactive
multidimensional correlation heatmaps, exploratory data analysis, and a
calibrated risk assessment prediction interface.

DATASET INFORMATION:
-------------------
- Records: 6,819 Taiwanese corporations (1999–2009)
- Features: 95 continuous financial ratios + 1 target ('Bankrupt?')
- Class Imbalance: 220 Bankrupt (3.23%) vs 6,599 Solvent (96.77%)
- Missing values: 0
- Location:
    * data/data.csv (11.4 MB full CSV)
    * data/taiwanese_bankruptcy.csv
    * data/correlation_top15.csv
    * data/correlation_key20.csv

HEATMAP CAPABILITIES:
--------------------
- Interactive HTML5 Canvas correlation heatmap engine with retina high-DPI rendering
- Dynamic hover crosshair highlighting and floating tooltips showing exact Pearson 'r'
- Presets:
    1. Top 15 Bankruptcy Indicators (Target correlation)
    2. Profitability & Operational Margins
    3. Solvency & Financial Leverage
    4. Liquidity & Working Capital Flow
    5. Executive 20-Factor Cross-Market Matrix
- Palettes: Cool-Warm (Diverging Blue/Red), Viridis (Sequential), Emerald-Ruby
- Cell numerical value overlay toggle
- Export to high-resolution PNG image and matrix CSV download
- Static high-res Seaborn publication figures in assets/

TESTING WITH REAL COMPANIES:
---------------------------
In the Company Prediction page:
- Click "Real Bankrupt Firm #1" or "Real Bankrupt Firm #2" to automatically populate
  the 95 indicators from actual failed companies in the dataset (predicts high risk).
- Click "Real Healthy Firm #1" or "Real Healthy Firm #2" to test solvent companies (predicts low risk).
- Click "Dataset Average Baseline" to benchmark against market average.
- Upload any company CSV matching the dataset features.

RUNNING THE PROJECT:
-------------------
1. Double-click index.html directly in Chrome, Edge, or Firefox, OR
2. In VS Code, right-click index.html and select "Open with Live Server", OR
3. Run python -m http.server 8000 in this folder and open http://localhost:8000

PROJECT DIRECTORY STRUCTURE:
----------------------------
├── index.html                  # Main interactive web application
├── style.css                   # Modern styling & responsive theme
├── script.js                   # Application logic, tables, prediction engine
├── heatmap.js                  # High-DPI interactive canvas heatmap engine
├── dataset_data.js             # Precomputed metadata, matrices & samples
├── data/
│   ├── data.csv                # Full Taiwanese Bankruptcy dataset (11.4 MB)
│   ├── taiwanese_bankruptcy.csv# Alias for the dataset
│   ├── correlation_top15.csv   # Pearson correlation matrix (Top 15)
│   └── correlation_key20.csv   # Pearson correlation matrix (20 Key Ratios)
├── assets/
│   ├── heatmap_top15_correlation.png # 150 DPI Seaborn heatmap figure
│   └── heatmap_key20.png             # 150 DPI Seaborn 20-ratio matrix figure
└── scripts/
    └── generate_data_js.py     # Python script to recompute stats from CSV
