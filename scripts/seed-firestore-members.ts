import { getFirebaseDb } from '../server/firebase-service';
import { collection, doc, writeBatch } from 'firebase/firestore';
import https from 'https';

const spreadsheetId = '1YJlGj7g2yH9kN_2-JVEuuHrIQhJ_ZGvHgGPh_Xg13pI';
const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=Loanmember`;

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

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', async () => {
    try {
      const rows = parseCSV(data);
      console.log(`Fetched ${rows.length} rows.`);
      if (rows.length <= 1) {
        console.error('No data rows found');
        return;
      }

      const dataRows = rows.slice(1);
      const members = dataRows.map((r, idx) => {
        const aClass = (r[0] || '').replace(/^"|"$/g, '').trim() || String(1001 + idx);
        const sb = (r[1] || '').replace(/^"|"$/g, '').trim();
        const erp = (r[2] || '').replace(/^"|"$/g, '').trim();
        const ins = (r[3] || '').replace(/^"|"$/g, '').trim();
        const name = (r[4] || '').replace(/^"|"$/g, '').trim() || 'உறுப்பினர்';
        const careOf = (r[5] || '').replace(/^"|"$/g, '').trim();
        const door = (r[6] || '').replace(/^"|"$/g, '').trim();
        const street = (r[7] || '').replace(/^"|"$/g, '').trim();
        const village = (r[8] || '').replace(/^"|"$/g, '').trim();
        const adhar = (r[9] || '').replace(/^"|"$/g, '').trim();
        const mobile = (r[10] || '').replace(/^"|"$/g, '').trim();
        const rationCard = (r[11] || '').replace(/^"|"$/g, '').trim();
        const namini = (r[12] || '').replace(/^"|"$/g, '').trim();
        const relation = (r[13] || '').replace(/^"|"$/g, '').trim();
        const mdcc = (r[14] || '').replace(/^"|"$/g, '').trim();
        const caste = (r[15] || '').replace(/^"|"$/g, '').trim();
        const gender = (r[16] || '').replace(/^"|"$/g, '').trim() || 'Male';
        const totalShare = (r[18] || '').replace(/^"|"$/g, '').trim() || '0';

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
          aadharNo: adhar,
          adhar,
          mobile,
          rationCard,
          namini,
          relation,
          mdcc,
          caste,
          gender,
          totalShare,
          landAcres: Number(totalShare.replace(/[^0-9.]/g, '')) || 0,
          kccAccountNo: sb || mdcc,
          bankBranch: 'TU3 PACCS தலைமை கிளை',
          updatedAt: new Date().toISOString()
        };
      });

      console.log(`Parsed ${members.length} members. Seeding to Firestore...`);

      const db = getFirebaseDb();
      if (!db) {
        console.error('Cannot connect to Firestore DB');
        return;
      }

      // Firestore batches have limit of 500 operations
      const batchSize = 200;
      for (let i = 0; i < members.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = members.slice(i, i + batchSize);
        chunk.forEach(m => {
          const docRef = doc(db, 'members', `mem_${m.memberNo}`);
          batch.set(docRef, m, { merge: true });
        });
        await batch.commit();
        console.log(`Committed chunk ${i + 1} to ${i + chunk.length}`);
      }

      console.log('✅ ALL MEMBERS SEEDED TO FIRESTORE SUCCESSFULLY!');
    } catch (err) {
      console.error('Error during seeding:', err);
    }
  });
});
