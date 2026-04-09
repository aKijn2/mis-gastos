import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'
import {
  localeByLanguage,
  messages,
  navSectionIds,
  type CategoryKey,
  type Language,
  type NavSectionId,
  type SortOption,
  type TypeFilter,
} from './i18n'

type EntryType = 'income' | 'expense'
type RangeFilter = 'all' | 'week' | 'month' | 'quarter'

type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  balance?: number
  type: EntryType
  category: CategoryKey
  source: string
}

type SummaryCard = {
  label: string
  value: string
  hint: string
  tone?: 'income' | 'expense' | 'neutral'
}

const STORAGE_KEY = 'mis-gastos.transactions'
const LANGUAGE_STORAGE_KEY = 'mis-gastos.language'

const categoryRules: Array<{ category: CategoryKey; keywords: string[] }> = [
  { category: 'supermarket', keywords: ['mercadona', 'carrefour', 'aldi', 'lidl', 'dia '] },
  { category: 'food', keywords: ['burger', 'mcdonald', 'restaurant', 'bar ', 'cafe', 'glovo', 'just eat', 'uber eats'] },
  { category: 'transport', keywords: ['renfe', 'cabify', 'uber', 'gasolin', 'repsol', 'cepsa', 'parking', 'metro'] },
  { category: 'home', keywords: ['ikea', 'leroy', 'bricomart', 'amazon'] },
  { category: 'subscriptions', keywords: ['netflix', 'spotify', 'youtube', 'apple.com/bill', 'google'] },
  { category: 'health', keywords: ['farmacia', 'dental', 'clinica'] },
  { category: 'salary', keywords: ['nomina', 'salary', 'payroll', 'pension'] },
  { category: 'transfers', keywords: ['transferencia', 'bizum', 'traspaso'] },
]

const sampleCsv = `fecha,descripcion,importe,saldo
2026-04-07,NOMINA EMPRESA,1850.00,3210.43
2026-04-08,MERCADONA,-42.15,3168.28
2026-04-08,SPOTIFY,-10.99,3157.29
2026-04-09,REPSOL,-55.20,3102.09
2026-03-30,AMAZON,-24.90,1252.31
2026-03-28,BIZUM ANA,-18.00,1277.21`

const headerAliases: Record<string, string[]> = {
  date: ['fecha', 'date', 'fecha operacion', 'fecha valor', 'operation date', 'booking date'],
  description: [
    'descripcion',
    'concepto',
    'detalle',
    'movimiento',
    'description',
    'concept',
    'merchant',
    'comercio',
  ],
  amount: ['importe', 'amount', 'cantidad', 'euros', 'valor', 'value'],
  balance: ['saldo', 'balance', 'running balance', 'saldo disponible'],
  category: ['categoria', 'category'],
  type: ['tipo', 'type'],
}

class CsvImportError extends Error {
  code: 'empty_file' | 'header_not_found' | 'missing_columns' | 'no_valid_rows'
  fields?: string[]

  constructor(
    code: 'empty_file' | 'header_not_found' | 'missing_columns' | 'no_valid_rows',
    fields?: string[],
  ) {
    super(code)
    this.code = code
    this.fields = fields
  }
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'es'
  }

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (savedLanguage === 'es' || savedLanguage === 'en') {
    return savedLanguage
  }

  return window.navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es'
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const next = line[index + 1]

    if (character === '"') {
      if (insideQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (character === delimiter && !insideQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  values.push(current.trim())
  return values
}

function detectDelimiter(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const sample = lines.slice(0, 5).join('\n')
  const candidates = [',', ';', '\t']

  return candidates.sort(
    (left, right) =>
      splitCsvLine(sample, right).length - splitCsvLine(sample, left).length,
  )[0]
}

function parseDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const dayFirst = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dayFirst) {
    return `${dayFirst[3]}-${dayFirst[2]}-${dayFirst[1]}`
  }

  const dayFirstDash = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (dayFirstDash) {
    return `${dayFirstDash[3]}-${dayFirstDash[2]}-${dayFirstDash[1]}`
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

function parseAmount(value: string) {
  const sanitized = value.replace(/[^\d,.-]/g, '').trim()
  if (!sanitized) {
    return NaN
  }

  const lastComma = sanitized.lastIndexOf(',')
  const lastDot = sanitized.lastIndexOf('.')
  let normalized = sanitized

  if (lastComma > lastDot) {
    normalized = sanitized.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    normalized = sanitized.replace(/,/g, '')
  }

  const match = normalized.match(/-?\d+(\.\d+)?/)
  return match ? Number(match[0]) : NaN
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatCurrency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMonthKey(monthKey: string, locale: string) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, (month ?? 1) - 1, 1))
}

function formatDisplayDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale)
}

function guessCategory(description: string, type: EntryType): CategoryKey {
  const normalized = normalizeText(description)

  for (const rule of categoryRules) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.category
    }
  }

  return type === 'income' ? 'income' : 'other'
}

function resolveCategory(rawCategory: string, description: string, type: EntryType): CategoryKey {
  const normalizedCategory = normalizeText(rawCategory)

  if (normalizedCategory) {
    for (const [key, labels] of Object.entries(messages)) {
      void key
      const categoryEntries = Object.entries(labels.categories) as Array<[CategoryKey, string]>

      for (const [categoryKey, label] of categoryEntries) {
        if (normalizeText(label) === normalizedCategory) {
          return categoryKey
        }
      }
    }
  }

  return guessCategory(description, type)
}

function toMonthKey(date: string) {
  return date.slice(0, 7)
}

function getWeekStart(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function parseIsoDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, (month ?? 1) - 1, day ?? 1)
}

function translateCategory(category: CategoryKey, language: Language) {
  return messages[language].categories[category]
}

function mapImportError(error: unknown, language: Language) {
  const currentMessages = messages[language]

  if (error instanceof CsvImportError) {
    if (error.code === 'missing_columns') {
      return currentMessages.errors.missingColumns(error.fields ?? [])
    }

    if (error.code === 'empty_file') {
      return currentMessages.errors.emptyFile
    }

    if (error.code === 'header_not_found') {
      return currentMessages.errors.headerNotFound
    }

    return currentMessages.errors.noValidRows
  }

  return error instanceof Error ? error.message : currentMessages.errors.uploadFallback
}

function findHeaderRowIndex(lines: string[], delimiter: string) {
  return lines.findIndex((line) => {
    const headers = splitCsvLine(line, delimiter).map(normalizeText)
    const hasDate = headers.some((header) => headerAliases.date.includes(header))
    const hasDescription = headers.some((header) => headerAliases.description.includes(header))
    const hasAmount = headers.some((header) => headerAliases.amount.includes(header))

    return hasDate && hasDescription && hasAmount
  })
}

function parseTransactions(csvText: string, sourceName: string) {
  const trimmed = csvText.trim()
  if (!trimmed) {
    throw new CsvImportError('empty_file')
  }

  const delimiter = detectDelimiter(trimmed)
  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) {
    throw new CsvImportError('empty_file')
  }

  const headerRowIndex = findHeaderRowIndex(lines, delimiter)
  if (headerRowIndex === -1) {
    throw new CsvImportError('header_not_found')
  }

  const headers = splitCsvLine(lines[headerRowIndex], delimiter).map(normalizeText)

  const dateIndex = headers.findIndex((header) => headerAliases.date.includes(header))
  const descriptionIndex = headers.findIndex((header) => headerAliases.description.includes(header))
  const amountIndex = headers.findIndex((header) => headerAliases.amount.includes(header))
  const balanceIndex = headers.findIndex((header) => headerAliases.balance.includes(header))
  const categoryIndex = headers.findIndex((header) => headerAliases.category.includes(header))
  const typeIndex = headers.findIndex((header) => headerAliases.type.includes(header))

  if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    const missingFields = [
      dateIndex === -1 ? 'date' : '',
      descriptionIndex === -1 ? 'description/concept' : '',
      amountIndex === -1 ? 'amount' : '',
    ].filter(Boolean)

    throw new CsvImportError('missing_columns', missingFields)
  }

  const parsedTransactions: Array<Transaction | null> = lines
    .slice(headerRowIndex + 1)
    .map((line, index) => {
      const columns = splitCsvLine(line, delimiter)
      const date = parseDate(columns[dateIndex] ?? '')
      const description = (columns[descriptionIndex] ?? '').trim()
      const amount = parseAmount(columns[amountIndex] ?? '')
      const balance = balanceIndex >= 0 ? parseAmount(columns[balanceIndex] ?? '') : NaN
      const explicitType = normalizeText(columns[typeIndex] ?? '')

      if (!date || !description || Number.isNaN(amount)) {
        return null
      }

      const type: EntryType =
        explicitType === 'ingreso' || explicitType === 'income'
          ? 'income'
          : explicitType === 'gasto' || explicitType === 'expense'
            ? 'expense'
            : amount >= 0
              ? 'income'
              : 'expense'

      return {
        id: `${sourceName}-${date}-${index}-${description}`,
        date,
        description,
        amount,
        balance: Number.isNaN(balance) ? undefined : balance,
        type,
        category: resolveCategory((columns[categoryIndex] ?? '').trim(), description, type),
        source: sourceName,
      }
    })

  const validTransactions = parsedTransactions
    .filter((transaction): transaction is Transaction => transaction !== null)
    .sort((left, right) => right.date.localeCompare(left.date))

  if (!validTransactions.length) {
    throw new CsvImportError('no_valid_rows')
  }

  return validTransactions
}

function groupConceptTotals(transactions: Transaction[]) {
  const totals = new Map<string, number>()

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue
    }

    totals.set(
      transaction.description,
      (totals.get(transaction.description) ?? 0) + Math.abs(transaction.amount),
    )
  }

  return [...totals.entries()]
    .map(([concept, total]) => ({ concept, total }))
    .sort((left, right) => right.total - left.total)
}

function groupMonthlyTotals(transactions: Transaction[]) {
  const totals = new Map<string, { income: number; expense: number }>()

  for (const transaction of transactions) {
    const monthKey = toMonthKey(transaction.date)
    const current = totals.get(monthKey) ?? { income: 0, expense: 0 }

    if (transaction.type === 'income') {
      current.income += transaction.amount
    } else {
      current.expense += Math.abs(transaction.amount)
    }

    totals.set(monthKey, current)
  }

  return [...totals.entries()]
    .map(([month, total]) => ({ month, ...total }))
    .sort((left, right) => left.month.localeCompare(right.month))
}

function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState('')
  const [selectedRange, setSelectedRange] = useState<RangeFilter>('month')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConcept, setSelectedConcept] = useState('all')
  const [toastMessage, setToastMessage] = useState('')
  const [activeSection, setActiveSection] = useState<NavSectionId>(navSectionIds[0])
  const t = messages[language]
  const locale = localeByLanguage[language]
  const navSections = navSectionIds.map((id) => ({ id, label: t.nav[id] }))
  const minimumColumns = language === 'en' ? ['date', 'description', 'amount'] : ['fecha', 'descripcion', 'importe']

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      setTransactions(parseTransactions(sampleCsv, 'sample.csv'))
      return
    }

    try {
      setTransactions(JSON.parse(saved) as Transaction[])
    } catch {
      setTransactions(parseTransactions(sampleCsv, 'sample.csv'))
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  useEffect(() => {
    if (!transactions.length) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('')
    }, 3500)

    return () => window.clearTimeout(timeoutId)
  }, [toastMessage])

  useEffect(() => {
    const updateActiveSection = () => {
      const sectionElements = navSections
        .map((section) => document.getElementById(section.id))
        .filter((section): section is HTMLElement => section !== null)

      if (!sectionElements.length) {
        return
      }

      const viewportMarker = window.innerHeight * 0.35
      let bestSection = sectionElements[0]
      let bestDistance = Number.POSITIVE_INFINITY

      for (const element of sectionElements) {
        const rect = element.getBoundingClientRect()
        const distance = Math.abs(rect.top - viewportMarker)

        if (rect.top <= viewportMarker && distance < bestDistance) {
          bestSection = element
          bestDistance = distance
        }
      }

      setActiveSection(bestSection.id as NavSectionId)
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [])

  const now = new Date()
  const latestTransactionDate = transactions[0]?.date
  const referenceDate = latestTransactionDate ? parseIsoDate(latestTransactionDate) : now
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const quarterStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 2, 1)
  const weekStart = getWeekStart(referenceDate)

  const rangeTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date)

    if (selectedRange === 'week') {
      return transactionDate >= weekStart
    }

    if (selectedRange === 'month') {
      return transactionDate >= monthStart
    }

    if (selectedRange === 'quarter') {
      return transactionDate >= quarterStart
    }

    return true
  })

  const conceptOptions = [...new Set(rangeTransactions.map((transaction) => transaction.description))]
    .sort((left, right) => left.localeCompare(right))

  const searchedTransactions = rangeTransactions.filter((transaction) => {
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter
    const matchesConcept =
      selectedConcept === 'all' || transaction.description === selectedConcept
    const haystack = `${transaction.description} ${translateCategory(transaction.category, language)} ${transaction.source}`
    const matchesSearch = normalizeText(haystack).includes(normalizeText(searchQuery))

    return matchesType && matchesConcept && matchesSearch
  })

  const filteredTransactions = [...searchedTransactions].sort((left, right) => {
    if (sortBy === 'oldest') {
      return left.date.localeCompare(right.date)
    }

    if (sortBy === 'highest') {
      return Math.abs(right.amount) - Math.abs(left.amount)
    }

    if (sortBy === 'lowest') {
      return Math.abs(left.amount) - Math.abs(right.amount)
    }

    return right.date.localeCompare(left.date)
  })

  const currentMonthKey = toMonthKey(formatDateKey(referenceDate))
  const previousMonthDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1)
  const previousMonthKey = toMonthKey(formatDateKey(previousMonthDate))

  const monthlyTotals = groupMonthlyTotals(transactions)
  const currentMonthTotals =
    monthlyTotals.find((month) => month.month === currentMonthKey) ??
    ({ income: 0, expense: 0 } as const)
  const previousMonthTotals =
    monthlyTotals.find((month) => month.month === previousMonthKey) ??
    ({ income: 0, expense: 0 } as const)

  const extractLatestDate = transactions[0]?.date
  const extractEarliestDate = transactions[transactions.length - 1]?.date
  const extractIncome = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const extractExpense = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0)
  const extractLatestBalanceTransaction = transactions.find(
    (transaction) => transaction.balance !== undefined,
  )
  const extractFinalBalance = extractLatestBalanceTransaction?.balance

  const conceptTotals = groupConceptTotals(rangeTransactions)
  const topConcepts = conceptTotals.slice(0, 6)
  const largestConceptTotal = topConcepts[0]?.total ?? 0
  const totalTopConceptExpense = topConcepts.reduce((sum, item) => sum + item.total, 0)
  const highestIncome = rangeTransactions
    .filter((transaction) => transaction.type === 'income')
    .sort((left, right) => right.amount - left.amount)[0]
  const highestExpense = rangeTransactions
    .filter((transaction) => transaction.type === 'expense')
    .sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))[0]

  const summaryCards: SummaryCard[] = [
    {
      label: t.summary.spent,
      value: formatCurrency(extractExpense, locale),
      hint:
        extractEarliestDate && extractLatestDate
          ? t.summary.spentHint(
              formatDisplayDate(extractEarliestDate, locale),
              formatDisplayDate(extractLatestDate, locale),
            )
          : t.summary.spentFallback,
      tone: 'expense',
    },
    {
      label: t.summary.income,
      value: formatCurrency(extractIncome, locale),
      hint: t.summary.incomeHint,
      tone: 'income',
    },
    {
      label: t.summary.expenses,
      value: formatCurrency(extractExpense, locale),
      hint: t.summary.expensesHint,
      tone: 'expense',
    },
    {
      label: t.summary.finalBalance,
      value:
        extractFinalBalance !== undefined
          ? formatCurrency(extractFinalBalance, locale)
          : t.summary.noBalance,
      hint: t.summary.finalBalanceHint,
      tone:
        extractFinalBalance === undefined
          ? 'neutral'
          : extractFinalBalance >= 0
            ? 'income'
            : 'expense',
    },
  ]

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const content = await file.text()
      const parsed = parseTransactions(content, file.name)
      setTransactions(parsed)
      setError('')
      setToastMessage(t.toast.loaded(parsed.length, file.name))
      setSelectedConcept('all')
      setSearchQuery('')
      setTypeFilter('all')
      setSortBy('newest')
    } catch (uploadError) {
      setError(mapImportError(uploadError, language))
    } finally {
      event.target.value = ''
    }
  }

  const resetToSample = () => {
    const sampleTransactions = parseTransactions(sampleCsv, 'sample.csv')
    setTransactions(sampleTransactions)
    setError('')
    setToastMessage(t.toast.loaded(sampleTransactions.length, 'sample.csv'))
    setSelectedConcept('all')
    setSearchQuery('')
    setTypeFilter('all')
    setSortBy('newest')
  }

  const clearAll = () => {
    setTransactions([])
    setError('')
    setSelectedConcept('all')
    setSearchQuery('')
    setTypeFilter('all')
    setSortBy('newest')
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <main className="app-shell">
      {toastMessage ? <aside className="toast-notification">{toastMessage}</aside> : null}

      <aside className="page-rail" aria-label={t.nav.goTo(t.sections.movementsTitle)}>
        <nav className="page-rail-nav">
          {navSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`page-rail-link ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => {
                document.getElementById(section.id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }}
              aria-label={t.nav.goTo(section.label)}
            >
              <span className="page-rail-dot" />
              <span className="page-rail-text">{section.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section id="inicio" className="hero-panel scroll-section">
        <div className="hero-copy-block">
          <div className="hero-topbar">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <div className="language-switcher" aria-label={t.languageLabel}>
              <button
                type="button"
                className={language === 'es' ? 'active' : ''}
                onClick={() => setLanguage('es')}
              >
                {t.languageOptions.es}
              </button>
              <button
                type="button"
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
              >
                {t.languageOptions.en}
              </button>
            </div>
          </div>
          <h1>{t.hero.title}</h1>
          <p className="hero-copy">{t.hero.copy}</p>
          <div className="hero-highlights">
            {t.hero.highlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
        </div>

        <div className="upload-card">
          <label className="upload-dropzone">
            <span>{t.upload.eyebrow}</span>
            <strong>{t.upload.title}</strong>
            <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} />
          </label>
          <p className="upload-hint">
            {t.upload.minimumColumns} <code>{minimumColumns[0]}</code>, <code>{minimumColumns[1]}</code> {t.upload.joiner}{' '}
            <code>{minimumColumns[2]}</code>.
          </p>
          <div className="upload-notes">
            <span>{t.upload.note1}</span>
            <span>{t.upload.note2}</span>
          </div>
          <div className="actions-row">
            <button type="button" onClick={resetToSample}>
              {t.upload.sampleButton}
            </button>
            <button type="button" className="ghost" onClick={clearAll}>
              {t.upload.clearButton}
            </button>
          </div>
          {error ? <p className="error-message">{error}</p> : null}
        </div>
      </section>

      <section id="resumen" className="summary-grid scroll-section">
        {summaryCards.map((card) => (
          <article key={card.label} className={`summary-card ${card.tone ?? 'neutral'}`}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.hint}</span>
          </article>
        ))}
      </section>

      <section className="helper-strip">
        {t.helpers.map((helper) => (
          <article key={helper.title} className="helper-card">
            <strong>{helper.title}</strong>
            <span>{helper.text}</span>
          </article>
        ))}
      </section>

      <div className="toolbar toolbar-inline">
        <div className="range-tabs">
          <button
            type="button"
            className={selectedRange === 'week' ? 'active' : ''}
            onClick={() => setSelectedRange('week')}
          >
            {t.ranges.week}
          </button>
          <button
            type="button"
            className={selectedRange === 'month' ? 'active' : ''}
            onClick={() => setSelectedRange('month')}
          >
            {t.ranges.month}
          </button>
          <button
            type="button"
            className={selectedRange === 'quarter' ? 'active' : ''}
            onClick={() => setSelectedRange('quarter')}
          >
            {t.ranges.quarter}
          </button>
          <button
            type="button"
            className={selectedRange === 'all' ? 'active' : ''}
            onClick={() => setSelectedRange('all')}
          >
            {t.ranges.all}
          </button>
        </div>
      </div>

      <section className="content-grid scroll-section">
        <article id="gastos" className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t.sections.expensesEyebrow}</p>
              <h2>{t.sections.expensesTitle}</h2>
            </div>
          </div>
          <div className="category-list">
            {topConcepts.length ? (
              topConcepts.map((item) => (
                <div key={item.concept} className="category-row">
                  <div className="category-labels">
                    <div className="category-title-block">
                      <strong>{item.concept}</strong>
                      <small>
                        {totalTopConceptExpense
                          ? t.expenses.percentOfTop(
                              Math.round((item.total / totalTopConceptExpense) * 100),
                            )
                          : t.expenses.noPercent}
                      </small>
                    </div>
                    <span>{formatCurrency(item.total, locale)}</span>
                  </div>
                  <div className="category-bar">
                    <span
                      style={{
                        width: `${largestConceptTotal ? (item.total / largestConceptTotal) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">{t.expenses.empty}</p>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t.sections.compareEyebrow}</p>
              <h2>{t.sections.compareTitle}</h2>
            </div>
          </div>
          <div className="comparison-grid">
            <div className="comparison-card">
              <span>{formatMonthKey(currentMonthKey, locale)}</span>
              <strong>{formatCurrency(currentMonthTotals.income - currentMonthTotals.expense, locale)}</strong>
              <p>
                {t.compare.incomeExpense(
                  formatCurrency(currentMonthTotals.income, locale),
                  formatCurrency(currentMonthTotals.expense, locale),
                )}
              </p>
              <small className="comparison-trend">
                {currentMonthTotals.income >= currentMonthTotals.expense
                  ? t.compare.positive
                  : t.compare.negative}
              </small>
            </div>
            <div className="comparison-card muted">
              <span>{formatMonthKey(previousMonthKey, locale)}</span>
              <strong>
                {formatCurrency(previousMonthTotals.income - previousMonthTotals.expense, locale)}
              </strong>
              <p>
                {t.compare.incomeExpense(
                  formatCurrency(previousMonthTotals.income, locale),
                  formatCurrency(previousMonthTotals.expense, locale),
                )}
              </p>
              <small className="comparison-trend">
                {previousMonthTotals.income >= previousMonthTotals.expense
                  ? t.compare.positive
                  : t.compare.negative}
              </small>
            </div>
          </div>
          <div className="chart-shell">
            <div className="chart-legend">
              <span><i className="legend income" /> {t.compare.legendIncome}</span>
              <span><i className="legend expense" /> {t.compare.legendExpense}</span>
            </div>
            <div className="mini-chart">
            {monthlyTotals.slice(-6).map((month) => {
              const maxValue = Math.max(
                ...monthlyTotals.map((entry) => Math.max(entry.income, entry.expense)),
                1,
              )

              return (
                <div key={month.month} className="mini-chart-column">
                  <div className="bars">
                    <span
                      className="income-bar"
                      style={{ height: `${(month.income / maxValue) * 100}%` }}
                    />
                    <span
                      className="expense-bar"
                      style={{ height: `${(month.expense / maxValue) * 100}%` }}
                    />
                  </div>
                  <small>{month.month.slice(5)}</small>
                </div>
              )
            })}
            </div>
          </div>
        </article>
      </section>

      <section id="filtros" className="secondary-grid scroll-section">
        <article className="panel insights-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t.sections.insightsEyebrow}</p>
              <h2>{t.sections.insightsTitle}</h2>
            </div>
          </div>
          <div className="insight-hero">
            <div className="insight-hero-card">
              <span>{t.insights.highestIncome}</span>
              <strong>{highestIncome ? highestIncome.description : t.insights.noData}</strong>
              <p>
                {highestIncome
                  ? formatCurrency(highestIncome.amount, locale)
                  : t.insights.loadMore}
              </p>
            </div>
            <div className="insight-mini-grid">
              <div className="insight-card compact">
                <span>{t.insights.highestExpense}</span>
                <strong>{highestExpense ? highestExpense.description : t.insights.noData}</strong>
                <p>
                  {highestExpense
                    ? formatCurrency(Math.abs(highestExpense.amount), locale)
                    : t.insights.loadMore}
                </p>
              </div>
              <div className="insight-card compact">
                <span>{t.insights.visibleMovements}</span>
                <strong>{filteredTransactions.length}</strong>
                <p>
                  {searchQuery || typeFilter !== 'all' || selectedConcept !== 'all'
                    ? t.insights.filtersActive
                    : t.insights.noExtraFilters}
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="panel filter-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t.sections.filtersEyebrow}</p>
              <h2>{t.sections.filtersTitle}</h2>
            </div>
          </div>
          <p className="filter-intro">{t.filters.intro}</p>
          <div className="filters-grid">
            <label className="field">
              <span>{t.filters.search}</span>
              <input
                type="search"
                placeholder={t.filters.searchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>

            <label className="field">
              <span>{t.filters.type}</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              >
                <option value="all">{t.filters.allTypes}</option>
                <option value="income">{t.filters.onlyIncome}</option>
                <option value="expense">{t.filters.onlyExpenses}</option>
              </select>
            </label>

            <label className="field">
              <span>{t.filters.concept}</span>
              <select
                value={selectedConcept}
                onChange={(event) => setSelectedConcept(event.target.value)}
              >
                <option value="all">{t.filters.allConcepts}</option>
                {conceptOptions.map((concept) => (
                  <option key={concept} value={concept}>
                    {concept}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{t.filters.order}</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
              >
                <option value="newest">{t.filters.newest}</option>
                <option value="oldest">{t.filters.oldest}</option>
                <option value="highest">{t.filters.highest}</option>
                <option value="lowest">{t.filters.lowest}</option>
              </select>
            </label>
          </div>
          <div className="filter-actions">
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setSearchQuery('')
                setTypeFilter('all')
                setSelectedConcept('all')
                setSortBy('newest')
              }}
            >
              {t.filters.clear}
            </button>
          </div>
          <div className="active-filters">
            <span>{t.filters.activeSearch(searchQuery)}</span>
            <span>{t.filters.activeType(typeFilter)}</span>
            <span>{t.filters.activeConcept(selectedConcept)}</span>
          </div>
        </article>
      </section>

      <section id="movimientos" className="panel scroll-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{t.sections.movementsEyebrow}</p>
            <h2>{t.sections.movementsTitle}</h2>
          </div>
          <span className="table-badge">{t.table.visibleCount(filteredTransactions.length)}</span>
        </div>
        {filteredTransactions.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.table.date}</th>
                  <th>{t.table.concept}</th>
                  <th>{t.table.type}</th>
                  <th>{t.table.amount}</th>
                  <th>{t.table.balance}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString(locale)}</td>
                    <td>
                      <div className="concept-cell">
                        <strong>{transaction.description}</strong>
                        <span>{translateCategory(transaction.category, language)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`pill ${transaction.type}`}>
                        {transaction.type === 'income' ? t.table.income : t.table.expense}
                      </span>
                    </td>
                    <td className={transaction.type === 'income' ? 'amount-income' : 'amount-expense'}>
                      {formatCurrency(transaction.amount, locale)}
                    </td>
                    <td>{transaction.balance !== undefined ? formatCurrency(transaction.balance, locale) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">{t.table.empty}</p>
        )}
      </section>
    </main>
  )
}

export default App
