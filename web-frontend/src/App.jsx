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

    // Auto-login on mount checking LocalStorage first, then API
    useEffect(() => {
        const initLogin = async () => {
            if (GAS_API_URL.includes('YOUR_GAS_WEB_APP_URL_HERE')) {
                setIsCheckingAutoLogin(false);
                return;
            }
            try {
                // Check if user has an active session in localStorage
                const savedUserStr = localStorage.getItem('tdl_userObj');
                const savedEmail = localStorage.getItem('tdl_localEmail');

                if (savedUserStr) {
                    const parsedUser = JSON.parse(savedUserStr);
                    setCurrentUser(parsedUser);
                    if (savedEmail) setLocalEmail(savedEmail);
                    setIsCheckingAutoLogin(false);
                    return; // Skip API call if we have a valid saved session to make it fast
                }

                const res = await fetchAPI('getMe');
                if (res && res.ok && res.data) {
                    setCurrentUser(res.data);
                    localStorage.setItem('tdl_userObj', JSON.stringify(res.data));
                }
            } catch (e) {
                console.error("Auto login failed", e);
            } finally {
                setIsCheckingAutoLogin(false);
            }
        };
        initLogin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleLoginClick = async (mode, formData) => {
        if (!formData.email || !formData.password) {
            alert('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
            return;
        }

        if (mode === 'register') {
            if (!formData.name) {
                alert('กรุณากรอกชื่อ-นามสกุล');
                return;
            }
            const res = await fetchAPI('registerUser', { user: formData });
            if (res && res.ok && res.data) {
                alert(res.data.message || 'สมัครสมาชิกสำเร็จ');
                // The LoginView will automatically switch back to 'login' mode on success
            } else {
                alert('ไม่สามารถสมัครสมาชิกได้: ' + (res?.error?.message || 'เกิดข้อผิดพลาด'));
                throw new Error("Register failed"); // To stop loading state in LoginView
            }
        }
        else if (mode === 'login') {
            const res = await fetchAPI('loginUser', { email: formData.email, password: formData.password });
            if (res && res.ok && res.data) {
                setCurrentUser(res.data);
                setLocalEmail(formData.email);
                localStorage.setItem('tdl_userObj', JSON.stringify(res.data));
                localStorage.setItem('tdl_localEmail', formData.email);
            } else {
                alert('ไม่สามารถเข้าสู่ระบบได้: ' + (res?.error?.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีของคุณอาจกำลังรอการอนุมัติ'));
                throw new Error("Login failed");
            }
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setLocalEmail('');
        localStorage.removeItem('tdl_userObj');
        localStorage.removeItem('tdl_localEmail');
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
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalLoading(true);
        try {
            if (mode === 'login') {
                await onLogin('login', formData);
            } else {
                await onLogin('register', formData);
                setMode('login'); // switch back after success
                setFormData({ ...formData, password: '' }); // clear password
            }
        } catch (error) {
            // Error handling is managed by onLogin from App
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F5F5F7]">
            {/* Left Panel: Branding & Graphics (Hidden on small screens) */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <FileText size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight font-display">Teacher DevLog</span>
                    </div>
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        ยกระดับ<br />
                        <span className="text-blue-400">การพัฒนาตนเอง</span><br />
                        อย่างมืออาชีพ
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md">
                        ระบบจัดการและติดตามผลลัพธ์การพัฒนาตนเองสำหรับบุคลากรทางการศึกษา ใช้งานง่ายและปลอดภัย
                    </p>
                </div>

                {/* Abstract Decorative Elements */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>

                <div className="relative z-10 flex items-center space-x-4 text-sm text-slate-500 font-medium">
                    <span>© 2026 Kruchat System</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>All Rights Reserved</span>
                </div>
            </div>

            {/* Right Panel: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
                <div className="max-w-[420px] w-full bg-white rounded-3xl apple-shadow-lg p-8 md:p-10 border border-gray-100">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <FileText size={32} className="text-white" />
                        </div>
                    </div>

                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            {mode === 'login' ? 'ยินต้อนรับกลับมา' : 'สร้างบัญชีใหม่'}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {mode === 'login' ? 'กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลของคุณ' : 'กรอกข้อมูลเพื่อลงทะเบียนเข้าใช้งานระบบ'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">ชื่อ - นามสกุล</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <Users size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        placeholder="เช่น สมชาย ใจดี"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">อีเมลโรงเรียน</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="your.email@school.ac.th"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-medium text-gray-700 ml-1">รหัสผ่าน</label>
                                {mode === 'login' && (
                                    <a href="#" className="text-xs text-blue-600 hover:text-blue-800 font-medium">ลืมรหัสผ่าน?</a>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none tracking-widest"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || localLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {(loading || localLoading) ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    กำลังดำเนินการ...
                                </>
                            ) : (
                                mode === 'login' ? "เข้าสู่ระบบ" : "สมัครสมาชิก"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center space-x-1 text-sm">
                        <span className="text-gray-500">
                            {mode === 'login' ? 'ยังไม่มีบัญชีผู้ใช้งาน?' : 'มีบัญชีอยู่แล้ว?'}
                        </span>
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setFormData({ email: '', password: '', name: '' }) }}
                            className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                        >
                            {mode === 'login' ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
                        </button>
                    </div>
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
    const [activeUserTab, setActiveUserTab] = useState('approved'); // 'approved' or 'pending'

    const loadUsers = async () => {
        const res = await fetchAPI('getUsers');
        if (res && res.ok) {
            setUsersList(res.data || []);
        }
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeUserTab]);

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
        const confirmMsg = currentStatus === 'pending'
            ? `ยืนยันการ อนุมัติ บัญชี ${targetEmail} เข้าสู่ระบบใช่หรือไม่?`
            : `ยืนยันการตั้งสถานะเป็น ${newStatus.toUpperCase()} ใช่หรือไม่?`;

        if (confirm(confirmMsg)) {
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

    const pendingUsers = usersList.filter(u => u.status === 'pending');
    const approvedUsers = usersList.filter(u => u.status !== 'pending');

    const displayUsers = activeUserTab === 'pending' ? pendingUsers : approvedUsers;

    return (
        <div className="bg-white rounded-xl shadow-sm border flex flex-col h-full">
            <div className="p-4 md:p-6 border-b flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">จัดการผู้ใช้งาน (Admin)</h2>
                        <p className="text-gray-500 text-sm">อนุมัติและจัดการสิทธิ์การเข้าถึงระบบ</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 border-b">
                    <button
                        onClick={() => setActiveUserTab('approved')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeUserTab === 'approved' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        ผู้ใช้งานปัจจุบัน ({approvedUsers.length})
                    </button>
                    <button
                        onClick={() => setActiveUserTab('pending')}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center ${activeUserTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        รอการอนุมัติ
                        {pendingUsers.length > 0 && (
                            <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">{pendingUsers.length}</span>
                        )}
                    </button>
                </div>
            </div>

            <div className="overflow-auto p-4 md:p-6">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">อีเมล</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600">ชื่อ</th>
                            {activeUserTab === 'approved' && <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">สิทธิ์</th>}
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-center">สถานะ</th>
                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {displayUsers.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">{activeUserTab === 'pending' ? 'ไม่มีผู้ใช้งานที่รอการอนุมัติ' : 'ไม่มีผู้ใช้งานในระบบ'}</td></tr>
                        ) : displayUsers.map(u => (
                            <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">{u.name}</td>
                                {activeUserTab === 'approved' && (
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
                                )}
                                <td className="px-4 py-3 text-center">
                                    {activeUserTab === 'pending' ? (
                                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
                                            PENDING
                                        </span>
                                    ) : (
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
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {activeUserTab === 'pending' ? (
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleStatusChange(u.email, u.status)}
                                                disabled={isProcessing}
                                                className="text-green-700 hover:text-green-800 font-medium text-sm transition-colors py-1.5 px-3 rounded-lg bg-green-100 hover:bg-green-200 disabled:opacity-50"
                                            >
                                                อนุมัติ
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(u.email)}
                                                disabled={isProcessing}
                                                className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors py-1 px-3 rounded-lg hover:bg-red-50 disabled:opacity-30 border border-transparent hover:border-red-100"
                                            >
                                                ปฏิเสธ
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleDeleteUser(u.email)}
                                            disabled={isProcessing || u.email === user.email}
                                            className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors py-1 px-3 rounded-lg hover:bg-red-50 disabled:opacity-30 border border-transparent hover:border-red-100"
                                        >
                                            ลบผู้ใช้
                                        </button>
                                    )}
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
