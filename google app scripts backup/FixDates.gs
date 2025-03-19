function fixColumnDDateFormat() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("License"); 
  const range = sheet.getRange("D2:D" + sheet.getLastRow());
  const values = range.getValues();

  const converted = values.map(row => {
    const iso = row[0];
    if (typeof iso === "string" && iso.includes("T")) {
      const date = new Date(iso);
      if (!isNaN(date)) {
        return [date]; // Parsed as actual Date object
      }
    }
    return [row[0]]; // Keep original if parsing fails
  });

  range.setValues(converted);

  // Apply date format
  range.setNumberFormat("yyyy-mm-dd");
}
