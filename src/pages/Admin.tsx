import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, MapPin, DollarSign, LogOut, CheckCircle, Car, Tag } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Admin() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState<any>(null);
    const [unverifiedDrivers, setUnverifiedDrivers] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [promoCodes, setPromoCodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'promo'>('overview');
    
    const [newPromoCode, setNewPromoCode] = useState('');
    const [newPromoDiscount, setNewPromoDiscount] = useState('');

    const mockChartData = [
        { name: 'Mon', revenue: 1200 },
        { name: 'Tue', revenue: 1500 },
        { name: 'Wed', revenue: 1100 },
        { name: 'Thu', revenue: 1800 },
        { name: 'Fri', revenue: 2200 },
        { name: 'Sat', revenue: 2500 },
        { name: 'Sun', revenue: 2800 },
    ];

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
        } else {
            fetchAllData();
        }
    }, [user, navigate]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, driversRes, transRes, promoRes] = await Promise.all([
                fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/unverified-drivers', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/promo', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (driversRes.ok) setUnverifiedDrivers(await driversRes.json());
            if (transRes.ok) setTransactions(await transRes.json());
            if (promoRes.ok) setPromoCodes(await promoRes.json());
            
        } catch (err) {
            console.error('Failed to fetch admin data', err);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePromo = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ code: newPromoCode.toUpperCase(), discountPercentage: Number(newPromoDiscount) })
            });
            if (res.ok) {
                toast.success('Promo code created');
                setNewPromoCode('');
                setNewPromoDiscount('');
                fetchAllData();
            } else {
                toast.error('Failed to create promo');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleTogglePromo = async (id: number, isActive: boolean) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/promo/${id}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ isActive: !isActive })
            });
            if (res.ok) {
                toast.success(isActive ? 'Promo deactivated' : 'Promo activated');
                fetchAllData();
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const handleVerifyDriver = async (id: number) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/verify-driver/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Driver verified successfully');
                setUnverifiedDrivers(prev => prev.filter(d => d.id !== id));
                // Update stats
                fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
                    .then(r => r.json())
                    .then(data => setStats(data));
            } else {
                toast.error('Failed to verify driver');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
                <div className="p-6 flex items-center gap-2 border-b border-slate-800">
                    <Activity className="w-6 h-6 text-blue-500" />
                    <h1 className="text-xl font-bold tracking-tight">FareGo Admin</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('overview')} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                        <Activity className="w-5 h-5" /> Overview
                    </button>
                    <button onClick={() => setActiveTab('promo')} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'promo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
                        <Tag className="w-5 h-5" /> Promo Codes
                    </button>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-300 transition-colors">
                        <DollarSign className="w-5 h-5 opacity-70" /> Finances
                    </a>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={() => { logout(); navigate('/'); }} className="flex items-center justify-center gap-3 w-full px-4 py-3 hover:bg-rose-600 hover:text-white rounded-xl text-sm font-bold text-slate-300 transition-colors">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                <header className="mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-900 font-display">{activeTab === 'overview' ? 'Dashboard Overview' : 'Promo Codes Management'}</h2>
                    <p className="text-slate-500 font-medium mt-1">{activeTab === 'overview' ? 'Monitor platform metrics and resolve driver verifications.' : 'Create and manage discount codes.'}</p>
                </header>
                
                {loading || !stats ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                    </div>
                ) : (
                    activeTab === 'overview' ? (
                    <div className="space-y-10">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Users</p>
                                </div>
                                <p className="text-4xl font-extrabold text-slate-900 font-display">{stats.usersCount}</p>
                            </div>
                            
                            <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Car className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Active Drivers</p>
                                </div>
                                <p className="text-4xl font-extrabold text-slate-900 font-display">{stats.driversCount}</p>
                            </div>

                            <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Completed Rides</p>
                                </div>
                                <p className="text-4xl font-extrabold text-slate-900 font-display">{stats.ridesCount}</p>
                            </div>

                            <div className="bg-white/70 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full -z-10 opacity-50 blur-3xl"></div>
                                <div className="flex items-center gap-4 mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Platform Revenue</p>
                                </div>
                                <p className="text-4xl font-extrabold text-emerald-600 font-display relative z-10">
                                    ₱{parseFloat(stats.revenue || 0).toLocaleString()} <span className="text-sm font-medium text-slate-400 align-middle">approx.</span>
                                </p>
                            </div>
                        </div>

                        {/* Charts & Actions Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Revenue Chart */}
                            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                                <h3 className="font-extrabold text-slate-900 mb-6 text-xl">Revenue Trend (7 Days)</h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₱${val}`} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value) => [`₱${value}`, 'Revenue']}
                                            />
                                            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Driver Verification Queue */}
                            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col">
                                <h3 className="font-extrabold text-slate-900 mb-6 text-xl flex items-center justify-between">
                                    Action Queue
                                    <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold">{unverifiedDrivers.length} Pending</span>
                                </h3>
                                
                                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                    {unverifiedDrivers.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                            <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
                                            <p className="font-bold text-slate-500">All caught up!</p>
                                        </div>
                                    ) : (
                                        unverifiedDrivers.map(driver => (
                                            <div key={driver.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{driver.firstName} {driver.lastName}</h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">{driver.email}</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleVerifyDriver(driver.id)}
                                                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    Verify
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Recent Transactions Table */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-extrabold text-slate-900 text-xl">Live Transactions</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-widest text-slate-400 font-bold">
                                            <th className="px-8 py-5">Trip ID</th>
                                            <th className="px-8 py-5">Date</th>
                                            <th className="px-8 py-5">Driver</th>
                                            <th className="px-8 py-5">Passenger</th>
                                            <th className="px-8 py-5 text-right">Gross Fare</th>
                                            <th className="px-8 py-5 text-right">Platform Fee (15%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {transactions.slice(0, 10).map((trans) => (
                                            <tr key={trans.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5 font-bold text-slate-900 text-sm">#{trans.id}</td>
                                                <td className="px-8 py-5 text-slate-500 text-sm font-medium">
                                                    {new Date(trans.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-5 font-semibold text-slate-700 text-sm">{trans.driverName || 'Driver ' + trans.driverId}</td>
                                                <td className="px-8 py-5 font-semibold text-slate-700 text-sm">{trans.passengerName || 'Passenger ' + trans.passengerId}</td>
                                                <td className="px-8 py-5 text-right font-bold text-slate-900 text-sm">₱{trans.proposedFare}</td>
                                                <td className="px-8 py-5 text-right font-black text-emerald-600">₱{(trans.proposedFare * 0.15).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-10 text-center text-slate-500 font-medium">
                                                    No transactions found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                    ) : (
                    <div className="space-y-6 max-w-4xl">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                            <h3 className="font-extrabold text-slate-900 mb-6 text-xl">Create New Promo</h3>
                            <form onSubmit={handleCreatePromo} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Code</label>
                                    <input type="text" value={newPromoCode} onChange={e => setNewPromoCode(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 uppercase font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden" placeholder="e.g. SUMMER25" />
                                </div>
                                <div className="w-32">
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Discount %</label>
                                    <input type="number" min="1" max="100" value={newPromoDiscount} onChange={e => setNewPromoDiscount(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden" placeholder="20" />
                                </div>
                                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all h-[52px]">
                                    Create Promo
                                </button>
                            </form>
                        </div>
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                            <h3 className="font-extrabold text-slate-900 mb-6 text-xl">Active Promos</h3>
                            {promoCodes.length === 0 ? (
                                <p className="text-slate-500 text-sm font-medium">No promo codes created yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {promoCodes.map(promo => (
                                        <div key={promo.id} className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${promo.isActive ? 'bg-slate-50 border-slate-100' : 'bg-slate-100 border-slate-200 opacity-60 grayscale'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white text-xl shadow-inner">
                                                    {promo.discountPercentage}%
                                                </div>
                                                <div>
                                                    <h4 className="font-extrabold text-slate-900 text-xl tracking-tight">{promo.code}</h4>
                                                    <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${promo.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                        {promo.isActive ? 'Active' : 'Inactive'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleTogglePromo(promo.id, promo.isActive)} 
                                                className={`px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors ${promo.isActive ? 'bg-white text-rose-600 border border-slate-200 hover:bg-rose-50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                            >
                                                {promo.isActive ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    )
                )}
            </div>
        </div>
    );
}
