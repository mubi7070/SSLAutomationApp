import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";

const getMonthsHeader = (months) => {
  const date = new Date();
  const monthNames = [];
  
  for (let i = 1; i <= months; i++) {
    date.setMonth(date.getMonth() + 1);
    monthNames.push(date.toLocaleString('default', { month: 'long' }));
  }
  
  return monthNames.join(', ');
};

export const updateLicenseSheet = async (data, months) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), "google-service-account.json"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_LICENSE_SHEET_ID;

    // Get current data length
    const { data: sheetData } = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'License!A:A',
    });

    const lastRow = sheetData.values ? sheetData.values.length : 0;
    const startRow = lastRow + 2;

    // Batch update for formatting
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          updateCells: {
            range: {
              sheetId: await getSheetId(sheets, spreadsheetId, 'License'),
              startRowIndex: startRow,
              endRowIndex: startRow + data.length + 3,
              startColumnIndex: 0,
              endColumnIndex: 4
            },
            rows: [
              {
                values: [{
                  userEnteredValue: { stringValue: `${getMonthsHeader(months)} License Expiry` },
                  userEnteredFormat: {
                    textFormat: { bold: true },
                    horizontalAlignment: "CENTER"
                  }
                }]
              },
              {
                values: ['Client Name', 'Source Key', 'Active Key', 'Key Expiry Date'].map(text => ({
                  userEnteredValue: { stringValue: text },
                  userEnteredFormat: { textFormat: { bold: true } }
                }))
              }
            ],
            fields: "userEnteredValue,userEnteredFormat"
          }
        }]
      }
    });

    // Insert data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `License!A${startRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [''], // Blank row
          [`${getMonthsHeader(months)} License Expiry`],
          ['Client Name', 'Source Key', 'Active Key', 'Key Expiry Date'],
          ...data.map(row => Object.values(row))
        ]
      }
    });

    return { success: true, inserted: data.length };

  } catch (error) {
    console.error("Sheet update error:", error);
    throw new Error(`Sheet update failed: ${error.message}`);
  }
};

const getSheetId = async (sheets, spreadsheetId, sheetName) => {
  const { data: { sheets: allSheets } } = await sheets.spreadsheets.get({ spreadsheetId });
  const licenseSheet = allSheets.find(s => s.properties.title === sheetName);
  return licenseSheet.properties.sheetId;
};