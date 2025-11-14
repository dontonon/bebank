# 💰 Crypto Income Portfolio Dashboard

A beautiful, privacy-first dashboard to track and analyze your crypto income streams. All data stays in your browser - no backend, no tracking, no servers.

![Tech Stack](https://img.shields.io/badge/React-18.3.1-blue)
![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.1-38B2AC)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4.1-FF6384)

## ✨ Features

- **📊 Visual Dashboard** - Pie chart showing income distribution across sources
- **🎯 Diversification Score** - 1-10 scale showing how diversified your income is
- **💎 Stability Score** - Percentage of recurring vs one-time income
- **📈 Category Breakdown** - Visual progress bars showing income by category
- **⚠️ Risk Warnings** - Alerts when a single source exceeds 50% of total income
- **✏️ Full Management** - Add, edit, delete, activate/deactivate income sources
- **🔒 Privacy First** - All data stored locally in your browser (localStorage)

## 🎨 Design

- **Dark Mode Theme** - Professional dark UI (#0A0E27 background, #1A1F3A cards)
- **Bold Accents** - Toxic green (#00FF88) and neon purple (#9D4EDD)
- **Smooth Animations** - Polished transitions and hover effects
- **Modern Typography** - Clean, readable fonts optimized for financial data

## 📦 Categories

- Protocol Partnerships 🤝
- Content Creation ✍️
- Consulting/Advisory 💼
- Dune Analytics 📊
- Other 💡

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. **Add Income Sources** - Click "Add New Source" to create your first income stream
2. **View Dashboard** - See your income distribution, scores, and insights
3. **Manage Sources** - Edit, deactivate, or delete sources as needed
4. **Track Progress** - Monitor your diversification and stability over time

## 🛠️ Tech Stack

- **React 18.3.1** - UI library
- **Vite 5.4.2** - Build tool and dev server
- **TailwindCSS 3.4.1** - Utility-first CSS framework
- **Chart.js 4.4.1** - Beautiful charts
- **react-chartjs-2 5.2.0** - React wrapper for Chart.js

## 📊 Score Calculations

### Diversification Score (1-10)
Uses Herfindahl-Hirschman Index (HHI) to measure concentration:
- **7-10**: Well diversified ✅
- **4-6**: Moderate risk ⚠️
- **1-3**: High concentration 🚨

### Stability Score (%)
Percentage of recurring income:
- **70%+**: Highly stable ✅
- **40-69%**: Moderately stable ⚠️
- **<40%**: Low stability 🚨

## 🔐 Privacy

Your data never leaves your browser. Everything is stored in localStorage - no databases, no servers, no tracking.

## 📄 License

MIT
