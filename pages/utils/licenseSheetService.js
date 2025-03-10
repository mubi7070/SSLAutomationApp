import { google } from "googleapis";
import { promises as fs } from "fs";
import path from "path";

export const updateLicenseSheet = async (data) => {
    try {
        // Load service account credentials
        const credentialsPath = path.join(process.cwd(), "google-service-account.json");
        const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));

        // Authenticate with Google Sheets API
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: credentials.client_email,
                private_key: credentials.private_key,
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheetId = process.env.GOOGLE_LICENSE_SHEET_ID;
        const range = "License!A:F"; // Update with your column structure

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: {
                values: data.map(item => [
                    item.license_key,
                    item.application_name,
                    item.expiration_date,
                    item.client_name,
                    item.contact_email,
                    new Date().toISOString().split('T')[0] // LastUpdated
                ])
            },
        });

        return {
            success: true,
            updatedRange: response.data.updates.updatedRange,
            updatedRows: response.data.updates.updatedRows
        };

    } catch (error) {
        console.error("License Sheet Update Error:", error);
        throw new Error(`Google Sheet update failed: ${error.message}`);
    }
};