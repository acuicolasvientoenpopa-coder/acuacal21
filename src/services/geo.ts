import { openDB, type IDBPDatabase } from "idb";

export interface PuntoGeo {
  lat: number;
  lng: number;
}

export interface EstanqueGeo {
  id: string;
  nombre: string;
  fincaId?: string;
  coordenadas: PuntoGeo[];
  profundidad?: number;
  volumenM3?: number;
  areaM2?: number;
  fechaCaptura: string;
  sincronizado: boolean;
  createdAt: string;
}

const DB_NAME = "acuacal_geo";
const DB_VERSION = 1;
const STORE = "estanques";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("sincronizado", "sincronizado");
          store.createIndex("fincaId", "fincaId");
          store.createIndex("fechaCaptura", "fechaCaptura");
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllEstanques(): Promise<EstanqueGeo[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function getEstanque(id: string): Promise<EstanqueGeo | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}

export async function saveEstanque(e: EstanqueGeo): Promise<void> {
  const db = await getDb();
  await db.put(STORE, e);
}

export async function removeEstanque(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

export async function getPendientes(): Promise<EstanqueGeo[]> {
  const db = await getDb();
  const tx = db.transaction(STORE, "readonly");
  const index = tx.store.index("sincronizado");
  return index.getAll(IDBKeyRange.only(false));
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDb();
  const e = await db.get(STORE, id);
  if (e) {
    e.sincronizado = true;
    await db.put(STORE, e);
  }
}

export async function getSyncCount(): Promise<number> {
  const pendientes = await getPendientes();
  return pendientes.length;
}
