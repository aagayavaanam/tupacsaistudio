import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
let sqlModule: any = null;
const DB_FILE_PATH = path.join(process.cwd(), 'app_data.db');
const DB_BAK_PATH = path.join(process.cwd(), 'app_data.db.bak');

const SQLITE_HEADER = 'SQLite format 3\0';

function isValidSqliteBuffer(buffer: Buffer | Uint8Array): boolean {
  if (!buffer || buffer.length < 100) return false;
  const header = Buffer.from(buffer.slice(0, 16)).toString('utf8');
  return header === SQLITE_HEADER;
}

function isBufferHealthy(buffer: Buffer | Uint8Array, SQL: any): boolean {
  if (!isValidSqliteBuffer(buffer)) return false;
  try {
    const testDb = new SQL.Database(buffer);
    const result = testDb.exec("PRAGMA quick_check;");
    testDb.close();
    if (result && result.length > 0 && result[0].values && result[0].values[0]) {
      return result[0].values[0][0] === 'ok';
    }
    return true;
  } catch {
    return false;
  }
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!sqlModule) {
    sqlModule = await initSqlJs();
  }
  const SQL = sqlModule;
  let loaded = false;

  // Clean up any stray temporary files from previous abrupt terminations
  try {
    const cwdFiles = fs.readdirSync(process.cwd());
    for (const f of cwdFiles) {
      if (f.startsWith('app_data.db.tmp')) {
        try {
          fs.unlinkSync(path.join(process.cwd(), f));
        } catch {}
      }
    }
  } catch {}

  // Attempt 1: Load primary DB_FILE_PATH
  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      if (isBufferHealthy(fileBuffer, SQL)) {
        const testDb = new SQL.Database(fileBuffer);
        testDb.exec("SELECT count(*) FROM sqlite_master");
        dbInstance = testDb;
        loaded = true;
      } else {
        console.warn('Primary DB file was corrupt/malformed. Isolating and attempting backup recovery...');
        try {
          const corruptPath = path.join(process.cwd(), `app_data.db.corrupted.${Date.now()}`);
          fs.renameSync(DB_FILE_PATH, corruptPath);
        } catch {}
      }
    } catch (err: any) {
      console.warn('Primary DB file was unreadable. Isolating and attempting backup recovery...', err?.message || err);
      try {
        const corruptPath = path.join(process.cwd(), `app_data.db.corrupted.${Date.now()}`);
        fs.renameSync(DB_FILE_PATH, corruptPath);
      } catch {}
    }
  }

  // Attempt 2: Auto-recover from backup DB_BAK_PATH if primary was corrupted
  if (!loaded && fs.existsSync(DB_BAK_PATH)) {
    try {
      const bakBuffer = fs.readFileSync(DB_BAK_PATH);
      if (isBufferHealthy(bakBuffer, SQL)) {
        const testDb = new SQL.Database(bakBuffer);
        testDb.exec("SELECT count(*) FROM sqlite_master");
        dbInstance = testDb;
        loaded = true;
        // Restore backup as primary
        try {
          fs.copyFileSync(DB_BAK_PATH, DB_FILE_PATH);
          console.log('✅ SQLite database successfully restored from backup (app_data.db.bak)');
        } catch {}
      } else {
        console.warn('Backup DB file was also corrupt/malformed. Isolating backup...');
        try {
          const corruptBakPath = path.join(process.cwd(), `app_data.db.bak.corrupted.${Date.now()}`);
          fs.renameSync(DB_BAK_PATH, corruptBakPath);
        } catch {}
      }
    } catch (err: any) {
      console.error('Backup DB file was unreadable:', err?.message || err);
      try {
        const corruptBakPath = path.join(process.cwd(), `app_data.db.bak.corrupted.${Date.now()}`);
        fs.renameSync(DB_BAK_PATH, corruptBakPath);
      } catch {}
    }
  }

  // Attempt 3: Create fresh in-memory database if no valid files exist
  if (!loaded || !dbInstance) {
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const corruptPath = path.join(process.cwd(), `app_data.db.corrupted.${Date.now()}`);
        fs.renameSync(DB_FILE_PATH, corruptPath);
      } catch {}
    }
    if (fs.existsSync(DB_BAK_PATH)) {
      try {
        const corruptBakPath = path.join(process.cwd(), `app_data.db.bak.corrupted.${Date.now()}`);
        fs.renameSync(DB_BAK_PATH, corruptBakPath);
      } catch {}
    }
    dbInstance = new SQL.Database();
  }

  // Create tables if they do not exist
  try {
    dbInstance.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_no TEXT UNIQUE,
      sb TEXT,
      erp TEXT,
      ins TEXT,
      name TEXT,
      care_of TEXT,
      door TEXT,
      street TEXT,
      village TEXT,
      aadhar_no TEXT,
      mobile TEXT,
      ration_card TEXT,
      namini TEXT,
      relation TEXT,
      mdcc TEXT,
      caste TEXT,
      gender TEXT,
      total_share TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS paduvada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_index INTEGER,
      rcl_number TEXT,
      rcl_date TEXT,
      sanctioned_amount TEXT,
      current_disb_no TEXT,
      resolution_no TEXT,
      resolution_date TEXT,
      a_class TEXT,
      name TEXT,
      care_of TEXT,
      sb TEXT,
      erp TEXT,
      ins TEXT,
      door TEXT,
      street TEXT,
      village TEXT,
      aadhar_no TEXT,
      mobile TEXT,
      ration_card TEXT,
      namini TEXT,
      relation TEXT,
      mdcc TEXT,
      caste TEXT,
      total_share TEXT,
      survey_no TEXT,
      acres TEXT,
      crop TEXT,
      seed TEXT,
      chemical_fertilizer TEXT,
      pesticide TEXT,
      plowing TEXT,
      harvesting TEXT,
      fertilizer_kind TEXT,
      organic_fertilizer TEXT,
      total_loan_amount TEXT,
      farmer_class TEXT,
      disability TEXT,
      mortgage_type TEXT,
      guarantee_type TEXT,
      passbook_fee TEXT,
      insurance TEXT,
      share_capital TEXT,
      prev_loan_no TEXT,
      prev_loan_date TEXT,
      prev_loan_amount TEXT,
      added_at TEXT
    );

    CREATE TABLE IF NOT EXISTS bank_sheet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_index INTEGER,
      date TEXT,
      member_payment REAL,
      disbursement_member_count REAL,
      disbursement_amount REAL,
      bank_payment REAL,
      bank_level_balance REAL,
      member_level_total REAL,
      total_member_count REAL,
      total_disbursed_amount REAL,
      net_measure REAL,
      bank_outstanding_status TEXT,
      col_f TEXT,
      col_g TEXT,
      col_h TEXT,
      col_i TEXT,
      col_j TEXT,
      added_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ah_paduvada (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_index INTEGER,
      financial_year TEXT,
      rcl_number TEXT,
      rcl_date TEXT,
      sanctioned_amount TEXT,
      officer_designation TEXT,
      officer_name TEXT,
      current_disb_no TEXT,
      resolution_no TEXT,
      resolution_date TEXT,
      a_class TEXT,
      name TEXT,
      care_of TEXT,
      sb TEXT,
      erp TEXT,
      ins TEXT,
      door TEXT,
      street TEXT,
      village TEXT,
      aadhar_no TEXT,
      mobile TEXT,
      ration_card TEXT,
      namini TEXT,
      relation TEXT,
      mdcc TEXT,
      caste TEXT,
      total_share TEXT,
      survey_no TEXT,
      acres TEXT,
      crop TEXT,
      livestock_type TEXT,
      livestock_count TEXT,
      seed TEXT,
      chemical_fertilizer TEXT,
      pesticide TEXT,
      plowing TEXT,
      harvesting TEXT,
      fertilizer_kind TEXT,
      organic_fertilizer TEXT,
      total_loan_amount TEXT,
      loan_amount TEXT,
      farmer_class TEXT,
      disability TEXT,
      mortgage_type TEXT,
      guarantee_type TEXT,
      passbook_fee TEXT,
      insurance TEXT,
      share_capital TEXT,
      prev_loan_no TEXT,
      prev_loan_date TEXT,
      prev_loan_amount TEXT,
      added_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ah_bank_sheet (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row_index INTEGER,
      date TEXT,
      member_payment REAL,
      disbursement_member_count REAL,
      disbursement_amount REAL,
      bank_payment REAL,
      bank_level_balance REAL,
      member_level_total REAL,
      total_member_count REAL,
      total_disbursed_amount REAL,
      net_measure REAL,
      bank_outstanding_status TEXT,
      col_f TEXT,
      col_g TEXT,
      col_h TEXT,
      col_i TEXT,
      col_j TEXT,
      added_at TEXT
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

    // Immediate safe save after schema init
    flushSaveDbSync();
  } catch (err) {
    console.error('Error creating database schema:', err);
  }

  return dbInstance;
}

let saveDebounceTimer: NodeJS.Timeout | null = null;
let isSaving = false;
let pendingSave = false;

function performAtomicWrite(): void {
  if (!dbInstance || !sqlModule) return;
  if (isSaving) {
    pendingSave = true;
    return;
  }

  try {
    isSaving = true;
    const data = dbInstance.export();
    if (!data || data.length < 100) {
      isSaving = false;
      return;
    }

    const buffer = Buffer.from(data);
    if (!isBufferHealthy(buffer, sqlModule)) {
      console.error('Exported SQLite database buffer failed health check; aborting disk write to protect data.');
      isSaving = false;
      return;
    }

    const uniqueTempPath = path.join(
      process.cwd(),
      `app_data.db.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`
    );
    fs.writeFileSync(uniqueTempPath, buffer);

    // Keep backup copy of current stable DB file before replacement only if current file is healthy
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const existingBuf = fs.readFileSync(DB_FILE_PATH);
        if (isBufferHealthy(existingBuf, sqlModule)) {
          fs.copyFileSync(DB_FILE_PATH, DB_BAK_PATH);
        }
      } catch {}
    }

    fs.renameSync(uniqueTempPath, DB_FILE_PATH);
  } catch (err) {
    console.error('Error in atomic SQLite save:', err);
  } finally {
    isSaving = false;
    if (pendingSave) {
      pendingSave = false;
      setTimeout(() => performAtomicWrite(), 10);
    }
  }
}

export function saveDb(): void {
  if (!dbInstance) return;
  // Debounce rapid successive saves to prevent disk thrashing and concurrency races
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    performAtomicWrite();
  }, 60);
}

export function flushSaveDbSync(): void {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  performAtomicWrite();
}

// Helpers for converting SQL results to objects
export function queryObjects(db: Database, sql: string, params: any[] = []): any[] {
  try {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const result: any[] = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    return result;
  } catch (err: any) {
    console.error('SQLite queryObjects error:', err?.message || err);
    return [];
  }
}

export function runQuery(db: Database, sql: string, params: any[] = []): void {
  try {
    db.run(sql, params);
    saveDb();
  } catch (err: any) {
    console.error('SQLite runQuery error:', err?.message || err);
  }
}


