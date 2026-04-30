function doGet() {
  return ContentService
    .createTextOutput('The Better Lungs Clinic booking script is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const sheetName = 'The Better Lungs Clinic';
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const headers = [
    'Submitted At',
    'Patient Name',
    'Phone',
    'Visit Type',
    'Preferred Date',
    'Reason for Visit',
    'Submitted From'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (firstRow.join('') === '') {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  const params = e.parameter || {};

  sheet.appendRow([
    params.submitted_at || new Date().toISOString(),
    params.patient_name || '',
    params.phone || '',
    params.visit_type || '',
    params.appt_date || '',
    params.visit_note || '',
    params.submitted_from || 'The Better Lungs Clinic contact page'
  ]);

  return ContentService
    .createTextOutput('OK')
    .setMimeType(ContentService.MimeType.TEXT);
}
