import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, CheckCircle, AlertOctagon, Star, MessageSquareWarning, ArrowLeft, MoreHorizontal } from 'lucide-react';
import NavigationDrawer from '../components/NavigationDrawer';
import toast from 'react-hot-toast';

export default function RideHistory() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [disputeModalData, setDisputeModalData] = useState<any | null>(null);
    const [disputeForm, setDisputeForm] = useState({ issueType: 'Driver was late', description: '' });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchHistory();
    }, [user, navigate]);

    const fetchHistory = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/rides/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisputeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/rides/${disputeModalData.id}/dispute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(disputeForm)
            });
            
            if (res.ok) {
                toast.success('Dispute ticket submitted safely.');
                setDisputeModalData(null);
                fetchHistory(); // Refresh to show badge
            } else {
                toast.error('Failed to submit ticket');
            }
        } catch (err) {
            toast.error('Network error');
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
            <NavigationDrawer />
            
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 pt-4">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4 pl-14">
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">Ride History</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 pt-10">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-6 shadow-xs">
                             <MapPin className="w-8 h-8 text-slate-300" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Where to next?</h2>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">You haven't taken any trips with us yet. Your journey history will appear here once you book a ride.</p>
                        <button 
                            onClick={() => navigate(user?.role === 'driver' ? '/driver' : '/passenger')}
                            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-extrabold hover:bg-blue-700 hover:shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5"
                        >
                            {user?.role === 'driver' ? 'Go to Driver Console' : 'Book your first ride'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {history.map((ride, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={ride.id} 
                                className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xs relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-10 bg-opacity-50"></div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{formatDate(ride.createdAt)}</h3>
                                            <span className="text-sm font-medium text-slate-500">Ride #{ride.id}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-slate-900 font-display">₱{ride.proposedFare}</div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mt-1 border border-emerald-100">
                                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                    <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-[26px] before:bottom-[26px] before:w-[2px] before:bg-slate-200">
                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5 border border-white">
                                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Pickup</span>
                                                <p className="text-slate-900 font-medium text-sm pr-4 line-clamp-2">{ride.pickupAddress}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5 border border-white">
                                                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Dropoff</span>
                                                <p className="text-slate-900 font-medium text-sm pr-4 line-clamp-2">{ride.dropoffAddress}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-between">
                                        <div>
                                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                {user?.role === 'passenger' ? 'Driver Details' : 'Passenger Details'}
                                            </span>
                                            <h4 className="font-bold text-slate-900">
                                                 {user?.role === 'passenger' ? ride.driverName || 'Verified Driver' : ride.passengerName || 'Verified Passenger'}
                                            </h4>
                                            
                                            {ride.rating && (
                                                <div className="flex items-center gap-1 mt-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-4 h-4 ${i < ride.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center gap-2">
                                            {ride.dispute_status === 'OPEN' ? (
                                                <span className="flex items-center gap-2 text-rose-600 font-bold text-sm bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                                                    <AlertOctagon className="w-4 h-4" /> Issue Reported
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => setDisputeModalData(ride)}
                                                    className="flex items-center gap-2 text-slate-500 font-semibold text-sm hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-100"
                                                >
                                                    <MessageSquareWarning className="w-4 h-4" /> Report Issue
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Dispute Modal */}
            <AnimatePresence>
                {disputeModalData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setDisputeModalData(null)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h3 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
                                    <AlertOctagon className="w-5 h-5 text-rose-500" /> Report Issue
                                </h3>
                                <button onClick={() => setDisputeModalData(null)} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm font-medium text-slate-500 mb-6 focus-within:">We take accountability seriously. Let us know what went wrong on Ride #{disputeModalData.id}.</p>
                                <form onSubmit={handleDisputeSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Issue Type</label>
                                        <select 
                                            name="issueType" 
                                            value={disputeForm.issueType}
                                            onChange={(e) => setDisputeForm({ ...disputeForm, issueType: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-semibold focus:outline-hidden focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all appearance-none outline-hidden"
                                        >
                                            <option>Driver was late</option>
                                            <option>Vehicle was unclean</option>
                                            <option>Safety concern</option>
                                            <option>Fare discrepancy</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Description</label>
                                        <textarea 
                                            placeholder="Please provide details..."
                                            required
                                            value={disputeForm.description}
                                            onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-medium focus:outline-hidden focus:border-rose-300 focus:ring-4 focus:ring-rose-50 transition-all min-h-[100px] outline-hidden"
                                        />
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200">
                                        Submit Ticket
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
