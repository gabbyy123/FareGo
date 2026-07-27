import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Home, Car, User, Wallet, LogOut, Navigation as NavIcon, History } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function NavigationDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="p-2.5 bg-slate-50/80 backdrop-blur-md border border-slate-200 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors text-slate-600 shadow-sm"
            >
                <Menu className="w-6 h-6" />
            </button>

            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200]"
                            />

                            <motion.div 
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl z-[201] border-r border-slate-200 flex flex-col pt-6"
                            >
                                <div className="px-6 pb-6 border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-500/20">
                                            <NavIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">FareGo</span>
                                    </div>
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 hover:text-slate-900 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-2">
                                    <Link onClick={() => setIsOpen(false)} to="/home" className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 transition-colors text-slate-700 font-bold">
                                        <Home className="w-5 h-5 text-slate-400" /> Home
                                    </Link>
                                    {user?.role === 'passenger' && (
                                        <Link onClick={() => setIsOpen(false)} to="/passenger" className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 transition-colors text-slate-700 font-bold">
                                            <Car className="w-5 h-5 text-slate-400" /> Book a Ride
                                        </Link>
                                    )}
                                    {user?.role === 'driver' && (
                                        <Link onClick={() => setIsOpen(false)} to="/driver" className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 transition-colors text-slate-700 font-bold">
                                            <Car className="w-5 h-5 text-slate-400" /> Driver Terminal
                                        </Link>
                                    )}
                                    <Link onClick={() => setIsOpen(false)} to="/profile" className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 transition-colors text-slate-700 font-bold">
                                        <User className="w-5 h-5 text-slate-400" /> Account Profile
                                    </Link>
                                    <Link onClick={() => setIsOpen(false)} to="/history" className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 transition-colors text-slate-700 font-bold">
                                        <History className="w-5 h-5 text-slate-400" /> Ride History
                                    </Link>
                                    <Link onClick={() => setIsOpen(false)} to="#" className="flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-slate-100 transition-colors text-slate-700 font-bold opacity-70 cursor-not-allowed">
                                        <Wallet className="w-5 h-5 text-slate-400" /> Wallet / Settings
                                    </Link>
                                </div>

                                <div className="p-6 border-t border-slate-100">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-rose-600 font-bold hover:bg-rose-50 transition-colors"
                                    >
                                        <LogOut className="w-5 h-5" /> Logout
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
