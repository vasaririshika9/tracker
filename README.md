# Paisa — Smart Expense Tracker & 30-Day Budget Challenge

A clean, responsive personal finance web app designed to help you track daily spending, visualize expenses by category, and stay within your monthly budget goal.

Built with **React**, **Vite**, **Recharts**, and passwordless OTP authentication via **Supabase**.

---

## ✨ Features

- **🎯 30-Day Budget Challenge**
  - Set custom budget targets (default: ₹10,000 / 30 days).
  - Live budget health indicators, remaining balance, and over-budget warnings.

- **💸 Quick Expense Logging**
  - Add and edit expenses with description, amount (₹ INR), category, payment method (UPI, Card, Cash, Net Banking), and date.
  - Delete and update records on the fly.

- **📊 Visual Spending Analytics**
  - Interactive category breakdown doughnut chart powered by Recharts.
  - Live percentage share and amount per category.

- **🔍 Search & Filter**
  - Instant search by title or category.
  - Filter by date range: *All Time*, *Today*, *Last 7 Days*, or *This Month*.

- **🔐 Passwordless OTP Authentication**
  - Phone (+91 SMS) and Email OTP sign-in powered by Supabase Auth.
  - Built-in **Development Mock Mode** to test the entire UI locally without needing SMS or email setup.

- **🎨 Modern Pastel Aesthetics**
  - Custom design tokens in CSS variables.
  - Interactive WebGL background wave animation.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd paisa
npm install
```

### 2. Configure Environment (.env)
Create a `.env` file in the project root:

```env
# Supabase credentials (for real OTP)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Set to "true" to test without Supabase (displays mock code on screen)
VITE_ENABLE_MOCK_AUTH=false
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---
## Screenshots


### 1. Login page
![Login page](screenshot/img3.png)

Users enter an optional name, their email, and an optional phone number with the +91 code. They pick email or SMS for the one-time code, then tap **Send OTP**. The page also has terms and privacy links and a short security note.
### 2. Successful login
![Successful login page](screenshot/img1.png)

After a successful OTP check, a welcome card greets the user by name with an animated checkmark. It shows the ₹10,000 / 30-day budgeting challenge, with buttons to open the dashboard or log out.

### 3 . Expense tracker dashboard
![Expense tracker dashboard](screenshot/img2.png)

The dashboard shows the total budget, amount spent, remaining balance and percentage of budget used. Users can add, search, filter, edit and delete expenses, and a category chart shows where the money goes.


## 🧪 Development Mock Mode

If you haven't set up Supabase yet, you can test the entire app instantly:
1. Open `.env` and set:
   ```env
   VITE_ENABLE_MOCK_AUTH=true
   ```
2. Restart Vite (`npm run dev`).
3. Enter any phone number or email on the login page.
4. An on-screen test OTP code will be generated automatically for you to test the sign-in flow.

> **Note:** Never enable `VITE_ENABLE_MOCK_AUTH` in production.

---

## 🛠️ Project Structure

```text
paisa/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AddExpenseForm.jsx    # Add / edit expense drawer
│   │   ├── AuthLayout.jsx        # App layout with WebGL canvas
│   │   ├── BudgetSummary.jsx     # Budget metrics & progress bar
│   │   ├── CategoryIcon.jsx      # Dynamic category icons
│   │   ├── ExpenseHistory.jsx    # Searchable transaction list
│   │   ├── ExpensePieChart.jsx   # Doughnut chart visualization
│   │   ├── LoginForm.jsx         # Email / Phone OTP form
│   │   ├── OtpInput.jsx          # 6-digit OTP input boxes
│   │   └── PredictiveArcEcho.tsx # WebGL wave background
│   ├── context/
│   │   └── AuthContext.jsx       # User authentication state
│   ├── pages/
│   │   ├── DashboardPage.jsx     # Main tracker dashboard
│   │   ├── LoginPage.jsx         # Sign-in page
│   │   ├── VerifyOtpPage.jsx     # OTP verification
│   │   └── SuccessPage.jsx       # Onboarding / challenge screen
│   ├── services/
│   │   ├── authService.js        # Supabase / mock auth logic
│   │   └── expenseService.js     # Expense CRUD & localStorage store
│   └── styles/
│       ├── theme.css             # Colors, radii, typography tokens
│       └── global.css            # Component & layout styles
├── index.html              # HTML entry point
├── package.json
└── vite.config.js
```

---

## 🎨 Customizing the Theme

Colors, fonts, and shadows are defined as CSS variables in `src/styles/theme.css`:

```css
:root {
  --color-primary: #F8C8DC;
  --color-bg: #FFF5F8;
  --color-button: #E98DB5;
  --font-family: 'Poppins', sans-serif;
  /* ... */
}
```
Updating these values automatically updates the appearance across the entire application.

---

## 📦 Build for Production

```bash
# Build the production-ready bundle
npm run build

# Preview production build locally
npm run preview
```

The output will be generated in the `dist/` directory, ready to deploy to Vercel, Netlify, or Cloudflare Pages.

---

## 📄 License
MIT
