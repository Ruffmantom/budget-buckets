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
let themePreference = 'light';

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
const themeToggleButton = document.getElementById('themeToggleButton');
const themeToggleLabel = document.getElementById('themeToggleLabel');
const themeToggleTrack = document.getElementById('themeToggleTrack');
const themeToggleKnob = document.querySelector('[data-theme-toggle-knob]');

let dragStylesInjected = false;
const sortState = new Map();

applyTheme(themePreference);
injectDragStyles();

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

function isCoarsePointer() {
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(pointer: coarse)').matches;
}

function sortCategoryItems(categoryId, direction) {
  const bucket = state[categoryId];
  if (!Array.isArray(bucket) || bucket.length <= 1) return false;

  const decorated = bucket.map((item, index) => ({ item, index }));
  decorated.sort((a, b) => {
    const diff =
      direction === 'asc'
        ? a.item.amount - b.item.amount
        : b.item.amount - a.item.amount;
    if (diff !== 0) return diff;
    return a.index - b.index;
  });

  const next = decorated.map(({ item }) => item);
  const changed = next.some((entry, idx) => entry !== bucket[idx]);
  if (changed) {
    state[categoryId] = next;
  }
  return changed;
}

function applySortIfNeeded(categoryId) {
  const dir = sortState.get(categoryId);
  if (dir === 'asc' || dir === 'desc') {
    return sortCategoryItems(categoryId, dir);
  }
  return false;
}

function persistState() {
  if (typeof localStorage === 'undefined') return;
  try {
    const buckets = categories.reduce((acc, category) => {
      acc[category.id] = state[category.id];
      return acc;
    }, {});
    const sortSnapshot = {};
    categories.forEach((category) => {
      const dir = sortState.get(category.id);
      if (dir === 'asc' || dir === 'desc') {
        sortSnapshot[category.id] = dir;
      }
    });
    const openSnapshot = {};
    categories.forEach((category) => {
      const fallback = category.id === 'income';
      openSnapshot[category.id] = openState.has(category.id)
        ? openState.get(category.id)
        : fallback;
    });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          buckets,
          open: openSnapshot,
          sort: sortSnapshot,
          theme: themePreference
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
    const sortSnapshot =
      hasWrapper && parsed.sort && typeof parsed.sort === 'object'
        ? parsed.sort
        : null;
    const storedTheme =
      hasWrapper && typeof parsed.theme === 'string' ? parsed.theme : null;

    let changed = !hasWrapper || !openSnapshot || !storedTheme;

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
        }
      });
    }

    sortState.clear();
    categories.forEach((category) => {
      const dir = sortSnapshot?.[category.id];
      if (dir === 'asc' || dir === 'desc') {
        sortState.set(category.id, dir);
      }
    });

    categories.forEach((category) => {
      if (applySortIfNeeded(category.id)) {
        changed = true;
      }
    });

    const normalizedTheme = storedTheme
      ? storedTheme.toLowerCase() === 'light'
        ? 'light'
        : 'dark'
      : 'light';
    themePreference = normalizedTheme;
    applyTheme(themePreference);

    if (changed) {
      persistState();
    }
  } catch (error) {
    console.warn('Unable to load saved budget data', error);
  }
}

function applyTheme(nextTheme) {
  themePreference = nextTheme === 'light' ? 'light' : 'dark';
  const root = document.documentElement;
  root.dataset.theme = themePreference;
  root.classList.toggle('dark', themePreference === 'dark');
  updateThemeToggleUI();
}

function updateThemeToggleUI() {
  if (!themeToggleButton) return;
  const isLight = themePreference === 'light';
  const label = isLight ? 'Light mode' : 'Dark mode';
  if (themeToggleLabel) {
    themeToggleLabel.textContent = label;
  }
  if (themeToggleTrack) {
    themeToggleTrack.style.backgroundColor = isLight
      ? 'rgba(16, 185, 129, 0.6)'
      : 'rgba(15, 23, 42, 0.7)';
  }
  if (themeToggleKnob) {
    themeToggleKnob.style.transform = isLight ? 'translateX(1.75rem)' : 'translateX(0)';
    themeToggleKnob.style.backgroundColor = isLight ? '#0f172a' : '#f8fafc';
  }
  themeToggleButton.setAttribute('aria-pressed', isLight ? 'false' : 'true');
}

function toggleThemePreference() {
  const nextTheme = themePreference === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  persistState();
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
    applySortIfNeeded(category.id);
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
      const sortDirection = sortState.get(category.id);
      const isOpen = openState.has(category.id)
        ? openState.get(category.id)
        : category.id === 'income';

      const listMarkup = items.length
        ? items
            .map((item, index, array) => {
              const isEditing =
                activeEdit &&
                activeEdit.categoryId === category.id &&
                activeEdit.itemId === item.id;
              const isFirst = index === 0;
              const isLast = index === array.length - 1;

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
                <li
                  class="flex gap-2"
                  data-item-id="${item.id}"
                >

                <div class="mobile-move-controls flex flex-col gap-3 justify-center">
                          ${
                            isFirst
                              ? ''
                              : `
                                <button
                                  type="button"
                                  class="flex items-center justify-center h-7 w-7 rounded-sm border border-white/10 bg-slate-900/60 text-slate-400 transition-colors hover:border-emerald-400/60 hover:text-emerald-200"
                                  data-move="up"
                                  aria-label="Move item up"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor" aria-hidden="true">
                                    <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/>
                                  </svg>
                                </button>
                              `
                          }
                          ${
                            isLast
                              ? ''
                              : `
                                <button
                                  type="button"
                                  class="flex items-center justify-center h-7 w-7 rounded-sm border border-white/10 bg-slate-900/60 text-slate-400 transition-colors hover:border-emerald-400/60 hover:text-emerald-200"
                                  data-move="down"
                                  aria-label="Move item down"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor" aria-hidden="true">
                                    <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/>
                                  </svg>
                                </button>
                              `
                          }
                        </div>


                  <div class="flex grow flex-col gap-3 rounded-sm border border-white/5 bg-slate-950/50 px-4 py-3 text-sm">
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          class="drag-handle flex items-center justify-center h-8 w-8 rounded-sm border border-white/10 bg-slate-900/60 text-slate-400 transition-colors hover:border-emerald-400/60 hover:text-emerald-200"
                          aria-label="Reorder item"
                          draggable="true"
                          data-drag-handle="true"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor" aria-hidden="true">
                            <path d="M160-360v-80h640v80H160Zm0-160v-80h640v80H160Z"/>
                          </svg>
                        </button>
                        
                        <span class="text-slate-200 truncate">${escapeHtml(item.name)}</span>
                      </div>
                      <span class="font-medium">${formatCurrency(item.amount)}</span>
                    </div>
                    <div class="w-full flex justify-between items-center gap-3">
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
        <details data-category="${category.id}" data-panel-id="${category.id}" class="group rounded-md border overflow-hidden border-white/5 bg-slate-900/60 shadow-sm shadow-black/15" ${
          isOpen ? 'open' : ''
        }>
          <summary data-panel-id="${category.id}" class="flex cursor-pointer overflow-hidden select-none items-center justify-between gap-3 px-4 py-4 focus:outline-none">
            <div>
              <p class="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">${category.title}</p>
              <p class="text-2xl font-semibold">${formatCurrency(total)}</p>
            </div>
            <div class="text-right flex items-center gap-2">
             
              <div class="text-right">
                <p class="text-xs text-slate-500">${category.hint}</p>
                <span class="inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold  ${category.badgeClass}">
                  ${items.length} item${items.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </summary>
          <div class="space-y-4 border-top border-white/5 bg-slate-950/30 px-4 py-5">
          <div class='item-list-tool-bar flex gap-3 py-1 justify-end'>
          <div class="tool-option flex gap-2 text-xs items-center">
          <p>Sort ${sortDirection === '' ? '':sortDirection === 'asc'? 'Low to high' : 'High to low'}</p>
          
           <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 bg-slate-950/40 text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                aria-label="Sort items by amount"
                data-sort="${category.id}"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="18"
                  viewBox="0 -960 960 960"
                  width="18"
                  fill="currentColor"
                  style="transform: rotate(${sortDirection === 'asc' ? '180deg' : '0deg'}); transition: transform 150ms ease;"
                >
                  <path d="M160-240q-17 0-28.5-11.5T120-280q0-17 11.5-28.5T160-320h160q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240H160Zm0-200q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520h400q17 0 28.5 11.5T600-480q0 17-11.5 28.5T560-440H160Zm0-200q-17 0-28.5-11.5T120-680q0-17 11.5-28.5T160-720h640q17 0 28.5 11.5T840-680q0 17-11.5 28.5T800-640H160Z"/>
                </svg>
              </button>
              </div>
          </div>
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
  applySortIfNeeded(categoryId);

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
  applySortIfNeeded(categoryId);

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
    applySortIfNeeded(categoryId);

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

function handleSortClick(event) {
  const button = event.target.closest('button[data-sort]');
  if (!button) return;
  const categoryId = button.dataset.sort;
  if (!categoryId) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const nextDirection = sortState.get(categoryId) === 'asc' ? 'desc' : 'asc';
  sortState.set(categoryId, nextDirection);
  sortCategoryItems(categoryId, nextDirection);
  openState.set(categoryId, true);

  persistState();
  renderCategories();
  updateSummary();
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
    // console.log(`[Panel] ${categoryId} is now ${isOpen ? 'open' : 'closed'}`);
    persistState();
  });
}

let dragContext = null;
let pointerDragContext = null;

function injectDragStyles() {
  if (dragStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    .dragging { opacity: 0.85; }
    .drag-over-before { outline: 1px dashed rgba(94, 234, 212, 0.6); outline-offset: -4px; }
    .drag-over-after { outline: 1px dashed rgba(94, 234, 212, 0.6); outline-offset: -4px; }
    .drag-handle { cursor: grab; }
    .drag-handle:active,
    .dragging .drag-handle { cursor: grabbing; }
    .drag-handle svg { pointer-events: none; }
    .mobile-move-controls { display: none; gap: 0.25rem; }
    @media (pointer: coarse) {
      .drag-handle[data-drag-handle="true"] { display: none; }
      .mobile-move-controls { display: inline-flex; }
      .mobile-move-controls { gap: 0.2rem; }
      .mobile-move-controls .drag-handle { width: 2.5rem; height: 2.5rem; padding: 0; }
      .mobile-move-controls svg { width: 16px; height: 16px; }
    }
    @media (pointer: fine) {
      .mobile-move-controls { display: none; }
    }
  `;
  document.head.appendChild(style);
  dragStylesInjected = true;
}

function getCategoryForElement(element) {
  const host = element.closest('details[data-category]');
  return host ? host.dataset.category : null;
}

function clearDragIndicators() {
  categoriesContainer
    .querySelectorAll('.drag-over-before, .drag-over-after, .dragging')
    .forEach((el) => {
      el.classList.remove('drag-over-before', 'drag-over-after', 'dragging');
    });
}

function handleDragStart(event) {
  if (isCoarsePointer()) return;
  const handle = event.target.closest('[data-drag-handle]');
  if (!handle) return;
  const itemEl = handle.closest('li[data-item-id]');
  if (!itemEl) return;

  const categoryId = getCategoryForElement(itemEl);
  const itemId = itemEl.dataset.itemId;
  if (!categoryId || !itemId) return;

  dragContext = { categoryId, itemId };
  itemEl.classList.add('dragging');

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', itemId);
  }
}

function handleDragOver(event) {
  if (isCoarsePointer()) return;
  if (!dragContext) return;
  const itemEl = event.target.closest('li[data-item-id]');
  if (!itemEl) return;
  const categoryId = getCategoryForElement(itemEl);
  if (categoryId !== dragContext.categoryId) return;

  event.preventDefault();
  const rect = itemEl.getBoundingClientRect();
  const isAfter = event.clientY > rect.top + rect.height / 2;

  itemEl.classList.toggle('drag-over-after', isAfter);
  itemEl.classList.toggle('drag-over-before', !isAfter);
}

function handleDragLeave(event) {
  if (isCoarsePointer()) return;
  const itemEl = event.target.closest('li[data-item-id]');
  if (!itemEl) return;
  itemEl.classList.remove('drag-over-before', 'drag-over-after');
}

function handleDrop(event) {
  if (isCoarsePointer()) return;
  if (!dragContext) return;
  const itemEl = event.target.closest('li[data-item-id]');
  if (!itemEl) return;

  const categoryId = getCategoryForElement(itemEl);
  if (categoryId !== dragContext.categoryId) return;

  const targetItemId = itemEl.dataset.itemId;
  const bucket = state[categoryId];
  const fromIndex = bucket.findIndex((entry) => entry.id === dragContext.itemId);
  const toIndex = bucket.findIndex((entry) => entry.id === targetItemId);

  if (fromIndex === -1 || toIndex === -1) {
    dragContext = null;
    clearDragIndicators();
    return;
  }

  event.preventDefault();
  const rect = itemEl.getBoundingClientRect();
  const isAfter = event.clientY > rect.top + rect.height / 2;
  let destinationIndex = toIndex + (isAfter ? 1 : 0);

  if (fromIndex < destinationIndex) {
    destinationIndex -= 1;
  }

  if (destinationIndex !== fromIndex) {
    const [moved] = bucket.splice(fromIndex, 1);
    bucket.splice(destinationIndex, 0, moved);
    sortState.delete(categoryId);

    persistState();
    renderCategories();
    updateSummary();
  }

  dragContext = null;
  clearDragIndicators();
}

function handleDragEnd() {
  if (isCoarsePointer()) return;
  dragContext = null;
  clearDragIndicators();
}

categoriesContainer.addEventListener('submit', handleEntrySubmit);
categoriesContainer.addEventListener('submit', handleEditSubmit);
categoriesContainer.addEventListener('click', handleSortClick);
categoriesContainer.addEventListener('click', handleActionClick);
categoriesContainer.addEventListener('click', handlePanelClick);
categoriesContainer.addEventListener('click', handleMoveClick);
categoriesContainer.addEventListener('dragstart', handleDragStart);
categoriesContainer.addEventListener('dragover', handleDragOver);
categoriesContainer.addEventListener('dragleave', handleDragLeave);
categoriesContainer.addEventListener('drop', handleDrop);
categoriesContainer.addEventListener('dragend', handleDragEnd);

function isInteractiveElement(element) {
  return Boolean(
    element.closest('button, input, textarea, select, option, a, [contenteditable]')
  );
}

function clearPointerIndicators(categoryId) {
  const selector = categoryId
    ? `details[data-category="${categoryId}"] li[data-item-id]`
    : 'li[data-item-id]';
  categoriesContainer.querySelectorAll(selector).forEach((el) => {
    el.classList.remove('drag-over-before', 'drag-over-after');
  });
}

function handlePointerDown(event) {
  if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
  if (isCoarsePointer()) return;
  const handle = event.target.closest('[data-drag-handle]');
  if (!handle) return;
  const itemEl = handle.closest('li[data-item-id]');
  if (!itemEl || isInteractiveElement(event.target)) return;
  const categoryId = getCategoryForElement(itemEl);
  const itemId = itemEl.dataset.itemId;
  if (!categoryId || !itemId) return;

  const bucket = state[categoryId];
  const startIndex = bucket.findIndex((entry) => entry.id === itemId);
  if (startIndex === -1) return;

  pointerDragContext = {
    pointerId: event.pointerId,
    categoryId,
    itemId,
    startIndex,
    destinationIndex: startIndex
  };

  if (itemEl.style.touchAction) {
    itemEl.dataset.restoreTouchAction = itemEl.style.touchAction;
  }
  itemEl.style.touchAction = 'none';
  itemEl.classList.add('dragging');
  itemEl.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function computeDestinationIndex(clientY, categoryId) {
  const items = Array.from(
    categoriesContainer.querySelectorAll(
      `details[data-category="${categoryId}"] li[data-item-id]`
    )
  );
  if (!items.length) return { destinationIndex: 0, indicator: null, isAfter: false };

  let destinationIndex = items.length;
  let indicator = items[items.length - 1];
  let isAfter = true;

  for (let i = 0; i < items.length; i += 1) {
    const rect = items[i].getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (clientY < midpoint) {
      destinationIndex = i;
      indicator = items[i];
      isAfter = false;
      break;
    }
  }

  if (destinationIndex === items.length) {
    isAfter = true;
  }

  return { destinationIndex, indicator, isAfter };
}

function handlePointerMove(event) {
  if (!pointerDragContext || event.pointerId !== pointerDragContext.pointerId) return;
  event.preventDefault();
  const { categoryId } = pointerDragContext;
  const { destinationIndex, indicator, isAfter } = computeDestinationIndex(
    event.clientY,
    categoryId
  );
  pointerDragContext.destinationIndex = destinationIndex;

  clearPointerIndicators(categoryId);
  if (indicator) {
    indicator.classList.add(isAfter ? 'drag-over-after' : 'drag-over-before');
  }
}

function finalizePointerReorder(applyMove = true) {
  if (!pointerDragContext) return;
  const { categoryId, itemId, destinationIndex } = pointerDragContext;
  const bucket = state[categoryId];
  const fromIndex = bucket.findIndex((entry) => entry.id === itemId);
  const draggedEl = categoriesContainer.querySelector(
    `details[data-category="${categoryId}"] li[data-item-id="${itemId}"]`
  );

  if (
    applyMove &&
    fromIndex !== -1 &&
    destinationIndex !== fromIndex &&
    destinationIndex !== fromIndex + 1
  ) {
    let targetIndex = destinationIndex;
    const [moved] = bucket.splice(fromIndex, 1);
    if (targetIndex > fromIndex) {
      targetIndex -= 1;
    }
    bucket.splice(Math.max(0, Math.min(targetIndex, bucket.length)), 0, moved);
    sortState.delete(categoryId);
    persistState();
    renderCategories();
    updateSummary();
  }

  clearPointerIndicators(categoryId);
  if (draggedEl) {
    draggedEl.classList.remove('dragging');
    if (draggedEl.dataset.restoreTouchAction) {
      draggedEl.style.touchAction = draggedEl.dataset.restoreTouchAction;
      delete draggedEl.dataset.restoreTouchAction;
    } else {
      draggedEl.style.touchAction = '';
    }
  }
  pointerDragContext = null;
}

function handlePointerUp(event) {
  if (isCoarsePointer()) return;
  if (!pointerDragContext || event.pointerId !== pointerDragContext.pointerId) return;
  finalizePointerReorder();
}

function handlePointerCancel(event) {
  if (isCoarsePointer()) return;
  if (!pointerDragContext || event.pointerId !== pointerDragContext.pointerId) return;
  finalizePointerReorder(false);
}

function moveItem(categoryId, itemId, direction) {
  const bucket = state[categoryId];
  if (!Array.isArray(bucket)) return;
  const currentIndex = bucket.findIndex((entry) => entry.id === itemId);
  if (currentIndex === -1) return;
  const delta = direction === 'up' ? -1 : 1;
  const targetIndex = currentIndex + delta;
  if (targetIndex < 0 || targetIndex >= bucket.length) return;
  const [moved] = bucket.splice(currentIndex, 1);
  bucket.splice(targetIndex, 0, moved);
  sortState.delete(categoryId);
  persistState();
  renderCategories();
  updateSummary();
}

function handleMoveClick(event) {
  const button = event.target.closest('button[data-move]');
  if (!button) return;
  const direction = button.dataset.move;
  if (direction !== 'up' && direction !== 'down') return;
  const itemEl = button.closest('li[data-item-id]');
  if (!itemEl) return;
  const categoryId = getCategoryForElement(button);
  const itemId = itemEl.dataset.itemId;
  if (!categoryId || !itemId) return;
  event.preventDefault();
  moveItem(categoryId, itemId, direction);
}

categoriesContainer.addEventListener('pointerdown', handlePointerDown);
categoriesContainer.addEventListener('pointermove', handlePointerMove);
categoriesContainer.addEventListener('pointerup', handlePointerUp);
categoriesContainer.addEventListener('pointercancel', handlePointerCancel);

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

if (themeToggleButton) {
  themeToggleButton.addEventListener('click', toggleThemePreference);
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
