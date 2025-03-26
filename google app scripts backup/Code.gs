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

function trackSSLModification(e) {
  const props = PropertiesService.getScriptProperties();
  const sslSheet = SpreadsheetApp.getActive().getSheetByName("SSL");
  
  if (!sslSheet || sslSheet.getSheetId() !== e.source.getActiveSheet().getSheetId()) return;
  
  props.setProperties({
    'lastSSLModified': new Date().toISOString(),
    'lastSSLLastRow': sslSheet.getLastRow().toString()
  });
}

function checkAndProcessSSL() {
  const props = PropertiesService.getScriptProperties();
  const lastModified = props.getProperty('lastSSLModified');
  
  if (!lastModified) return;
  
  const now = new Date();
  const diffMinutes = (now - new Date(lastModified)) / (1000 * 60);
  
  if (diffMinutes >= 1 && diffMinutes <= 3) {
    props.deleteProperty('lastSSLModified');
    syncSSLToNSSupport();
  }
}


function processNewData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("License");
  var data = sheet.getDataRange().getValues();
  
  // 1. Find the latest valid API block
  var block = findLatestDataBlock(data);
  if (!block) return;
  
  // 2. Calculate sheet rows for deletion (1-based)
  var sheetStartRow = block.start + 1; // Convert data index to sheet row
  var rowsToDelete = block.end - block.start + 2; // Include header and blank
  
  // 3. Remove only the API block
  sheet.deleteRows(sheetStartRow - 2, rowsToDelete);
  
  // 4. Deduplicate and rebuild new data
  var existingData = data.slice(0, block.start - 2);
  var filteredData = deduplicateNewData(block.data, existingData);
  
  // 5. Reinsert formatted data at end
  if (filteredData.length > 0) {
    var output = [
      ['','','',''], // Blank row
      ['','','',''], // Blank row
      [block.header[0], '', '', ''], // Month header
      ['Client Name', 'Source Key', 'Active Key', 'Key Expiry Date']
    ].concat(filteredData);
    
    sheet.getRange(sheet.getLastRow() + 1, 1, output.length, 4)
      .setValues(output);
  }
}

function findLatestDataBlock(data) {
  // Find last valid API block with 2 blanks + header
  for (var i = data.length - 1; i >= 2; i--) {
    if (data[i-2].join("").trim() === "" && 
       data[i-1].join("").trim() === "" &&
       data[i][0].includes("License Expiry")) {
      
      var end = data.length;
      for (var j = i + 2; j < data.length; j++) {
        if (data[j][0] === "") {
          end = j;
          break;
        }
      }
      
      return {
        start: i,    // Month header data index
        end: end,
        data: data.slice(i + 1, end), // Skip month header
        header: data[i]
      };
    }
  }
  return null;
}

// Keep existing deduplicateNewData and isDataRow functions unchanged

function deduplicateNewData(newBlockData, existingData) {
  var existingKeys = new Set();
  
  // Build keys from existing data (A,B,D)
  existingData.forEach(row => {
    if (row[0] && row[0] !== "Client Name" && !row[0].includes("License Expiry")) {
      existingKeys.add([row[0], row[1], row[3]].join("|"));
    }
  });

  // Filter new data
  var filtered = [];
  var newKeys = new Set();
  
  newBlockData.forEach(row => {
    // Explicitly skip column headers
    if (row[0] === "Client Name") return;
    
    if (!isDataRow(row)) {
      filtered.push(row); // Keep month headers
    } else {
      var key = [row[0], row[1], row[3]].join("|");
      if (!existingKeys.has(key) && !newKeys.has(key)) {
        newKeys.add(key);
        filtered.push(row);
      }
    }
  });
  
  return filtered;
}

function isDataRow(row) {
  return row[0] && 
         row[0] !== "Client Name" && 
         !row[0].includes("License Expiry");
}

function updateSheet(sheet, block, newData) {
  // Clear original API block (including 2 blank rows)
  if (block.end > block.start) {
    sheet.deleteRows(block.start - 2, block.end - block.start + 3);
  }

  // Insert filtered data with proper 4-column structure
  if (newData.length > 0) {
    var output = [
      ['','','',''], // Blank row (4 columns)
      ['','','',''], // Blank row (4 columns)
      [block.header[0], '', '', ''], // Month header (4 columns)
      ['Client Name', 'Source Key', 'Active Key', 'Key Expiry Date']
    ].concat(newData);
    
    sheet.getRange(sheet.getLastRow() + 1, 1, output.length, 4)
      .setValues(output);
  }
}

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

function setupTriggers() {
  // Delete only LICENSE triggers
  const licenseTriggers = ['trackModification', 'checkAndProcess'];
  
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkAndProcess') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Recreate License triggers
  ScriptApp.newTrigger('trackModification')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();

  ScriptApp.newTrigger('checkAndProcess')
    .timeBased()
    .everyMinutes(1) // Changed from 2 to 1 minute
    .create();

  // Keep SSL triggers separate
  const sslTriggers = ['trackSSLModification', 'checkAndProcessSSL'];
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (sslTriggers.includes(trigger.getHandlerFunction())) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('trackSSLModification')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();
    
  ScriptApp.newTrigger('checkAndProcessSSL')
    .timeBased()
    .everyMinutes(1)
    .create();
}




function initialSetup() {
  const ss = SpreadsheetApp.getActive();
  
  // Initialize License tracking
  const licenseSheet = ss.getSheetByName("License");
  PropertiesService.getScriptProperties()
    .setProperty('lastLicenseRow', licenseSheet.getLastRow().toString());

  // Initialize SSL tracking  
  const sslSheet = ss.getSheetByName("SSL");
  PropertiesService.getScriptProperties()
    .setProperty('lastSSLLastRow', sslSheet.getLastRow().toString());

  setupTriggers();
  console.log('Dual trigger setup complete!');
}





