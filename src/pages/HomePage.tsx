import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import NavigationDrawer from '../components/NavigationDrawer';
import { MapPin, Car, Shield, Leaf, Users, Clock, Plane } from 'lucide-react';

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleServiceSelect = (serviceType: string) => {
        // We'll set it in localStorage/session or state, simple url state works too, for now localstorage or navigate state
        navigate('/passenger', { state: { serviceType } });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* Top Navigation */}
            <header className="px-6 py-4 flex justify-between items-center bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-[100]">
                <div className="flex items-center gap-3">
                    <NavigationDrawer />
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-display">FareGo</h1>
                </div>
                <div>
                     <button onClick={() => navigate('/profile')} className="p-2.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-500">
                        <span className="font-bold">{user?.firstName ? user.firstName.charAt(0) : 'U'}</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-6 pb-20">
                {/* Greeting Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 mt-4"
                >
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
                        Good to see you, {user?.firstName}
                    </h2>
                    <p className="text-slate-500 font-medium text-lg">Where are we going today?</p>
                </motion.div>

                {/* Service Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    
                    {/* CITY_RIDE */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceSelect('CITY_RIDE')}
                        className="col-span-2 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2rem] p-6 text-left relative overflow-hidden shadow-xl shadow-blue-900/10 group flex flex-col justify-end min-h-[160px]"
                    >
                        <div className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform">
                            <Car className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tight mb-1">City Ride</h3>
                        <p className="text-blue-100 font-medium">Standard everyday commute</p>
                    </motion.button>
                    
                    {/* CITY_TO_CITY */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceSelect('CITY_TO_CITY')}
                        className="bg-white border border-slate-200 rounded-[2rem] p-6 text-left shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group min-h-[160px]"
                    >
                        <div className="mb-4 p-3 bg-indigo-50 rounded-2xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">City to City</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Inter-city travel</p>
                    </motion.button>
                    
                    {/* AIRPORT */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceSelect('AIRPORT')}
                        className="bg-white border border-slate-200 rounded-[2rem] p-6 text-left shadow-sm hover:shadow-xl hover:border-amber-200 transition-all group min-h-[160px]"
                    >
                        <div className="mb-4 p-3 bg-amber-50 rounded-2xl w-fit group-hover:bg-amber-500 group-hover:text-white transition-colors text-amber-500">
                            <Plane className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Airport Drop</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Spacious rides</p>
                    </motion.button>

                    {/* POOL */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceSelect('POOL')}
                        className="col-span-2 md:col-span-1 bg-white border border-slate-200 rounded-[2rem] p-6 text-left shadow-sm hover:shadow-xl hover:border-fuchsia-200 transition-all group min-h-[160px]"
                    >
                        <div className="mb-4 p-3 bg-fuchsia-50 rounded-2xl w-fit group-hover:bg-fuchsia-500 group-hover:text-white transition-colors text-fuchsia-500">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Pool Ride</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Share and save</p>
                    </motion.button>

                    {/* ADVANCED */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceSelect('ADVANCED')}
                        className="bg-slate-900 rounded-[2rem] p-6 text-left shadow-xl group min-h-[160px]"
                    >
                        <div className="mb-4 p-3 bg-slate-800 rounded-2xl w-fit text-slate-300">
                            <Clock className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Advanced</h3>
                        <p className="text-sm text-slate-400 font-medium mt-1">Book ahead</p>
                    </motion.button>
                    
                    {/* ECO */}
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceSelect('ECO')}
                        className="bg-white border border-slate-200 rounded-[2rem] p-6 text-left shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group min-h-[160px]"
                    >
                        <div className="mb-4 p-3 bg-emerald-50 rounded-2xl w-fit group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-500">
                            <Leaf className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Eco-Drive</h3>
                        <p className="text-sm text-slate-500 font-medium mt-1">Low-emission</p>
                    </motion.button>

                     {/* WOMEN TO WOMEN (Conditional) */}
                     {user?.gender === 'female' && (
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleServiceSelect('WOMEN_TO_WOMEN')}
                            className="bg-gradient-to-br from-rose-500 to-pink-500 border border-rose-200 rounded-[2rem] p-6 text-left shadow-lg shadow-rose-900/10 hover:shadow-xl group min-h-[160px] col-span-2 md:col-span-1"
                        >
                            <div className="mb-4 p-3 bg-white/20 rounded-2xl w-fit text-white">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Women Only</h3>
                            <p className="text-sm text-rose-100 font-medium mt-1">Female drivers</p>
                        </motion.button>
                     )}
                </div>
            </main>
        </div>
    );
}
