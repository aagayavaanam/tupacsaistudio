import { LoanMember } from '../types';
import { formatMobile, formatAadhar } from './formatters';

export const DEFAULT_SPREADSHEET_ID = '1YJlGj7g2yH9kN_2-JVEuuHrIQhJ_ZGvHgGPh_Xg13pI';

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

export async function fetchMembersFromGoogleSheet(spreadsheetId: string = DEFAULT_SPREADSHEET_ID): Promise<{ success: boolean; members: LoanMember[]; error?: string }> {
  const cleanId = spreadsheetId ? spreadsheetId.replace(/\/d\/([a-zA-Z0-9-_]+)/, '$1').trim() : DEFAULT_SPREADSHEET_ID;

  // 1. First attempt: via local/backend API (if running with backend proxy)
  try {
    const res = await fetch(`/api/sheets/members?spreadsheetId=${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.members && data.members.length > 0) {
        return { success: true, members: data.members };
      }
    }
  } catch (e) {
    // Backend API not reachable (e.g. running statically on Vercel/Netlify/GitHub Pages)
  }

  // 2. Second attempt: Direct Google Sheets GViz CSV export (Works 100% on static Vercel/GitHub Pages if sheet is set to Anyone with link can view)
  const candidateUrls = [
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv&sheet=Loanmember`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&gid=0`
  ];

  for (const url of candidateUrls) {
    try {
      const csvRes = await fetch(url);
      if (csvRes.ok) {
        const text = await csvRes.text();
        // If Google redirects to HTML login page, it means the sheet is private
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('ServiceLogin')) {
          const rows = parseCSV(text);
          if (rows.length > 0) {
            const firstRowCombined = (rows[0] || []).join(' ').toLowerCase();
            const isHeaderRow = 
              firstRowCombined.includes('class') || 
              firstRowCombined.includes('name') || 
              firstRowCombined.includes('member') || 
              firstRowCombined.includes('பெயர்') || 
              firstRowCombined.includes('village');

            const headers = isHeaderRow ? rows[0].map(h => (h || '').replace(/^"|"$/g, '').trim()) : [];
            const dataRows = isHeaderRow ? rows.slice(1) : rows;

            const members: LoanMember[] = dataRows.map((row: string[], index: number) => {
              const cleanRow = row.map(c => (c || '').replace(/^"|"$/g, '').trim());

              const getVal = (aliases: string[], fallbackIdx: number) => {
                for (const alias of aliases) {
                  const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const idx = headers.findIndex(h => {
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

              const aClass = getVal(['a class', 'aclass', 'a-class', 'memberno', 'member no', 'உறுப்பினர் எண்'], 0) || String(1001 + index);
              const sb = getVal(['sb', 's.b', 'sb ac', 'sb account', 'வங்கி கணக்கு'], 1);
              const erp = getVal(['erp', 'erp no', 'erp code'], 2);
              const ins = getVal(['ins', 'initial', 'தலைப்பெழுத்து'], 3);
              const name = getVal(['name', 'member name', 'பெயர்', 'உறுப்பினர் பெயர்'], 4) || 'உறுப்பினர்';
              const careOf = getVal(['c/o', 'care of', 'father', 'husband', 'தந்தை / கணவர் பெயர்', 'தந்தை/கணவர்'], 5);
              const door = getVal(['door', 'door no', 'கதவு எண்'], 6);
              const street = getVal(['street', 'தெரு'], 7);
              const village = getVal(['village', 'கிராமம்'], 8);
              const adhar = getVal(['adhar', 'aadhar', 'ஆதார்', 'ஆதார் எண்'], 9);
              const mobile = getVal(['mobile', 'phone', 'கைபேசி', 'அலைபேசி'], 10);
              const rationCard = getVal(['ration card', 'குடும்ப அட்டை'], 11);
              const namini = getVal(['namini', 'nominee', 'வாரிசுதாரர்'], 12);
              const relation = getVal(['relation', 'உறவுமுறை'], 13);
              const mdcc = getVal(['mdcc', 'எம்டிசிசி'], 14);
              const caste = getVal(['caste', 'பிரிவு'], 15);
              const gender = getVal(['gender', 'பாலினம்'], 16) || 'Male';
              const totalShare = getVal(['total share', 'share', 'பங்கு', 'பங்கு தொகை'], 17) || '100';

              return {
                memberNo: aClass,
                aClass,
                sb,
                erp,
                ins,
                name,
                fatherOrHusbandName: careOf,
                careOf,
                door,
                street,
                village,
                aadharNo: formatAadhar(adhar),
                adhar: formatAadhar(adhar),
                mobile: formatMobile(mobile),
                rationCard,
                namini,
                relation,
                mdcc,
                caste,
                gender,
                totalShare,
                landAcres: Number(String(totalShare).replace(/[^0-9]/g, '')) || 0,
                kccAccountNo: sb || mdcc,
                bankBranch: 'TU3 PACCS தலைமை கிளை'
              };
            });

            if (members.length > 0) {
              return { success: true, members };
            }
          }
        }
      }
    } catch (err) {
      // Continue to next candidate
    }
  }

  return { 
    success: false, 
    members: [], 
    error: 'Google Sheet அணுகல் கிடைக்கவில்லை. உங்கள் Google Sheet-ல் Share -> Anyone with the link can view என மாற்றவும்.' 
  };
}
