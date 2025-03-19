function setupTriggers() {
  // Delete existing triggers first
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });

  // Create change detector trigger
  ScriptApp.newTrigger('trackModification')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();

  // Create timer trigger
  ScriptApp.newTrigger('checkAndProcess')
    .timeBased()
    .everyMinutes(2)
    .create();
}