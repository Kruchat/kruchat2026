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
    
    // Public endpoints that do NOT require authentication
    const publicActions = ['registerUser', 'loginUser'];
    if (publicActions.includes(action)) {
      switch(action) {
        case 'registerUser':
          responseData = registerUser(payload.user);
          break;
        case 'loginUser':
          responseData = loginUser(payload.email, payload.password);
          break;
      }
      return buildResponse({ ok: true, data: responseData });
    }
    
    // For authenticated endpoints, get user email from Session or payload
    let currentUserEmail = Session.getActiveUser().getEmail();
    if (!currentUserEmail && payload.email) {
       currentUserEmail = payload.email;
    }
    
    if(!currentUserEmail) throw new Error("Authentication failed: No email found");

    const currentUser = getUser(currentUserEmail);
    if(!currentUser && action !== 'getMe') {
       const sheet = getDB().getSheetByName('Users');
       if(sheet.getLastRow() <= 1) {
          upsertUser({ email: currentUserEmail, name: 'Admin', role: 'admin', status: 'active' });
       }
    }

    switch(action) {
      case 'getMe':
        responseData = getMeProcess(currentUserEmail);
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
        requireAdmin(currentUserEmail);
        responseData = reviewRecord(payload.recordId, payload.reviewAction, payload.comment, currentUserEmail);
        break;
      case 'deleteRecord':
        responseData = deleteRecord(payload.recordId, currentUserEmail);
        break;
      case 'getCompetencies':
        responseData = getCompetencies();
        break;
      case 'getUsers':
        requireAdmin(currentUserEmail);
        responseData = getAllUsers();
        break;
      case 'upsertUser':
        requireAdmin(currentUserEmail);
        responseData = upsertUser(payload.user);
        break;
      case 'updateUser':
        requireAdmin(currentUserEmail);
        responseData = updateUser(payload.targetEmail, payload.updates, currentUserEmail);
        break;
      case 'deleteUser':
        requireAdmin(currentUserEmail);
        responseData = deleteUser(payload.targetEmail, currentUserEmail);
        break;
      case 'uploadFile':
        responseData = uploadFile(payload, currentUserEmail);
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

function getMeProcess(email) {
  const user = getUser(email);
  if(!user) {
    throw new Error("ไม่พบบัญชีผู้ใช้งานในระบบ กรุณาสมัครสมาชิก");
  }
  
  if (user.status !== 'active') {
      throw new Error("บัญชีของคุณถูกระงับการใช้งาน หรือรอการอนุมัติ กรุณาติดต่อผู้ดูแลระบบ");
  }
  
  // Don't send password hash back to client
  const safeUser = { ...user };
  delete safeUser.password;
  
  return safeUser;
}

function registerUser(userData) {
  if (!userData.email || !userData.password || !userData.name) {
    throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
  }
  
  const existingUser = getUser(userData.email);
  if (existingUser) {
    throw new Error("อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ");
  }
  
  const sheet = getDB().getSheetByName('Users');
  const isFirstUser = sheet.getLastRow() <= 1;
  
  // Hash password very simply for GAS (For production, use a proper crypto library if available, here we use basic SHA-256)
  const passwordHash = computeSHA256(userData.password);
  
  const newUser = {
    email: userData.email,
    name: userData.name,
    role: isFirstUser ? 'admin' : 'teacher',
    status: isFirstUser ? 'active' : 'pending', // Auto active if first user (admin)
    password: passwordHash,
    createdAt: Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss")
  };
  
  const result = saveObjectToSheet('Users', newUser, 'email');
  logAudit(newUser.email, 'REGISTER_USER', `Role: ${newUser.role}`);
  
  const safeUser = { ...result };
  delete safeUser.password;
  
  return { 
    user: safeUser, 
    message: isFirstUser ? "ลงทะเบียน Admin สำเร็จ เข้าสู่ระบบได้ทันที" : "สมัครสมาชิกสำเร็จ กรุณารอผู้ดูแลระบบอนุมัติการใช้งาน" 
  };
}

function loginUser(email, password) {
  if (!email || !password) throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
  
  const user = getUser(email);
  if (!user) {
    throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }
  
  const inputHash = computeSHA256(password);
  if (user.password !== inputHash) {
     // Legacy support: if user has no password (created before this update), allow them to set it now by treating their first login as setting the password
     if (!user.password) {
        user.password = inputHash;
        saveObjectToSheet('Users', user, 'email');
     } else {
        throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
     }
  }
  
  if (user.status === 'pending') {
    throw new Error("บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ");
  }
  
  if (user.status !== 'active') {
    throw new Error("บัญชีของคุณถูกระงับการใช้งาน");
  }
  
  logAudit(email, 'LOGIN', 'Success');
  
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

function computeSHA256(input) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) {
      hashVal += 256;
    }
    if (hashVal.toString(16).length == 1) {
      txtHash += '0';
    }
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function requireAdmin(currentUserEmail) {
  const user = getUser(currentUserEmail);
  if (!user || user.role !== 'admin') {
    throw new Error('Permission denied: Admin only');
  }
  if (user.status !== 'active') {
    throw new Error('Permission denied: Account suspended');
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

function updateUser(targetEmail, updates, currentUserEmail) {
  if (!targetEmail || !updates) throw new Error("Missing parameters for updateUser");
  const user = getUser(targetEmail);
  if (!user) throw new Error("User not found: " + targetEmail);

  if (targetEmail === currentUserEmail) {
     if (updates.role && updates.role !== 'admin') throw new Error("Cannot demote yourself");
     if (updates.status && updates.status !== 'active') throw new Error("Cannot deactivate yourself");
  }

  const updatedUser = { ...user, ...updates };
  updatedUser.updatedAt = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  
  const result = saveObjectToSheet('Users', updatedUser, 'email');
  logAudit(currentUserEmail, 'UPDATE_USER', `Updated user: ${targetEmail}`);
  return result;
}

function deleteUser(targetEmail, currentUserEmail) {
  if (targetEmail === currentUserEmail) throw new Error("Cannot delete your own account");
  const user = getUser(targetEmail);
  if (!user) throw new Error("User not found: " + targetEmail);
  
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getDB().getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const emailIndex = headers.indexOf('email');
    
    let deleted = false;
    for(let i=1; i<data.length; i++) {
       if(data[i][emailIndex] === targetEmail) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
       }
    }
    if (!deleted) throw new Error("User row not found to delete");
  } finally {
    lock.releaseLock();
  }
  
  logAudit(currentUserEmail, 'DELETE_USER', targetEmail);
  return { success: true, email: targetEmail };
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
  
  const attachments = getSheetDataAsObjects('Attachments');
  records.forEach(r => {
    r.attachments = attachments.filter(a => a.recordId === r.recordId);
  });
  
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
  record.status = actionType === 'approved' ? 'approved' : 'rejected';
  record.adminComment = comment || '';
  record.updatedAt = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
  saveObjectToSheet('Records', record, 'recordId');
  logAudit(email, 'REVIEW_RECORD', `ID: ${recordId}, Action: ${actionType}`);
  return record;
}

function getOrCreateAppFolder() {
  const props = PropertiesService.getScriptProperties();
  let folderId = props.getProperty('DRIVE_FOLDER_ID');
  let folder;
  
  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch(e) {
      folder = null;
    }
  }
  
  if (!folder) {
    folder = DriveApp.createFolder('Teacher Dev Logs Attachments');
    props.setProperty('DRIVE_FOLDER_ID', folder.getId());
    
    try {
       const settingsSheet = getDB().getSheetByName('Settings');
       const data = settingsSheet.getDataRange().getValues();
       for(let i=0; i<data.length; i++) {
          if(data[i][0] === 'driveFolderId') {
             settingsSheet.getRange(i+1, 2).setValue(folder.getId());
             break;
          }
       }
    } catch(e) {}
  }
  return folder;
}

function uploadFile(payload, email) {
  const { fileName, mimeType, base64Data, recordId } = payload;
  if(!fileName || !base64Data || !recordId) throw new Error("Missing required file parameters");
  
  getRecord(recordId, email); 

  const folder = getOrCreateAppFolder();
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data.split(',')[1]), mimeType, fileName);
  const file = folder.createFile(blob);
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  const attachmentRecord = {
    fileId: file.getId(),
    recordId: recordId,
    fileName: fileName,
    fileUrl: file.getUrl(),
    mimeType: mimeType,
    uploadedAt: Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss")
  };
  
  const result = saveObjectToSheet('Attachments', attachmentRecord, 'fileId');
  logAudit(email, 'UPLOAD_FILE', `User uploaded ${fileName} to record ${recordId}`);
  
  return result;
}
