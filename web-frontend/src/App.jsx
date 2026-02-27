import { useState, useEffect } from 'react';
import { Download, Upload, Plus, FileText, CheckCircle, XCircle, Clock, Settings, Users, Home, Search, Filter, LogOut, FileCode } from 'lucide-react';

// === Configuration ===
// นำ URL ที่ได้จากการ Deploy Google Apps Script มาวางที่นี่
const GAS_API_URL = 'YOUR_GAS_WEB_APP_URL_HERE'; // TODO: Replace

// Mock Data for UI Dev
const MOCK_USER = { email: 'teacher@school.ac.th', name: 'ครูสมใจ', role: 'teacher', status: 'active' };

export default function App() {
    const [currentUser, setCurrentUser] = useState(MOCK_USER);
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, records, review, users, settings
    const [loading, setLoading] = useState(false);

    // Example of API call pattern
    const fetchAPI = async (action, payload = {}) => {
        if (GAS_API_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
            console.warn('API URL not set, returning mock data');
            return { ok: true, data: [] };
        }
        setLoading(true);
        try {
            const res = await fetch(GAS_API_URL, {
                method: 'POST',
                body: JSON.stringify({ action, ...payload })
            });
            const json = await res.json();
            return json;
        } catch (e) {
            console.error(e);
            return { ok: false, error: e.message };
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView user={currentUser} />;
            case 'records': return <RecordsView user={currentUser} fetchAPI={fetchAPI} />;
            case 'review': return <ReviewView user={currentUser} fetchAPI={fetchAPI} />;
            case 'users': return <UsersView user={currentUser} fetchAPI={fetchAPI} />;
            case 'settings': return <SettingsView user={currentUser} fetchAPI={fetchAPI} />;
            default: return <DashboardView user={currentUser} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-sm md:text-base">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                    <h1 className="text-xl font-semibold text-gray-800">ระบบบันทึกการพัฒนาตนเอง</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600 hidden md:inline-block">ยินดีต้อนรับ, {currentUser.name}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium uppercase tracking-wider">{currentUser.role}</span>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

// === Components ===

const Sidebar = ({ activeTab, setActiveTab, user }) => {
    const navItems = [
        { id: 'dashboard', label: 'ภาพรวม', icon: <Home size={20} />, roles: ['teacher', 'admin'] },
        { id: 'records', label: 'บันทึกของฉัน', icon: <FileText size={20} />, roles: ['teacher', 'admin'] },
        { id: 'review', label: 'รายการรอตรวจ', icon: <CheckCircle size={20} />, roles: ['admin'] },
        { id: 'users', label: 'จัดการผู้ใช้', icon: <Users size={20} />, roles: ['admin'] },
        { id: 'settings', label: 'ตั้งค่าระบบ', icon: <Settings size={20} />, roles: ['admin'] },
    ];

    return (
        <div className="w-64 bg-slate-800 text-white flex flex-col hidden md:flex">
            <div className="p-6">
                <h2 className="text-2xl font-bold tracking-tight text-white mb-1"><span className="text-blue-400">Teacher</span>DevLog</h2>
                <p className="text-slate-400 text-xs">Self-Development System</p>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.filter(item => item.roles.includes(user.role)).map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-slate-700">
                <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:text-white transition-colors">
                    <LogOut size={20} />
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        </div>
    );
};

// === Views ===

const DashboardView = ({ user }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="ชั่วโมงสะสมปีนี้" value="45" subtitle="เป้าหมาย: 20 ชั่วโมง" icon={<Clock className="text-blue-500" size={24} />} />
            <Card title="รายการรอตรวจ" value="2" subtitle="รอการอนุมัติรับรอง" icon={<FileText className="text-yellow-500" size={24} />} />
            <Card title="ผ่านการอนุมัติแล้ว" value="5" subtitle="รายการวิทยฐานะ" icon={<CheckCircle className="text-green-500" size={24} />} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-medium mb-4">กิจกรรมล่าสุด</h3>
            <div className="text-center py-10 text-gray-500">
                <FileCode size={48} className="mx-auto text-gray-300 mb-3" />
                <p>ยังไม่มีกิจกรรมล่าสุด กรุณาเพิ่มบันทึกการพัฒนาตนเอง</p>
            </div>
        </div>
    </div>
);

const Card = ({ title, value, subtitle, icon }) => (
    <div className="bg-white rounded-xl shadow-sm border p-6 flex items-start space-x-4 hover:shadow-md transition-shadow">
        <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h4 className="text-2xl font-bold text-gray-900 my-1">{value}</h4>
            <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
    </div>
);

const RecordsView = ({ user }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="bg-white rounded-xl shadow-sm border flex flex-col h-full">
            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">บันทึกของฉัน</h2>
                    <p className="text-gray-500 text-sm">จัดการข้อมูลการพัฒนาตนเองของคุณทั้งหมดที่นี่</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    <span>เพิ่มรายการใหม่</span>
                </button>
            </div>

            <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="ค้นหากิจกรรม..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <button className="bg-white border text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-gray-50">
                    <Filter size={16} />
                    <span>ตัวกรอง</span>
                </button>
                <button className="bg-white border text-gray-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-gray-50">
                    <Download size={16} />
                    <span>ส่งออกรายงาน</span>
                </button>
            </div>

            <div className="flex-1 overflow-auto p-0">
                <table className="w-full min-w-[800px] text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อกิจกรรม</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">ประเภท</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">วันที่</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">ชั่วโมง</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">สถานะ</th>
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                ไม่มีข้อมูลบันทึก กดปุ่ม "เพิ่มรายการใหม่" เพื่อเริ่มต้น
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {showModal && <RecordModal onClose={() => setShowModal(false)} />}
        </div>
    );
};

const RecordModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                <h3 className="text-lg font-bold text-gray-800">เพิ่มบันทึกการพัฒนาตนเอง</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <XCircle size={24} />
                </button>
            </div>

            <div className="p-6 overflow-auto flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">ชื่อกิจกรรม / หลักสูตร <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น อบรมการสอนแบบ Active Learning" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">ประเภทกิจกรรม <span className="text-red-500">*</span></label>
                        <select className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="">เลือกประเภท...</option>
                            <option value="อบรม">อบรม</option>
                            <option value="สัมมนา">สัมมนา</option>
                            <option value="PLC">PLC</option>
                            <option value="ศึกษาดูงาน">ศึกษาดูงาน</option>
                            <option value="เรียนออนไลน์">เรียนออนไลน์</option>
                            <option value="วิจัย">วิจัย</option>
                            <option value="อื่น ๆ">อื่น ๆ</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">รูปแบบกิจกรรม <span className="text-red-500">*</span></label>
                        <select className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="onsite">Onsite</option>
                            <option value="online">Online</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">วันที่เริ่มต้น <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">วันที่สิ้นสุด <span className="text-red-500">*</span></label>
                        <input type="date" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">หน่วยงานผู้จัด <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">จำนวนชั่วโมงพัฒนา (ชั่วโมง) <span className="text-red-500">*</span></label>
                        <input type="number" min="0" step="0.5" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-800">การนำไปใช้ประโยชน์</h4>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">เป้าหมายที่คาดหวัง</label>
                        <textarea className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="2"></textarea>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">สิ่งที่ได้เรียนรู้ (Reflection)</label>
                        <textarea className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="3"></textarea>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-800">หลักฐานแนบ</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                        <p className="text-sm text-gray-600 mb-1">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่</p>
                        <p className="text-xs text-gray-400">รองรับ PDF, JPG, PNG (ขนาดไม่เกิน 10MB)</p>
                    </div>
                    <p className="text-center text-sm font-medium text-gray-500">หรือ</p>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">แนบลิงก์หลักฐาน (Google Drive/เว็บไซต์)</label>
                        <input type="url" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://" />
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border bg-white">
                    ยกเลิก
                </button>
                <button className="px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                    บันทึกร่าง
                </button>
                <button className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-colors">
                    บันทึกและส่งตรวจ
                </button>
            </div>
        </div>
    </div>
);

// Admins Views Placeholders
const ReviewView = () => <div className="p-6 text-center text-gray-500 bg-white rounded-xl border shadow-sm">ฟังก์ชันสำหรับรอตรวจ (Admin Only)</div>;
const UsersView = () => <div className="p-6 text-center text-gray-500 bg-white rounded-xl border shadow-sm">จัดการผู้ใช้ระบบ (Admin Only)</div>;
const SettingsView = () => <div className="p-6 text-center text-gray-500 bg-white rounded-xl border shadow-sm">ตั้งค่าระบบ (Admin Only)</div>;
