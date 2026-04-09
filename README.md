# Mis Gastos

`Mis Gastos` is a small web app that lets you import a bank `CSV` and review your money in a clearer way.

It focuses on simple personal finance review:

- total spending in the uploaded statement
- total income
- final balance read from the file
- spending grouped by concept
- month vs previous month comparison
- search and filters for transactions

The interface is available in Spanish and English. On first load the app follows the browser language, and you can switch languages manually from the top of the page.

## Run locally

```powershell
npm install
npm run dev
```

The app usually opens at `http://localhost:5173/`.

## How to use it

1. Export a `CSV` from your bank app or online banking site.
2. Upload the file in the main screen.
3. Review the summary cards.
4. Use the search and filters to inspect specific income, expenses, or merchants.

You can also click `Load sample` to test the app without using real banking data.

## Supported CSV formats

The importer is intentionally flexible and tries to recognize headers such as:

- `Fecha`, `Date`, `Booking Date`, `Fecha operacion`
- `Descripcion`, `Concepto`, `Detalle`, `Description`, `Merchant`
- `Importe`, `Amount`, `Cantidad`, `Value`
- `Saldo`, `Balance`

Minimum required columns:

- date
- description or concept
- amount

If your bank exports an Excel file, open it and save it as `CSV UTF-8` first.

## What the app calculates

- `Spent in this statement`
  Uses the real range present in the uploaded CSV, from the oldest date to the newest one.
- `Income`
  Sums all positive transactions in the statement.
- `Expenses`
  Sums all expenses in the statement.
- `Final balance`
  Uses the latest balance found in the file.

`This week`, `This month`, and `Last 3 months` are based on the latest date found in the uploaded CSV, so older statements still make sense when filtered.

## Language support

- Spanish and English UI
- automatic browser language detection on first visit
- manual `ES / EN` switcher in the header
- language choice saved in `localStorage`

Dates, month names, and currency formatting follow the selected language.

## Current limits

- CSV import only
- no PDF import
- no multiple accounts or multi-file merge yet
- automatic categories are basic helper labels, not accounting-grade classification

## Privacy

Do not upload real CSVs, screenshots, or personal banking data to GitHub.

Avoid publishing:

- IBANs
- full names
- account balances
- personal transactions

This project is meant to run locally on your own machine.
