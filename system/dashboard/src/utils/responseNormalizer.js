/**
 * TOON Format (Token-Optimized Object Notation)
 * Maps abbreviated keys to full property names
 */
const TOON_MAP = {
  nm: 'name',
  ds: 'description',
  c: 'content',
  p: 'path',
  t: 'type',
  d: 'isDir',
  ch: 'children',
  en: 'enabled',
  v: 'version',
  tl: 'title',
  cmd: 'command',
  a: 'action',
  s: 'success',
  er: 'error',
  ts: 'timestamp',
  ag: 'agent',
  dt: 'date',
  tok: 'tokens',
  ld: 'lead',
  ags: 'agents',
  ps: 'personas',
  sks: 'skills',
  als: 'aliases',
  plgs: 'plugins',
  instr: 'instructions',
  tb: 'tokenBudget',
  mdl: 'model'
};

/**
 * Normalize a complete response (handles arrays and objects)
 * @param {any} data - Data to normalize (can be array, object, or primitive)
 * @returns {any} Normalized data
 */
export const normalizeResponse = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => normalizeObject(item));
  }
  return normalizeObject(data);
};

/**
 * Normalize a single object by expanding TOON keys
 * @param {Object} obj - Object to normalize
 * @returns {Object} Normalized object with expanded keys
 */
export const normalizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => normalizeObject(item));
  }

  const normalized = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = TOON_MAP[key] || key;

    // Recursively normalize nested objects and arrays
    if (Array.isArray(value)) {
      normalized[fullKey] = value.map(item => normalizeObject(item));
    } else if (value && typeof value === 'object') {
      normalized[fullKey] = normalizeObject(value);
    } else {
      normalized[fullKey] = value;
    }
  }

  return normalized;
};

export default {
  TOON_MAP,
  normalizeResponse,
  normalizeObject
};
