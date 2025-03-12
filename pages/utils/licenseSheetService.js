import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";

const getNextTwoMonths = () => {
  const months = [];
  const date = new Date();
  for (let i = 1; i <= 2; i++) {
    date.setMonth(date.getMonth() + 1);
    months.push(date.toLocaleString('default', { month: 'long' }));
  }
  return months.join(' & ');
};

export const updateLicenseSheet = async (data) => {
  try {
    const credentialsPath = path.join(process.cwd(), "google-service-account.json");
    const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_LICENSE_SHEET_ID;

    // Get current sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'License!A:A',
    });

    const lastRow = response.data.values ? response.data.values.length : 0;
    const startRow = lastRow + 2; // Leave blank row after previous data

    // Prepare batch update requests
    const requests = [
        // Insert empty rows first
        {
          insertDimension: {
            range: {
              sheetId: 0,
              dimension: "ROWS",
              startIndex: startRow - 1,
              endIndex: startRow + data.length + 2
            },
            inheritFromBefore: false
          }
        },
        // Add header formatting
        {
          updateCells: {
            range: {
              sheetId: 0,
              startRowIndex: startRow,
              endRowIndex: startRow + 2,
              startColumnIndex: 0,
              endColumnIndex: 4
            },
            rows: [
              {
                values: [{
                  userEnteredValue: { stringValue: `${getNextTwoMonths()} License Expiry` },
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
            fields: "userEnteredValue,userEnteredFormat.textFormat.bold,userEnteredFormat.horizontalAlignment"
          }
        }
      ];

        // Execute batch update first
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: { requests }
          });
      
          // Now add the data values
          const dataValues = [
            [''], // Blank row
            [`${getNextTwoMonths()} License Expiry`],
            ['Client Name', 'Source Key', 'Active Key', 'Key Expiry Date'],
            ...data.map(item => [
              item.client_name,
              item.source_key,
              item.active_key,
              item.key_expire
            ])
          ];
      
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `License!A${startRow}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: dataValues }
          });
      
          return {
            success: true,
            insertedRows: data.length,
            startRow: startRow + 3 // Account for header rows
          };
      
        } catch (error) {
          console.error("License Sheet Update Error:", error);
          throw new Error(`Google Sheet update failed: ${error.message}`);
        }
      };