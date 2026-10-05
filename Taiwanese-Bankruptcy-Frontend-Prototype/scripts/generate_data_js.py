"""
Generate dataset_data.js for Taiwanese Bankruptcy Prediction Frontend
Reads data/data.csv and extracts:
- Dataset metrics & summary statistics
- 95 Financial indicators metadata with categories
- Precalculated Pearson correlation matrices for multiple heatmap presets
- Comparative profile differences (Bankrupt vs Non-Bankrupt Z-scores)
- Real company records for one-click testing in the prediction tool
- Raw sample preview rows for in-browser data exploration
"""

import os
import json
import pandas as pd
import numpy as np

def generate():
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'data.csv')
    csv_path = os.path.abspath(csv_path)
    
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    print(f"Reading dataset from {csv_path}...")
    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]

    features = df.columns[1:].tolist()

    def categorize(name):
        n = name.lower()
        if any(k in n for k in ['roa', 'margin', 'profit', 'income', 'eps', 'earning', 'return on']):
            return 'Profitability'
        if any(k in n for k in ['debt', 'liabilit', 'net worth', 'leverage', 'borrow', 'equity']):
            return 'Solvency & Leverage'
        if any(k in n for k in ['cash', 'current ratio', 'quick ratio', 'working capital', 'quick asset', 'cfo']):
            return 'Liquidity & Cash Flow'
        if any(k in n for k in ['growth', 'frequency', 'turnover', 'days', 'rate (times)']):
            return 'Turnover & Growth'
        return 'Operating & Structure'

    stats = []
    corr_target = df.corr(numeric_only=True)['Bankrupt?']
    for i, f in enumerate(features):
        s = df[f]
        c_val = float(corr_target.get(f, 0.0))
        if np.isnan(c_val):
            c_val = 0.0
        stats.append({
            'index': i,
            'name': f,
            'category': categorize(f),
            'mean': float(round(s.mean(), 4)),
            'std': float(round(s.std(), 4)),
            'min': float(round(s.min(), 4)),
            'median': float(round(s.median(), 4)),
            'max': float(round(s.max(), 4)),
            'corr': float(round(c_val, 4))
        })

    top_pos = corr_target.drop('Bankrupt?').dropna().nlargest(7).index.tolist()
    top_neg = corr_target.drop('Bankrupt?').dropna().nsmallest(8).index.tolist()
    top15_cols = ['Bankrupt?'] + top_neg + top_pos

    prof_cols = ['Bankrupt?', 'ROA(A) before interest and % after tax', 'ROA(B) before interest and depreciation after tax',
                 'ROA(C) before interest and depreciation before interest', 'Operating Gross Margin', 'Operating Profit Rate',
                 'Pre-tax net Interest Rate', 'After-tax net Interest Rate', 'Net Income to Total Assets',
                 'Persistent EPS in the Last Four Seasons', 'Gross Profit to Sales']

    solv_cols = ['Bankrupt?', 'Debt ratio %', 'Net worth/Assets', 'Borrowing dependency', 'Total debt/Total net worth',
                 'Current Liability to Assets', 'Liability to Equity', 'Current Liabilities/Liability',
                 'Degree of Financial Leverage (DFL)', 'Equity to Liability', 'Total expense/Assets']

    liq_cols = ['Bankrupt?', 'Cash flow rate', 'Current Ratio', 'Quick Ratio', 'Working Capital to Total Assets',
                'Cash/Total Assets', 'Cash/Current Liability', 'Quick Assets/Total Assets',
                'Operating Funds to Liability', 'Cash Flow to Sales', 'Cash Reinvestment %']

    key20_cols = ['Bankrupt?', 'Net Income to Total Assets', 'ROA(A) before interest and % after tax',
                  'Debt ratio %', 'Current Liability to Assets', 'Borrowing dependency', 'Net worth/Assets',
                  'Persistent EPS in the Last Four Seasons', 'Retained Earnings to Total Assets',
                  'Working Capital to Total Assets', 'Operating Gross Margin', 'Operating Profit Rate',
                  'Cash flow rate', 'Current Ratio', 'Quick Ratio', 'Cash/Total Assets',
                  'Total debt/Total net worth', 'Liability to Equity', 'Degree of Financial Leverage (DFL)',
                  'Total expense/Assets', 'Cash Reinvestment %']

    def build_matrix(cols):
        sub = df[cols].corr(numeric_only=True).round(3).fillna(0)
        matrix = []
        for r in cols:
            matrix.append([float(sub.loc[r, c]) for c in cols])
        return {'features': cols, 'matrix': matrix}

    matrices = {
        'top15': {
            'title': 'Top 15 Bankruptcy Indicators Correlation',
            'desc': 'Pairwise Pearson correlations between the target Bankrupt? flag and the top 15 most predictive financial indicators.',
            **build_matrix(top15_cols)
        },
        'profitability': {
            'title': 'Profitability & Operational Return Heatmap',
            'desc': 'Correlation structure between Return on Assets (ROA), margins, and income efficiency metrics.',
            **build_matrix(prof_cols)
        },
        'solvency': {
            'title': 'Solvency & Capital Structure Leverage Heatmap',
            'desc': 'Correlations across debt obligations, borrowing dependencies, and equity protection levels.',
            **build_matrix(solv_cols)
        },
        'liquidity': {
            'title': 'Liquidity & Working Capital Flow Heatmap',
            'desc': 'Interplay between cash reserves, current/quick ratios, and working capital buffers.',
            **build_matrix(liq_cols)
        },
        'key20': {
            'title': 'Executive 20-Factor Cross-Market Heatmap',
            'desc': 'Comprehensive correlation matrix across all primary financial pillars and bankruptcy status.',
            **build_matrix(key20_cols)
        }
    }

    comp_cols = [c for c in key20_cols if c != 'Bankrupt?']
    b_mean = df[df['Bankrupt?']==1][comp_cols].mean()
    nb_mean = df[df['Bankrupt?']==0][comp_cols].mean()
    overall_std = df[comp_cols].std().replace(0, 1)

    profile_data = []
    for c in comp_cols:
        z_diff = float(round((b_mean[c] - nb_mean[c]) / overall_std[c], 3))
        profile_data.append({
            'feature': c,
            'category': categorize(c),
            'bankrupt_mean': float(round(b_mean[c], 4)),
            'healthy_mean': float(round(nb_mean[c], 4)),
            'z_diff': z_diff,
            'direction': 'Elevated Risk Driver' if z_diff > 0 else 'Depressed Health Indicator'
        })

    mean_sample = df[features].mean().round(4).to_dict()

    samples = [
        {
            'id': 'b1',
            'label': 'Real Bankrupt Company #1 (Index 0)',
            'type': 'Bankrupt',
            'badge': 'High Risk',
            'values': df.iloc[0][features].round(4).to_dict()
        },
        {
            'id': 'b2',
            'label': 'Real Bankrupt Company #2 (Index 1)',
            'type': 'Bankrupt',
            'badge': 'High Risk',
            'values': df.iloc[1][features].round(4).to_dict()
        },
        {
            'id': 'h1',
            'label': 'Real Healthy Company #1 (Index 6)',
            'type': 'Non-Bankrupt',
            'badge': 'Safe',
            'values': df.iloc[6][features].round(4).to_dict()
        },
        {
            'id': 'h2',
            'label': 'Real Healthy Company #2 (Index 7)',
            'type': 'Non-Bankrupt',
            'badge': 'Safe',
            'values': df.iloc[7][features].round(4).to_dict()
        },
        {
            'id': 'avg',
            'label': 'Dataset Average Company Baseline',
            'type': 'Baseline',
            'badge': 'Baseline',
            'values': mean_sample
        }
    ]

    preview_indices = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    preview_rows = []
    for idx in preview_indices:
        row_data = {'row_id': int(idx), 'Bankrupt?': int(df.iloc[idx]['Bankrupt?'])}
        for col in key20_cols[1:11]:
            row_data[col] = float(round(df.iloc[idx][col], 4))
        preview_rows.append(row_data)

    output_path = os.path.join(os.path.dirname(__file__), '..', 'dataset_data.js')
    output_path = os.path.abspath(output_path)

    js_content = '/**\n * Taiwanese Bankruptcy Dataset Precomputed Analytics & Metadata\n * Generated automatically from data/data.csv (6,819 rows x 96 columns)\n */\n\n'
    js_content += 'const DATASET_INFO = ' + json.dumps({
        'name': 'Taiwanese Bankruptcy Prediction Dataset',
        'source': 'Taiwan Economic Journal (TEJ) / UCI Machine Learning Repository',
        'total_records': len(df),
        'bankrupt_count': int((df['Bankrupt?']==1).sum()),
        'non_bankrupt_count': int((df['Bankrupt?']==0).sum()),
        'bankrupt_pct': float(round((df['Bankrupt?']==1).mean() * 100, 2)),
        'feature_count': len(features),
        'total_columns': len(df.columns),
        'missing_values': 0,
        'years': '1999 - 2009'
    }, indent=2) + ';\n\n'

    js_content += 'const FEATURES_METADATA = ' + json.dumps(stats, indent=2) + ';\n\n'
    js_content += 'const HEATMAP_MATRICES = ' + json.dumps(matrices, indent=2) + ';\n\n'
    js_content += 'const PROFILE_COMPARISON = ' + json.dumps(profile_data, indent=2) + ';\n\n'
    js_content += 'const SAMPLE_COMPANIES = ' + json.dumps(samples, indent=2) + ';\n\n'
    js_content += 'const RAW_PREVIEW_ROWS = ' + json.dumps(preview_rows, indent=2) + ';\n\n'
    js_content += 'const ALL_FEATURE_NAMES = ' + json.dumps(features, indent=2) + ';\n'

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Generated {output_path} successfully ({os.path.getsize(output_path)} bytes).")

if __name__ == '__main__':
    generate()
