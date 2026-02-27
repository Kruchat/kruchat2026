function getDB() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('SPREADSHEET_ID');
  let ss = null;
  if (ssId) {
    try { ss = SpreadsheetApp.openById(ssId); } catch (e) {}
  }
  if (!ss) {
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
    if (!ss || ss === null) {
      ss = SpreadsheetApp.create('Teacher Dev Log DB');
    }
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }
  return ss;
}

function initSheets() {
  const ss = getDB();
  const requiredSheets = {
    'Users': ['email', 'name', 'school', 'department', 'position', 'role', 'status', 'createdAt'],
    'Records': ['recordId', 'ownerEmail', 'startDate', 'endDate', 'activityType', 'title', 'organizer', 'format', 'hours', 'competencies', 'expectedGoal', 'reflection', 'implementationPlan', 'status', 'adminComment', 'createdAt', 'updatedAt'],
    'Attachments': ['fileId', 'recordId', 'fileName', 'fileUrl', 'mimeType', 'uploadedAt'],
    'Competencies': ['id', 'name', 'description'],
    'Settings': ['key', 'value'],
    'AuditLog': ['timestamp', 'userEmail', 'action', 'details']
  };

  for (const [sheetName, headers] of Object.entries(requiredSheets)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
      
      if(sheetName === 'Competencies') {
         sheet.appendRow(['C1', 'การจัดการเรียนรู้', 'ออกแบบและจัดประสบการณ์เรียนรู้']);
         sheet.appendRow(['C2', 'การพัฒนาผู้เรียน', 'ปลูกฝังคุณธรรมจริยธรรม']);
      }
      if(sheetName === 'Settings') {
         sheet.appendRow(['targetHoursPerYear', '20']);
         sheet.appendRow(['driveFolderId', '']); 
      }
    }
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  // Add CORS headers by returning JSONP if callback provided, else we use standard handling but rely on GAS built-in 302 redirects for fetch compatibility
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    initSheets(); 
    
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }
    
    // Support GET or POST action passing
    const action = payload.action || (e.parameter && e.parameter.action);
    let responseData = null;
    
    const currentUserEmail = Session.getActiveUser().getEmail();
    const currentUser = getUser(currentUserEmail);
    if(!currentUser && action !== 'getMe') {
       const sheet = getDB().getSheetByName('Users');
       if(sheet.getLastRow() <= 1) {
          upsertUser({ email: currentUserEmail, name: 'Admin', role: 'admin', status: 'active' });
       }
    }

    switch(action) {
      case 'getMe':
        responseData = getMeProcess();
        break;
      case 'listRecords':
        responseData = listRecords(payload, currentUserEmail);
        break;
      case 'getRecord':
        responseData = getRecord(payload.recordId, currentUserEmail);
        break;
      case 'upsertRecord':
        responseData = upsertRecord(payload, currentUserEmail);
        break;
      case 'submitRecord':
        responseData = changeRecordStatus(payload.recordId, 'submitted', currentUserEmail);
        break;
      case 'reviewRecord':
        requireAdmin();
        responseData = reviewRecord(payload.recordId, payload.reviewAction, payload.comment, currentUserEmail);
        break;
      case 'deleteRecord':
        responseData = deleteRecord(payload.recordId, currentUserEmail);
        break;
      case 'getCompetencies':
        responseData = getCompetencies();
        break;
      case 'getUsers':
        requireAdmin();
        responseData = getAllUsers();
        break;
      case 'upsertUser':
        requireAdmin();
        responseData = upsertUser(payload.user);
        break;
      default:
        throw new Error("Invalid action or missing action parameter: " + action);
    }
    
    return buildResponse({ ok: true, data: responseData });
  } catch (error) {
    if(Session.getActiveUser().getEmail()) logAudit(Session.getActiveUser().getEmail(), 'ERROR', error.toString());
    return buildResponse({ ok: false, error: { message: error.toString() } });
  }
}

function buildResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getMeProcess() {
  const email = Session.getActiveUser().getEmail();
  let user = getUser(email);
  if(!user) {
     const sheet = getDB().getSheetByName('Users');
     if(sheet.getLastRow() <= 1) {
        user = { email, name: email.split('@')[0], role: 'admin', status: 'active'};
        upsertUser(user);
     } else {
        user = { email, name: email.split('@')[0], role: 'teacher', status: 'active'};
        upsertUser(user);
     }
  }
  return user;
}

function requireAdmin() {
  const email = Session.getActiveUser().getEmail();
  const user = getUser(email);
  if (!user || user.role !== 'admin') {
    throw new Error('Permission denied: Admin only');
  }
}

function logAudit(email, action, details) {
  const sheet = getDB().getSheetByName('AuditLog');
  const timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  sheet.appendRow([timestamp, email, action, typeof details === 'object' ? JSON.stringify(details) : details]);
}

function getSheetDataAsObjects(sheetName) {
  const sheet = getDB().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function saveObjectToSheet(sheetName, obj, keyField) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getDB().getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    let rowIndex = -1;
    if(keyField && obj[keyField]) {
      const keyColIndex = headers.indexOf(keyField);
      for(let i=1; i<data.length; i++) {
        if(data[i][keyColIndex] == obj[keyField]) {
          rowIndex = i + 1;
          break;
        }
      }
    }
    
    const rowData = headers.map(h => {
       if(typeof obj[h] === 'object') return JSON.stringify(obj[h]);
       return obj[h] !== undefined ? obj[h] : '';
    });

    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    return obj;
  } finally {
    lock.releaseLock();
  }
}

function getUser(email) {
  const users = getSheetDataAsObjects('Users');
  return users.find(u => u.email === email) || null;
}

function getAllUsers() {
  return getSheetDataAsObjects('Users');
}

function upsertUser(userObj) {
  if(!userObj.createdAt) userObj.createdAt = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  const result = saveObjectToSheet('Users', userObj, 'email');
  logAudit(Session.getActiveUser().getEmail(), 'UPSERT_USER', result.email);
  return result;
}

function getCompetencies() {
  return getSheetDataAsObjects('Competencies');
}

function listRecords(filters, email) {
  let records = getSheetDataAsObjects('Records');
  const user = getUser(email);
  
  if (user.role !== 'admin') {
    records = records.filter(r => r.ownerEmail === email);
  }
  
  if(filters) {
    if(filters.status) records = records.filter(r => r.status === filters.status);
  }
  return records.reverse(); 
}

function getRecord(recordId, email) {
  const records = getSheetDataAsObjects('Records');
  const record = records.find(r => r.recordId === recordId);
  if(!record) throw new Error("Record not found");
  
  const user = getUser(email);
  if(user.role !== 'admin' && record.ownerEmail !== email) {
     throw new Error("Permission denied");
  }
  
  if(typeof record.competencies === 'string' && record.competencies.startsWith('[')) {
     try { record.competencies = JSON.parse(record.competencies); } catch(e){}
  }
  
  return record;
}

function upsertRecord(payload, email) {
  let record = payload.record || {};
  let isNew = false;
  
  if(!record.recordId) {
    isNew = true;
    record.recordId = Utilities.getUuid();
    record.ownerEmail = email;
    record.createdAt = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    record.status = 'draft';
  } else {
    const existing = getRecord(record.recordId, email);
    if(existing.status !== 'draft' && existing.status !== 'rejected') {
       throw new Error("Cannot edit a submitted or approved record");
    }
    record.createdAt = existing.createdAt;
  }
  
  record.updatedAt = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  
  const result = saveObjectToSheet('Records', record, 'recordId');
  logAudit(email, isNew ? 'CREATE_RECORD' : 'UPDATE_RECORD', record.recordId);
  return result;
}

function deleteRecord(recordId, email) {
  const record = getRecord(recordId, email); 
  if(record.status === 'approved') throw new Error("Cannot delete approved record");
  
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getDB().getSheetByName('Records');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('recordId');
    
    for(let i=1; i<data.length; i++) {
       if(data[i][idIndex] === recordId) {
          sheet.deleteRow(i + 1);
          logAudit(email, 'DELETE_RECORD', recordId);
          return { deleted: true };
       }
    }
    throw new Error("Record not found to delete");
  } finally {
    lock.releaseLock();
  }
}

function changeRecordStatus(recordId, newStatus, email) {
  const record = getRecord(recordId, email);
  record.status = newStatus;
  record.updatedAt = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  saveObjectToSheet('Records', record, 'recordId');
  logAudit(email, 'SUBMIT_RECORD', recordId);
  return record;
}

function reviewRecord(recordId, actionType, comment, email) {
  const record = getRecord(recordId, email);
  record.status = actionType === 'approve' ? 'approved' : 'rejected';
  record.adminComment = comment || '';
  record.updatedAt = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  saveObjectToSheet('Records', record, 'recordId');
  logAudit(email, 'REVIEW_RECORD', `ID: ${recordId}, Action: ${actionType}`);
  return record;
}
