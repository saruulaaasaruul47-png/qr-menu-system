const store = new Map();

export const cache = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },
  set(key, value, ttlMs = 60_000) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  },
  del(key) {
    store.delete(key);
  },
  clearByPrefix(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) store.delete(key);
    }
  },
};
