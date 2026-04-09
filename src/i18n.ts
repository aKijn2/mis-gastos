export type Language = 'es' | 'en'
export type NavSectionId = 'inicio' | 'resumen' | 'gastos' | 'filtros' | 'movimientos'
export type TypeFilter = 'all' | 'income' | 'expense'
export type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'
export type CategoryKey =
  | 'supermarket'
  | 'food'
  | 'transport'
  | 'home'
  | 'subscriptions'
  | 'health'
  | 'salary'
  | 'transfers'
  | 'income'
  | 'other'

export const localeByLanguage: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US',
}

export const navSectionIds: NavSectionId[] = ['inicio', 'resumen', 'gastos', 'filtros', 'movimientos']

export const messages = {
  es: {
    languageLabel: 'Idioma',
    languageOptions: { es: 'ES', en: 'EN' },
    nav: {
      inicio: 'Inicio',
      resumen: 'Resumen',
      gastos: 'Gastos',
      filtros: 'Filtros',
      movimientos: 'Movimientos',
      goTo: (label: string) => `Ir a ${label}`,
    },
    hero: {
      eyebrow: 'Mis Gastos',
      title: 'Ve tu dinero de forma clara y sin complicaciones',
      copy:
        'Sube un CSV de tu banco y mira rapidamente cuanto has cobrado, cuanto has gastado y que saldo te queda, sin tener que entender tablas raras.',
      highlights: ['Facil de leer', 'Busqueda rapida', 'Compatible con varios bancos'],
    },
    upload: {
      eyebrow: 'Subir movimientos CSV',
      title: 'Selecciona un archivo CSV exportado desde tu banco',
      minimumColumns: 'Columnas minimas:',
      note1: 'Acepta cabeceras como `Fecha`, `Concepto`, `Descripcion`, `Importe` o `Amount`.',
      note2: 'Si tu banco exporta en Excel, abre el archivo y guardalo como `CSV UTF-8`.',
      sampleButton: 'Cargar ejemplo',
      clearButton: 'Limpiar datos',
      joiner: 'y',
    },
    summary: {
      spent: 'Gastado en este extracto',
      spentHint: (from: string, to: string) => `Del ${from} al ${to}`,
      spentFallback: 'Segun el extracto cargado',
      income: 'Ingresos',
      incomeHint: 'Total de ingresos del extracto',
      expenses: 'Gastos',
      expensesHint: 'Total de gastos del extracto',
      finalBalance: 'Saldo final',
      finalBalanceHint: 'Ultimo saldo leido del extracto',
      noBalance: 'Sin saldo',
    },
    helpers: [
      { title: '1. Mira primero', text: '`Saldo final` y `Gastos`' },
      {
        title: '2. Si quieres encontrar algo',
        text: 'Usa el buscador escribiendo Bizum, pension o el nombre del comercio',
      },
      {
        title: '3. Si tu archivo falla',
        text: 'Revisa que tenga columnas de fecha, descripcion y cantidad antes de importarlo',
      },
    ],
    ranges: {
      week: 'Esta semana',
      month: 'Este mes',
      quarter: 'Ultimos 3 meses',
      all: 'Todo',
    },
    sections: {
      expensesEyebrow: 'Gastos',
      expensesTitle: 'En que cosas gastas mas',
      compareEyebrow: 'Comparar',
      compareTitle: 'Este mes frente al anterior',
      filtersEyebrow: 'Buscar y filtrar',
      filtersTitle: 'Encuentra un movimiento facilmente',
      insightsEyebrow: 'Resumen',
      insightsTitle: 'Lo mas importante',
      movementsEyebrow: 'Movimientos',
      movementsTitle: 'Lista de movimientos',
    },
    compare: {
      incomeExpense: (income: string, expense: string) => `Ingresos ${income} / Gastos ${expense}`,
      positive: 'Mes positivo',
      negative: 'Mes con mas gasto que ingreso',
      legendIncome: 'Ingresos',
      legendExpense: 'Gastos',
    },
    expenses: {
      percentOfTop: (value: number) => `${value}% del top gasto`,
      noPercent: 'Sin porcentaje',
      empty: 'Cuando cargues gastos, apareceran aqui agrupados por concepto.',
    },
    insights: {
      highestIncome: 'Movimiento mas alto de ingreso',
      highestExpense: 'Gasto mas alto',
      visibleMovements: 'Movimientos visibles',
      noData: 'Sin datos',
      loadMore: 'Carga mas datos para verlo',
      filtersActive: 'Con filtros activos',
      noExtraFilters: 'Sin filtros extra',
    },
    filters: {
      intro:
        'Escribe una palabra, elige si quieres ver ingresos o gastos y, si hace falta, selecciona un concepto concreto.',
      search: 'Buscar',
      searchPlaceholder: 'Escribe Bizum, pension, Amazon...',
      type: 'Tipo',
      concept: 'Concepto',
      order: 'Orden',
      clear: 'Limpiar filtros',
      allTypes: 'Todos',
      onlyIncome: 'Solo ingresos',
      onlyExpenses: 'Solo gastos',
      allConcepts: 'Todos los conceptos',
      newest: 'Mas recientes',
      oldest: 'Mas antiguos',
      highest: 'Importe mas alto',
      lowest: 'Importe mas bajo',
      activeSearch: (value: string) => `Busqueda: ${value ? `"${value}"` : 'ninguna'}`,
      activeType: (value: TypeFilter) =>
        `Tipo: ${value === 'all' ? 'todos' : value === 'income' ? 'solo ingresos' : 'solo gastos'}`,
      activeConcept: (value: string) => `Concepto: ${value === 'all' ? 'todos' : value}`,
    },
    table: {
      visibleCount: (count: number) => `${count} visibles`,
      date: 'Fecha',
      concept: 'Concepto',
      type: 'Tipo',
      amount: 'Importe',
      balance: 'Saldo',
      income: 'Ingreso',
      expense: 'Gasto',
      empty: 'No hay movimientos con esos filtros. Prueba a limpiar la busqueda o ampliar el rango.',
    },
    categories: {
      supermarket: 'Supermercado',
      food: 'Restauracion',
      transport: 'Transporte',
      home: 'Hogar',
      subscriptions: 'Suscripciones',
      health: 'Salud',
      salary: 'Nomina',
      transfers: 'Transferencias',
      income: 'Ingresos',
      other: 'Otros',
    },
    toast: {
      loaded: (count: number, source: string) => `${count} movimientos cargados desde ${source}`,
    },
    errors: {
      emptyFile: 'El archivo esta vacio o no tiene filas suficientes.',
      headerNotFound:
        'No he encontrado la fila de cabeceras. El CSV debe incluir fecha, descripcion o concepto e importe.',
      missingColumns: (fields: string[]) =>
        `Faltan columnas importantes en el CSV: ${fields.join(', ')}.`,
      noValidRows: 'No he encontrado movimientos validos en el archivo.',
      uploadFallback: 'No se pudo leer el archivo.',
    },
  },
  en: {
    languageLabel: 'Language',
    languageOptions: { es: 'ES', en: 'EN' },
    nav: {
      inicio: 'Start',
      resumen: 'Summary',
      gastos: 'Spending',
      filtros: 'Filters',
      movimientos: 'Transactions',
      goTo: (label: string) => `Go to ${label}`,
    },
    hero: {
      eyebrow: 'My Expenses',
      title: 'See your money clearly without the hassle',
      copy:
        'Upload a CSV from your bank and quickly see how much you earned, how much you spent, and what balance is left without dealing with confusing tables.',
      highlights: ['Easy to read', 'Fast search', 'Works with several banks'],
    },
    upload: {
      eyebrow: 'Upload CSV transactions',
      title: 'Choose a CSV file exported from your bank',
      minimumColumns: 'Minimum columns:',
      note1: 'Accepts headers like `Fecha`, `Concepto`, `Descripcion`, `Importe`, `Date`, `Description`, or `Amount`.',
      note2: 'If your bank exports Excel, open the file and save it as `CSV UTF-8`.',
      sampleButton: 'Load sample',
      clearButton: 'Clear data',
      joiner: 'and',
    },
    summary: {
      spent: 'Spent in this statement',
      spentHint: (from: string, to: string) => `From ${from} to ${to}`,
      spentFallback: 'Based on the uploaded statement',
      income: 'Income',
      incomeHint: 'Total income in the statement',
      expenses: 'Expenses',
      expensesHint: 'Total expenses in the statement',
      finalBalance: 'Final balance',
      finalBalanceHint: 'Last balance read from the statement',
      noBalance: 'No balance',
    },
    helpers: [
      { title: '1. Check first', text: '`Final balance` and `Expenses`' },
      {
        title: '2. If you want to find something',
        text: 'Use the search box with Bizum, pension, or the merchant name',
      },
      {
        title: '3. If the file fails',
        text: 'Make sure it includes date, description, and amount columns before importing',
      },
    ],
    ranges: {
      week: 'This week',
      month: 'This month',
      quarter: 'Last 3 months',
      all: 'All',
    },
    sections: {
      expensesEyebrow: 'Spending',
      expensesTitle: 'What you spend the most on',
      compareEyebrow: 'Compare',
      compareTitle: 'This month vs previous month',
      filtersEyebrow: 'Search and filter',
      filtersTitle: 'Find a transaction easily',
      insightsEyebrow: 'Summary',
      insightsTitle: 'What matters most',
      movementsEyebrow: 'Transactions',
      movementsTitle: 'Transactions list',
    },
    compare: {
      incomeExpense: (income: string, expense: string) => `Income ${income} / Expenses ${expense}`,
      positive: 'Positive month',
      negative: 'More spending than income',
      legendIncome: 'Income',
      legendExpense: 'Expenses',
    },
    expenses: {
      percentOfTop: (value: number) => `${value}% of top spending`,
      noPercent: 'No percentage',
      empty: 'Your expense groups will appear here once you upload data.',
    },
    insights: {
      highestIncome: 'Highest income transaction',
      highestExpense: 'Highest expense',
      visibleMovements: 'Visible transactions',
      noData: 'No data',
      loadMore: 'Upload more data to see this',
      filtersActive: 'With active filters',
      noExtraFilters: 'No extra filters',
    },
    filters: {
      intro:
        'Type a word, choose whether you want to see income or expenses, and if needed select a specific concept.',
      search: 'Search',
      searchPlaceholder: 'Type Bizum, pension, Amazon...',
      type: 'Type',
      concept: 'Concept',
      order: 'Order',
      clear: 'Clear filters',
      allTypes: 'All',
      onlyIncome: 'Income only',
      onlyExpenses: 'Expenses only',
      allConcepts: 'All concepts',
      newest: 'Most recent',
      oldest: 'Oldest',
      highest: 'Highest amount',
      lowest: 'Lowest amount',
      activeSearch: (value: string) => `Search: ${value ? `"${value}"` : 'none'}`,
      activeType: (value: TypeFilter) =>
        `Type: ${value === 'all' ? 'all' : value === 'income' ? 'income only' : 'expenses only'}`,
      activeConcept: (value: string) => `Concept: ${value === 'all' ? 'all' : value}`,
    },
    table: {
      visibleCount: (count: number) => `${count} visible`,
      date: 'Date',
      concept: 'Concept',
      type: 'Type',
      amount: 'Amount',
      balance: 'Balance',
      income: 'Income',
      expense: 'Expense',
      empty: 'There are no transactions for these filters. Try clearing the search or widening the range.',
    },
    categories: {
      supermarket: 'Groceries',
      food: 'Food',
      transport: 'Transport',
      home: 'Home',
      subscriptions: 'Subscriptions',
      health: 'Health',
      salary: 'Salary',
      transfers: 'Transfers',
      income: 'Income',
      other: 'Other',
    },
    toast: {
      loaded: (count: number, source: string) => `${count} transactions loaded from ${source}`,
    },
    errors: {
      emptyFile: 'The file is empty or does not contain enough rows.',
      headerNotFound:
        'I could not find the header row. The CSV must include date, description or concept, and amount.',
      missingColumns: (fields: string[]) => `Important CSV columns are missing: ${fields.join(', ')}.`,
      noValidRows: 'I could not find valid transactions in this file.',
      uploadFallback: 'The file could not be read.',
    },
  },
} as const
