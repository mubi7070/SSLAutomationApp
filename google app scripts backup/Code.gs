function syncSSLToNSSupport(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("SSL");
  var targetSheet = ss.getSheetByName("NS Support");

  if (!sourceSheet || !targetSheet) {
    Logger.log("One of the sheets does not exist.");
    return;
  }

  // Get the data from A:F in SSL sheet
  var sourceRange = sourceSheet.getRange("A:F");
  var sourceData = sourceRange.getValues();

  // Get the existing data in NS Support sheet
  var targetRange = targetSheet.getRange(1, 1, sourceData.length, sourceData[0].length);
  
  // Paste the data in NS Support sheet A:F (keeping G onwards intact)
  targetRange.setValues(sourceData);
}
