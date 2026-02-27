import { useState, useEffect, useCallback } from 'react';
import { Download, Upload, Plus, FileText, CheckCircle, XCircle, Clock, Settings, Users, Home, Search, Filter, LogOut, FileCode, Check, Paperclip, Menu } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// === Configuration ===
// นำ URL ที่ได้จากการ Deploy Google Apps Script มาวางที่นี่
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxhjBgP7lhCTIwIegwl3yweU0b602hcBEJ4tvq8NO8nFsxm6jwXL7_maODDel6_rBL6/exec'; // TODO: Replace

export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [localEmail, setLocalEmail] = useState(''); // Store manual email for local dev
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, records, review, users, settings
    const [loading, setLoading] = useState(false);
    const [isCheckingAutoLogin, setIsCheckingAutoLogin] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            const finalPayload = { action, ...payload };
            // Append localEmail if it exists, to bypass empty Session on localhost
            if (localEmail && !finalPayload.email) {
                finalPayload.email = localEmail;
            }

            const res = await fetch(GAS_API_URL, {
                method: 'POST',
                body: JSON.stringify(finalPayload)
            });
            const json = await res.json();
            return json;
        } catch (e) {
            console.error(e);
            return { ok: false, error: { message: e.message } };
        } finally {
            setLoading(false);
        }
    }, [localEmail]);

    const handleLoginClick = async (emailInput) => {
        // Send emailInput to backend if available (useful for local dev testing)
        const res = await fetchAPI('getMe', { email: emailInput });
        if (res && res.ok && res.data) {
            setCurrentUser(res.data);
            if (emailInput) setLocalEmail(emailInput);
        } else {
            alert('ไม่สามารถเข้าสู่ระบบได้: ' + (res?.error?.message || 'โปรดตรวจสอบสิทธิ์'));
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setLocalEmail('');
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
        <div className="flex h-screen bg-gray-50 text-sm md:text-base overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={handleLogout} className="hidden md:flex" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="absolute top-0 left-0 bottom-0 w-64 bg-slate-800 shadow-xl" onClick={e => e.stopPropagation()}>
                        <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} user={currentUser} onLogout={handleLogout} className="flex h-full" />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center space-x-3">
                        <button
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800"><span className="hidden sm:inline">ระบบ</span>บันทึกการพัฒนาตนเอง</h1>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <span className="text-gray-600 hidden md:inline-block">ยินดีต้อนรับ, {currentUser.name}</span>
                        <span className="px-2 md:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] md:text-xs font-medium uppercase tracking-wider">{currentUser.role}</span>
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

const LoginView = ({ onLogin, loading }) => {
    const [email, setEmail] = useState('');

    return (
        <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[24px] shadow-xl overflow-hidden border border-gray-100">
                <div className="p-10 text-center bg-slate-900">
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2 font-display"><span className="text-blue-400">Teacher</span>DevLog</h2>
                    <p className="text-slate-300 text-sm">ระบบบันทึกการพัฒนาตนเอง</p>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-center text-gray-600 text-sm mb-2">
                        เข้าสู่ระบบเพื่อใช้งาน (ระบุอีเมล)
                    </p>
                    <input
                        type="email"
                        placeholder="your.email@school.ac.th"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center"
                    />
                    <button
                        onClick={() => onLogin(email)}
                        disabled={loading || !email.includes('@')}
                        className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-medium py-3.5 rounded-xl transition-colors apple-shadow flex items-center justify-center disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                กำลังตรวจสอบ...
                            </>
                        ) : (
                            "เข้าสู่ระบบ"
                        )}
                    </button>
                </div>
                <div className="bg-orange-50 p-6 border-t border-orange-100 text-xs text-center text-orange-800 space-y-2">
                    <p className="font-semibold text-sm">สำหรับนักพัฒนา (Localhost Mode)</p>
                    <p>ระบบ Google Apps Script จะไม่สามารถดึงอีเมลอัตโนมัติได้เมื่อรันผ่าน localhost กรุณาพิมพ์อีเมลของคุณ (เช่น <b>admin@test.com</b>) แล้วกดปุ่มเพื่อใช้ทดสอบระบบครับ</p>
                </div>
            </div>
        </div>
    );
};

// === Components ===

const Sidebar = ({ activeTab, setActiveTab, user, onLogout, className = "hidden md:flex" }) => {
    const navItems = [
        { id: 'dashboard', label: 'ภาพรวม', icon: <Home size={20} />, roles: ['teacher', 'admin'] },
        { id: 'records', label: 'บันทึกของฉัน', icon: <FileText size={20} />, roles: ['teacher', 'admin'] },
        { id: 'review', label: 'รายการรอตรวจ', icon: <CheckCircle size={20} />, roles: ['admin'] },
        { id: 'users', label: 'จัดการผู้ใช้', icon: <Users size={20} />, roles: ['admin'] },
        { id: 'settings', label: 'ตั้งค่าระบบ', icon: <Settings size={20} />, roles: ['admin'] },
    ];

    return (
        <div className={`w-64 bg-slate-800 text-white flex-col ${className}`}>
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
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);

    useEffect(() => {
        const loadStats = async () => {
            const res = await fetchAPI('listRecords');
            if (res && res.ok) {
                const records = res.data || [];
                let h = 0, p = 0, a = 0;

                // For charts
                const typeCount = {};
                const formatCount = { onsite: 0, online: 0, hybrid: 0 };

                records.forEach(r => {
                    if (r.status === 'approved') {
                        a++;
                        h += Number(r.hours) || 0;

                        // Count types for approved
                        typeCount[r.activityType] = (typeCount[r.activityType] || 0) + 1;
                        if (r.format) formatCount[r.format] = (formatCount[r.format] || 0) + 1;
                    }
                    if (r.status === 'submitted') p++;
                });

                setStats({ totalHours: h, pending: p, approved: a });

                setChartData(Object.keys(typeCount).map(k => ({ name: k, count: typeCount[k] })));
                setPieData([
                    { name: 'Onsite', value: formatCount.onsite },
                    { name: 'Online', value: formatCount.online },
                    { name: 'Hybrid', value: formatCount.hybrid }
                ].filter(d => d.value > 0));
            }
        };
        loadStats();
    }, [user, fetchAPI]);

    const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#FF2D55'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="ชั่วโมงสะสมปีนี้ (ผ่านแล้ว)" value={stats.totalHours} subtitle="เป้าหมาย: 20 ชั่วโมง" icon={<Clock className="text-[#007AFF]" size={28} />} />
                <Card title="รายการรอตรวจ" value={stats.pending} subtitle="รอการอนุมัติรับรอง" icon={<FileText className="text-[#FF9500]" size={28} />} />
                <Card title="ผ่านการอนุมัติแล้ว" value={stats.approved} subtitle="รายการกิจกรรม" icon={<CheckCircle className="text-[#34C759]" size={28} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[24px] apple-shadow border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 font-display">จำนวนกิจกรรมที่ผ่านอนุมัติ (แยกตามประเภท)</h3>
                    {chartData.length > 0 ? (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8E8E93', fontSize: 12 }} />
                                    <Tooltip cursor={{ fill: '#F2F2F7' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                    <Bar dataKey="count" fill="#007AFF" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                            <FileCode size={48} className="mb-4 opacity-20" />
                            <p>ไม่มีข้อมูลสถิติที่ผ่านการอนุมัติ</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[24px] apple-shadow border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 font-display">สัดส่วนรูปแบบการเข้าร่วม</h3>
                    {pieData.length > 0 ? (
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                <span className="text-3xl font-bold text-gray-800">{stats.approved}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">ทั้งหมด</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                            <FileCode size={48} className="mb-4 opacity-20" />
                            <p>ไม่มีข้อมูลสัดส่วนรูปแบบ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Card = ({ title, value, subtitle, icon }) => (
    <div className="bg-white rounded-[24px] apple-shadow border border-gray-100 p-6 flex items-center space-x-5 hover:apple-shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="p-4 bg-gray-50 rounded-2xl">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h4 className="text-3xl font-bold text-gray-900 my-1">{value}</h4>
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
                            <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">ไฟล์แนบ</th>
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
                                <td className="px-6 py-4 text-center">
                                    {record.attachments?.length > 0 ? (
                                        <a href={record.attachments[0].fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 flex justify-center w-full" title="ดูไฟล์แนบ">
                                            <Paperclip size={16} />
                                        </a>
                                    ) : '-'}
                                </td>
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
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // File upload handler
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('ขนาดไฟล์ต้องไม่เกิน 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

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
                // If there's a file, upload it after saving record is successful
                if (selectedFile) {
                    setIsUploading(true);
                    try {
                        const reader = new FileReader();
                        reader.readAsDataURL(selectedFile);
                        reader.onload = async () => {
                            const base64Data = reader.result;
                            const uploadRes = await fetchAPI('uploadFile', {
                                recordId: res.data.recordId,
                                fileName: selectedFile.name,
                                mimeType: selectedFile.type,
                                base64Data: base64Data
                            });
                            if (!uploadRes.ok) {
                                alert('บันทึกข้อมูลสำเร็จ แต่ไม่สามารถอัปโหลดไฟล์ได้: ' + uploadRes.error?.message);
                            } else {
                                alert('บันทึกและอัปโหลดไฟล์เรียบร้อยแล้ว');
                            }
                            onClose();
                        };
                    } catch (err) {
                        alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
                        onClose();
                    } finally {
                        setIsUploading(false);
                    }
                } else {
                    alert('บันทึกข้อมูลเรียบร้อยแล้ว');
                    onClose();
                }
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

                        {(record?.attachments && record.attachments.length > 0) ? (
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><FileText size={20} /></div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">{record.attachments[0].fileName}</p>
                                        <a href={record.attachments[0].fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">ดูไฟล์แนบ</a>
                                    </div>
                                </div>
                                <span className="text-xs bg-white px-2 py-1 rounded text-blue-500 border border-blue-200">อัปโหลดแล้ว</span>
                            </div>
                        ) : null}

                        <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 hover:border-blue-400 transition-colors cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group">
                            <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.png,.jpg,.jpeg" />
                            {selectedFile ? (
                                <>
                                    <CheckCircle className="text-green-500 mb-2" size={32} />
                                    <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB - คลิกเพื่อเปลี่ยนไฟล์</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" size={32} />
                                    <p className="text-sm text-gray-600 mb-1 font-medium group-hover:text-blue-600 transition-colors">คลิกเพื่ออัปโหลดไฟล์หลักฐาน (เก็บลง Google Drive)</p>
                                    <p className="text-xs text-gray-400">รองรับ PDF, JPG, PNG (ขนาดไม่เกิน 10MB)</p>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                    <button onClick={onClose} disabled={isSaving || isUploading} className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-full transition-colors bg-gray-100 disabled:opacity-50 border border-transparent">
                        ยกเลิก
                    </button>
                    <button onClick={() => handleSave('draft')} disabled={isSaving || isUploading} className="px-6 py-2.5 text-sm font-medium text-[#007AFF] bg-blue-50 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50 border border-transparent">
                        {isSaving ? 'กำลังบันทึก...' : isUploading ? 'กำลังอัปโหลด...' : 'บันทึกร่าง'}
                    </button>
                    <button onClick={() => handleSave('submitted')} disabled={isSaving || isUploading} className="px-6 py-2.5 text-sm font-medium text-white bg-[#007AFF] hover:bg-blue-600 apple-shadow rounded-full transition-colors disabled:opacity-50 border border-transparent">
                        {isSaving ? 'กำลังบันทึก...' : isUploading ? 'กำลังอัปโหลด...' : 'บันทึกและส่งตรวจ'}
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
    const [isProcessing, setIsProcessing] = useState(false);

    const loadUsers = async () => {
        const res = await fetchAPI('getUsers');
        if (res && res.ok) {
            setUsersList(res.data || []);
        }
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleRoleChange = async (targetEmail, currentRole) => {
        if (targetEmail === user.email) {
            alert('ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้');
            return;
        }
        const newRole = currentRole === 'admin' ? 'teacher' : 'admin';
        if (confirm(`ยืนยันการตั้งเป็น ${newRole.toUpperCase()} ใช่หรือไม่?`)) {
            setIsProcessing(true);
            const res = await fetchAPI('updateUser', { targetEmail, updates: { role: newRole } });
            if (res.ok) await loadUsers();
            else alert('ข้อผิดพลาด: ' + (res.error?.message || 'ไม่ทราบสาเหตุ'));
            setIsProcessing(false);
        }
    };

    const handleStatusChange = async (targetEmail, currentStatus) => {
        if (targetEmail === user.email) {
            alert('ไม่สามารถระงับการใช้งานของตัวเองได้');
            return;
        }
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        if (confirm(`ยืนยันการเปลี่ยนสถานะเป็น ${newStatus} ใช่หรือไม่?`)) {
            setIsProcessing(true);
            const res = await fetchAPI('updateUser', { targetEmail, updates: { status: newStatus } });
            if (res.ok) await loadUsers();
            else alert('ข้อผิดพลาด: ' + (res.error?.message || 'ไม่ทราบสาเหตุ'));
            setIsProcessing(false);
        }
    };

    const handleDeleteUser = async (targetEmail) => {
        if (targetEmail === user.email) {
            alert('ไม่สามารถลบบัญชีของตัวเองได้');
            return;
        }
        if (confirm(`คำเตือน: ยืนยันการลบบัญชี ${targetEmail} อย่างถาวรใช่หรือไม่?\n(ข้อมูลจะไม่สามารถกู้คืนได้)`)) {
            setIsProcessing(true);
            const res = await fetchAPI('deleteUser', { targetEmail });
            if (res.ok) await loadUsers();
            else alert('ข้อผิดพลาด: ' + (res.error?.message || 'ไม่ทราบสาเหตุ'));
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">จัดการผู้ใช้ระบบ (Admin)</h2>
            <div className="overflow-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">อีเมล</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">ชื่อ</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">สิทธิ์</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">สถานะ</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {usersList.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">กำลังโหลดข้อมูล...</td></tr>
                        ) : usersList.map(u => (
                            <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">{u.name}</td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => handleRoleChange(u.email, u.role)}
                                        disabled={isProcessing || u.email === user.email}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-colors disabled:opacity-50 border 
                                            ${u.role === 'admin'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                                    >
                                        {u.role.toUpperCase()}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => handleStatusChange(u.email, u.status)}
                                        disabled={isProcessing || u.email === user.email}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-colors disabled:opacity-50 border
                                            ${u.status === 'active'
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                                    >
                                        {u.status.toUpperCase()}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => handleDeleteUser(u.email)}
                                        disabled={isProcessing || u.email === user.email}
                                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors py-1 px-3 rounded-lg hover:bg-red-50 disabled:opacity-30 border border-transparent hover:border-red-100"
                                    >
                                        ลบผู้ใช้
                                    </button>
                                </td>
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
