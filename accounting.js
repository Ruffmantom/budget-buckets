'use strict';

const STORAGE_KEY = 'budget-buckets-state-v1';
const EXPENSES_KEY = 'budget-expenses-v1';
const PREFERENCES_KEY = 'accounting-preferences-v1';

const categories = [
  {
    id: 'income',
    title: 'Monthly Net Income',
    hint: 'Paychecks & deposits',
    badgeClass: 'bg-emerald-400/15 text-emerald-200'
  },
  {
    id: 'fundamental',
    title: 'Fundamental',
    hint: 'Bills / rent / food',
    badgeClass: 'bg-sky-400/15 text-sky-200'
  },
  {
    id: 'future',
    title: 'Future',
    hint: 'Savings & goals',
    badgeClass: 'bg-amber-400/15 text-amber-200'
  },
  {
    id: 'fun',
    title: 'Fun',
    hint: 'Dining / travel / movie night',
    badgeClass: 'bg-pink-400/15 text-pink-200'
  }
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
});

const summaryEls = {
  spent: document.getElementById('summary-spent'),
  available: document.getElementById('summary-available')
};

const bucketCountEl = document.getElementById('bucketCount');
const bucketBreakdownEl = document.getElementById('bucketBreakdown');
const bucketBreakdownContainer = document.getElementById('bucketBreakdownContainer');
const bucketSnapshotToggle = document.getElementById('bucketSnapshotToggle');
const bucketToggleIcon = document.getElementById('bucketToggleIcon');
const expenseForm = document.getElementById('expenseForm');
const expenseBucketSelect = document.getElementById('expenseBucket');
const expenseStatusEl = document.getElementById('expenseStatus');
const toggleExpenseFormButton = document.getElementById('toggleExpenseForm');
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const settingsCloseEls = document.querySelectorAll('[data-close-settings]');
const expenseListEl = document.getElementById('expenseList');
const expenseCountEl = document.getElementById('expenseCount');
const expenseSheet = document.getElementById('expenseSheet');
const expenseSheetPanel = document.querySelector('[data-expense-panel]');
const closeExpenseSheetButton = document.getElementById('closeExpenseSheet');

let expenses = [];
let activeExpenseEdit = null;
let currentBuckets = [];
let bucketLookup = new Map();
let snapshotOpen = true;

function formatCurrency(value) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function applyThemeFromBudget() {
  if (typeof document === 'undefined') return;
  let theme = 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.theme === 'string') {
        theme = parsed.theme;
      }
    }
  } catch (error) {
    console.warn('Unable to read theme from budget data', error);
  }

  const root = document.documentElement;
  root.classList.toggle('dark', theme !== 'light');
  if (theme === 'light') {
    root.dataset.theme = 'light';
  } else {
    delete root.dataset.theme;
  }
}

function loadBudgetState() {
  const empty = categories.reduce((acc, category) => {
    acc[category.id] = [];
    return acc;
  }, {});

  if (typeof localStorage === 'undefined') return empty;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return empty;
    const parsed = JSON.parse(stored);
    const hasWrapper =
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      parsed.buckets;

    const bucketsSource = hasWrapper ? parsed.buckets : parsed;
    const nextState = { ...empty };

    categories.forEach((category) => {
      const rawBucket = Array.isArray(bucketsSource?.[category.id])
        ? bucketsSource[category.id]
        : [];
      const normalized = [];

      rawBucket.forEach((entry) => {
        if (!entry) return;
        const name = typeof entry.name === 'string' ? entry.name.trim() : '';
        const amount = Number(entry.amount);
        if (!name || !Number.isFinite(amount) || amount <= 0) return;

        const id =
          typeof entry.id === 'string' && entry.id.trim()
            ? entry.id
            : generateId();
        const sanitizedAmount = Math.round(amount * 100) / 100;
        normalized.push({ id, name, amount: sanitizedAmount });
      });

      nextState[category.id] = normalized;
    });

    return nextState;
  } catch (error) {
    console.warn('Unable to read budget data', error);
    return empty;
  }
}

function loadExpenses() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(EXPENSES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((expense) => {
        const amount = Number(expense.amount);
        const label =
          typeof expense.label === 'string' ? expense.label.trim() : '';
        const bucketId =
          typeof expense.bucketId === 'string' ? expense.bucketId : '';
        if (!label || !Number.isFinite(amount) || amount <= 0) return null;
        return {
          id:
            typeof expense.id === 'string' && expense.id.trim()
              ? expense.id
              : generateId(),
          label,
          amount: Math.round(amount * 100) / 100,
          bucketId,
          bucketName:
            typeof expense.bucketName === 'string' && expense.bucketName.trim()
              ? expense.bucketName.trim()
              : 'Unassigned',
          categoryId:
            typeof expense.categoryId === 'string' ? expense.categoryId : null,
          createdAt:
            typeof expense.createdAt === 'string'
              ? expense.createdAt
              : new Date().toISOString()
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('Unable to read expenses', error);
    return [];
  }
}

function persistExpenses() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.warn('Unable to save expenses', error);
  }
}

function getTotals(budgetState) {
  const breakdown = {};
  categories.forEach((category) => {
    const bucket = budgetState[category.id] || [];
    breakdown[category.id] = bucket.reduce((sum, entry) => sum + entry.amount, 0);
  });
  const incomeTotal = breakdown.income || 0;
  const allocated =
    (breakdown.fundamental || 0) + (breakdown.future || 0) + (breakdown.fun || 0);
  const remaining = incomeTotal - allocated;
  return { incomeTotal, allocated, remaining };
}

function buildBuckets(budgetState) {
  const list = [];
  categories.forEach((category) => {
    const bucket = budgetState[category.id] || [];
    bucket.forEach((entry) => {
      list.push({
        id: entry.id,
        name: entry.name,
        amount: entry.amount,
        categoryId: category.id,
        categoryTitle: category.title,
        archived: false
      });
    });
  });
  return list;
}

function computeSpendByBucket(expenseList) {
  const spend = new Map();
  expenseList.forEach((expense) => {
    if (!expense.bucketId) return;
    const current = spend.get(expense.bucketId) || 0;
    spend.set(expense.bucketId, current + expense.amount);
  });
  return spend;
}

function computeSpendByCategory(expenseList) {
  const spend = new Map();
  expenseList.forEach((expense) => {
    const categoryId = expense.categoryId || 'unknown';
    const current = spend.get(categoryId) || 0;
    spend.set(categoryId, current + expense.amount);
  });
  return spend;
}

function renderSummary(budgetState) {
  const { incomeTotal, allocated, remaining } = getTotals(budgetState);
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const available = allocated - totalSpent;

  if (summaryEls.spent) {
    summaryEls.spent.textContent = formatCurrency(totalSpent);
  }
  if (summaryEls.available) {
    summaryEls.available.textContent = `${formatCurrency(available)} allocated to buckets`;
    summaryEls.available.classList.remove('text-emerald-300', 'text-rose-300');
    summaryEls.available.classList.add(
      available < 0 ? 'text-rose-300' : 'text-emerald-300'
    );
  }
}

function getCategoryTitle(categoryId) {
  const category = categories.find((entry) => entry.id === categoryId);
  return category ? category.title : 'Uncategorized';
}

function ensureArchivedBuckets(budgetBuckets, expenseList) {
  const knownIds = new Set(budgetBuckets.map((bucket) => bucket.id));
  const extras = [];

  expenseList.forEach((expense) => {
    if (!expense.bucketId || knownIds.has(expense.bucketId)) return;
    knownIds.add(expense.bucketId);
    extras.push({
      id: expense.bucketId,
      name: expense.bucketName || 'Archived bucket',
      amount: 0,
      categoryId: expense.categoryId || 'unknown',
      categoryTitle: getCategoryTitle(expense.categoryId),
      archived: true
    });
  });

  return budgetBuckets.concat(extras);
}

function renderBucketOptions(budgetBuckets) {
  const select = expenseBucketSelect;
  const options = ['<option value="">Select a bucket</option>'];
  const spendingBuckets = budgetBuckets.filter(
    (bucket) => bucket.categoryId !== 'income'
  );
  const archivedBuckets = spendingBuckets.filter((bucket) => bucket.archived);
  const activeBuckets = spendingBuckets.filter((bucket) => !bucket.archived);
  const byCategory = new Map();

  activeBuckets.forEach((bucket) => {
    if (!byCategory.has(bucket.categoryId)) {
      byCategory.set(bucket.categoryId, []);
    }
    byCategory.get(bucket.categoryId).push(bucket);
  });

  categories
    .filter((category) => category.id !== 'income')
    .forEach((category) => {
      const buckets = byCategory.get(category.id) || [];
      if (!buckets.length) return;
      const groupOptions = buckets
        .map(
          (bucket) =>
            `<option value="${bucket.id}">${bucket.name} (${category.title})</option>`
        )
        .join('');
      options.push(`<optgroup label="${category.title}">${groupOptions}</optgroup>`);
    });

  if (archivedBuckets.length) {
    const archivedOptions = archivedBuckets
      .map(
        (bucket) =>
          `<option value="${bucket.id}">${bucket.name || 'Archived bucket'}</option>`
      )
      .join('');
    options.push(`<optgroup label="Archived">${archivedOptions}</optgroup>`);
  }

  select.innerHTML = options.join('');
  const noBuckets = !spendingBuckets.length;
  select.disabled = noBuckets;
  if (expenseStatusEl) {
    expenseStatusEl.textContent = noBuckets
      ? 'Add buckets on the Budget tab to start logging expenses.'
      : '';
  }
}

function renderBucketBreakdown(budgetState) {
  const spendByBucket = computeSpendByBucket(expenses);
  const spendByCategory = computeSpendByCategory(expenses);
  const bucketMarkup = [];

  const spendingBuckets = currentBuckets.filter(
    (bucket) => bucket.categoryId !== 'income'
  );
  const byCategory = new Map();
  spendingBuckets.forEach((bucket) => {
    if (!byCategory.has(bucket.categoryId)) {
      byCategory.set(bucket.categoryId, []);
    }
    byCategory.get(bucket.categoryId).push(bucket);
  });

  categories
    .filter((category) => category.id !== 'income')
    .forEach((category) => {
      const buckets = byCategory.get(category.id) || [];
      const categorySpend = spendByCategory.get(category.id) || 0;
      const categoryBudget = (budgetState[category.id] || []).reduce(
        (sum, entry) => sum + entry.amount,
        0
      );
      const categoryRemaining = categoryBudget - categorySpend;

      bucketMarkup.push(`
        <div class="rounded-sm border border-white/5 bg-slate-900/40 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">${category.title}</p>
              <p class="text-xs text-slate-500">${formatCurrency(categorySpend)} spent of ${formatCurrency(
        categoryBudget
      )}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold ${
                categoryRemaining < 0 ? 'text-rose-300' : 'text-emerald-400'
              }">${formatCurrency(categoryRemaining)}</p>
              <p class="text-[0.65rem] uppercase text-slate-500">Remaining</p>
            </div>
          </div>
          <div class="space-y-2">
            ${
              buckets.length
                ? buckets
                    .map((bucket) => {
                      const spent = spendByBucket.get(bucket.id) || 0;
                      const remaining = bucket.amount - spent;
                      return `
                        <div class="flex items-center justify-between rounded-xs border border-white/5 bg-slate-950/60 px-3 py-2">
                          <div>
                            <p class="text-sm font-semibold">${bucket.name}</p>
                            <p class="text-[0.7rem] text-slate-500">${formatCurrency(
                              spent
                            )} spent of ${formatCurrency(bucket.amount)}</p>
                          </div>
                          <div class="text-right">
                            <p class="text-sm font-semibold ${
                              remaining < 0 ? 'text-rose-300' : 'text-emerald-300'
                            }">${formatCurrency(remaining)}</p>
                            <p class="text-[0.65rem] uppercase text-slate-500">Left</p>
                          </div>
                        </div>
                      `;
                    })
                    .join('')
                : `<p class="text-sm text-slate-500">No buckets yet for this category.</p>`
            }
          </div>
        </div>
      `);
    });

  const hasBuckets = spendingBuckets.length > 0;
  if (!hasBuckets) {
    bucketBreakdownEl.innerHTML =
      '<p class="text-sm text-slate-500">Start by adding buckets on the main budget page to track spending.</p>';
  } else {
    bucketBreakdownEl.innerHTML = bucketMarkup.join('');
  }

  bucketCountEl.textContent = `${spendingBuckets.length} bucket${
    spendingBuckets.length === 1 ? '' : 's'
  }`;
  applySnapshotVisibility();
}

function getBucketOptionsMarkup(selectedId) {
  const spendingBuckets = currentBuckets.filter(
    (bucket) => bucket.categoryId !== 'income'
  );
  const archivedBuckets = spendingBuckets.filter((bucket) => bucket.archived);
  const activeBuckets = spendingBuckets.filter((bucket) => !bucket.archived);
  const byCategory = new Map();

  activeBuckets.forEach((bucket) => {
    if (!byCategory.has(bucket.categoryId)) {
      byCategory.set(bucket.categoryId, []);
    }
    byCategory.get(bucket.categoryId).push(bucket);
  });

  const options = [];
  categories
    .filter((category) => category.id !== 'income')
    .forEach((category) => {
      const buckets = byCategory.get(category.id) || [];
      if (!buckets.length) return;
      const group = buckets
        .map(
          (bucket) =>
            `<option value="${bucket.id}" ${
              selectedId === bucket.id ? 'selected' : ''
            }>${bucket.name} (${category.title})</option>`
        )
        .join('');
      options.push(`<optgroup label="${category.title}">${group}</optgroup>`);
    });

  if (archivedBuckets.length) {
    const group = archivedBuckets
      .map(
        (bucket) =>
          `<option value="${bucket.id}" ${
            selectedId === bucket.id ? 'selected' : ''
          }>${bucket.name || 'Archived bucket'}</option>`
      )
      .join('');
    options.push(`<optgroup label="Archived">${group}</optgroup>`);
  }

  if (!options.length) {
    options.push('<option value="">No buckets available</option>');
  }

  return options.join('');
}

function renderExpenseList() {
  if (!expenses.length) {
    expenseListEl.innerHTML =
      '<p class="text-sm text-slate-500">No expenses logged yet.</p>';
    expenseCountEl.textContent = '0 entries';
    return;
  }

  const items = expenses
    .map((expense) => {
      const bucket = bucketLookup.get(expense.bucketId);
      const bucketName = bucket?.name || expense.bucketName || 'Unassigned';
      const categoryTitle =
        bucket?.categoryTitle || getCategoryTitle(expense.categoryId);
      const isEditing = activeExpenseEdit === expense.id;

      if (isEditing) {
        return `
          <div class="rounded-sm border border-white/5 bg-slate-950/60 p-3 space-y-2">
            <form data-expense-edit="${expense.id}" class="space-y-2">
              <label class="flex flex-col gap-1 text-[0.6rem] uppercase text-slate-400">
                Description
                <input
                  type="text"
                  name="label"
                  value="${expense.label}"
                  required
                  class="rounded-sm border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label class="flex flex-col gap-1 text-[0.6rem] uppercase text-slate-400">
                  Amount
                  <input
                    type="number"
                    name="amount"
                    inputmode="decimal"
                    min="0"
                    step="0.01"
                    value="${expense.amount}"
                    required
                    class="rounded-sm border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
                <label class="flex flex-col gap-1 text-[0.6rem] uppercase text-slate-400">
                  Bucket
                  <select
                    name="bucket"
                    class="rounded-sm border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
                    required
                  >
                    ${getBucketOptionsMarkup(expense.bucketId)}
                  </select>
                </label>
              </div>
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  data-expense-action="cancel-edit"
                  data-expense-id="${expense.id}"
                  class="rounded-sm border border-white/10 bg-slate-950/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-sm bg-emerald-400/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        `;
      }

      return `
        <div class="rounded-sm border border-white/5 bg-slate-950/60 p-3">
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <p class="text-sm font-semibold">${expense.label}</p>
              <p class="text-xs text-slate-400">${categoryTitle} • ${bucketName}</p>
              <p class="text-xs text-slate-500">${new Date(
                expense.createdAt
              ).toLocaleDateString()}</p>
            </div>
            <div class="text-right">
              <p class="text-base font-semibold">${formatCurrency(expense.amount)}</p>
              <div class="mt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  data-expense-action="edit"
                  data-expense-id="${expense.id}"
                  class="rounded-sm border border-white/10 bg-slate-950/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  data-expense-action="delete"
                  data-expense-id="${expense.id}"
                  class="rounded-sm border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  expenseListEl.innerHTML = items;
  expenseCountEl.textContent = `${expenses.length} entr${expenses.length === 1 ? 'y' : 'ies'}`;
}

function refreshBuckets() {
  const budgetState = loadBudgetState();
  const budgetBuckets = buildBuckets(budgetState);
  currentBuckets = ensureArchivedBuckets(budgetBuckets, expenses);
  bucketLookup = new Map(currentBuckets.map((bucket) => [bucket.id, bucket]));
  renderBucketOptions(currentBuckets);
  renderSummary(budgetState);
  renderBucketBreakdown(budgetState);
  renderExpenseList();
}

function handleExpenseSubmit(event) {
  event.preventDefault();
  if (!expenseForm) return;

  const labelField = expenseForm.elements.label;
  const amountField = expenseForm.elements.amount;
  const bucketField = expenseForm.elements.bucket;

  const label = labelField.value.trim();
  const amount = parseFloat(amountField.value);
  const bucketId = bucketField.value;

  if (!label || !Number.isFinite(amount) || amount <= 0 || !bucketId) {
    expenseStatusEl.textContent = 'Enter an amount and pick a bucket.';
    bucketField.focus();
    return;
  }

  const bucket = bucketLookup.get(bucketId);
  const sanitizedAmount = Math.round(amount * 100) / 100;

  expenses.push({
    id: generateId(),
    label,
    amount: sanitizedAmount,
    bucketId,
    bucketName: bucket?.name || 'Unassigned',
    categoryId: bucket?.categoryId || null,
    createdAt: new Date().toISOString()
  });

  persistExpenses();
  expenseForm.reset();
  expenseStatusEl.textContent = 'Expense added.';
  activeExpenseEdit = null;
  refreshBuckets();
  closeExpenseSheet();
}

function handleExpenseListClick(event) {
  const button = event.target.closest('[data-expense-action]');
  if (!button) return;
  const action = button.dataset.expenseAction;
  const expenseId = button.dataset.expenseId;
  if (!expenseId) return;

  if (action === 'delete') {
    expenses = expenses.filter((expense) => expense.id !== expenseId);
    persistExpenses();
    if (activeExpenseEdit === expenseId) {
      activeExpenseEdit = null;
    }
    refreshBuckets();
    return;
  }

  if (action === 'edit') {
    activeExpenseEdit = expenseId;
    renderExpenseList();
    return;
  }

  if (action === 'cancel-edit') {
    activeExpenseEdit = null;
    renderExpenseList();
  }
}

function handleExpenseEditSubmit(event) {
  if (!event.target.matches('form[data-expense-edit]')) return;
  event.preventDefault();
  const form = event.target;
  const expenseId = form.dataset.expenseEdit;
  const label = form.elements.label.value.trim();
  const amount = parseFloat(form.elements.amount.value);
  const bucketId = form.elements.bucket.value;
  if (!expenseId || !label || !Number.isFinite(amount) || amount <= 0 || !bucketId) {
    return;
  }

  const expenseIndex = expenses.findIndex((entry) => entry.id === expenseId);
  if (expenseIndex === -1) return;

  const bucket = bucketLookup.get(bucketId);
  expenses[expenseIndex] = {
    ...expenses[expenseIndex],
    label,
    amount: Math.round(amount * 100) / 100,
    bucketId,
    bucketName: bucket?.name || 'Unassigned',
    categoryId: bucket?.categoryId || null
  };

  activeExpenseEdit = null;
  persistExpenses();
  refreshBuckets();
}

function handleToggleExpenseForm() {
  if (isExpenseSheetOpen()) {
    closeExpenseSheet();
  } else {
    openExpenseSheet();
  }
}

function init() {
  loadPreferences();
  applyThemeFromBudget();
  expenses = loadExpenses();
  refreshBuckets();

  if (expenseForm) {
    expenseForm.addEventListener('submit', handleExpenseSubmit);
  }
  if (expenseListEl) {
    expenseListEl.addEventListener('click', handleExpenseListClick);
    expenseListEl.addEventListener('submit', handleExpenseEditSubmit);
  }
  if (toggleExpenseFormButton) {
    toggleExpenseFormButton.addEventListener('click', handleToggleExpenseForm);
  }
  if (closeExpenseSheetButton) {
    closeExpenseSheetButton.addEventListener('click', closeExpenseSheet);
  }
  if (expenseSheet) {
    expenseSheet.addEventListener('click', (event) => {
      if (event.target?.dataset?.expenseOverlay !== undefined) {
        closeExpenseSheet();
      }
    });
  }

  // Settings modal parity with main page
  if (settingsButton && settingsModal) {
    settingsButton.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    settingsCloseEls.forEach((el) =>
      el.addEventListener('click', () => settingsModal.classList.add('hidden'))
    );
    settingsModal.addEventListener('click', (event) => {
      if (event.target === settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
      }
    });
  }

  if (bucketSnapshotToggle) {
    bucketSnapshotToggle.addEventListener('click', () => {
      snapshotOpen = !snapshotOpen;
      applySnapshotVisibility();
      persistPreferences();
    });
  }
}

init();

function isExpenseSheetOpen() {
  return expenseSheet && !expenseSheet.classList.contains('hidden');
}

function openExpenseSheet() {
  if (!expenseSheet || !expenseSheetPanel) return;
  expenseSheet.classList.remove('hidden');
  requestAnimationFrame(() => {
    expenseSheetPanel.classList.remove('translate-y-full');
    expenseSheetPanel.classList.add('translate-y-0');
  });
  if (toggleExpenseFormButton) {
    toggleExpenseFormButton.setAttribute('aria-expanded', 'true');
  }
  expenseForm?.elements?.label?.focus?.();
}

function closeExpenseSheet() {
  if (!expenseSheet || !expenseSheetPanel) return;
  expenseSheetPanel.classList.add('translate-y-full');
  expenseSheetPanel.classList.remove('translate-y-0');
  if (toggleExpenseFormButton) {
    toggleExpenseFormButton.setAttribute('aria-expanded', 'false');
  }
  expenseSheetPanel.addEventListener(
    'transitionend',
    () => {
      if (expenseSheetPanel.classList.contains('translate-y-full')) {
        expenseSheet.classList.add('hidden');
      }
    },
    { once: true }
  );
}
function loadPreferences() {
  if (typeof localStorage === 'undefined') return;
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed.snapshotOpen === 'boolean') {
      snapshotOpen = parsed.snapshotOpen;
    }
  } catch (error) {
    console.warn('Unable to read accounting preferences', error);
  }
}

function persistPreferences() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ snapshotOpen }));
  } catch (error) {
    console.warn('Unable to save accounting preferences', error);
  }
}

function applySnapshotVisibility() {
  if (!bucketBreakdownContainer) return;
  bucketBreakdownContainer.classList.toggle('hidden', !snapshotOpen);
  if (bucketSnapshotToggle) {
    bucketSnapshotToggle.setAttribute('aria-expanded', snapshotOpen ? 'true' : 'false');
  }
  if (bucketToggleIcon) {
    bucketToggleIcon.classList.toggle('rotate-180', !snapshotOpen);
  }
}
