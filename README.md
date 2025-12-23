***

# 🟪 FinMate

*FinMate* is a modern, AI-powered personal finance management app built for everyday professionals, students, and families. Track your expenses, set and achieve savings goals, manage recurring costs, and grow your financial confidence—all in a sleek, secure, and intuitive platform.

***

## ✨ Key Features

### *🔐 Authentication & Onboarding*
- Sign up and login securely using Firebase Authentication.
- Cloud data persistence with Firestore for reliable data storage.
- Guided onboarding: Set your user role (Student/Professional/Housewife), income, and fixed monthly expenses.

### *📊 Dashboard*
- See an instant snapshot of your monthly finances: Income, overall and daily spending, savings, goals, emergency fund, and category breakdowns.
- Visual analytics for recent spending and active goals.
- Smart alerts if you exceed your daily spending limit or near important milestones.
- Export comprehensive financial reports in multiple formats:
  - Beautiful PDF reports with financial insights, trends, and recommendations
  - Structured tables showing transactions, goals, and emergency fund details
  - Visual charts and graphs embedded in PDF exports
  - CSV export for spreadsheet analysis
  - JSON data for external integrations

### *📝 Daily Expense Logging (Check-In)*
- Quickly log today's expenses, specifying category, amount, and description.
- Real-time progress against your set daily limit.
- Interactive pie charts visualize spending by category each day.
- Automatic categorization and field parsing using AI.
- Voice input support for hands-free expense logging.
- OCR support for scanning receipts and bills.

### *📒 Expenses & Analysis*
- Powerful filters by week, month, or full history.
- See vertical bar charts breaking down spending per category.
- Review and sort transactions in detail.
- AI Recommendations: Personalized insights for budgeting and saving better.
- End-of-day summaries with spending analysis.
- Real-time spending forecasts and trend analysis.

### *📅 Fixed Expenses & EMIs*
- Add, edit, and check off fixed monthly expenses (like rent, subscriptions, EMIs).
- Timeline tracking for EMIs/loans with progress bars and upcoming deadline alerts.
## kart-i-quo

Minimal README for the Kart‑i‑quo project. This repository contains a personal finance web app built with Next.js and Firebase.

## Features
- Firebase Authentication (signup/login)
- Dashboard (overview and basic charts)
- Daily expense check-in (log expenses)
- Expenses list & filters
- Fixed expenses management
- Goals tracking
- Emergency fund tracking
- OCR receipt upload (server API + frontend uploader)
- Voice input / speech-to-text for logging
- PDF export of reports
- AI-driven recommendations (basic integrations)

## Tech
- Next.js, React, TypeScript
- Tailwind CSS, shadcn/ui
- Firebase Auth & Firestore
- Tesseract.js (OCR), Web Speech API (voice)

## Quick start
1. Install deps:

```powershell
npm install
```

2. Copy environment variables to `.env.local` (Firebase keys required).

3. Run dev server:

```powershell
npm run dev
```

Open http://localhost:3000

## Notes
- This README is intentionally concise — update it when features change.
- For detailed setup (Firebase config, API keys), see `src/lib/firebase.ts` and add the required keys to `.env.local`.
| lucide-react         | Modern, easily customizable icons           |
