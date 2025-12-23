***

# 🟪 Kart-i-quo

*Kart-i-quo* is a modern, AI-powered personal finance management app built for everyday professionals, students, and families. Track your expenses, set and achieve savings goals, manage recurring costs, and grow your financial confidence—all in a sleek, secure, and intuitive platform.

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

## Functions (what this app implements)
- Authentication
  - Sign up and login using Firebase Authentication
  - Onboarding flow (set role, income, fixed expenses)
- Dashboard
  - Monthly overview, basic charts and spending breakdown
- Daily check-in
  - Quick expense logging with category, amount, description
  - Voice entry (speech-to-text)
- Expenses
  - Create / read / update / delete transactions
  - Filters by day/week/month and category
- Fixed expenses
  - Manage recurring/monthly fixed costs and EMIs
- Goals
  - Create and track savings goals with progress
- Emergency fund
  - Track emergency savings and contributions
- OCR receipt upload
  - Server endpoint receives uploaded images and extracts text (Tesseract.js integration)
- Speech-to-text
  - Client route for recording audio and converting to text via Web Speech API / server helper
- Export & reports
  - PDF export of reports (server-side generation)
- AI recommendations
  - Basic AI-driven recommendations and flows (see `src/ai/flows`)

## Quick start
1. Install dependencies:

```powershell
npm install
```

2. Add Firebase keys to `.env.local` (see `src/lib/firebase.ts` for required vars).

3. Run dev server:

```powershell
npm run dev
```

Open http://localhost:3000

## Notes
- Update this README as features evolve.
- Key implementation locations: `src/app/(auth)`, `src/app/(app)`, `src/ai`, `src/lib/firebase.ts`.
| lucide-react         | Modern, easily customizable icons           |
