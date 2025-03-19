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

// Track last modification time in PropertiesService
function trackModification() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('lastModified', new Date().toISOString());
}

// Main controller function
function checkAndProcess() {
  const props = PropertiesService.getScriptProperties();
  const lastModified = props.getProperty('lastModified');
  
  if (!lastModified) return;
  
  const now = new Date();
  const modifiedTime = new Date(lastModified);
  const diffMinutes = (now - modifiedTime) / (1000 * 60);
  
  // Run only if last modification was 1-3 minutes ago
  if (diffMinutes >= 1 && diffMinutes <= 3) {
    props.deleteProperty('lastModified');
    processNewData();
  }
}