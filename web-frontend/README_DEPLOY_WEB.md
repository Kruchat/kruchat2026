# การนำ Web Frontend ขึ้นสู่ GitHub Pages

เมื่อโปรเจกต์นี้ได้ถูกพุชขึ้น GitHub แล้ว ระบบได้เตรียม **GitHub Actions** (`.github/workflows/deploy-pages.yml`) ไว้ให้เรียบร้อยแล้ว โดยผู้ใช้เพียงแค่ต้องตั้งค่าบน GitHub ดังนี้:

## ขั้นตอนการติดตั้ง (Deployment Steps)

1. ไปที่เว็บไซต์บัญชี GitHub ของคุณ
2. เข้าไปที่ Repository ของโปรเจกต์คุณ (ตัวอย่างเช่น **teacher-dev-log**)
3. ไปที่แท็บ **Settings (การตั้งค่า)**
4. ในแถบเมนูด้านซ้าย เลื่อนลงมาหาระบบ **Pages (GitHub Pages)**
5. ภายใต้หัวข้อ **Build and deployment** > Source ให้ทำการเลือก **"GitHub Actions"**
6. โค้ด Backend ของระบบจะถูกสร้างและ Deploy ให้อัตโนมัติทุกครั้งที่คุณ Commit โค้ดเข้า branch หลัก!

*หมายเหตุ: หากคุณทดลอง Commit โค้ดแล้วเจอ Error ตรง Workflow อาจเป็นสาเหตุมาจากคุณยังไม่ได้เปลี่ยนการตั้งค่า Source ของหน้า Pages ให้เป็น Actions!*

## การแก้ไขที่อยู่ URL Backend (GAS API)

1. ก่อนจะทำการพุชโค้ดขึ้น GitHub ให้เปิดไฟล์ `src/App.jsx`
2. มองหาตัวแปรล่างนี้ด้านบนไฟล์:

```javascript
// === Configuration ===
// นำ URL ที่ได้จากการ Deploy Google Apps Script มาวางที่นี่
const GAS_API_URL = 'YOUR_GAS_WEB_APP_URL_HERE'; 
```
3. วาง **Web app URL** ของ Apps Script ทับคำว่า `'YOUR_GAS_WEB_APP_URL_HERE'` ตัวอย่างเช่น:
```javascript
const GAS_API_URL = 'https://script.google.com/macros/s/AKfyc.../exec'; 
```
4. ในไฟล์ `vite.config.js` ให้เปลี่ยน `base` เป็นชื่อของ **Repository Name** ที่คุณใช้งานอยู่ (ในปัจจุบันถูกตั้งไว้เป็น `'/teacher-dev-log/'` แล้ว)

เมื่อแก้เสร็จแล้ว ก็ `git commit` และ `git push` โค้ดทั้งหมดขึ้นไปใหม่ ระบบจะจัดการ build ให้ใหม่ทันที!
