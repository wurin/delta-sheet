const STORAGE_KEY = 'character-sheet';
const NOTES_STORAGE_KEY = 'character-sheet-notes';

const lockToggle = document.getElementById('lock-toggle');
const saveButton = document.getElementById('save-button');
const revertButton = document.getElementById('revert-button');
const fields = document.querySelectorAll('input, textarea');

let dirty = false;

function markDirty() {
  dirty = true;
  saveButton.classList.remove('hidden');
  revertButton.classList.remove('hidden');
}

function markClean() {
  dirty = false;
  saveButton.classList.add('hidden');
  revertButton.classList.add('hidden');
}

function isDataField(field) {
  return field.id && !field.closest('#edit-modal');
}

function loadFieldValues() {
  const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  fields.forEach((field) => {
    if (!isDataField(field)) return;
    const value = savedData[field.id];
    if (field.type === 'checkbox') {
      field.checked = value === true;
    } else {
      field.value = value === undefined ? '' : value;
    }
  });
}

function loadFieldNotes() {
  const savedNotes = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
  Object.keys(fieldNotes).forEach((key) => delete fieldNotes[key]);
  Object.assign(fieldNotes, savedNotes);
}

const fieldNotes = {};

loadFieldValues();
loadFieldNotes();

let locked = false;

lockToggle.addEventListener('click', () => {
  locked = !locked;
  fields.forEach((field) => {
    field.disabled = locked;
  });
  lockToggle.textContent = locked ? 'Unlock' : 'Lock';
});

const modal = document.getElementById('edit-modal');
const modalInput = document.getElementById('edit-modal-input');
const modalNotes = document.getElementById('edit-modal-notes');
const modalOk = document.getElementById('edit-modal-ok');
const modalCancel = document.getElementById('edit-modal-cancel');

let activeField = null;

function openModal(field) {
  activeField = field;
  modalInput.value = field.value;
  modalNotes.value = fieldNotes[field.id] || '';
  modal.classList.remove('hidden');
  modalInput.focus();
}

function closeModal() {
  modal.classList.add('hidden');
  activeField = null;
}

fields.forEach((field) => {
  if (!isDataField(field)) return;

  if (field.tagName === 'TEXTAREA') {
    field.addEventListener('input', markDirty);
  } else if (field.type === 'checkbox') {
    field.addEventListener('change', markDirty);
  } else if (field.type === 'text') {
    field.readOnly = true;
    field.addEventListener('click', () => openModal(field));
  }
});

modalOk.addEventListener('click', () => {
  if (activeField) {
    activeField.value = modalInput.value;
    fieldNotes[activeField.id] = modalNotes.value;
    markDirty();
  }
  closeModal();
});

modalCancel.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

saveButton.addEventListener('click', () => {
  const data = {};

  fields.forEach((field) => {
    if (!isDataField(field)) return;
    data[field.id] = field.type === 'checkbox' ? field.checked : field.value;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(fieldNotes));

  markClean();
});

revertButton.addEventListener('click', () => {
  const confirmed = window.confirm('Discard unsaved changes and restore the last saved data?');
  if (!confirmed) return;

  loadFieldValues();
  loadFieldNotes();
  markClean();
});

const exportButton = document.getElementById('export-button');
const importButton = document.getElementById('import-button');
const importInput = document.getElementById('import-input');

exportButton.addEventListener('click', () => {
  if (dirty) {
    const confirmed = window.confirm('You have unsaved changes. Export the last saved data anyway?');
    if (!confirmed) return;
  }

  const exportData = {
    data: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
    notes: JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}'),
  };

  const charName = (exportData.data['char-name'] || '').trim();
  const fileName = charName ? charName.replace(/\s+/g, '-') : 'character-sheet';
  const date = new Date().toISOString().slice(0, 10);

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}-${date}.json`;
  link.click();

  URL.revokeObjectURL(url);
});

importButton.addEventListener('click', () => {
  importInput.click();
});

importInput.addEventListener('change', () => {
  const file = importInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    const imported = JSON.parse(reader.result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported.data || {}));
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(imported.notes || {}));

    loadFieldValues();
    loadFieldNotes();
    markClean();

    window.alert('Character sheet imported successfully.');
  });
  reader.readAsText(file);

  importInput.value = '';
});

const clearButton = document.getElementById('clear-button');

clearButton.addEventListener('click', () => {
  const confirmed = window.confirm('Clear all data from the sheet and local storage? This cannot be undone.');
  if (!confirmed) return;

  fields.forEach((field) => {
    if (!isDataField(field)) return;
    if (field.type === 'checkbox') {
      field.checked = false;
    } else {
      field.value = '';
    }
  });

  Object.keys(fieldNotes).forEach((key) => delete fieldNotes[key]);

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NOTES_STORAGE_KEY);

  markClean();
});
