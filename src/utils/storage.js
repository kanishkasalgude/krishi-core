const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

async function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
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

async function addItem(filename, item) {
  const items = await readCollection(filename);
  items.push(item);
  await writeJSON(filename, items);
  return item;
}

async function updateItem(filename, id, updates) {
  const items = await readCollection(filename);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
  await writeJSON(filename, items);
  return items[index];
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
