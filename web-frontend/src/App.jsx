import { useState, useEffect, useCallback } from 'react';
import { Download, Upload, Plus, FileText, CheckCircle, XCircle, Clock, Settings, Users, Home, Search, Filter, LogOut, FileCode, Check } from 'lucide-react';

// === Configuration ===
// นำ URL ที่ได้จากการ Deploy Google Apps Script มาวางที่นี่
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzI3UTyHWR03wkuAQkTosIDzDM9pGgg1MV9u8LUP6TaOUIHddNtN3d6CbyAevqXdd5V/exec'; // TODO: Replace

export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, records, review, users, settings
    const [loading, setLoading] = useState(false);
    const [isCheckingAutoLogin, setIsCheckingAutoLogin] = useState(true);

    // Auto-login on mount
    useEffect(() => {
        const initLogin = async () => {
            if (GAS_API_URL.includes('YOUR_GAS_WEB_APP_URL_HERE')) {
                setIsCheckingAutoLogin(false);
                return;
            }
            try {
                const res = await fetchAPI('getMe');
                if (res && res.ok && res.data) {
                    setCurrentUser(res.data);
                }
            } catch (e) {
                console.error("Auto login failed", e);
            } finally {
                setIsCheckingAutoLogin(false);
            }
        };
        initLogin();
    }, []);

    const fetchAPI = useCallback(async (action, payload = {}) => {
        if (GAS_API_URL.includes('YOUR_GAS_WEB_APP_URL_HERE')) {
            console.warn('API URL not set');
            return { ok: false, error: { message: "API URL not set" } };
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
            return { ok: false, error: { message: e.message } };
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLoginClick = async () => {
        const res = await fetchAPI('getMe');
        if (res && res.ok && res.data) {
            setCurrentUser(res.data);
        } else {
            alert('ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบว่าท่านได้เปิดสิทธิ์ของแอป (Authorization) แล้วหรือไม่');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    if (isCheckingAutoLogin) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">กำลังตรวจสอบข้อมูลผู้ใช้...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginView onLogin={handleLoginClick} loading={loading} />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardView user={currentUser} fetchAPI={fetchAPI} />;
            case 'records': return <RecordsView user={currentUser} fetchAPI={fetchAPI} />;
            case 'review': return <ReviewView user={currentUser} fetchAPI={fetchAPI} />;
            case 'users': return <UsersView user={currentUser} fetchAPI={fetchAPI} />;
            case 'settings': return <SettingsView />;
            default: return <DashboardView user={currentUser} fetchAPI={fetchAPI} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 text-sm md:text-base">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                    <h1 className="text-xl font-semibold text-gray-800">ระบบบันทึกการพัฒนาตนเอง</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600 hidden md:inline-block">ยินดีต้อนรับ, {currentUser.name}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium uppercase tracking-wider">{currentUser.role}</span>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
                            <div className="px-4 py-2 bg-white rounded-lg shadow-md border flex items-center space-x-3 text-blue-600">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="font-medium">กำลังโหลด...</span>
                            </div>
                        </div>
                    )}
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

// === Components ===

const LoginView = ({ onLogin, loading }) => (
    <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border">
            <div className="p-8 text-center bg-slate-800">
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2"><span className="text-blue-400">Teacher</span>DevLog</h2>
                <p className="text-slate-300 text-sm">ระบบบันทึกและติดตามการพัฒนาตนเองของครู</p>
            </div>
            <div className="p-8 space-y-6">
                <p className="text-center text-gray-600 text-sm">
                    กรุณาเข้าสู่ระบบด้วยบัญชี Google ของสถานศึกษาเพื่อเริ่มต้นใช้งานระบบ
                </p>
                <button
                    onClick={onLogin}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center disabled:opacity-70"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            กำลังตรวจสอบ...
                        </>
                    ) : (
                        "เข้าสู่ระบบด้วย Google"
                    )}
                </button>
            </div>
            <div className="bg-slate-50 p-6 border-t text-xs text-center text-gray-500 space-y-2">
                <p className="font-medium text-gray-700">คำแนะนำสำหรับผู้ใช้งานใหม่</p>
                <p>หากคุณพบปัญหาในการเข้าสู่ระบบ โปรดแน่ใจว่าคุณได้กดเปิดสิทธิ์การใช้งาน (Authorization) ในหน้า Web App ของ Google แล้ว</p>
            </div>
        </div>
    </div>
);

// === Components ===

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
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
                <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:text-white transition-colors">
                    <LogOut size={20} />
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        </div>
    );
};

// === Views ===

const DashboardView = ({ user, fetchAPI }) => {
    const [stats, setStats] = useState({ totalHours: 0, pending: 0, approved: 0 });

    useEffect(() => {
        const loadStats = async () => {
            const res = await fetchAPI('listRecords');
            if (res && res.ok) {
                const records = res.data || [];
                let h = 0, p = 0, a = 0;
                records.forEach(r => {
                    if (r.status === 'approved') {
                        a++;
                        h += Number(r.hours) || 0;
                    }
                    if (r.status === 'submitted') p++;
                });
                setStats({ totalHours: h, pending: p, approved: a });
            }
        };
        loadStats();
    }, [user, fetchAPI]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="ชั่วโมงสะสมปีนี้ (ผ่านแล้ว)" value={stats.totalHours} subtitle="เป้าหมาย: 20 ชั่วโมง" icon={<Clock className="text-blue-500" size={24} />} />
                <Card title="รายการรอตรวจ" value={stats.pending} subtitle="รอการอนุมัติรับรอง" icon={<FileText className="text-yellow-500" size={24} />} />
                <Card title="ผ่านการอนุมัติแล้ว" value={stats.approved} subtitle="รายการกิจกรรม" icon={<CheckCircle className="text-green-500" size={24} />} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-medium mb-4">กิจกรรมล่าสุด</h3>
                <div className="text-center py-10 text-gray-500">
                    <FileCode size={48} className="mx-auto text-gray-300 mb-3" />
                    <p>เข้าสู่เมนู "บันทึกของฉัน" เพื่อดูรายการกิจกรรมทั้งหมด</p>
                </div>
            </div>
        </div>
    );
};

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

const RecordsView = ({ user, fetchAPI }) => {
    const [showModal, setShowModal] = useState(false);
    const [records, setRecords] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);

    const loadRecords = async () => {
        const res = await fetchAPI('listRecords');
        if (res && res.ok) {
            setRecords(res.data || []);
        }
    };

    useEffect(() => {
        loadRecords();
    }, [user, fetchAPI]);

    const handleDelete = async (recordId) => {
        if (!confirm('ยืนยันการลบรายการนี้?')) return;
        const res = await fetchAPI('deleteRecord', { recordId });
        if (res.ok) {
            loadRecords();
        } else {
            alert('ลบไม่สำเร็จ: ' + res.error?.message);
        }
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">ผ่านแล้ว</span>;
            case 'submitted': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">รอตรวจ</span>;
            case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">ส่งกลับ</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">ร่าง</span>;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border flex flex-col h-full">
            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">บันทึกของฉัน</h2>
                    <p className="text-gray-500 text-sm">จัดการข้อมูลการพัฒนาตนเองของคุณทั้งหมดที่นี่</p>
                </div>
                <button
                    onClick={() => { setEditingRecord(null); setShowModal(true); }}
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
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    ไม่มีข้อมูลบันทึก กดปุ่ม "เพิ่มรายการใหม่" เพื่อเริ่มต้น
                                </td>
                            </tr>
                        ) : records.map(record => (
                            <tr key={record.recordId} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{record.title}</td>
                                <td className="px-6 py-4 text-gray-500">{record.activityType}</td>
                                <td className="px-6 py-4 text-gray-500">
                                    {record.startDate ? new Date(record.startDate).toLocaleDateString('th-TH') : '-'}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-500">{record.hours}</td>
                                <td className="px-6 py-4 text-center"><StatusBadge status={record.status} /></td>
                                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                    {(record.status === 'draft' || record.status === 'rejected') && (
                                        <button onClick={() => { setEditingRecord(record); setShowModal(true); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">แก้ไข</button>
                                    )}
                                    <button onClick={() => handleDelete(record.recordId)} className="text-red-600 hover:text-red-800 text-sm font-medium">ลบ</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && <RecordModal record={editingRecord} onClose={() => { setShowModal(false); setEditingRecord(null); loadRecords(); }} fetchAPI={fetchAPI} />}
        </div>
    );
};

const RecordModal = ({ record, onClose, fetchAPI }) => {
    const [formData, setFormData] = useState({
        recordId: record?.recordId || '',
        title: record?.title || '',
        activityType: record?.activityType || '',
        format: record?.format || 'onsite',
        startDate: (record?.startDate ? record.startDate.split('T')[0] : '') || '',
        endDate: (record?.endDate ? record.endDate.split('T')[0] : '') || '',
        organizer: record?.organizer || '',
        hours: record?.hours || '',
        expectedGoal: record?.expectedGoal || '',
        reflection: record?.reflection || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (status) => {
        if (!formData.title || !formData.activityType || !formData.startDate || !formData.hours) {
            alert('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
            return;
        }

        setIsSaving(true);
        const payload = {
            record: { ...formData, status }
        };

        try {
            const res = await fetchAPI('upsertRecord', payload);
            if (res.ok) {
                alert('บันทึกข้อมูลเรียบร้อยแล้ว');
                onClose();
            } else {
                alert('เกิดข้อผิดพลาด: ' + (res.error?.message || 'ไม่ทราบสาเหตุ'));
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-gray-800">{formData.recordId ? 'แก้ไขบันทึก' : 'เพิ่มบันทึกการพัฒนาตนเอง'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-auto flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">ชื่อกิจกรรม / หลักสูตร <span className="text-red-500">*</span></label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น อบรมการสอนแบบ Active Learning" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">ประเภทกิจกรรม <span className="text-red-500">*</span></label>
                            <select name="activityType" value={formData.activityType} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
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
                            <select name="format" value={formData.format} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="onsite">Onsite</option>
                                <option value="online">Online</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">วันที่เริ่มต้น <span className="text-red-500">*</span></label>
                            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">วันที่สิ้นสุด <span className="text-red-500">*</span></label>
                            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">หน่วยงานผู้จัด <span className="text-red-500">*</span></label>
                            <input type="text" name="organizer" value={formData.organizer} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">จำนวนชั่วโมงพัฒนา (ชั่วโมง) <span className="text-red-500">*</span></label>
                            <input type="number" name="hours" value={formData.hours} onChange={handleChange} min="0" step="0.5" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-semibold text-gray-800">การนำไปใช้ประโยชน์</h4>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">เป้าหมายที่คาดหวัง</label>
                            <textarea name="expectedGoal" value={formData.expectedGoal} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="2"></textarea>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">สิ่งที่ได้เรียนรู้ (Reflection)</label>
                            <textarea name="reflection" value={formData.reflection} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" rows="3"></textarea>
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
                    <button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors border bg-white disabled:opacity-50">
                        ยกเลิก
                    </button>
                    <button onClick={() => handleSave('draft')} disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50">
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
                    </button>
                    <button onClick={() => handleSave('submitted')} disabled={isSaving} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm rounded-lg transition-colors disabled:opacity-50">
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกและส่งตรวจ'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Admins Views
const ReviewView = ({ user, fetchAPI }) => {
    const [records, setRecords] = useState([]);

    const loadRecords = async () => {
        const res = await fetchAPI('listRecords', { status: 'submitted' });
        if (res && res.ok) {
            setRecords((res.data || []).filter(r => r.status === 'submitted'));
        }
    };

    useEffect(() => {
        loadRecords();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleReview = async (recordId, actionType) => {
        const comment = actionType === 'reject' ? prompt('เหตุผลที่ส่งกลับ (ถ้ามี):') : '';
        if (actionType === 'reject' && comment === null) return;

        const reviewAction = actionType === 'approve' ? 'approved' : 'rejected';
        const res = await fetchAPI('reviewRecord', { recordId, reviewAction, comment });
        if (res.ok) {
            alert('ดำเนินการเรียบร้อย');
            loadRecords();
        } else {
            alert('เกิดข้อผิดพลาด: ' + (res.error?.message || 'ไม่ทราบสาเหตุ'));
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">รายการรอตรวจ (Admin)</h2>
            <div className="overflow-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">ผู้ส่ง</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">ชื่อกิจกรรม</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">ชั่วโมง</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {records.length === 0 ? (
                            <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">ไม่มีรายการรอดำเนินการ</td></tr>
                        ) : records.map(record => (
                            <tr key={record.recordId} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{record.ownerEmail}</td>
                                <td className="px-4 py-3">{record.title}</td>
                                <td className="px-4 py-3">{record.hours}</td>
                                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                    <button onClick={() => handleReview(record.recordId, 'approve')} className="text-green-700 bg-green-100 font-medium hover:bg-green-200 px-3 py-1 rounded-md transition-colors">อนุมัติ</button>
                                    <button onClick={() => handleReview(record.recordId, 'reject')} className="text-red-700 bg-red-100 font-medium hover:bg-red-200 px-3 py-1 rounded-md transition-colors">ส่งกลับ</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UsersView = ({ user, fetchAPI }) => {
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        const loadUsers = async () => {
            const res = await fetchAPI('getUsers');
            if (res && res.ok) {
                setUsersList(res.data || []);
            }
        };
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">จัดการผู้ใช้ระบบ (Admin)</h2>
            <div className="overflow-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">อีเมล</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">ชื่อ</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">สิทธิ์</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">สถานะ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {usersList.length === 0 ? (
                            <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">กำลังโหลดข้อมูล...</td></tr>
                        ) : usersList.map(u => (
                            <tr key={u.email} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">{u.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{u.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SettingsView = () => (
    <div className="bg-white rounded-xl border p-8 space-y-6 shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center mb-2"><Settings className="mr-2" size={24} /> ตั้งค่าระบบ (Admin Only)</h2>
            <p className="text-gray-500 text-sm mb-6">ขณะนี้ระบบกำลังพัฒนาส่วนของ UI ผู้ดูแลสามารถทำการตั้งค่าเพิ่มเติมได้โดยการเข้าไปที่ Google Sheets ของระบบ</p>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">วิธีตั้งค่าเป้าหมายชั่วโมงการพัฒนา</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                <li>เปิดไฟล์ <strong>Teacher Dev Log DB</strong> ขึ้นมา (Google Sheet)</li>
                <li>ไปที่ชีต <strong>Settings</strong></li>
                <li>แก้ไขค่า <strong>20</strong> ในเครื่องหมาย <code>targetHoursPerYear</code></li>
            </ol>
        </div>
    </div>
);
