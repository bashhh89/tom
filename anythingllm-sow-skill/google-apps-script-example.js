/**
 * Google Apps Script Web App to handle SOW JSON data and create a new Google Sheet
 * 
 * To use this script:
 * 1. Create a new Google Sheet template with the required structure
 * 2. Copy this script to the Script Editor (Extensions > Apps Script)
 * 3. Update the TEMPLATE_SHEET_ID with your template sheet ID
 * 4. Deploy as a Web App (Publish > Deploy as web app)
 * 5. Set "Who has access" to "Anyone, even anonymous"
 * 6. Copy the Web App URL and use it in the AnythingLLM skill settings
 */

// Replace with your template sheet ID
const TEMPLATE_SHEET_ID = "YOUR_TEMPLATE_SHEET_ID";

function doGet(e) {
  return HtmlService.createHtmlOutput("This is a web app endpoint for creating SOW Google Sheets. Please use POST requests.");
}

function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // Create a new copy of the template sheet
    const templateSheet = SpreadsheetApp.openById(TEMPLATE_SHEET_ID);
    const newSheet = templateSheet.copy(`SOW: ${data.scopeName || "New SOW"} - ${new Date().toLocaleDateString()}`);

    // Get the ID of the new sheet
    const newSheetId = newSheet.getId();

    // Fill in the main SOW data
    fillMainSOWData(newSheet, data);

    // Fill in the individual scopes
    fillIndividualScopes(newSheet, data.individualScopes || []);

    // Return the URL of the new sheet
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      sheetId: newSheetId,
      sheetUrl: newSheet.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function fillMainSOWData(sheet, data) {
  // This function fills in the main SOW data in the appropriate cells
  // Adjust the cell references based on your template structure

  // Get the active sheet (assuming the main SOW data is on the first sheet)
  const sowSheet = sheet.getSheets()[0];

  // Fill in the scope name
  if (data.scopeName) {
    sowSheet.getRange("B2").setValue(data.scopeName);
  }

  // Fill in the overview
  if (data.overview) {
    sowSheet.getRange("B3").setValue(data.overview);
  }

  // Fill in what's included
  if (data.whatsIncluded && Array.isArray(data.whatsIncluded)) {
    const whatsIncludedRange = sowSheet.getRange("B4");
    whatsIncludedRange.setValue(data.whatsIncluded.join("\n"));
  }

  // Fill in outcomes
  if (data.outcomes && Array.isArray(data.outcomes)) {
    const outcomesRange = sowSheet.getRange("B5");
    outcomesRange.setValue(data.outcomes.join("\n"));
  }

  // Fill in assumptions
  if (data.assumptions && Array.isArray(data.assumptions)) {
    const assumptionsRange = sowSheet.getRange("B6");
    assumptionsRange.setValue(data.assumptions.join("\n"));
  }
}

function fillIndividualScopes(sheet, individualScopes) {
  // This function fills in the individual scopes data
  // Adjust the sheet name and cell references based on your template structure

  // Get the sheet for individual scopes (assuming it's named "Individual Scopes")
  let scopesSheet;
  try {
    scopesSheet = sheet.getSheetByName("Individual Scopes");
  } catch (e) {
    // If the sheet doesn't exist, create it
    scopesSheet = sheet.insertSheet("Individual Scopes");

    // Add headers
    scopesSheet.getRange("A1").setValue("Role");
    scopesSheet.getRange("B1").setValue("Tasks");
    scopesSheet.getRange("C1").setValue("Hours");
    scopesSheet.getRange("D1").setValue("Deliverables");
    scopesSheet.getRange("E1").setValue("Assumptions");
  }

  // Clear existing data (except headers)
  const lastRow = scopesSheet.getLastRow();
  if (lastRow > 1) {
    scopesSheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }

  // Add new data
  individualScopes.forEach((scope, index) => {
    const row = index + 2; // Start from row 2 (row 1 is headers)

    // Fill in role
    if (scope.role) {
      scopesSheet.getRange(row, 1).setValue(scope.role);
    }

    // Fill in tasks
    if (scope.tasks && Array.isArray(scope.tasks)) {
      scopesSheet.getRange(row, 2).setValue(scope.tasks.join(", "));
    }

    // Fill in hours
    if (scope.hours !== undefined) {
      scopesSheet.getRange(row, 3).setValue(scope.hours);
    }

    // Fill in deliverables
    if (scope.deliverables && Array.isArray(scope.deliverables)) {
      scopesSheet.getRange(row, 4).setValue(scope.deliverables.join(", "));
    }

    // Fill in assumptions
    if (scope.assumptions && Array.isArray(scope.assumptions)) {
      scopesSheet.getRange(row, 5).setValue(scope.assumptions.join(", "));
    }
  });
}
