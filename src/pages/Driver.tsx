import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Star, Clock, ShieldCheck, Power, Crown, Wallet, Home, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ActiveDriverTrip from '../components/ActiveDriverTrip';
import NavigationDrawer from '../components/NavigationDrawer';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';



const RideRequestCard = ({ ride, onAccept, onCounter, isSubmitting }: { ride: any, onAccept: (id: number) => void, onCounter: (id: number, bid: number) => void, isSubmitting: boolean }) => {
    const [customBid, setCustomBid] = useState('');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-3xl overflow-hidden transition-all duration-300 relative ${ride.isFemaleOnly ? 'border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-purple-50/10' : 'border border-slate-200 shadow-xs'}`}
        >
            {ride.isFemaleOnly && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
            )}
            <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            {ride.isFemaleOnly && (
                                <div className="hidden sm:flex w-14 h-14 rounded-full bg-purple-100 items-center justify-center shrink-0 border border-purple-200 shadow-inner">
                                    <ShieldCheck className="w-7 h-7 text-purple-600" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    {ride.passengerName || 'Passenger'}
                                    <span className="flex items-center gap-1 text-sm font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                                       <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {(ride.rating || 5.0).toFixed(1)}
                                    </span>
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-slate-600 font-medium text-sm">
                                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                                        <Clock className="w-4 h-4" /> {ride.eta || '3 min'} pickup ({ride.distance || '1.1km'})
                                    </span>
                                    {ride.isFemaleOnly && (
                                        <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100 font-bold">
                                            <ShieldCheck className="w-4 h-4" /> Women Only
                                        </span>
                                    )}
                                    {ride.promoCode && (
                                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100 font-bold">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg> 
                                            Promo Used
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Proposed Fare</p>
                           <p className="text-4xl font-extrabold text-slate-900 font-display tracking-tight">₱{ride.proposedFare}</p>
                        </div>
                    </div>
                
                    <div className="relative pl-7 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                        <div className="relative">
                            <span className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm ring-1 ring-slate-200"></span>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Pickup</p>
                            <p className="text-slate-900 font-semibold">{ride.pickupAddress}</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-[29px] top-1 w-4 h-4 rounded-sm bg-slate-900 border-4 border-white shadow-sm ring-1 ring-slate-200"></span>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Dropoff</p>
                            <p className="text-slate-900 font-semibold">{ride.dropoffAddress}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-50 border-t border-slate-100 p-4 md:p-5 flex flex-col xl:flex-row gap-3 items-center">
                <button
                    onClick={() => onAccept(ride.id)}
                    disabled={isSubmitting}
                    className="w-full xl:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                >
                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Accept Offer'}
                </button>
                
                <div className="flex gap-2 w-full xl:w-auto shrink-0">
                    {[20, 50, 100].map(amt => (
                        <button
                            key={amt}
                            onClick={() => onCounter(ride.id, ride.proposedFare + amt)}
                            disabled={isSubmitting}
                            className="flex-1 xl:flex-none px-2 sm:px-4 py-4 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-base md:text-lg rounded-2xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            +₱{amt}
                        </button>
                    ))}
                </div>
                
                <div className="flex w-full xl:w-auto gap-2 shrink-0">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₱</span>
                        <input 
                            type="number" 
                            value={customBid}
                            onChange={(e) => setCustomBid(e.target.value)}
                            placeholder="Custom" 
                            disabled={isSubmitting}
                            className="w-full xl:w-32 pl-8 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                    </div>
                    <button 
                        onClick={() => customBid && onCounter(ride.id, Number(customBid))}
                        disabled={!customBid || isSubmitting}
                        className="px-6 py-4 bg-slate-900 text-white font-bold text-base md:text-lg rounded-2xl shadow-md hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                        Bid
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default function Driver() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(true);
    const [rides, setRides] = useState<any[]>([]);
    const [activeTrip, setActiveTrip] = useState<any | null>(null);
    const [showDestFilter, setShowDestFilter] = useState(false);
    const [destFilterText, setDestFilterText] = useState('');
    const [isFilterActive, setIsFilterActive] = useState(false);
    const [submittingRideId, setSubmittingRideId] = useState<number | null>(null);
    
    const socketRef = React.useRef<any>(null);

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL || '/');
        
        socketRef.current.on('newRideAvailable', () => {
            fetchAvailableRides();
        });

        socketRef.current.on('rideCancelled', (data: any) => {
            setRides((prev) => prev.filter(r => String(r.id) !== String(data.rideId)));
        });

        socketRef.current.on('bidAccepted', (data: any) => {
            if (data.winningDriverId === user?.id) {
                toast.success('Your bid was accepted! Redirecting...');
                setRides(prev => {
                    const matchedRide = data.rideDetails || prev.find(r => String(r.id) === String(data.rideId)) || { id: data.rideId, active: true };
                    setActiveTrip(matchedRide);
                    return prev.filter(r => String(r.id) !== String(data.rideId));
                });
            } else {
                setRides(prev => prev.filter(r => String(r.id) !== String(data.rideId)));
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (!user || user.role !== 'driver') {
            navigate('/login');
        } else {
            fetchAvailableRides();
        }
    }, [user, navigate]);

    const fetchAvailableRides = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/rides/available', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                   const formatted = data.availableTrips.map((r: any) => ({
                   id: r.id,
                   passengerName: r.passengerName || 'Passenger',
                   rating: 5.0,
                   pickupAddress: r.pickupAddress || 'Unknown Pickup',
                   dropoffAddress: r.dropoffAddress || 'Unknown Dropoff',
                   pickupLat: r.pickupLat, pickupLng: r.pickupLng,
                   dropoffLat: r.dropoffLat, dropoffLng: r.dropoffLng,
                   distance: r.distance || '1.0 km',
                   eta: r.eta || '5 mins',
                   proposedFare: r.proposedFare,
                   isFemaleOnly: r.isFemaleOnly,
                   requestedVehicleType: r.requestedVehicleType,
                   serviceType: r.serviceType
                 }));
                 setRides(formatted);
                 if (data.activeTrip && (!activeTrip || activeTrip.id !== data.activeTrip.id)) {
                     setActiveTrip(data.activeTrip);
                 }
            }
        } catch (err) {
            console.error('Failed to fetch available rides', err);
        }
    };

    const handleAccept = async (rideId: number) => {
        const ride = rides.find(r => r.id === rideId);
        if (ride) {
            setSubmittingRideId(rideId);
            try {
                const bidData = {
                    rideId,
                    driverId: user?.id,
                    driverName: `${user?.firstName} ${user?.lastName}`,
                    rating: 5.0,
                    distance: ride.distance,
                    proposedFare: ride.proposedFare,
                    time: ride.eta || 2,
                    isMale: user?.gender === 'male'
                };
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/bids/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(bidData)
                });
                
                if (res.ok) {
                    toast.success(`Accepted ₱${ride.proposedFare}. Waiting for passenger...`);
                } else {
                    const errData = await res.json();
                    console.error("Bid failed:", errData);
                    toast.error(`Failed: ${errData.details || errData.error || 'Server error'}`);
                }
            } catch (err) {
                 toast.error('Network Error');
            } finally {
                 setSubmittingRideId(null);
            }
        }
    };

    const handleCounter = async (rideId: number, bid: number) => {
         const ride = rides.find(r => r.id === rideId);
         if (ride) {
             setSubmittingRideId(rideId);
             try {
                 const bidData = {
                     rideId,
                     driverId: user?.id,
                     driverName: `${user?.firstName} ${user?.lastName}`,
                     rating: 5.0,
                     distance: ride.distance,
                     proposedFare: bid,
                     time: ride.eta || 2,
                     isMale: user?.gender === 'male'
                 };
                 const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/bids/submit', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                     body: JSON.stringify(bidData)
                 });
                 if (res.ok) {
                     toast.success(`Countered ₱${bid}. Waiting for passenger...`);
                 } else {
                     const errData = await res.json();
                     console.error("Bid failed:", errData);
                     toast.error(`Failed: ${errData.details || errData.error || 'Server error'}`);
                 }
             } catch (err) {
                  toast.error('Network Error');
             } finally {
                  setSubmittingRideId(null);
             }
         }
    };

    const handleCompleteTrip = (amount: number) => {
        setActiveTrip(null);
    };

    if (activeTrip) {
        return <ActiveDriverTrip ride={activeTrip} onComplete={handleCompleteTrip} />;
    }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="bg-slate-950 text-white px-6 py-4 flex flex-col xl:flex-row justify-between items-center gap-4 sticky top-0 z-[100] shadow-xl border-b border-white/10">
                <div className="flex w-full xl:w-auto items-center justify-between xl:justify-start gap-4">
                    <div className="flex items-center gap-3">
                        <NavigationDrawer />
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight font-display">FareGo Driver</h1>
                            <p className="text-xs text-slate-400 font-medium tracking-wide mt-1">Welcome back, {user?.firstName}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex w-full xl:w-auto items-center justify-between xl:justify-end gap-3 md:gap-6 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
                    
                    {/* Earnings Widget */}
                    <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700/50 shrink-0">
                         <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                             <Wallet className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">Today's Earnings</p>
                             <p className="text-xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">₱2,450.00</p>
                         </div>
                    </div>

                    {/* Subscription Widget */}
                    <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700/50 shrink-0">
                         <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
                             <Crown className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">Subscription</p>
                             <p className="text-sm sm:text-base font-extrabold text-orange-400">Premium Tier</p>
                         </div>
                    </div>

                    {/* Destination Filter */}
                    <div className="relative shrink-0">
                        <button 
                            onClick={() => setShowDestFilter(!showDestFilter)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold transition-all border ${isFilterActive ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                        >
                            <Home className="w-5 h-5" />
                            <span className="hidden sm:inline">{isFilterActive ? 'Heading Home' : 'Dest Filter'}</span>
                        </button>
                        
                        <AnimatePresence>
                            {showDestFilter && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-[120%] right-0 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 text-slate-900"
                                >
                                    <h4 className="font-bold text-slate-900 mb-2">Heading Home Filter</h4>
                                    <p className="text-xs text-slate-500 mb-4">Only receive requests along your route home.</p>
                                    <input 
                                        type="text"
                                        placeholder="Enter drop-off area..."
                                        value={destFilterText}
                                        onChange={e => setDestFilterText(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 mb-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                                    />
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => { setIsFilterActive(false); setDestFilterText(''); setShowDestFilter(false); }}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm flex-1 hover:bg-slate-200"
                                        >
                                            Clear
                                        </button>
                                        <button 
                                            onClick={() => { setIsFilterActive(!!destFilterText); setShowDestFilter(false); }}
                                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm flex-1 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Online Toggle */}
                    <button 
                        onClick={() => setIsOnline(!isOnline)} 
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border shrink-0 ${isOnline ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <Power className="w-5 h-5" /> 
                        {isOnline ? (
                            <span className="flex items-center gap-2">
                                ONLINE
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                                </span>
                            </span>
                        ) : 'OFFLINE'}
                    </button>

                    <div className="flex items-center gap-2 shrink-0 ml-1">
                        <button onClick={() => navigate('/driver/account')} className="p-3 bg-slate-800 rounded-2xl hover:bg-slate-700 transition flex items-center justify-center font-bold text-slate-300">
                            {user?.firstName ? user.firstName.charAt(0) : 'D'}
                        </button>
                        <button onClick={() => { logout(); navigate('/'); }} className="p-3.5 bg-slate-800 rounded-2xl hover:bg-slate-700 transition">
                            <LogOut className="w-5 h-5 text-slate-300" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full lg:w-[80%] mx-auto p-4 sm:p-6 lg:p-8">
                
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">Rapid Request Feed</h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">Live broadcasts near your location</p>
                    </div>
                </div>

                {!isOnline ? (
                    <div className="bg-white p-16 rounded-3xl shadow-sm text-center border border-slate-200">
                        <Power className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">You are offline</h3>
                        <p className="text-slate-500 mt-2">Go online to receive nearby ride requests and start earning.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <AnimatePresence>
                            {[...rides]
                                .filter(r => !isFilterActive || (destFilterText && r.dropoffAddress && r.dropoffAddress.toLowerCase().includes(destFilterText.toLowerCase())))
                                .sort((a, b) => {
                                    if (a.isFemaleOnly && !b.isFemaleOnly) return -1;
                                    if (!a.isFemaleOnly && b.isFemaleOnly) return 1;
                                    return 0;
                                }).map(ride => (
                                <RideRequestCard 
                                    key={ride.id} 
                                    ride={ride} 
                                    onAccept={handleAccept} 
                                    onCounter={handleCounter} 
                                    isSubmitting={submittingRideId === ride.id}
                                />
                            ))}
                        </AnimatePresence>
                        
                        {rides.length === 0 && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-16 rounded-[2rem] shadow-sm text-center border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
                                <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                                     <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                                     <div className="absolute inset-2 bg-blue-200 rounded-full animate-pulse opacity-80"></div>
                                     <div className="relative bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                         <span className="w-3 h-3 bg-white rounded-full"></span>
                                     </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">No active broadcasts nearby</h3>
                                <p className="text-slate-500 mt-3 font-medium max-w-sm mx-auto text-base">Stay online! New requests will automatically appear here as passengers look for rides.</p>
                            </motion.div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
