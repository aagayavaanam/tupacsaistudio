import express from 'express';
import path from 'path';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';
import { getDb, queryObjects, runQuery, saveDb } from './server/sqlite-db';
import {
  getSqliteStatus,
  clearAllDbTables,
  getMembersFromDb,
  saveMemberToDb,
  getPaduvadaFromDb,
  savePaduvadaToDb,
  updatePaduvadaInDb,
  deletePaduvadaFromDb,
  getAhPaduvadaFromDb,
  saveAhPaduvadaToDb,
  updateAhPaduvadaInDb,
  deleteAhPaduvadaFromDb,
  getBankSheetFromDb,
  saveBankRowToDb,
  updateBankRowInDb,
  deleteBankRowFromDb,
  clearAllBankRowsFromDb,
  getAhBankSheetFromDb,
  saveAhBankRowToDb,
  updateAhBankRowInDb,
  deleteAhBankRowFromDb,
  clearAllAhBankRowsFromDb,
  getAppSettingFromDb,
  saveAppSettingToDb
} from './server/sqlite-service';
import {
  getFirebaseDb,
  getBankRowsFromFirestore,
  saveBankRowToFirestore,
  deleteBankRowFromFirestore,
  getAhBankRowsFromFirestore,
  saveAhBankRowToFirestore,
  deleteAhBankRowFromFirestore,
  getMembersFromFirestore,
  saveMemberToFirestore,
  getPaduvadaFromFirestore,
  savePaduvadaToFirestore,
  getAhPaduvadaFromFirestore,
  saveAhPaduvadaToFirestore,
  deleteAhPaduvadaFromFirestore,
  getAppSettingFromFirestore,
  saveAppSettingToFirestore
} from './server/firebase-service';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to parse CSV strings
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/);
  return lines.map(line => {
    const row: string[] = [];
    let insideQuotes = false;
    let currentCell = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    return row;
  }).filter(r => r.some(cell => cell.length > 0));
}

// Helper to send data via Google Apps Script Web App if configured
async function postToAppsScript(webAppUrl: string, payload: any) {
  try {
    const res = await fetch(webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: res.ok, rawText: text };
    }
  } catch (err: any) {
    console.error('Apps Script Post Error:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

// Helper to clean spreadsheet ID from URLs or raw strings
function cleanSpreadsheetId(idStr: string): string {
  if (!idStr) return '';
  const match = idStr.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) return match[1];
  return idStr.trim();
}

// Helper to get Google Sheets API client
function getSheetsClient(req: express.Request) {
  const authHeader = req.headers.authorization;
  let token = authHeader?.replace('Bearer ', '');

  if (!token && process.env.GOOGLE_ACCESS_TOKEN) {
    token = process.env.GOOGLE_ACCESS_TOKEN;
  }

  if (token) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    return google.sheets({ version: 'v4', auth });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return google.sheets({ version: 'v4', auth: apiKey });
  }

  return google.sheets({ version: 'v4' });
}

// 1. GET /api/sheets/members - Fetch members from SQLite or Google Sheet tab 'Loanmember'
app.get('/api/sheets/members', async (req, res) => {
  try {
    const forceRefresh = req.query.forceRefresh === 'true';
    const spreadsheetId = (req.query.spreadsheetId as string) || process.env.SPREADSHEET_ID;

    // First check SQLite Database
    if (!forceRefresh) {
      const dbMembers = await getMembersFromDb();
      if (dbMembers && dbMembers.length > 0) {
        return res.json({
          success: true,
          members: dbMembers,
          headers: [
            'A Class', 'SB', 'ERP', 'Ins', 'Name', 'C/o', 'Door', 'Street', 'Village',
            'Adhar', 'Mobile', 'Ration Card', 'Namini', 'Relation', 'Mdcc', 'Caste', 'Gender', 'Total Share'
          ],
          total: dbMembers.length,
          source: 'sqlite'
        });
      }
    }

    if (!spreadsheetId) {
      const dbMembers = await getMembersFromDb();
      if (dbMembers && dbMembers.length > 0) {
        return res.json({
          success: true,
          members: dbMembers,
          headers: [
            'A Class', 'SB', 'ERP', 'Ins', 'Name', 'C/o', 'Door', 'Street', 'Village',
            'Adhar', 'Mobile', 'Ration Card', 'Namini', 'Relation', 'Mdcc', 'Caste', 'Gender', 'Total Share'
          ],
          total: dbMembers.length,
          source: 'sqlite'
        });
      }

      return res.status(400).json({ 
        success: false,
        error: 'Spreadsheet ID (கூகுள் சீட் ஐடி) தேவைப்படுகிறது.' 
      });
    }

    let rows: string[][] | null = null;
    let apiErrorDetail = '';
    let isSheetAccessible = false;

    // Attempt 1: Official Google Sheets API
    try {
      const sheets = getSheetsClient(req);
      let response;
      try {
        response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Loanmember!A:Z',
        });
      } catch (err) {
        // Fallback to first sheet tab if 'Loanmember' tab name is not yet created
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const firstSheetName = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';
        response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${firstSheetName}!A:Z`,
        });
      }
      rows = response.data.values as string[][];
      isSheetAccessible = true;
    } catch (err: any) {
      apiErrorDetail = err?.message || String(err);
      console.log('Google Sheets API failed, trying public CSV fallback fetch...', apiErrorDetail);
    }

    // Attempt 2: Public CSV Export fallback (if the sheet is shared as "Anyone with link can view")
    if (!rows || rows.length === 0) {
      try {
        const csvUrls = [
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Loanmember`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
        ];

        for (const url of csvUrls) {
          const csvRes = await fetch(url);
          if (csvRes.ok) {
            const csvText = await csvRes.text();
            if (csvText && !csvText.includes('<!DOCTYPE html>')) {
              isSheetAccessible = true;
              const parsed = parseCSV(csvText);
              if (parsed.length > 0) {
                rows = parsed;
                break;
              }
            }
          }
        }
      } catch (csvErr: any) {
        console.error('CSV fallback failed:', csvErr?.message);
      }
    }

    const DEFAULT_18_HEADERS = [
      'A Class', 'SB', 'ERP', 'Ins', 'Name', 'C/o', 'Door', 'Street', 'Village',
      'Adhar', 'Mobile', 'Ration Card', 'Namini', 'Relation', 'Mdcc', 'Caste', 'Gender', 'Total Share'
    ];

    if (!rows || rows.length === 0) {
      if (isSheetAccessible) {
        return res.json({
          success: true,
          members: [],
          headers: DEFAULT_18_HEADERS,
          total: 0,
          message: 'கூகுள் சீட் இணைப்பு வெற்றி! (தற்போது சீட்டில் உறுப்பினர்கள் ஏதுமில்லை / காலியாக உள்ளது)'
        });
      }

      return res.status(400).json({ 
        success: false,
        error: 'கூகுள் சீட்டிலிருந்து தகவலைப் பெற முடியவில்லை.',
        details: apiErrorDetail || 'சீட் அணுகல் அனுமதி இல்லை அல்லது சீட் ஐடி தவறாக உள்ளது. கூகுள் சீட்டின் பகிர்தல் அனுமதியை "Anyone with the link can view/edit" என மாற்றவும்.'
      });
    }

    const firstRowCombined = (rows[0] || []).join(' ').toLowerCase();
    const isHeaderRow = 
      firstRowCombined.includes('class') || 
      firstRowCombined.includes('name') || 
      firstRowCombined.includes('member') || 
      firstRowCombined.includes('பெயர்') || 
      firstRowCombined.includes('உறுப்பினர்') || 
      firstRowCombined.includes('village') || 
      firstRowCombined.includes('கிராமம்') ||
      firstRowCombined.includes('mobile') ||
      firstRowCombined.includes('adhar') ||
      firstRowCombined.includes('ஆதார்') ||
      firstRowCombined.includes('c/o') ||
      firstRowCombined.includes('care of') ||
      firstRowCombined.includes('door') ||
      firstRowCombined.includes('street') ||
      firstRowCombined.includes('ration') ||
      firstRowCombined.includes('namini') ||
      firstRowCombined.includes('caste');

    const sheetHeaders = isHeaderRow && rows[0] && rows[0].length > 0
      ? rows[0].map(h => (h || '').replace(/^"|"$/g, '').trim())
      : DEFAULT_18_HEADERS;

    const dataRows = isHeaderRow ? rows.slice(1) : rows;

    const members = dataRows.map((row: string[], index: number) => {
      const cleanRow = row.map(c => (c || '').replace(/^"|"$/g, '').trim());

      // Helper to find column value by alias or fallback index
      const getHeaderVal = (aliases: string[], fallbackIdx: number) => {
        for (const alias of aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          const idx = sheetHeaders.findIndex(h => {
            const cleanH = (h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return (cleanAlias !== '' && cleanH === cleanAlias) || (h || '').toLowerCase().trim() === alias.toLowerCase().trim();
          });
          if (idx !== -1 && cleanRow[idx] !== undefined && cleanRow[idx] !== '') {
            return cleanRow[idx];
          }
        }
        return (cleanRow[fallbackIdx] !== undefined && cleanRow[fallbackIdx] !== '') 
          ? cleanRow[fallbackIdx] 
          : '';
      };

      const aClass = getHeaderVal(['a class', 'aclass', 'a-class', 'a_class', 'memberno', 'member no', 'member_no', 'உறுப்பினர் எண்', 'ஏ கிளாஸ்', 'உறுப்பினர்', 'வ.எண்', 'sl.no', 'sl no', 's.no'], 0) || String(1001 + index);
      const sb = getHeaderVal(['sb', 's.b', 'sb ac', 'sb account', 'sb no', 'sb a/c', 'வங்கிக்கணக்கு', 'வங்கி கணக்கு', 'எஸ்.பி', 'sb கணக்கு'], 1);
      const erp = getHeaderVal(['erp', 'erp no', 'erp code', 'erp id', 'ஈஆர்பி', 'ஈ.ஆர்.பி'], 2);
      const ins = getHeaderVal(['ins', 'initial', 'initials', 'insurance', 'தலைப்பெழுத்து', 'இனிஷியல்'], 3);
      const name = getHeaderVal(['name', 'member name', 'பெயர்', 'உறுப்பினர் பெயர்', 'பெயர் தமிழ்'], 4);
      const careOf = getHeaderVal(['c/o', 'care of', 'co', 'careof', 'father', 'husband', 'father name', 'தந்தை பெயர்', 'கணவர் பெயர்', 'தந்தை / கணவர் பெயர்', 'தந்தை/கணவர்', 'தந்தை/கணவர் பெயர்'], 5);
      const door = getHeaderVal(['door', 'door no', 'door_no', 'doorno', 'கதவு எண்', 'கதவுஎண்'], 6);
      const street = getHeaderVal(['street', 'street name', 'தெரு', 'தெரு பெயர்', 'தெருமுகவரி'], 7);
      const village = getHeaderVal(['village', 'village name', 'கிராமம்', 'ஊர்', 'கிராம பெயர்'], 8);
      const adhar = getHeaderVal(['adhar', 'aadhar', 'adhar no', 'aadhar no', 'adhar_no', 'ஆதார்', 'ஆதார் எண்', 'ஆதார் எண்.'], 9);
      const mobile = getHeaderVal(['mobile', 'mobile no', 'phone', 'phone no', 'தொலைபேசி', 'அலைபேசி', 'அலைபேசி எண்', 'போன்'], 10);
      const rationCard = getHeaderVal(['ration card', 'rationcard', 'ration_card', 'ration card no', 'ரேஷன் கார்டு', 'குடும்ப அட்டை எண்', 'ஸ்மார்ட் கார்டு'], 11);
      const namini = getHeaderVal(['namini', 'nominee', 'nomini', 'வாரிசுதாரர்', 'வாரிசு', 'வாரிசுதாரர் பெயர்'], 12);
      const relation = getHeaderVal(['relation', 'relationship', 'உறவுமுறை', 'உறவு'], 13);
      const mdcc = getHeaderVal(['mdcc', 'mdcc no', 'mdcc code', 'எம்டிசிசி'], 14);
      const caste = getHeaderVal(['caste', 'community', 'சாதி', 'பிரிவு', 'வகுப்பு'], 15);
      const gender = getHeaderVal(['gender', 'sex', 'பாலினம்', 'ஆண்/பெண்'], 16);
      const totalShare = getHeaderVal(['total share', 'totalshare', 'total_share', 'share', 'total share amount', 'பங்கு தொகை', 'பங்குத் தொகை', 'மொத்த பங்கு'], 17);

      return {
        memberNo: aClass,
        name: name,
        fatherOrHusbandName: careOf,
        village: village,
        mobile: mobile,
        aadharNo: adhar,
        landAcres: parseFloat(totalShare) || 0,
        aClass,
        sb,
        erp,
        ins,
        careOf,
        door,
        street,
        rationCard,
        namini,
        relation,
        mdcc,
        caste,
        gender,
        totalShare
      };
    }).filter(m => m.name.length > 0 || m.memberNo.length > 0);

    // Sync fetched members into SQLite DB
    for (const m of members) {
      saveMemberToDb(m).catch(() => {});
    }

    res.json({ success: true, members, headers: sheetHeaders, total: members.length });
  } catch (error: any) {
    console.error('Error fetching Google Sheet members:', error?.message || error);
    res.status(500).json({ 
      success: false,
      error: 'கூகுள் சீட்டிலிருந்து தகவலைப் பெறுவதில் பிழை ஏற்பட்டது.',
      details: error?.message || 'Unknown error'
    });
  }
});

// GET /api/sheets/test-connection - Dedicated Test Connection endpoint
app.get('/api/sheets/test-connection', async (req, res) => {
  try {
    const rawId = req.query.spreadsheetId as string;
    const webAppUrl = (req.query.webAppUrl || req.query.scriptUrl) as string;
    const spreadsheetId = cleanSpreadsheetId(rawId || '');

    if (!spreadsheetId && !webAppUrl) {
      return res.status(400).json({ success: false, error: 'கூகுள் சீட் ஐடி அல்லது Google Apps Script URL தேவை.' });
    }

    if (webAppUrl && webAppUrl.startsWith('http')) {
      try {
        const scriptRes = await postToAppsScript(webAppUrl, { action: 'ping' });
        if (scriptRes && (scriptRes.success || scriptRes.ok || scriptRes.rawText || scriptRes.status === 'success')) {
          return res.json({ 
            success: true, 
            message: 'Google Apps Script Web App இணைப்பு வெற்றிகரமாக சோதிக்கப்பட்டது!' 
          });
        }
      } catch (e) {
        console.log('Apps script ping notice:', e);
      }
    }

    if (spreadsheetId) {
      // Try Google Sheets API
      try {
        const sheets = getSheetsClient(req);
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        if (meta.data.spreadsheetId) {
          return res.json({ 
            success: true, 
            message: `கூகுள் சீட் இணைப்பு வெற்றிகரமாக சோதிக்கப்பட்டது! (${meta.data.properties?.title || 'Google Sheet'})`,
            sheetTitle: meta.data.properties?.title || 'Google Sheet'
          });
        }
      } catch (apiErr: any) {
        console.log('Sheets API check fallback to public CSV check:', apiErr?.message);
      }

      // Try Public CSV Export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
      const csvRes = await fetch(csvUrl);
      if (csvRes.ok) {
        const csvText = await csvRes.text();
        if (csvText && !csvText.includes('<!DOCTYPE html>')) {
          return res.json({ 
            success: true, 
            message: 'கூகுள் சீட் இணைப்பு வெற்றிகரமாக சோதிக்கப்பட்டது! ("Anyone with link" அணுகல் உறுதி செய்யப்பட்டது)'
          });
        }
      }
    }

    return res.status(400).json({
      success: false,
      error: 'கூகுள் சீட்டை அணுக முடியவில்லை.',
      details: 'கூகுள் சீட் ஐடி சரியானதா மற்றும் Share permissions "Anyone with link" என உள்ளதா என சரிபார்க்கவும்.'
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'கூகுள் சீட் இணைப்பு சோதனையில் பிழை ஏற்பட்டது.',
      details: err?.message || 'Unknown error'
    });
  }
});

// 2. POST /api/sheets/add-member - Add new member to SQLite and Google Sheet tab 'Loanmember'
app.post('/api/sheets/add-member', async (req, res) => {
  try {
    const { spreadsheetId, webAppUrl, member, rowValues } = req.body;

    if (!member && !rowValues) {
      return res.status(400).json({ 
        error: 'உறுப்பினர் விபரங்கள் தேவை.' 
      });
    }

    // 1. Save to SQLite database and Firebase Firestore Cloud DB
    if (member) {
      await saveMemberToDb(member);
      await saveMemberToFirestore(member);
    } else if (rowValues && Array.isArray(rowValues)) {
      const memObj = {
        memberNo: rowValues[0],
        aClass: rowValues[0],
        sb: rowValues[1],
        erp: rowValues[2],
        ins: rowValues[3],
        name: rowValues[4],
        careOf: rowValues[5],
        door: rowValues[6],
        street: rowValues[7],
        village: rowValues[8],
        aadharNo: rowValues[9],
        mobile: rowValues[10],
        rationCard: rowValues[11],
        namini: rowValues[12],
        relation: rowValues[13],
        mdcc: rowValues[14],
        caste: rowValues[15],
        gender: rowValues[16],
        totalShare: rowValues[17]
      };
      await saveMemberToDb(memObj);
      await saveMemberToFirestore(memObj);
    }

    // 2. Also sync to Google Sheets if configured
    if (webAppUrl || spreadsheetId) {
      const targetSheet = 'Loanmember';
      let valuesToAppend: string[][];

      if (rowValues && Array.isArray(rowValues)) {
        valuesToAppend = [rowValues.map(v => String(v ?? ''))];
      } else {
        valuesToAppend = [[
          member.aClass || member.memberNo || '',
          member.sb || '',
          member.erp || '',
          member.ins || '',
          member.name || '',
          member.careOf || member.fatherOrHusbandName || '',
          member.door || '',
          member.street || '',
          member.village || '',
          member.aadharNo || member.adhar || '',
          member.mobile || '',
          member.rationCard || '',
          member.namini || '',
          member.relation || '',
          member.mdcc || '',
          member.caste || '',
          member.gender || '',
          member.totalShare ?? member.landAcres ?? ''
        ]];
      }

      if (webAppUrl && webAppUrl.startsWith('http')) {
        postToAppsScript(webAppUrl, {
          action: 'append',
          sheetName: 'Loanmember',
          rowValues: valuesToAppend[0]
        }).catch(err => console.log('Apps Script async append notice:', err));
      } else if (spreadsheetId) {
        try {
          const sheets = getSheetsClient(req);
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${targetSheet}!A:R`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: valuesToAppend },
          });
        } catch (err: any) {
          console.log('Google Sheet append async notice:', err?.message);
        }
      }
    }

    res.json({ 
      success: true, 
      message: 'உறுப்பினர் விபரம் SQLite தரவுத்தளத்தில் வெற்றிப்படியாக பதியப்பட்டது!'
    });
  } catch (error: any) {
    console.error('Error adding member:', error?.message || error);
    res.status(500).json({ 
      error: 'புதிய உறுப்பினரை பதிவிடுவதில் பிழை ஏற்பட்டது.',
      details: error?.message || 'Unknown error'
    });
  }
});

// 3. POST /api/sheets/init-sheet - Initialize Loanmember sheet tab headers
app.post('/api/sheets/init-sheet', async (req, res) => {
  try {
    const { spreadsheetId } = req.body;
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'Spreadsheet ID தேவை.' });
    }

    const sheets = getSheetsClient(req);
    const headers = [[
      'A Class', 'SB', 'ERP', 'Ins', 'Name', 'C/o', 'Door', 'Street', 'Village',
      'Adhar', 'Mobile', 'Ration Card', 'Namini', 'Relation', 'Mdcc', 'Caste', 'Gender', 'Total Share'
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Loanmember!A1:R1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: headers }
    });

    res.json({ success: true, message: 'Loanmember தலைப்புகள் உருவாக்கப்பட்டன!' });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to initialize headers' });
  }
});

// 4. POST /api/sheets/add-paduvada - Save Paduvada record to SQLite, Firestore and Google Sheet
app.post('/api/sheets/add-paduvada', async (req, res) => {
  try {
    const { spreadsheetId, webAppUrl, paduvadaData, type } = req.body;

    if (!paduvadaData) {
      return res.status(400).json({ success: false, error: 'பட்டுவாடா விபரங்கள் தேவை.' });
    }

    const isAH = type === 'ah' || req.query.type === 'ah' || paduvadaData.loanType === 'ah' || Boolean(paduvadaData.livestockType);

    // 1. Save into SQLite AND Firebase Firestore Cloud Database
    if (isAH) {
      await saveAhPaduvadaToDb(paduvadaData);
      await saveAhPaduvadaToFirestore(paduvadaData);
    } else {
      await savePaduvadaToDb(paduvadaData);
      await savePaduvadaToFirestore(paduvadaData);
    }

    // 2. Async sync to Google Sheets if configured
    if (webAppUrl || spreadsheetId) {
      const targetSheet = isAH ? 'AH All Paduvada Members' : 'KCC All Paduvada Members';
      const HEADERS = isAH ? [
        'RCL எண்', 'RCL தேதி', 'அனுமதிக்கப்பட்ட கடன் அளவு', 'தற்போதைய AH பட்டுவாடா எண்', 'தீர்மான எண்', 'தீர்மான தேதி',
        'A Class எண்', 'பெயர்', 'தந்தை / கணவர் பெயர்', 'SB கணக்கு எண்', 'ERP எண்', 'இனிஷியல்',
        'கதவு எண்', 'தெரு', 'கிராமம்', 'ஆதார் எண்', 'அலைபேசி எண்', 'ரேஷன் கார்டு எண்',
        'நாமினியின் பெயர்', 'உறவுமுறை', 'MDCC எண்', 'சாதி', 'மொத்த பங்கு', 'கால்நடைகளின் வகை',
        'கால்நடைகளின் எண்ணிக்கை', 'கடன் தொகை (ரூ.)', 'விவசாயி பிரிவு',
        'மாற்றுத்திறனாளி', 'அடமான வகை', 'ஜாமீன் வகை', 'பாஸ்புக் கட்டணம் (ரூ.)', 'காப்பீடு (ரூ.)', 'பங்குத் தொகை (ரூ.)',
        'முன்கடன் எண்', 'முன்கடன் தேதி', 'முன்கடன் தொகை (ரூ.)', 'சேர்க்கப்பட்ட நேரம்'
      ] : [
        'RCL எண்', 'RCL தேதி', 'அனுமதிக்கப்பட்ட கடன் அளவு', 'தற்போதைய பட்டுவாடா எண்', 'தீர்மான எண்', 'தீர்மான தேதி',
        'A Class எண்', 'பெயர்', 'தந்தை / கணவர் பெயர்', 'SB கணக்கு எண்', 'ERP எண்', 'இனிஷியல்',
        'கதவு எண்', 'தெரு', 'கிராமம்', 'ஆதார் எண்', 'அலைபேசி எண்', 'ரேஷன் கார்டு எண்',
        'நாமினியின் பெயர்', 'உறவுமுறை', 'MDCC எண்', 'சாதி', 'மொத்த பங்கு', 'சர்வே எண்',
        'பரப்பு (ஏக்கர்)', 'பயிர் பெயர்', 'விதை (ரூ.)', 'உரத் தேவை ரொக்கம் (ரூ.)', 'பூச்சி மருந்து (ரூ.)', 'உழும் செலவு (ரூ.)',
        'அறுவடை செலவு (ரூ.)', 'உரத் தேவை உரம் (ரூ.)', 'இயற்கை உரம் (ரூ.)', 'மொத்த கடன் தொகை (ரூ.)', 'விவசாயி பிரிவு',
        'மாற்றுத்திறனாளி', 'அடமான வகை', 'ஜாமீன் வகை', 'பாஸ்புக் கட்டணம் (ரூ.)', 'பயிர் காப்பீடு (ரூ.)', 'பங்குத் தொகை (ரூ.)',
        'முன்கடன் எண்', 'முன்கடன் தேதி', 'முன்கடன் தொகை (ரூ.)', 'சேர்க்கப்பட்ட நேரம்'
      ];

      const p = paduvadaData || {};
      const rowValues = isAH ? [
        p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '',
        p.resolutionNo || '', p.resolutionDate || '', p.aClass || p.memberNo || '', p.name || '',
        p.careOf || p.fatherOrHusbandName || '', p.sb || '', p.erp || '', p.ins || '',
        p.door || '', p.street || '', p.village || '', p.aadharNo || p.adhar || '',
        p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '',
        p.mdcc || '', p.caste || p.category || '', p.totalShare ?? p.landAcres ?? '',
        p.livestockType || p.crop || 'மாடுகள்', p.livestockCount || p.acres || '',
        p.totalLoanAmount || p.loanAmount || '', p.farmerClass || 'MF', p.disability || '0',
        p.mortgageType || '', p.guaranteeType || '', p.passbookFee || '0', p.insurance || '0',
        p.shareCapital || '0', p.prevLoanNo || 'AH -', p.prevLoanDate || '', p.prevLoanAmount || '0',
        p.addedAt || new Date().toLocaleString('ta-IN')
      ] : [
        p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '',
        p.resolutionNo || '', p.resolutionDate || '', p.aClass || '', p.name || '',
        p.careOf || '', p.sb || '', p.erp || '', p.ins || '',
        p.door || '', p.street || '', p.village || '', p.aadharNo || '',
        p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '',
        p.mdcc || '', p.caste || '', p.totalShare || '', p.surveyNo || '',
        p.acres || '', p.crop || '', p.seed || '', p.chemicalFertilizer || '',
        p.pesticide || '', p.plowing || '', p.harvesting || '', p.fertilizerKind || '',
        p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '',
        p.mortgageType || '', p.guaranteeType || '', p.passbookFee || '', p.insurance || '',
        p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '',
        p.addedAt || new Date().toLocaleString('ta-IN')
      ];

      if (webAppUrl && webAppUrl.startsWith('http')) {
        postToAppsScript(webAppUrl, {
          action: 'append',
          sheetName: targetSheet,
          headers: HEADERS,
          rowValues
        }).catch(e => console.log('Apps Script paduvada async notice:', e));
      } else if (spreadsheetId) {
        try {
          const sheets = getSheetsClient(req);
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${targetSheet}'!A:AS`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [rowValues] },
          });
        } catch (err: any) {
          console.log('Google Sheet paduvada append async notice:', err?.message);
        }
      }
    }

    return res.json({
      success: true,
      message: isAH ? 'AH பட்டுவாடா விபரம் SQLite மற்றும் Firestore-ல் வெற்றியுடன் பதிவானது!' : 'பட்டுவாடா விபரம் SQLite தரவுத்தளத்தில் வெற்றியுடன் பதிவானது!'
    });
  } catch (error: any) {
    console.error('Error adding paduvada member:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'பட்டுவாடா விபரம் பதிவிடுவதில் பிழை ஏற்பட்டது.',
      details: error?.message || 'Unknown error'
    });
  }
});

// 5. GET /api/sheets/get-paduvada - Fetch Paduvada records from SQLite, Firestore or Google Sheet
app.get('/api/sheets/get-paduvada', async (req, res) => {
  try {
    const spreadsheetId = req.query.spreadsheetId as string;
    const webAppUrl = req.query.webAppUrl as string;
    const disbNo = req.query.disbNo as string;
    const forceRefresh = req.query.forceRefresh === 'true';
    const isAH = req.query.type === 'ah';

    // 1. First check SQLite Database
    if (!forceRefresh) {
      const dbResult = isAH ? await getAhPaduvadaFromDb(disbNo) : await getPaduvadaFromDb(disbNo);
      if (dbResult && dbResult.data && dbResult.data.length > 0) {
        return res.json({
          success: true,
          data: dbResult.data,
          totalCount: dbResult.totalCount,
          maxDisbNo: dbResult.maxDisbNo,
          source: 'sqlite'
        });
      }
    }

    // 2. Check Firebase Firestore Database
    if (!forceRefresh) {
      const fsResult = isAH ? await getAhPaduvadaFromFirestore() : await getPaduvadaFromFirestore();
      if (fsResult && fsResult.length > 0) {
        // Sync to SQLite
        for (const item of fsResult) {
          if (isAH) {
            saveAhPaduvadaToDb(item).catch(() => {});
          } else {
            savePaduvadaToDb(item).catch(() => {});
          }
        }
        let maxDisbNo = 0;
        fsResult.forEach((item: any) => {
          const val = parseInt((item.currentDisbNo || '').toString().trim(), 10);
          if (!isNaN(val) && val > maxDisbNo) {
            maxDisbNo = val;
          }
        });
        const targetDisb = (disbNo || '').toString().trim();
        const filtered = (targetDisb !== '')
          ? fsResult.filter((item: any) => {
              const itemDisb = (item.currentDisbNo || '').toString().trim();
              return itemDisb === targetDisb || (parseInt(itemDisb, 10) > 0 && parseInt(itemDisb, 10) === parseInt(targetDisb, 10));
            })
          : fsResult;
        return res.json({
          success: true,
          data: filtered,
          totalCount: fsResult.length,
          maxDisbNo: maxDisbNo > 0 ? maxDisbNo.toString() : '0',
          source: 'firestore'
        });
      }
    }

    if (!spreadsheetId && !webAppUrl) {
      const dbResult = isAH ? await getAhPaduvadaFromDb(disbNo) : await getPaduvadaFromDb(disbNo);
      if (dbResult && dbResult.data) {
        return res.json({
          success: true,
          data: dbResult.data,
          totalCount: dbResult.totalCount,
          maxDisbNo: dbResult.maxDisbNo,
          source: 'sqlite'
        });
      }
      return res.status(400).json({ success: false, error: 'Spreadsheet ID அல்லது Google Apps Script URL தேவை.' });
    }

    let rawRows: any[][] = [];
    const targetSheetName = isAH ? 'AH All Paduvada Members' : 'KCC All Paduvada Members';

    // Priority 1: Try Google Apps Script Web App URL if provided
    if (webAppUrl && webAppUrl.startsWith('http')) {
      const scriptRes = await postToAppsScript(webAppUrl, {
        action: 'get_paduvada',
        sheetName: targetSheetName,
        disbNo: disbNo || ''
      });

      if (scriptRes && scriptRes.rows && Array.isArray(scriptRes.rows)) {
        rawRows = scriptRes.rows;
      } else {
        // Fallback to GET on webAppUrl if POST didn't return rows
        try {
          const getRes = await fetch(`${webAppUrl}?sheetName=${encodeURIComponent(targetSheetName)}`);
          const getData = await getRes.json();
          if (getData && getData.rows && Array.isArray(getData.rows)) {
            rawRows = getData.rows;
          }
        } catch (e) {
          console.log('Apps Script GET fallback notice:', e);
        }
      }
    }

    // Priority 2: Use Google Sheets REST API if no rows obtained yet
    if (rawRows.length === 0 && spreadsheetId) {
      try {
        const sheets = getSheetsClient(req);
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${targetSheetName}'!A1:AS1000`,
        });

        rawRows = response.data.values || [];
      } catch (restErr: any) {
        console.error('REST API read notice:', restErr?.message);
      }
    }

    // Filter out header row if present
    const dataRows = rawRows.filter(r => {
      if (!r || r.length === 0) return false;
      const col0 = String(r[0] || '').trim();
      const col3 = String(r[3] || '').trim();
      const col6 = String(r[6] || '').trim();
      if (col0 === 'RCL எண்' || col3.includes('பட்டுவாடா') || col6 === 'A Class எண்') {
        return false;
      }
      return true;
    });

    const items = dataRows.map((r, index) => {
      const rowIndex = index + 2;
      if (isAH) {
        return {
          id: `sheet-ah-${rowIndex}-${r[6] || index}`,
          rowIndex,
          rclNumber: r[0] || '',
          rclDate: r[1] || '',
          sanctionedAmount: r[2] || '',
          currentDisbNo: r[3] || '',
          resolutionNo: r[4] || '',
          resolutionDate: r[5] || '',
          aClass: r[6] || '',
          memberNo: r[6] || '',
          name: r[7] || '',
          careOf: r[8] || '',
          fatherOrHusbandName: r[8] || '',
          sb: r[9] || '',
          erp: r[10] || '',
          ins: r[11] || '',
          door: r[12] || '',
          street: r[13] || '',
          village: r[14] || '',
          aadharNo: r[15] || '',
          adhar: r[15] || '',
          mobile: r[16] || '',
          rationCard: r[17] || '',
          namini: r[18] || '',
          relation: r[19] || '',
          mdcc: r[20] || '',
          caste: r[21] || '',
          category: r[21] || '',
          totalShare: r[22] || '',
          livestockType: r[23] || 'மாடுகள்',
          crop: r[23] || 'மாடுகள்',
          livestockCount: r[24] || '',
          acres: r[24] || '',
          totalLoanAmount: r[25] || '',
          loanAmount: r[25] || '',
          farmerClass: r[26] || 'MF',
          disability: r[27] || '0',
          mortgageType: r[28] || '',
          guaranteeType: r[29] || '',
          passbookFee: r[30] || '0',
          insurance: r[31] || '0',
          shareCapital: r[32] || '0',
          prevLoanNo: r[33] || 'AH -',
          prevLoanDate: r[34] || '',
          prevLoanAmount: r[35] || '0',
          addedAt: r[36] || ''
        };
      }
      return {
        id: `sheet-${rowIndex}-${r[6] || index}`,
        rowIndex,
        rclNumber: r[0] || '',
        rclDate: r[1] || '',
        sanctionedAmount: r[2] || '',
        currentDisbNo: r[3] || '',
        resolutionNo: r[4] || '',
        resolutionDate: r[5] || '',
        aClass: r[6] || '',
        name: r[7] || '',
        careOf: r[8] || '',
        sb: r[9] || '',
        erp: r[10] || '',
        ins: r[11] || '',
        door: r[12] || '',
        street: r[13] || '',
        village: r[14] || '',
        aadharNo: r[15] || '',
        mobile: r[16] || '',
        rationCard: r[17] || '',
        namini: r[18] || '',
        relation: r[19] || '',
        mdcc: r[20] || '',
        caste: r[21] || '',
        totalShare: r[22] || '',
        surveyNo: r[23] || '',
        acres: r[24] || '',
        crop: r[25] || '',
        seed: r[26] || '',
        chemicalFertilizer: r[27] || '',
        pesticide: r[28] || '',
        plowing: r[29] || '',
        harvesting: r[30] || '',
        fertilizerKind: r[31] || '',
        organicFertilizer: r[32] || '',
        totalLoanAmount: r[33] || '',
        farmerClass: r[34] || '',
        disability: r[35] || '',
        mortgageType: r[36] || '',
        guaranteeType: r[37] || '',
        passbookFee: r[38] || '',
        insurance: r[39] || '',
        shareCapital: r[40] || '',
        prevLoanNo: r[41] || '',
        prevLoanDate: r[42] || '',
        prevLoanAmount: r[43] || '',
        addedAt: r[44] || ''
      };
    });

    // Sync fetched paduvada items to SQLite DB
    for (const item of items) {
      if (isAH) {
        saveAhPaduvadaToDb(item).catch(() => {});
      } else {
        savePaduvadaToDb(item).catch(() => {});
      }
    }

    let maxDisbNo = 0;
    items.forEach(item => {
      const val = parseInt((item.currentDisbNo || '').toString().trim(), 10);
      if (!isNaN(val) && val > maxDisbNo) {
        maxDisbNo = val;
      }
    });

    const targetDisb = (disbNo || '').toString().trim();
    const filtered = (targetDisb !== '')
      ? items.filter(item => {
          const itemDisb = (item.currentDisbNo || '').toString().trim();
          return itemDisb === targetDisb || (parseInt(itemDisb, 10) > 0 && parseInt(itemDisb, 10) === parseInt(targetDisb, 10));
        })
      : items;

    return res.json({
      success: true,
      data: filtered,
      totalCount: items.length,
      maxDisbNo: maxDisbNo > 0 ? maxDisbNo.toString() : '0'
    });
  } catch (error: any) {
    console.error('Error fetching paduvada members from Google Sheet:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'கூகுள் சீட்டிலிருந்து தகவல்களைப் பெறுவதில் பிழை ஏற்பட்டது.',
      details: error?.message || 'Unknown error'
    });
  }
});

// 6. POST /api/sheets/delete-paduvada - Delete a Paduvada record from SQLite, Firestore and Google Sheet
app.post('/api/sheets/delete-paduvada', async (req, res) => {
  try {
    const { spreadsheetId: rawSheetId, webAppUrl, aClass, currentDisbNo, rowIndex, crop, id, type } = req.body;
    const spreadsheetId = cleanSpreadsheetId(rawSheetId || '');
    const isAH = type === 'ah' || req.query.type === 'ah';

    // 1. Delete from SQLite DB & Firestore
    if (isAH) {
      await deleteAhPaduvadaFromDb(aClass, currentDisbNo, crop, id);
      if (id) await deleteAhPaduvadaFromFirestore(id);
    } else {
      await deletePaduvadaFromDb(aClass, currentDisbNo, crop, id);
    }

    // 2. Async sync to Google Sheets if configured
    const targetSheet = isAH ? 'AH All Paduvada Members' : 'KCC All Paduvada Members';
    if (webAppUrl && webAppUrl.startsWith('http')) {
      postToAppsScript(webAppUrl, {
        action: 'deletePaduvada',
        sheetName: targetSheet,
        aClass,
        currentDisbNo,
        rowIndex,
        crop,
        id
      }).catch(e => console.log('Apps Script delete notice:', e));
    } else if (spreadsheetId) {
      try {
        const sheets = getSheetsClient(req);
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetObj = meta.data.sheets?.find(
          s => s.properties?.title?.trim().toLowerCase() === targetSheet.toLowerCase()
        );

        if (sheetObj && sheetObj.properties?.sheetId !== undefined) {
          const sheetId = sheetObj.properties.sheetId;
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${targetSheet}'!A1:AS1000`,
          });
          const rows = response.data.values || [];
          const targetAClass = String(aClass || '').trim().toLowerCase();
          const targetDisb = String(currentDisbNo || '').trim();
          const targetCrop = String(crop || '').trim().toLowerCase();

          let targetRowNumber = -1;
          if (targetAClass) {
            const foundIdx = rows.findIndex((r, idx) => {
              if (idx === 0) return false;
              const rowAClass = String(r[6] || '').trim().toLowerCase();
              const rowDisb = String(r[3] || '').trim();
              const rowCrop = String(isAH ? (r[23] || '') : (r[25] || '')).trim().toLowerCase();
              const matchClass = rowAClass === targetAClass;
              const matchDisb = !targetDisb || rowDisb === targetDisb;
              const matchCrop = !targetCrop || rowCrop === targetCrop;
              return matchClass && matchDisb && matchCrop;
            });
            if (foundIdx !== -1) targetRowNumber = foundIdx + 1;
          }

          if (targetRowNumber > 1) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId,
              requestBody: {
                requests: [{
                  deleteDimension: {
                    range: {
                      sheetId,
                      dimension: 'ROWS',
                      startIndex: targetRowNumber - 1,
                      endIndex: targetRowNumber
                    }
                  }
                }]
              }
            });
          }
        }
      } catch (err: any) {
        console.log('Google Sheet delete async notice:', err?.message);
      }
    }

    return res.json({
      success: true,
      message: 'தரவுத்தளத்திலிருந்து நபர் வெற்றியுடன் நீக்கப்பட்டார்!'
    });
  } catch (error: any) {
    console.error('Error deleting paduvada member:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'நபரை நீக்குவதில் பிழை ஏற்பட்டது.',
      details: error?.message || 'Unknown error'
    });
  }
});

// 7. POST /api/sheets/update-paduvada - Update a Paduvada record in SQLite, Firestore and Google Sheet
app.post('/api/sheets/update-paduvada', async (req, res) => {
  try {
    const { spreadsheetId, webAppUrl, paduvadaData, rowIndex, aClass, currentDisbNo, crop, id, type } = req.body;

    if (!paduvadaData) {
      return res.status(400).json({ error: 'புதுப்பிக்கப்பட வேண்டிய தகவல்கள் தேவை.' });
    }

    const isAH = type === 'ah' || req.query.type === 'ah' || paduvadaData.loanType === 'ah' || Boolean(paduvadaData.livestockType);

    // 1. Update in SQLite DB & Firestore
    if (isAH) {
      await updateAhPaduvadaInDb(
        paduvadaData,
        aClass || paduvadaData.aClass,
        currentDisbNo || paduvadaData.currentDisbNo,
        crop || paduvadaData.crop || paduvadaData.livestockType,
        id || paduvadaData.id || paduvadaData.dbId
      );
      await saveAhPaduvadaToFirestore(paduvadaData);
    } else {
      await updatePaduvadaInDb(
        paduvadaData,
        aClass || paduvadaData.aClass,
        currentDisbNo || paduvadaData.currentDisbNo,
        crop || paduvadaData.crop,
        id || paduvadaData.id || paduvadaData.dbId
      );
      await savePaduvadaToFirestore(paduvadaData);
    }

    // 2. Async sync to Google Sheets if configured
    const targetSheet = isAH ? 'AH All Paduvada Members' : 'KCC All Paduvada Members';
    if (webAppUrl && webAppUrl.startsWith('http')) {
      postToAppsScript(webAppUrl, {
        action: 'updatePaduvada',
        sheetName: targetSheet,
        paduvadaData,
        rowIndex,
        aClass,
        currentDisbNo,
        crop: crop || paduvadaData.crop || paduvadaData.livestockType,
        id: id || paduvadaData.id
      }).catch(e => console.log('Apps Script update notice:', e));
    } else if (spreadsheetId) {
      try {
        const sheets = getSheetsClient(req);
        let targetRowNumber = rowIndex;

        if (!targetRowNumber) {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${targetSheet}'!A1:AS1000`,
          });
          const rows = response.data.values || [];
          const targetCrop = (crop || paduvadaData?.crop || paduvadaData?.livestockType || '').trim().toLowerCase();
          const targetAClass = String(aClass || paduvadaData?.aClass || '').trim().toLowerCase();
          const targetDisb = String(currentDisbNo || paduvadaData?.currentDisbNo || '').trim();

          const foundIdx = rows.findIndex((r, idx) => {
            if (idx === 0) return false;
            const matchAClass = String(r[6] || '').trim().toLowerCase() === targetAClass;
            const matchDisb = !targetDisb || String(r[3] || '').trim() === targetDisb;
            const cropColIdx = isAH ? 23 : 25;
            const matchCrop = !targetCrop || String(r[cropColIdx] || '').trim().toLowerCase() === targetCrop;
            return matchAClass && matchDisb && matchCrop;
          });
          if (foundIdx !== -1) targetRowNumber = foundIdx + 1;
        }

        if (targetRowNumber) {
          const p = paduvadaData || {};
          const rowValues = isAH ? [
            p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '',
            p.resolutionNo || '', p.resolutionDate || '', p.aClass || p.memberNo || '', p.name || '',
            p.careOf || p.fatherOrHusbandName || '', p.sb || '', p.erp || '', p.ins || '',
            p.door || '', p.street || '', p.village || '', p.aadharNo || p.adhar || '',
            p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '',
            p.mdcc || '', p.caste || p.category || '', p.totalShare ?? p.landAcres ?? '',
            p.livestockType || p.crop || 'மாடுகள்', p.livestockCount || p.acres || '',
            p.totalLoanAmount || p.loanAmount || '', p.farmerClass || 'MF', p.disability || '0',
            p.mortgageType || '', p.guaranteeType || '', p.passbookFee || '0', p.insurance || '0',
            p.shareCapital || '0', p.prevLoanNo || 'AH -', p.prevLoanDate || '', p.prevLoanAmount || '0',
            p.addedAt || new Date().toLocaleString('ta-IN')
          ] : [
            p.rclNumber || '', p.rclDate || '', p.sanctionedAmount || '', p.currentDisbNo || '',
            p.resolutionNo || '', p.resolutionDate || '', p.aClass || '', p.name || '',
            p.careOf || '', p.sb || '', p.erp || '', p.ins || '',
            p.door || '', p.street || '', p.village || '', p.aadharNo || '',
            p.mobile || '', p.rationCard || '', p.namini || '', p.relation || '',
            p.mdcc || '', p.caste || '', p.totalShare || '', p.surveyNo || '',
            p.acres || '', p.crop || '', p.seed || '', p.chemicalFertilizer || '',
            p.pesticide || '', p.plowing || '', p.harvesting || '', p.fertilizerKind || '',
            p.organicFertilizer || '', p.totalLoanAmount || '', p.farmerClass || '', p.disability || '',
            p.mortgageType || '', p.guaranteeType || '', p.passbookFee || '', p.insurance || '',
            p.shareCapital || '', p.prevLoanNo || '', p.prevLoanDate || '', p.prevLoanAmount || '',
            p.addedAt || new Date().toLocaleString('ta-IN')
          ];

          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${targetSheet}'!A${targetRowNumber}:AS${targetRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [rowValues] },
          });
        }
      } catch (err: any) {
        console.log('Google Sheet update async notice:', err?.message);
      }
    }

    res.json({
      success: true,
      message: 'தரவுத்தளத்தில் நபர் விபரங்கள் வெற்றியுடன் புதுப்பிக்கப்பட்டன!'
    });
  } catch (error: any) {
    console.error('Error updating paduvada member:', error?.message || error);
    res.status(500).json({
      error: 'நபரின் தகவலைத் திருத்துவதில் பிழை ஏற்பட்டது.',
      details: error?.message || 'Unknown error'
    });
  }
});

// 8. POST /api/sheets/sync-paduvada-batch - Bulk Sync / Backup Paduvada items
app.post('/api/sheets/sync-paduvada-batch', async (req, res) => {
  try {
    const { spreadsheetId, webAppUrl, items, type } = req.body;

    if (!spreadsheetId && !webAppUrl) {
      return res.status(400).json({ success: false, error: 'Spreadsheet ID அல்லது Google Apps Script URL தேவை.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'சேமிக்கப்பட வேண்டிய பட்டுவாடா தகவல்கள் ஏதுமில்லை.' });
    }

    const isAH = type === 'ah' || req.query.type === 'ah';
    const targetSheet = isAH ? 'AH All Paduvada Members' : 'KCC All Paduvada Members';
    const sheets = getSheetsClient(req);

    // Ensure sheet tab exists
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const existingSheets = meta.data.sheets || [];
      const sheetExists = existingSheets.some(
        s => s.properties?.title?.trim().toLowerCase() === targetSheet.toLowerCase()
      );

      if (!sheetExists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: targetSheet } } }],
          },
        });
      }
    } catch (sheetErr: any) {
      console.log('Sheet tab check notice:', sheetErr?.message);
    }

    // Ensure HEADERS
    const HEADERS = isAH ? [
      'RCL எண்', 'RCL தேதி', 'அனுமதிக்கப்பட்ட கடன் அளவு', 'தற்போதைய AH பட்டுவாடா எண்', 'தீர்மான எண்', 'தீர்மான தேதி',
      'A Class எண்', 'பெயர்', 'தந்தை / கணவர் பெயர்', 'SB கணக்கு எண்', 'ERP எண்', 'இனிஷியல்',
      'கதவு எண்', 'தெரு', 'கிராமம்', 'ஆதார் எண்', 'அலைபேசி எண்', 'ரேஷன் கார்டு எண்',
      'நாமினியின் பெயர்', 'உறவுமுறை', 'MDCC எண்', 'சாதி', 'மொத்த பங்கு', 'கால்நடைகளின் வகை',
      'கால்நடைகளின் எண்ணிக்கை', 'கடன் தொகை (ரூ.)', 'விவசாயி பிரிவு',
      'மாற்றுத்திறனாளி', 'அடமான வகை', 'ஜாமீன் வகை', 'பாஸ்புக் கட்டணம் (ரூ.)', 'காப்பீடு (ரூ.)', 'பங்குத் தொகை (ரூ.)',
      'முன்கடன் எண்', 'முன்கடன் தேதி', 'முன்கடன் தொகை (ரூ.)', 'சேர்க்கப்பட்ட நேரம்'
    ] : [
      'RCL எண்', 'RCL தேதி', 'அனுமதிக்கப்பட்ட கடன் அளவு', 'தற்போதைய பட்டுவாடா எண்', 'தீர்மான எண்', 'தீர்மான தேதி',
      'A Class எண்', 'பெயர்', 'தந்தை / கணவர் பெயர்', 'SB கணக்கு எண்', 'ERP எண்', 'இனிஷியல்',
      'கதவு எண்', 'தெரு', 'கிராமம்', 'ஆதார் எண்', 'அலைபேசி எண்', 'ரேஷன் கார்டு எண்',
      'நாமினியின் பெயர்', 'உறவுமுறை', 'MDCC எண்', 'சாதி', 'மொத்த பங்கு', 'சர்வே எண்',
      'பரப்பு (ஏக்கர்)', 'பயிர் பெயர்', 'விதை (ரூ.)', 'உரத் தேவை ரொக்கம் (ரூ.)', 'பூச்சி மருந்து (ரூ.)', 'உழும் செலவு (ரூ.)',
      'அறுவடை செலவு (ரூ.)', 'உரத் தேவை உரம் (ரூ.)', 'இயற்கை உரம் (ரூ.)', 'மொத்த கடன் தொகை (ரூ.)', 'விவசாயி பிரிவு',
      'மாற்றுத்திறனாளி', 'அடமான வகை', 'ஜாமீன் வகை', 'பாஸ்புக் கட்டணம் (ரூ.)', 'பயிர் காப்பீடு (ரூ.)', 'பங்குத் தொகை (ரூ.)',
      'முன்கடன் எண்', 'முன்கடன் தேதி', 'முன்கடன் தொகை (ரூ.)', 'சேர்க்கப்பட்ட நேரம்'
    ];

    let hasHeaders = false;
    try {
      const existingRange = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${targetSheet}'!A1:AS1`,
      });
      if (existingRange.data.values && existingRange.data.values.length > 0) {
        hasHeaders = true;
      }
    } catch (e) {
      hasHeaders = false;
    }

    if (!hasHeaders) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${targetSheet}'!A1:AS1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADERS] },
      });
    }

    // Build row values for each item
    const rowsToAppend = items.map((p: any) => isAH ? [
      p.rclNumber || '',
      p.rclDate || '',
      p.sanctionedAmount || '',
      p.currentDisbNo || '',
      p.resolutionNo || '',
      p.resolutionDate || '',
      p.aClass || p.memberNo || '',
      p.name || '',
      p.careOf || p.fatherOrHusbandName || '',
      p.sb || '',
      p.erp || '',
      p.ins || '',
      p.door || '',
      p.street || '',
      p.village || '',
      p.aadharNo || p.adhar || '',
      p.mobile || '',
      p.rationCard || '',
      p.namini || '',
      p.relation || '',
      p.mdcc || '',
      p.caste || p.category || '',
      p.totalShare ?? p.landAcres ?? '',
      p.livestockType || p.crop || 'மாடுகள்',
      p.livestockCount || p.acres || '',
      p.totalLoanAmount || p.loanAmount || '',
      p.farmerClass || 'MF',
      p.disability || '0',
      p.mortgageType || '',
      p.guaranteeType || '',
      p.passbookFee || '0',
      p.insurance || '0',
      p.shareCapital || '0',
      p.prevLoanNo || 'AH -',
      p.prevLoanDate || '',
      p.prevLoanAmount || '0',
      p.addedAt || new Date().toLocaleString('ta-IN')
    ] : [
      p.rclNumber || '',
      p.rclDate || '',
      p.sanctionedAmount || '',
      p.currentDisbNo || '',
      p.resolutionNo || '',
      p.resolutionDate || '',
      p.aClass || p.memberNo || '',
      p.name || '',
      p.careOf || p.fatherOrHusbandName || '',
      p.sb || '',
      p.erp || '',
      p.ins || '',
      p.door || '',
      p.street || '',
      p.village || '',
      p.aadharNo || p.adhar || '',
      p.mobile || '',
      p.rationCard || '',
      p.namini || '',
      p.relation || '',
      p.mdcc || '',
      p.caste || '',
      p.totalShare || '',
      p.surveyNo || '',
      p.acres || '',
      p.crop || '',
      p.seed || '',
      p.chemicalFertilizer || p.fertilizer || '',
      p.pesticide || '',
      p.plowing || '0',
      p.harvesting || '0',
      p.fertilizerKind || p.compost || '',
      p.organicFertilizer || p.cash || '',
      p.totalLoanAmount || '',
      p.farmerClass || 'MF',
      p.disability || '',
      p.mortgageType || '',
      p.guaranteeType || '',
      p.passbookFee || '',
      p.insurance || '',
      p.shareCapital || '',
      p.prevLoanNo || '',
      p.prevLoanDate || '',
      p.prevLoanAmount || '',
      p.addedAt || new Date().toLocaleString('ta-IN')
    ]);

    // Priority 1: Use Apps Script Web App URL if provided
    if (webAppUrl && webAppUrl.startsWith('http')) {
      const scriptRes = await postToAppsScript(webAppUrl, {
        action: 'batch_append',
        sheetName: targetSheet,
        headers: HEADERS,
        rows: rowsToAppend
      });
      if (scriptRes.success) {
        return res.json({
          success: true,
          count: items.length,
          message: `பட்டுவாடா பட்டியலில் உள்ள ${items.length} உறுப்பினர்களின் விபரங்களும் கூகுள் சீட்டில் வெற்றியுடன் நகல் (Backup) எடுக்கப்பட்டன!`
        });
      }
    }

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${targetSheet}'!A:AS`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rowsToAppend },
    });

    return res.json({
      success: true,
      count: items.length,
      message: `பட்டுவாடா பட்டியலில் உள்ள ${items.length} உறுப்பினர்களின் விபரங்களும் கூகுள் சீட்டில் ('${targetSheet}') வெற்றியுடன் நகல் (Backup) எடுக்கப்பட்டன!`,
      updatedRange: appendResponse.data.updates?.updatedRange
    });
  } catch (error: any) {
    console.error('Error in batch sync paduvada to Google Sheet:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'கூகுள் சீட்டில் தரவை எழுத அனுமதி தேவை.',
      details: 'Google Sheets REST API எழுதுவதற்கு அனுமதி தேவைப்படுகிறது. "கூகுள் சீட் இணைப்பு" (Google Sheet Sync) பக்கத்தில் உள்ள 1-நிமிட Google Apps Script Web App முகவரியை அமைக்கவும்.'
    });
  }
});

// 9. GET /api/sheets/get-bank-sheet & /api/sheets/get-bank-rows - Fetch Banksheet records from Firebase Firestore, SQLite or Google Sheet
const handleGetBankSheet = async (req: express.Request, res: express.Response) => {
  try {
    const rawSheetId = req.query.spreadsheetId as string;
    const spreadsheetId = cleanSpreadsheetId(rawSheetId || '');
    const webAppUrl = req.query.webAppUrl as string;
    const forceRefresh = req.query.forceRefresh === 'true';
    const isAH = req.query.type === 'ah';

    const obFKey = isAH ? 'ah_ob_f' : 'kcc_ob_f';
    const obGKey = isAH ? 'ah_ob_g' : 'kcc_ob_g';
    const defaultSheetName = isAH ? 'AH Banksheet' : 'KCC Banksheet';

    let storedObF = await getAppSettingFromFirestore(obFKey);
    let storedObG = await getAppSettingFromFirestore(obGKey);
    if (storedObF === null) storedObF = await getAppSettingFromDb(obFKey);
    if (storedObG === null) storedObG = await getAppSettingFromDb(obGKey);

    // 1. Check SQLite Database first for instant response (<5ms)
    const dbBank = isAH ? await getAhBankSheetFromDb() : await getBankSheetFromDb();
    if (!forceRefresh && dbBank && dbBank.data && dbBank.data.length > 0) {
      return res.json({
        success: true,
        data: dbBank.data,
        totalCount: dbBank.totalCount,
        obF: storedObF,
        obG: storedObG,
        source: 'sqlite'
      });
    }

    // 2. Check Firebase Firestore Database
    if (!forceRefresh) {
      const fsBankRows = isAH ? await getAhBankRowsFromFirestore() : await getBankRowsFromFirestore();
      if (fsBankRows && fsBankRows.length > 0) {
        // Background sync to local SQLite
        for (const item of fsBankRows) {
          if (isAH) {
            saveAhBankRowToDb(item).catch(() => {});
          } else {
            saveBankRowToDb(item).catch(() => {});
          }
        }
        return res.json({
          success: true,
          data: fsBankRows,
          totalCount: fsBankRows.length,
          obF: storedObF,
          obG: storedObG,
          source: 'firebase'
        });
      }
    }

    if (!spreadsheetId && !webAppUrl) {
      const dbBank = isAH ? await getAhBankSheetFromDb() : await getBankSheetFromDb();
      if (dbBank && dbBank.data) {
        return res.json({
          success: true,
          data: dbBank.data,
          totalCount: dbBank.totalCount,
          obF: storedObF,
          obG: storedObG,
          source: 'sqlite'
        });
      }
      return res.status(400).json({ success: false, error: 'Spreadsheet ID அல்லது Google Apps Script URL தேவை.' });
    }

    let rawRows: any[][] = [];

    // Priority 1: Apps Script Web App URL
    if (webAppUrl && webAppUrl.startsWith('http')) {
      const scriptRes = await postToAppsScript(webAppUrl, {
        action: 'get_bank_sheet',
        sheetName: defaultSheetName
      });

      if (scriptRes && scriptRes.rows && Array.isArray(scriptRes.rows)) {
        rawRows = scriptRes.rows;
      } else {
        try {
          const getRes = await fetch(`${webAppUrl}?sheetName=${encodeURIComponent(defaultSheetName)}`);
          const getData = await getRes.json();
          if (getData && getData.rows && Array.isArray(getData.rows)) {
            rawRows = getData.rows;
          }
        } catch (e) {
          console.log('Apps Script GET bank sheet notice:', e);
        }
      }
    }

    // Priority 2: Google Sheets REST API
    if (rawRows.length === 0 && spreadsheetId) {
      try {
        const sheets = getSheetsClient(req);
        let targetSheet = defaultSheetName;
        try {
          const meta = await sheets.spreadsheets.get({ spreadsheetId });
          const sheetsList = meta.data.sheets || [];
          const found = sheetsList.find(s => {
            const title = String(s.properties?.title || '').trim().toLowerCase();
            return isAH
              ? (title === 'ah banksheet' || title.includes('ah bank') || title.includes('ah_bank'))
              : (title === 'kcc banksheet' || title.includes('banksheet') || title.includes('bank'));
          });
          if (found && found.properties?.title) {
            targetSheet = found.properties.title;
          }
        } catch (e) {}

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${targetSheet}'!A1:K1000`,
        });
        rawRows = response.data.values || [];
      } catch (restErr: any) {
        console.error('REST API read bank sheet notice:', restErr?.message);
      }
    }

    // Priority 3: Public CSV Export fallback
    if (rawRows.length === 0 && spreadsheetId) {
      try {
        const csvUrls = [
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(defaultSheetName)}`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
        ];

        for (const url of csvUrls) {
          const csvRes = await fetch(url);
          if (csvRes.ok) {
            const csvText = await csvRes.text();
            if (csvText && csvText.trim().length > 0 && !csvText.includes('<!DOCTYPE html>')) {
              const parsedRows = parseCSV(csvText);
              if (parsedRows && parsedRows.length > 0) {
                rawRows = parsedRows;
                break;
              }
            }
          }
        }
      } catch (csvErr: any) {
        console.error('CSV fetch read bank sheet notice:', csvErr?.message);
      }
    }

    // Helper to parse numeric values even if formatted with commas or currency symbols
    const parseNum = (val: any): number => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      if (!val) return 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Filter out header row and empty rows (Column A must have Date or OB)
    const dataRows = rawRows.filter(r => {
      if (!r || r.length === 0) return false;
      const col0 = String(r[0] || '').trim();
      const col1 = String(r[1] || '').trim();

      // Require Column A to be present (Date or OB)
      if (!col0) return false;
      
      if (col0 === 'தேதி' || col0.toLowerCase() === 'date' || col0.includes('தேதி') || col1.includes('உறுப்பினர்')) {
        return false;
      }
      return true;
    });

    const items = dataRows.map((r, index) => {
      const rowIndex = index + 2;
      const netVal = parseNum(r[9]);
      const defaultOutstandingText = netVal >= 0 ? 'வங்கியில் அதிகமாக உள்ளது' : 'வங்கிக்கு இன்னும் செலுத்த வேண்டும்';

      const rawF = r[5] !== undefined ? String(r[5]).trim() : '';
      const rawG = r[6] !== undefined ? String(r[6]).trim() : '';
      const rawH = r[7] !== undefined ? String(r[7]).trim() : '';
      const rawI = r[8] !== undefined ? String(r[8]).trim() : '';
      const rawJ = r[9] !== undefined ? String(r[9]).trim() : '';

      return {
        id: `bank-row-${isAH ? 'ah-' : ''}${rowIndex}-${r[0] || index}`,
        rowIndex,
        date: String(r[0] || '').trim(),
        memberPayment: parseNum(r[1]),
        disbursementMemberCount: parseNum(r[2]),
        disbursementAmount: parseNum(r[3]),
        bankPayment: parseNum(r[4]),
        bankLevelBalance: parseNum(r[5]),
        memberLevelTotal: parseNum(r[6]),
        totalMemberCount: parseNum(r[7]),
        totalDisbursedAmount: parseNum(r[8]),
        netMeasure: netVal,
        bankOutstandingStatus: r[10] ? String(r[10]).trim() : defaultOutstandingText,
        colF: rawF || parseNum(r[5]),
        colG: rawG || parseNum(r[6]),
        colH: rawH || parseNum(r[7]),
        colI: rawI || parseNum(r[8]),
        colJ: rawJ || parseNum(r[9]),
      };
    });

    // Sync bank sheet items to SQLite & Firebase
    for (const item of items) {
      if (isAH) {
        saveAhBankRowToDb(item).catch(() => {});
        saveAhBankRowToFirestore(item).catch(() => {});
      } else {
        saveBankRowToDb(item).catch(() => {});
        saveBankRowToFirestore(item).catch(() => {});
      }
    }

    return res.json({
      success: true,
      data: items,
      totalCount: items.length,
      obF: storedObF,
      obG: storedObG
    });
  } catch (error: any) {
    console.error('Error fetching Banksheet from Google Sheet:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Banksheet தரவை பெற முடியவில்லை.',
      details: error?.message || 'Unknown error'
    });
  }
};

app.get('/api/sheets/get-bank-sheet', handleGetBankSheet);
app.get('/api/sheets/get-bank-rows', handleGetBankSheet);

// GET & POST OB Balance Settings (Server-wide across computers)
app.get('/api/settings/kcc-ob', async (req, res) => {
  try {
    let obF = await getAppSettingFromFirestore('kcc_ob_f');
    let obG = await getAppSettingFromFirestore('kcc_ob_g');
    if (obF === null) obF = await getAppSettingFromDb('kcc_ob_f');
    if (obG === null) obG = await getAppSettingFromDb('kcc_ob_g');
    return res.json({ success: true, obF, obG });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/kcc-ob', async (req, res) => {
  try {
    const { obF, obG } = req.body;
    if (obF !== undefined && obF !== null) {
      await saveAppSettingToDb('kcc_ob_f', String(obF));
      await saveAppSettingToFirestore('kcc_ob_f', String(obF));
    }
    if (obG !== undefined && obG !== null) {
      await saveAppSettingToDb('kcc_ob_g', String(obG));
      await saveAppSettingToFirestore('kcc_ob_g', String(obG));
    }
    return res.json({ success: true, message: 'OB Balance saved to cloud server database.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// AH OB Settings
app.get('/api/settings/ah-ob', async (req, res) => {
  try {
    let obF = await getAppSettingFromFirestore('ah_ob_f');
    let obG = await getAppSettingFromFirestore('ah_ob_g');
    if (obF === null) obF = await getAppSettingFromDb('ah_ob_f');
    if (obG === null) obG = await getAppSettingFromDb('ah_ob_g');
    return res.json({ success: true, obF, obG });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/ah-ob', async (req, res) => {
  try {
    const { obF, obG } = req.body;
    if (obF !== undefined && obF !== null) {
      await saveAppSettingToDb('ah_ob_f', String(obF));
      await saveAppSettingToFirestore('ah_ob_f', String(obF));
    }
    if (obG !== undefined && obG !== null) {
      await saveAppSettingToDb('ah_ob_g', String(obG));
      await saveAppSettingToFirestore('ah_ob_g', String(obG));
    }
    return res.json({ success: true, message: 'AH OB Balance saved to cloud server database.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST /api/sheets/add-bank-row - Add row to Firebase Firestore, SQLite and Banksheet
app.post('/api/sheets/add-bank-row', async (req, res) => {
  try {
    const { spreadsheetId: rawSheetId, webAppUrl, bankRow, type } = req.body;
    const spreadsheetId = cleanSpreadsheetId(rawSheetId || '');
    const isAH = type === 'ah' || req.query.type === 'ah' || bankRow?.type === 'ah';

    if (!bankRow) {
      return res.status(400).json({ success: false, error: 'வங்கி கணக்கு விவரங்கள் தேவை.' });
    }

    const obFKey = isAH ? 'ah_ob_f' : 'kcc_ob_f';
    const obGKey = isAH ? 'ah_ob_g' : 'kcc_ob_g';
    const targetSheet = isAH ? 'AH Banksheet' : 'KCC Banksheet';

    // Save OB Settings if passed with the row
    if (bankRow.obF !== undefined && bankRow.obF !== null && bankRow.obF !== '') {
      await saveAppSettingToDb(obFKey, String(bankRow.obF));
      await saveAppSettingToFirestore(obFKey, String(bankRow.obF));
    }
    if (bankRow.obG !== undefined && bankRow.obG !== null && bankRow.obG !== '') {
      await saveAppSettingToDb(obGKey, String(bankRow.obG));
      await saveAppSettingToFirestore(obGKey, String(bankRow.obG));
    }

    // 1. Save into local SQLite DB instantly (<1ms)
    if (isAH) {
      await saveAhBankRowToDb(bankRow);
      saveAhBankRowToFirestore(bankRow).catch(e => console.log('Firestore bg save notice:', e));
    } else {
      await saveBankRowToDb(bankRow);
      saveBankRowToFirestore(bankRow).catch(e => console.log('Firestore bg save notice:', e));
    }

    // 3. Background async sync to Google Sheets if configured
    if (webAppUrl || spreadsheetId) {
      (async () => {
        const HEADERS = [
          'தேதி',
          'உறுப்பினர் செலுத்துதல்',
          'பட்டுவாடா உறுப்பினர்',
          'பட்டுவாடா தொகை',
          'வங்கிக்கு செலுத்துதல்',
          'வங்கி அளவு',
          'மெம்பர் அளவு',
          'மொத்த உறுப்பினர் எண்ணிக்கை',
          'இதுவரை பட்டுவாடா செய்தது',
          'தொகையின் அளவீடு',
          'வங்கியின் நிலுவை தொகை'
        ];

        const r = bankRow || {};
        const netVal = r.netMeasure ?? 0;
        const defaultOutstandingText = netVal >= 0 ? 'வங்கியில் அதிகமாக உள்ளது' : 'வங்கிக்கு இன்னும் செலுத்த வேண்டும்';

        const rowValues = [
          r.date || new Date().toISOString().split('T')[0],
          r.memberPayment ?? 0,
          r.disbursementMemberCount ?? 0,
          r.disbursementAmount ?? 0,
          r.bankPayment ?? 0,
          r.bankLevelBalance ?? 0,
          r.memberLevelTotal ?? 0,
          r.totalMemberCount ?? 0,
          r.totalDisbursedAmount ?? 0,
          r.netMeasure ?? 0,
          r.bankOutstandingStatus || defaultOutstandingText
        ];

        if (webAppUrl && webAppUrl.startsWith('http')) {
          await postToAppsScript(webAppUrl, {
            action: 'append',
            sheetName: targetSheet,
            headers: HEADERS,
            rowValues
          });
        } else if (spreadsheetId) {
          const sheets = getSheetsClient(req);
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${targetSheet}'!A:K`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [rowValues] },
          });
        }
      })().catch(e => console.log('Google Sheet bg sync error:', e?.message || e));
    }

    return res.json({
      success: true,
      message: `${targetSheet} விவரங்கள் SQLite தரவுத்தளத்தில் சேமிக்கப்பட்டன!`
    });
  } catch (error: any) {
    console.error('Error adding bank row:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'Banksheet தரவை பெற/எழுத இயலவில்லை.',
      details: error?.message || 'Unknown error'
    });
  }
});

// Helper to find matching bank row index in Banksheet
function findBankRowIndex(rows: any[][], targetRowIndex?: number, targetDate?: string, targetMemberPayment?: number, targetDisbAmount?: number, targetBankPayment?: number): number {
  if (!rows || rows.length <= 1) return -1;

  const normTargetDate = String(targetDate || '').trim().toLowerCase();

  const parseDateParts = (str: string) => {
    if (!str) return null;
    const clean = str.trim().split(' ')[0].split('t')[0].split('T')[0];
    const parts = clean.split(/[-/.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return { y: parts[0], m: parseInt(parts[1], 10), d: parseInt(parts[2], 10) };
      } else if (parts[2].length === 4) {
        return { y: parts[2], m: parseInt(parts[1], 10), d: parseInt(parts[0], 10) };
      }
    }
    return null;
  };

  const targetParts = parseDateParts(normTargetDate);
  const isObTarget = normTargetDate.includes('ob') || normTargetDate.includes('open') || normTargetDate.includes('ஆரம்ப');

  // 1. Priority check: targetRowIndex if within valid bounds and row exists
  if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= rows.length) {
    const candidateRow = rows[targetRowIndex - 1] || [];
    const rDate = String(candidateRow[0] || '').trim().toLowerCase();
    
    if (!normTargetDate || rDate === normTargetDate || (isObTarget && (rDate.includes('ob') || rDate.includes('open') || rDate.includes('ஆரம்ப')))) {
      return targetRowIndex;
    }
    const candidateParts = parseDateParts(rDate);
    if (targetParts && candidateParts && targetParts.y === candidateParts.y && targetParts.m === candidateParts.m && targetParts.d === candidateParts.d) {
      return targetRowIndex;
    }
    const rMemberPay = parseFloat(String(candidateRow[1] || 0).replace(/[^0-9.-]/g, '')) || 0;
    const rDisbAmt = parseFloat(String(candidateRow[3] || 0).replace(/[^0-9.-]/g, '')) || 0;
    const rBankPay = parseFloat(String(candidateRow[4] || 0).replace(/[^0-9.-]/g, '')) || 0;
    let candidateAmtMatch = true;
    if (targetMemberPayment !== undefined && Math.abs(rMemberPay - targetMemberPayment) > 1) candidateAmtMatch = false;
    if (targetDisbAmount !== undefined && Math.abs(rDisbAmt - targetDisbAmount) > 1) candidateAmtMatch = false;
    if (targetBankPayment !== undefined && Math.abs(rBankPay - targetBankPayment) > 1) candidateAmtMatch = false;
    if (candidateAmtMatch) {
      return targetRowIndex;
    }
  }

  // 2. Try exact match on date AND payment amounts
  for (let i = rows.length - 1; i >= 1; i--) {
    const r = rows[i] || [];
    const rDate = String(r[0] || '').trim().toLowerCase();
    const rMemberPay = parseFloat(String(r[1] || 0).replace(/[^0-9.-]/g, '')) || 0;
    const rDisbAmt = parseFloat(String(r[3] || 0).replace(/[^0-9.-]/g, '')) || 0;
    const rBankPay = parseFloat(String(r[4] || 0).replace(/[^0-9.-]/g, '')) || 0;

    let dateMatch = false;
    if (rDate && normTargetDate) {
      if (rDate === normTargetDate || rDate.includes(normTargetDate) || normTargetDate.includes(rDate)) {
        dateMatch = true;
      } else if (isObTarget && (rDate.includes('ob') || rDate.includes('open') || rDate.includes('ஆரம்ப'))) {
        dateMatch = true;
      } else {
        const rowParts = parseDateParts(rDate);
        if (targetParts && rowParts) {
          if (targetParts.y === rowParts.y && targetParts.m === rowParts.m && targetParts.d === rowParts.d) {
            dateMatch = true;
          }
        }
      }
    }

    if (dateMatch) {
      let amtMatch = true;
      if (targetMemberPayment !== undefined && Math.abs(rMemberPay - targetMemberPayment) > 1) amtMatch = false;
      if (targetDisbAmount !== undefined && Math.abs(rDisbAmt - targetDisbAmount) > 1) amtMatch = false;
      if (targetBankPayment !== undefined && Math.abs(rBankPay - targetBankPayment) > 1) amtMatch = false;

      if (amtMatch) {
        return i + 1; // 1-based index
      }
    }
  }

  // 3. Fallback: match by date alone
  if (normTargetDate) {
    for (let i = rows.length - 1; i >= 1; i--) {
      const r = rows[i] || [];
      const rDate = String(r[0] || '').trim().toLowerCase();
      if (rDate) {
        if (rDate === normTargetDate || rDate.includes(normTargetDate) || normTargetDate.includes(rDate)) {
          return i + 1;
        }
        if (isObTarget && (rDate.includes('ob') || rDate.includes('open') || rDate.includes('ஆரம்ப'))) {
          return i + 1;
        }
        const rowParts = parseDateParts(rDate);
        if (targetParts && rowParts) {
          if (targetParts.y === rowParts.y && targetParts.m === rowParts.m && targetParts.d === rowParts.d) {
            return i + 1;
          }
        }
      }
    }
  }

  // 4. Fallback: targetRowIndex
  if (targetRowIndex && targetRowIndex >= 2 && targetRowIndex <= rows.length) {
    return targetRowIndex;
  }

  return -1;
}

// 11. POST /api/sheets/update-bank-row - Update a row in SQLite and Banksheet
app.post('/api/sheets/update-bank-row', async (req, res) => {
  try {
    const { spreadsheetId: rawSheetId, webAppUrl, rowIndex, date, bankRow, type } = req.body;
    const spreadsheetId = cleanSpreadsheetId(rawSheetId || '');
    const isAH = type === 'ah' || req.query.type === 'ah' || bankRow?.type === 'ah';

    const r = bankRow || {};
    const targetSheet = isAH ? 'AH Banksheet' : 'KCC Banksheet';

    // 1. Update in SQLite & Firebase Firestore
    if (bankRow) {
      if (isAH) {
        await updateAhBankRowInDb(bankRow, bankRow.id, date, rowIndex);
        await saveAhBankRowToFirestore(bankRow);
      } else {
        await updateBankRowInDb(bankRow, bankRow.id, date, rowIndex);
        await saveBankRowToFirestore(bankRow);
      }
    }

    // 2. Async sync to Google Sheets if configured
    if (webAppUrl || spreadsheetId) {
      const HEADERS = [
        'தேதி',
        'உறுப்பினர் செலுத்துதல்',
        'பட்டுவாடா உறுப்பினர்',
        'பட்டுவாடா தொகை',
        'வங்கிக்கு செலுத்துதல்',
        'வங்கி அளவு',
        'மெம்பர் அளவு',
        'மொத்த உறுப்பினர் எண்ணிக்கை',
        'இதுவரை பட்டுவாடா செய்தது',
        'தொகையின் அளவீடு',
        'வங்கியின் நிலுவை தொகை'
      ];

      const netVal = r.netMeasure ?? 0;
      const defaultOutstandingText = netVal >= 0 ? 'வங்கியில் அதிகமாக உள்ளது' : 'வங்கிக்கு இன்னும் செலுத்த வேண்டும்';

      const rowValues = [
        r.date || date || new Date().toISOString().split('T')[0],
        r.memberPayment ?? 0,
        r.disbursementMemberCount ?? 0,
        r.disbursementAmount ?? 0,
        r.bankPayment ?? 0,
        r.bankLevelBalance ?? 0,
        r.memberLevelTotal ?? 0,
        r.totalMemberCount ?? 0,
        r.totalDisbursedAmount ?? 0,
        r.netMeasure ?? 0,
        r.bankOutstandingStatus || defaultOutstandingText
      ];

      if (webAppUrl && webAppUrl.startsWith('http')) {
        postToAppsScript(webAppUrl, {
          action: 'update_bank_row',
          sheetName: targetSheet,
          rowIndex,
          date: r.date || date,
          bankRow: r,
          rowValues
        }).catch(e => console.log('Apps Script update bank row notice:', e));
      } else if (spreadsheetId) {
        try {
          const sheets = getSheetsClient(req);
          const meta = await sheets.spreadsheets.get({ spreadsheetId });
          const sheetsList = meta.data.sheets || [];
          const sheetObj = sheetsList.find(
            s => {
              const title = String(s.properties?.title || '').trim().toLowerCase();
              return isAH
                ? (title === 'ah banksheet' || title.includes('ah bank') || title.includes('ah_bank'))
                : (title === 'kcc banksheet' || title.includes('banksheet') || title.includes('bank'));
            }
          );

          if (sheetObj) {
            const sheetTitle = sheetObj.properties?.title || targetSheet;
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `'${sheetTitle}'!A1:K1000`,
            });
            const rows = response.data.values || [];
            const targetRowNumber = findBankRowIndex(
              rows,
              rowIndex,
              r.date || date,
              r.memberPayment,
              r.disbursementAmount,
              r.bankPayment
            );

            if (targetRowNumber >= 2) {
              await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetTitle}'!A${targetRowNumber}:K${targetRowNumber}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [rowValues] },
              });
            }
          }
        } catch (err: any) {
          console.log('Google Sheet update bank row async notice:', err?.message);
        }
      }
    }

    return res.json({
      success: true,
      message: 'தரவுத்தளத்தில் பதிவு வெற்றியுடன் புதுப்பிக்கப்பட்டது!'
    });
  } catch (error: any) {
    console.error('Error updating bank row:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'பதிவைப் புதுப்பிப்பதில் பிழை ஏற்பட்டது.',
      details: error?.message || 'Unknown error'
    });
  }
});

// 12. POST /api/sheets/delete-bank-row - Delete a row from SQLite and optionally Banksheet
app.post('/api/sheets/delete-bank-row', async (req, res) => {
  try {
    const { id, spreadsheetId: rawSheetId, webAppUrl, rowIndex, date, memberPayment, disbursementAmount, bankPayment, type } = req.body;
    const spreadsheetId = cleanSpreadsheetId(rawSheetId || '');
    const isAH = type === 'ah' || req.query.type === 'ah';
    const targetSheet = isAH ? 'AH Banksheet' : 'KCC Banksheet';

    // 1. Delete from SQLite DB & Firebase Firestore
    if (isAH) {
      await deleteAhBankRowFromDb(id || date, rowIndex, date);
      if (id) await deleteAhBankRowFromFirestore(id);
    } else {
      await deleteBankRowFromDb(id || date, rowIndex, date);
      if (id) await deleteBankRowFromFirestore(id);
    }

    // 2. Async sync to Google Sheets if configured
    if (webAppUrl && webAppUrl.startsWith('http')) {
      try {
        await postToAppsScript(webAppUrl, {
          action: 'delete_bank_row',
          sheetName: targetSheet,
          rowIndex,
          date,
          memberPayment,
          disbursementAmount,
          bankPayment
        });
      } catch (e) {
        console.log('Apps Script delete bank row notice:', e);
      }
    } else if (spreadsheetId) {
      try {
        const sheets = getSheetsClient(req);
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetsList = meta.data.sheets || [];
        const sheetObj = sheetsList.find(
          s => {
            const title = String(s.properties?.title || '').trim().toLowerCase();
            return isAH
              ? (title === 'ah banksheet' || title.includes('ah bank') || title.includes('ah_bank'))
              : (title === 'kcc banksheet' || title.includes('banksheet') || title.includes('bank'));
          }
        );

        if (sheetObj && sheetObj.properties?.sheetId !== undefined) {
          const sheetId = sheetObj.properties.sheetId;
          const sheetTitle = sheetObj.properties.title || targetSheet;

          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetTitle}'!A1:K1000`,
          });
          const rows = response.data.values || [];

          const targetRowNumber = findBankRowIndex(
            rows,
            rowIndex,
            date,
            memberPayment,
            disbursementAmount,
            bankPayment
          );

          if (targetRowNumber >= 2) {
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId,
              requestBody: {
                requests: [
                  {
                    deleteDimension: {
                      range: {
                        sheetId,
                        dimension: 'ROWS',
                        startIndex: targetRowNumber - 1,
                        endIndex: targetRowNumber
                      }
                    }
                  }
                ]
              }
            });
          }
        }
      } catch (err: any) {
        console.log('Google Sheet delete bank row async notice:', err?.message);
      }
    }

    return res.json({
      success: true,
      message: 'பதிவு வெற்றியுடன் நீக்கப்பட்டது!'
    });
  } catch (error: any) {
    console.error('Error deleting bank row:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: 'பதிவை நீக்குவதில் பிழை ஏற்பட்டது.',
      details: error?.message || 'Unknown error'
    });
  }
});

app.post('/api/sheets/clear-all-bank-rows', async (req, res) => {
  try {
    const isAH = req.body?.type === 'ah' || req.query.type === 'ah';
    if (isAH) {
      await clearAllAhBankRowsFromDb();
    } else {
      await clearAllBankRowsFromDb();
    }
    return res.json({ success: true, message: 'அனைத்து பதிவுகளும் நீக்கப்பட்டன.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

// 13. SQLite DB Management APIs
app.get('/api/sqlite/status', async (req, res) => {
  try {
    const status = await getSqliteStatus();
    return res.json({ success: true, status });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

app.post('/api/sqlite/clear', async (req, res) => {
  try {
    const result = await clearAllDbTables();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

// 14. Firebase Cloud Database Status API
app.get('/api/firebase/status', async (req, res) => {
  try {
    const db = getFirebaseDb();
    if (!db) {
      return res.json({ connected: false, message: 'Firebase configuration not found.' });
    }
    const bankRows = await getBankRowsFromFirestore();
    const members = await getMembersFromFirestore();
    const paduvada = await getPaduvadaFromFirestore();
    const ahBankRows = await getAhBankRowsFromFirestore();
    const ahPaduvada = await getAhPaduvadaFromFirestore();
    return res.json({
      connected: true,
      bankRowsCount: bankRows ? bankRows.length : 0,
      membersCount: members ? members.length : 0,
      paduvadaCount: paduvada ? paduvada.length : 0,
      ahBankRowsCount: ahBankRows ? ahBankRows.length : 0,
      ahPaduvadaCount: ahPaduvada ? ahPaduvada.length : 0
    });
  } catch (error: any) {
    return res.status(500).json({ connected: false, error: error?.message });
  }
});

async function startServer() {
  // Vite middleware for development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TU3 PACCS Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
