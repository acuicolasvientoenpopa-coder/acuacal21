const OLD_PREFIX = "aquacalc_";
const NEW_PREFIX = "acuical_";

if (typeof localStorage !== "undefined") {
  let migrated = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(OLD_PREFIX)) {
      const newKey = NEW_PREFIX + key.slice(OLD_PREFIX.length);
      if (localStorage.getItem(newKey) === null) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          localStorage.setItem(newKey, val);
          migrated++;
        }
      }
      localStorage.removeItem(key);
    }
  }
  if (migrated > 0) {
    console.log(`[acuical] Migradas ${migrated} claves de localStorage ${OLD_PREFIX} → ${NEW_PREFIX}`);
  }
}
