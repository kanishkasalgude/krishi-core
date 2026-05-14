const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// ── BUG-08: Simple async write-lock to prevent concurrent write race conditions ──
const writeLocks = {};
async function withLock(filename, fn) {
  while (writeLocks[filename]) {
    await new Promise((r) => setTimeout(r, 10));
  }
  writeLocks[filename] = true;
  try {
    return await fn();
  } finally {
    writeLocks[filename] = false;
  }
}

// ── BUG-04: Safe JSON parse — returns [] on missing/corrupted file instead of crashing ──
async function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw || raw.trim() === '') return [];
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn(`[STORAGE] File not found: ${filename} — returning empty array`);
      return [];
    }
    console.error(`[STORAGE] Failed to parse ${filename}: ${err.message} — returning empty array`);
    return [];
  }
}

async function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function readCollection(filename) {
  const data = await readJSON(filename);
  return Array.isArray(data) ? data : [];
}

async function findById(filename, id) {
  const items = await readCollection(filename);
  return items.find(item => item.id === id) || null;
}

// ── BUG-08: addItem and updateItem use write-lock to prevent race conditions ──
async function addItem(filename, item) {
  return withLock(filename, async () => {
    const items = await readCollection(filename);
    items.push(item);
    await writeJSON(filename, items);
    return item;
  });
}

async function updateItem(filename, id, updates) {
  return withLock(filename, async () => {
    const items = await readCollection(filename);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    await writeJSON(filename, items);
    return items[index];
  });
}

async function deleteItem(filename, id) {
  const items = await readCollection(filename);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  const removed = items.splice(index, 1)[0];
  await writeJSON(filename, items);
  return removed;
}

async function query(filename, predicate) {
  const items = await readCollection(filename);
  return items.filter(predicate);
}

module.exports = {
  readJSON,
  writeJSON,
  readCollection,
  findById,
  addItem,
  updateItem,
  deleteItem,
  query,
};
