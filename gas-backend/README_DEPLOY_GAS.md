# การติดตั้ง Backend บน Google Apps Script (GAS)

## วิธีที่ 1: ติดตั้งผ่านหน้าเว็บ (สำหรับผู้ไม่คุ้นเคย Command Line)
1. ไปที่ [Google Apps Script](https://script.google.com/)
2. สร้าง "New Project" (โปรเจกต์ใหม่)
3. คัดลอกเนื้อหาในไฟล์ `Code.gs` ทั้งหมดไปวางทับใน `Code.gs` บนเว็บ
4. ไปที่ "Project Settings" (ตั้งค่าโปรเจกต์ไอคอนฟันเฟืองด้านซ้าย) -> ติ๊กเลือก "Show 'appsscript.json' manifest file in editor"
5. กลับไปที่หน้า Code จะมีไฟล์ `appsscript.json` เพิ่มขึ้นมา ให้คัดลอกโค้ดจาก `appsscript.json` นำไปวางทับ
6. กดปุ่ม **Deploy** (ทำให้ใช้งานได้) ด้านขวาบน -> เลือก **New deployment**
7. เลือกประเภท (Select type) เป็น **Web app**
8. ตั้งค่า:
   - **Execute as**: Me (`อีเมลของคุณ`)
   - **Who has access**: `Anyone` หรือ `Anyone within [Domain]` ตามความเหมาะสมของโรงเรียน
9. กด **Deploy** และกดยอมรับสิทธิ์การเข้าถึงข้อมูล (Authorize access)
10. คุณจะได้รับ **Web app URL** (คัดลอกเก็บไว้เพื่อนำไปใส่ในโค้ดฝั่ง React Frontend `src/App.jsx`)

## วิธีที่ 2: ติดตั้งผ่าน Clasp (สำหรับ Developer)
1. ติดตั้ง Clasp: `npm install -g @google/clasp`
2. ล็อกอิน: `clasp login`
3. สร้างโปรเจกต์: `clasp create --type webapp --title "Teacher Dev Log API"`
4. นำ `scriptId` ที่ได้ ไปอัปเดตใส่ในไฟล์ `.clasp.json` (จากเทมเพลต)
5. พุชโค้ด: `clasp push`
6. Deploy เป็น Web App: `clasp deploy`

---

## การเตรียม Spreadsheet
เมื่อคุณนำ GAS ไป Deploy และเรียกใช้งาน API ครั้งแรก โค้ดจะทำการ **สร้าง Spreadsheets และ Sheets ทั้งหมดให้โดยอัตโนมัติ** รวมถึงสร้างไอดี Admin ให้กับอีเมลบัญชีของคุณ!
