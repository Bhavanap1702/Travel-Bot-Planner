// src/services/cache.js
const poiCache = new Map();

export function getCachedPOI(query) {
  return poiCache.get(query.toLowerCase());
}

export function setCachedPOI(query, results) {
  poiCache.set(query.toLowerCase(), results);
}
