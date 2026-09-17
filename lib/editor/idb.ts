/** Minimal IndexedDB key/value store for pending image uploads (survives reloads). */

const DB_NAME = "apex-admin";
const STORE = "images";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const imageDb = {
  put: (key: string, blob: Blob) => run("readwrite", (store) => store.put(blob, key)),
  delete: (key: string) => run("readwrite", (store) => store.delete(key)),
  async entries(): Promise<[string, Blob][]> {
    const [keys, values] = await Promise.all([
      run("readonly", (store) => store.getAllKeys()),
      run("readonly", (store) => store.getAll()),
    ]);
    return keys.map((key, index) => [String(key), values[index] as Blob]);
  },
};
