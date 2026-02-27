# ระบบบันทึกข้อมูลพัฒนาตนเองของครู (Teacher Self-Development Log)
ระบบบันทึกข้อมูลการพัฒนาตนเองของครู (Teacher Self-Development Log) เป็นแอปพลิเคชันแบบ Full-stack โดยฝั่ง Frontend สร้างด้วย **React + Tailwind CSS** (Vite) และ Backend ใช้ **Google Apps Script** (GAS) ที่บันทึกข้อมูลและดึงข้อมูลจาก **Google Sheets** โดยตรง

## โครงสร้างโปรเจกต์
- `/gas-backend` - ประกอบด้วยโค้ดของ Google Apps Script (`Code.gs`) แบ็กเอนด์ที่จัดการข้อมูล
- `/web-frontend` - ประกอบด้วยโค้ดของแอป React ที่ทำหน้าที่เป็นส่วนแสดงผล
- `/docs` - เอกสารสรุปภาพรวมและสถาปัตยกรรมของระบบ
- `/.github/workflows` - อัตโนมัติการอัปโหลดแอปหน้าบ้านขึ้น GitHub Pages

## เอกสารการติดตั้ง
- [ดูวิธีติดตั้ง Backend (Google Apps Script)](./gas-backend/README_DEPLOY_GAS.md)
- [ดูวิธีติดตั้ง Frontend (GitHub Pages)](./web-frontend/README_DEPLOY_WEB.md)
- [ดูภาพรวมสถาปัตยกรรมระบบ](./docs/SYSTEM_OVERVIEW.md)

## ขั้นตอนสำหรับ Developer เพื่อนำโปรเจกต์นี้ขึ้น GitHub ครั้งแรก

ให้คุณ (Developer) ดำเนินการตามคำสั่งนี้ใน **Terminal / Command Prompt** ทีละขั้นตอน:

```bash
# 1. เข้าไปที่โฟลเดอร์โปรเจกต์
cd "teacher-dev-log"

# 2. เริ่มต้นระบบควบคุมเวอร์ชัน (Git)
git init

# 3. เพิ่มไฟล์ทั้งหมดลงไปใน Git
git add .

# 4. คอมมิต (Commit) ครั้งแรก
git commit -m "init teacher self development app"

# 5. เปลี่ยนชื่อสาขาหลักเป็น main
git branch -M main

# 6. เพิ่ม Remote Repository ปลายทางของ GitHub (อย่าลืมเปลี่ยน <USERNAME> และ <REPO> ให้ถูกต้องตามของคุณ)
# ตัวอย่าง: git remote add origin https://github.com/my-username/teacher-dev-log.git
git remote add origin https://github.com/<USERNAME>/<REPO>.git

# 7. พุชโค้ดขึ้น GitHub
git push -u origin main
```

**หมายเหตุสำคัญ**: เมื่อพุชโค้ดเข้า branch สำเร็จ `GitHub Actions` จะทำงานให้อัตโนมัติทันที
**(กรุณาไปที่แท็บ Settings ของ Repository รอดูผลตรงกล่อง Pages)**
