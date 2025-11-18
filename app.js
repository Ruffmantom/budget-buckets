// app.js
'use strict';

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

const state = categories.reduce((acc, category) => {
  acc[category.id] = [];
  return acc;
}, {});
const openState = new Map([['income', true]]);
const STORAGE_KEY = 'budget-buckets-state-v1';
let activeEdit = null;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
});

const categoriesContainer = document.getElementById('categories');
const summaryEls = {
  income: document.getElementById('summary-income'),
  allocated: document.getElementById('summary-allocated'),
  remaining: document.getElementById('summary-remaining')
};
const budgetStatusEls = {
  card: document.getElementById('budget-status-card'),
  label: document.getElementById('budget-status-label'),
  amount: document.getElementById('budget-status-amount'),
  detail: document.getElementById('budget-status-detail')
};
const settingsModal = document.getElementById('settingsModal');
const settingsButton = document.getElementById('settingsButton');
const settingsCloseEls = document.querySelectorAll('[data-close-settings]');
const downloadCsvButton = document.getElementById('downloadCsvButton');
const importCsvButton = document.getElementById('importCsvButton');
const importCsvInput = document.getElementById('importCsvInput');

function formatCurrency(value) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

function escapeHtml(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createItem(name, amount) {
  return {
    id: generateId(),
    name,
    amount
  };
}

function persistState() {
  if (typeof localStorage === 'undefined') return;
  try {
    const buckets = categories.reduce((acc, category) => {
      acc[category.id] = state[category.id];
      return acc;
    }, {});
    const openSnapshot = {};
    categories.forEach((category) => {
      const fallback = category.id === 'income';
      openSnapshot[category.id] = openState.has(category.id)
        ? openState.get(category.id)
        : fallback;
    });
    console.log('[Persist] Buckets:', buckets);
    console.log('[Persist] Open states:', openSnapshot);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        buckets,
        open: openSnapshot
      })
    );
  } catch (error) {
    console.warn('Unable to save budget data', error);
  }
}

function hydrateState() {
  if (typeof localStorage === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored);
    const hasWrapper =
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      parsed.buckets;
    const bucketsSource = hasWrapper ? parsed.buckets : parsed;
    const openSnapshot =
      hasWrapper && parsed.open && typeof parsed.open === 'object'
        ? parsed.open
        : null;

    console.log('[Hydrate] Raw payload:', parsed);

    let changed = !hasWrapper || !openSnapshot;

    categories.forEach((category) => {
      const bucket = Array.isArray(bucketsSource?.[category.id])
        ? bucketsSource[category.id]
        : [];
      const normalized = [];

      bucket.forEach((entry) => {
        if (!entry) {
          changed = true;
          return;
        }

        const originalName = typeof entry.name === 'string' ? entry.name : '';
        const name = originalName.trim();
        const rawAmount = Number(entry.amount);
        if (!name || !Number.isFinite(rawAmount) || rawAmount <= 0) {
          changed = true;
          return;
        }

        const sanitizedAmount = Math.round(rawAmount * 100) / 100;
        const id =
          typeof entry.id === 'string' && entry.id.trim()
            ? entry.id
            : generateId();

        if (
          sanitizedAmount !== rawAmount ||
          id !== entry.id ||
          name !== originalName
        ) {
          changed = true;
        }

        normalized.push({ id, name, amount: sanitizedAmount });
      });

      state[category.id] = normalized;
    });

    if (openSnapshot) {
      categories.forEach((category) => {
        if (typeof openSnapshot[category.id] === 'boolean') {
          openState.set(category.id, openSnapshot[category.id]);
          console.log(
            `[Hydrate] Restored open state for ${category.id}:`,
            openSnapshot[category.id]
          );
        }
      });
    }

    if (changed) {
      persistState();
    }
  } catch (error) {
    console.warn('Unable to load saved budget data', error);
  }
}

function openSettingsModal() {
  if (!settingsModal) return;
  settingsModal.classList.remove('hidden');
  settingsModal.classList.add('flex');
  document.body.classList.add('overflow-hidden');
}

function closeSettingsModal() {
  if (!settingsModal) return;
  settingsModal.classList.add('hidden');
  settingsModal.classList.remove('flex');
  document.body.classList.remove('overflow-hidden');
  if (importCsvInput) {
    importCsvInput.value = '';
  }
}

function csvEscapeValue(value) {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsvText() {
  const rows = [['category', 'label', 'amount']];
  categories.forEach((category) => {
    state[category.id].forEach((item) => {
      rows.push([
        category.id,
        item.name,
        item.amount.toFixed(2)
      ]);
    });
  });
  return rows.map((row) => row.map(csvEscapeValue).join(',')).join('\r\n');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function importBudgetFromCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length);

  if (!lines.length) {
    throw new Error('CSV file is empty.');
  }

  const header = parseCsvLine(lines[0]).map((value) => value.trim().toLowerCase());
  const categoryIndex = header.indexOf('category');
  const labelIndex = header.indexOf('label');
  const amountIndex = header.indexOf('amount');

  if (categoryIndex === -1 || labelIndex === -1 || amountIndex === -1) {
    throw new Error('CSV headers must include category, label, and amount.');
  }

  const nextState = categories.reduce((acc, category) => {
    acc[category.id] = [];
    return acc;
  }, {});

  for (let i = 1; i < lines.length; i += 1) {
    const rowNumber = i + 1;
    const cells = parseCsvLine(lines[i]);
    if (!cells.length || cells.every((cell) => !cell.trim())) {
      continue;
    }

    const categoryIdRaw = (cells[categoryIndex] || '').trim();
    const categoryId = categoryIdRaw.toLowerCase();
    const label = (cells[labelIndex] || '').trim();
    const amountValue = parseFloat(cells[amountIndex]);

    if (!categoryId || !(categoryId in nextState)) {
      throw new Error(`Unknown category "${categoryIdRaw}" on row ${rowNumber}.`);
    }

    if (!label) {
      throw new Error(`Missing label on row ${rowNumber}.`);
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      throw new Error(`Invalid amount on row ${rowNumber}.`);
    }

    const sanitizedAmount = Math.round(amountValue * 100) / 100;
    nextState[categoryId].push(createItem(label, sanitizedAmount));
  }

  categories.forEach((category) => {
    state[category.id] = nextState[category.id];
    const shouldOpen =
      state[category.id].length > 0 || category.id === 'income';
    openState.set(category.id, shouldOpen);
  });

  activeEdit = null;
  persistState();
  renderCategories();
  updateSummary();
}

function handleCsvDownload() {
  try {
    const csvText = buildCsvText();
    const filename = `budget-${new Date().toISOString().split('T')[0]}.csv`;
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV download failed', error);
    alert('Unable to download CSV right now.');
  }
}

function handleImportButtonClick() {
  if (importCsvInput) {
    importCsvInput.click();
  }
}

function handleImportInputChange(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const text = typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : '';
      importBudgetFromCsv(text);
      alert('Budget imported successfully.');
      closeSettingsModal();
    } catch (error) {
      console.error('CSV import failed', error);
      alert(error instanceof Error ? error.message : 'Unable to import CSV.');
    } finally {
      if (importCsvInput) {
        importCsvInput.value = '';
      }
    }
  };
  reader.onerror = () => {
    alert('Unable to read the selected file.');
    if (importCsvInput) {
      importCsvInput.value = '';
    }
  };
  reader.readAsText(file);
}

function handleKeydown(event) {
  if (event.key !== 'Escape') return;
  if (!settingsModal || settingsModal.classList.contains('hidden')) return;
  closeSettingsModal();
}

function getCategoryTotal(id) {
  return state[id].reduce((sum, item) => sum + item.amount, 0);
}

function getTotals() {
  const breakdown = {};
  categories.forEach((category) => {
    breakdown[category.id] = getCategoryTotal(category.id);
  });
  const incomeTotal = breakdown.income || 0;
  const allocated =
    (breakdown.fundamental || 0) +
    (breakdown.future || 0) +
    (breakdown.fun || 0);
  const remaining = incomeTotal - allocated;

  return { breakdown, incomeTotal, allocated, remaining };
}

function renderCategories() {
  categoriesContainer.innerHTML = categories
    .map((category) => {
      const total = getCategoryTotal(category.id);
      const items = state[category.id];
      const isOpen = openState.has(category.id)
        ? openState.get(category.id)
        : category.id === 'income';

      const listMarkup = items.length
        ? items
            .map((item) => {
              const isEditing =
                activeEdit &&
                activeEdit.categoryId === category.id &&
                activeEdit.itemId === item.id;

              if (isEditing) {
                return `
                  <li class="rounded-sm border border-white/5 bg-slate-950/50 px-4 py-4 text-sm" data-item-id="${item.id}">
                    <form data-edit-category="${category.id}" data-item-id="${item.id}" class="grid grid-cols-1 gap-3">
                      <label class="flex flex-col gap-1 text-[0.6rem] uppercase text-slate-400">
                        Label
                        <input
                          type="text"
                          name="label"
                          value="${escapeHtml(item.name)}"
                          required
                          class="rounded-sm border border-white/10 bg-slate-950/40 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                        />
                      </label>
                      <label class="flex flex-col gap-1 text-[0.6rem] uppercase text-slate-400">
                        Amount
                        <input
                          type="number"
                          name="amount"
                          inputmode="decimal"
                          min="0"
                          step="0.01"
                          value="${item.amount.toFixed(2)}"
                          required
                          class="rounded-sm border border-white/10 bg-slate-950/40 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                        />
                      </label>
                      <div class="flex items-center gap-3" style="justify-content:flex-end;">
                        <button
                          type="submit"
                          class="rounded-sm bg-emerald-400/90 px-5 py-3 text-xs font-semibold uppercase text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">
                          Save
                        </button>
                        <button
                          type="button"
                          data-action="cancel-edit"
                          data-category="${category.id}"
                          data-item-id="${item.id}"
                          class="rounded-sm border border-white/10 bg-slate-950/40 px-5 py-3 text-xs font-semibold uppercase text-slate-200 focus:outline-none">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </li>
                `;
              }

              return `
                <li class="rounded-sm border border-white/5 bg-slate-950/50 px-4 py-3 text-sm" data-item-id="${item.id}">
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-slate-200">${escapeHtml(item.name)}</span>
                      <span class="font-medium">${formatCurrency(item.amount)}</span>
                    </div>
                    <div class="flex items-center gap-3" style="justify-content:flex-end;">
                      <button
                        type="button"
                        data-action="edit"
                        data-category="${category.id}"
                        data-item-id="${item.id}"
                        class="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs text-slate-200">
                        Edit
                      </button>
                      <button
                        type="button"
                        data-action="delete"
                        data-category="${category.id}"
                        data-item-id="${item.id}"
                        class="rounded-full border border-white/10 bg-rose-500/10 px-3 py-1 text-xs text-rose-200">
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              `;
            })
            .join('')
        : `<li class="rounded-sm border border-dashed border-slate-800/60 px-4 py-4 text-center text-xs text-slate-500">No items added yet.</li>`;

      return `
        <details data-category="${category.id}" data-panel-id="${category.id}" class="group rounded-3xl border border-white/5 bg-slate-900/60 shadow-xl shadow-black/30" ${
          isOpen ? 'open' : ''
        }>
          <summary data-panel-id="${category.id}" class="flex cursor-pointer select-none items-center justify-between gap-3 px-4 py-4 focus:outline-none">
            <div>
              <p class="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">${category.title}</p>
              <p class="text-2xl font-semibold">${formatCurrency(total)}</p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-500">${category.hint}</p>
              <span class="inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold  ${category.badgeClass}">
                ${items.length} item${items.length === 1 ? '' : 's'}
              </span>
            </div>
          </summary>
          <div class="space-y-4 border-top border-white/5 bg-slate-950/30 px-4 py-5">
            <ul class="space-y-3">
              ${listMarkup}
            </ul>
            <form data-category="${category.id}" class="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <label class="flex flex-col gap-1 text-[0.6rem] uppercase  text-slate-400">
                Label
                <input
                  type="text"
                  name="label"
                  placeholder="Name"
                  required
                  class="rounded-sm border border-white/10 bg-slate-950/40 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <label class="flex flex-col gap-1 text-[0.6rem] uppercase text-slate-400">
                Amount
                <input
                  type="number"
                  name="amount"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                  class="rounded-sm border border-white/10 bg-slate-950/40 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                class="self-end rounded-sm bg-emerald-400/90 px-5 py-3 text-xs font-semibold uppercase text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200">
                Add 
              </button>
            </form>
          </div>
        </details>
      `;
    })
    .join('');
}

function updateSummary() {
  const { incomeTotal, allocated, remaining } = getTotals();

  summaryEls.income.textContent = formatCurrency(incomeTotal);
  summaryEls.allocated.textContent = formatCurrency(allocated);
  summaryEls.remaining.textContent = formatCurrency(remaining);

  summaryEls.remaining.classList.remove('text-emerald-300', 'text-rose-300');
  summaryEls.remaining.classList.add(
    remaining < 0 ? 'text-rose-300' : 'text-emerald-300'
  );

  budgetStatusEls.card.classList.remove(
    'border-emerald-400/40',
    'border-rose-400/40'
  );

  if (!incomeTotal && !allocated) {
    budgetStatusEls.label.textContent = 'Welcome';
    budgetStatusEls.amount.textContent = '$0.00';
    budgetStatusEls.detail.textContent =
      'Start by entering your monthly net income.';
  } else if (remaining < 0) {
    budgetStatusEls.label.textContent = 'Over Allocated';
    budgetStatusEls.amount.textContent = formatCurrency(Math.abs(remaining));
    budgetStatusEls.detail.textContent =
      'Trim this amount to get back on track.';
    budgetStatusEls.card.classList.add('border-rose-400/40');
  } else {
    budgetStatusEls.label.textContent = 'On Track';
    budgetStatusEls.amount.textContent = formatCurrency(remaining);
    budgetStatusEls.detail.textContent =
      'Available to assign without breaking the budget.';
    budgetStatusEls.card.classList.add('border-emerald-400/40');
  }
}

function handleEntrySubmit(event) {
  if (!event.target.matches('form[data-category]')) return;

  event.preventDefault();
  const form = event.target;
  const categoryId = form.dataset.category;
  const labelField = form.elements.label;
  const amountField = form.elements.amount;

  const label = labelField.value.trim();
  const amount = parseFloat(amountField.value);

  if (!label || !Number.isFinite(amount) || amount <= 0) {
    amountField.focus();
    return;
  }

  const sanitizedAmount = Math.round(amount * 100) / 100;
  state[categoryId].push(createItem(label, sanitizedAmount));
  openState.set(categoryId, true);

  form.reset();
  activeEdit = null;
  persistState();
  renderCategories();
  updateSummary();
}

function handleEditSubmit(event) {
  if (!event.target.matches('form[data-edit-category]')) return;

  event.preventDefault();
  const form = event.target;
  const categoryId = form.dataset.editCategory;
  const itemId = form.dataset.itemId;

  if (!categoryId || !itemId) return;

  const labelField = form.elements.label;
  const amountField = form.elements.amount;
  const label = labelField.value.trim();
  const amount = parseFloat(amountField.value);

  if (!label || !Number.isFinite(amount) || amount <= 0) {
    amountField.focus();
    return;
  }

  const bucket = state[categoryId];
  if (!Array.isArray(bucket)) return;

  const targetIndex = bucket.findIndex((entry) => entry.id === itemId);
  if (targetIndex === -1) return;

  const sanitizedAmount = Math.round(amount * 100) / 100;
  bucket[targetIndex] = {
    ...bucket[targetIndex],
    name: label,
    amount: sanitizedAmount
  };

  activeEdit = null;
  persistState();
  renderCategories();
  updateSummary();
}

function handleActionClick(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const categoryId = button.dataset.category;
  const itemId = button.dataset.itemId;

  if (action === 'delete') {
    if (!categoryId || !itemId) return;
    const bucket = state[categoryId];
    if (!Array.isArray(bucket)) return;

    const nextItems = bucket.filter((entry) => entry.id !== itemId);
    if (nextItems.length === bucket.length) return;

    state[categoryId] = nextItems;
    if (activeEdit && activeEdit.itemId === itemId) {
      activeEdit = null;
    }

    persistState();
    renderCategories();
    updateSummary();
    return;
  }

  if (action === 'edit') {
    if (!categoryId || !itemId) return;
    activeEdit = { categoryId, itemId };
    openState.set(categoryId, true);
    renderCategories();
    return;
  }

  if (action === 'cancel-edit') {
    activeEdit = null;
    renderCategories();
  }
}

function handlePanelClick(event) {
  const summary = event.target.closest('summary[data-panel-id]');
  if (!summary || !categoriesContainer.contains(summary)) return;
  const details = summary.closest('details[data-category]');
  if (!details) return;
  const categoryId = summary.dataset.panelId;
  if (!categoryId) return;

  // Wait for the browser to toggle the <details> element so we get the new state.
  requestAnimationFrame(() => {
    const isOpen = details.open;
    openState.set(categoryId, isOpen);
    console.log(`[Panel] ${categoryId} is now ${isOpen ? 'open' : 'closed'}`);
    persistState();
  });
}

categoriesContainer.addEventListener('submit', handleEntrySubmit);
categoriesContainer.addEventListener('submit', handleEditSubmit);
categoriesContainer.addEventListener('click', handleActionClick);
categoriesContainer.addEventListener('click', handlePanelClick);

if (settingsButton) {
  settingsButton.addEventListener('click', openSettingsModal);
}

settingsCloseEls.forEach((element) =>
  element.addEventListener('click', closeSettingsModal)
);

if (settingsModal) {
  settingsModal.addEventListener('click', (event) => {
    if (event.target === settingsModal && !settingsModal.classList.contains('hidden')) {
      closeSettingsModal();
    }
  });
}

if (downloadCsvButton) {
  downloadCsvButton.addEventListener('click', handleCsvDownload);
}

if (importCsvButton) {
  importCsvButton.addEventListener('click', handleImportButtonClick);
}

if (importCsvInput) {
  importCsvInput.addEventListener('change', handleImportInputChange);
}

document.addEventListener('keydown', handleKeydown);

hydrateState();
renderCategories();
updateSummary();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      console.info('Service worker registration skipped.');
    });
  });
}
