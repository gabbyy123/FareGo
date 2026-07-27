import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation, Shield, Leaf, Users, LogOut, CheckCircle, Clock, Star, Tag, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LocationAutocomplete from '../components/LocationAutocomplete';
import LiveTrackingMap from '../components/LiveTrackingMap';
import { NumericFormat } from 'react-number-format';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import ActivePassengerTrip from '../components/ActivePassengerTrip';
import NavigationDrawer from '../components/NavigationDrawer';

export default function Passenger() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Fallback to CITY_RIDE if not navigated directly from Service Hub
    const initialServiceType = location.state?.serviceType || 'CITY_RIDE';
    
    const [rides, setRides] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [acceptingBidId, setAcceptingBidId] = useState<number | null>(null);
    
    const [serviceType, setServiceType] = useState<string>(initialServiceType);
    const [requestedVehicleType, setRequestedVehicleType] = useState<'MC_TAXI' | 'CAR' | 'VAN'>('CAR');
    
    const [formData, setFormData] = useState({
        pickupAddress: '', dropoffAddress: '', proposedFare: '', isFemaleOnlyRequest: false, isEcoFriendly: false, isPool: false
    });
    const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
    const [dropoffCoords, setDropoffCoords] = useState<{lat: number, lng: number} | null>(null);
    const [promoCode, setPromoCode] = useState('');
    const [isPromoApplied, setIsPromoApplied] = useState(false);
    const [discountPercentage, setDiscountPercentage] = useState<number>(0);
    const [showPromoInput, setShowPromoInput] = useState(false);
    const [originalFare, setOriginalFare] = useState<string | null>(null);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    
    // Map states
    const [rideStatus, setRideStatus] = useState<'idle' | 'negotiating' | 'in_progress' | 'active_trip'>('idle');
    const [acceptedBid, setAcceptedBid] = useState<any | null>(null);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; 
    };

    const recommendedFare = React.useMemo(() => {
        if (!pickupCoords || !dropoffCoords) return null;
        const dist = calculateDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
        const baseFare = 50;
        const perKmFare = 20; 
        
        let multiplier = 1.0;
        if (requestedVehicleType === 'MC_TAXI') multiplier = 0.7;
        if (requestedVehicleType === 'VAN') multiplier = 1.5;
        
        const calculatedBase = Math.max(50, Math.round((baseFare + (dist * perKmFare)) * multiplier));

        if (isPromoApplied && discountPercentage > 0) {
            return Math.max(0, Math.round(calculatedBase * (1 - (discountPercentage / 100))));
        }
        
        return calculatedBase;
    }, [pickupCoords, dropoffCoords, requestedVehicleType, isPromoApplied, discountPercentage]);

    useEffect(() => {
        if (recommendedFare) {
             setFormData(prev => ({ ...prev, proposedFare: recommendedFare.toString() }));
        }
    }, [recommendedFare]);

    const [activeBids, setActiveBids] = useState<any[]>([]);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setPickupCoords({ lat, lng });
                    setFormData(prev => ({ ...prev, pickupAddress: 'Current Location (Auto-detected)' }));
                },
                (error) => {
                    console.error("Error getting location: ", error);
                }
            );
        }
    }, []);

    const socketRef = React.useRef<any>(null);
    const [currentRideId, setCurrentRideId] = useState<number | null>(null);

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL || '/');
        
        socketRef.current.on('rideStatusUpdate', (data: any) => {
            if (data.status) setRideStatus(data.status);
            if (data.status === 'in_progress') {
                setActiveBids([]);
            }
        });

        socketRef.current.on('newBidReceived', (bid: any) => {
            setActiveBids(prev => [bid, ...prev]);
            toast.success('New driver bid received!');
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!user || user.role !== 'passenger') {
            navigate('/login');
        } else {
            fetchRides();
        }
    }, [user, navigate]);

    useEffect(() => {
        if (rideStatus === 'negotiating' && currentRideId) {
            // Fetch real bids for the ride
            fetch(`${import.meta.env.VITE_API_URL || ''}/api/bids/ride/${currentRideId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setActiveBids(data.bids || []);
                }
            })
            .catch(err => {
                console.error(err);
                toast.error('Failed to load bids');
            });
        } else {
            setActiveBids([]);
        }
    }, [rideStatus, currentRideId, token]);

    const fetchRides = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/rides/passenger', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setRides(data);
                // Simple mock logic to update map based on top active ride
                if (data.length > 0) {
                    const topRide = data[0];
                    if (topRide.status === 'pending' || topRide.status === 'negotiating') {
                        setRideStatus('negotiating');
                        setPickupCoords({ lat: topRide.pickupLat, lng: topRide.pickupLng });
                        setDropoffCoords({ lat: topRide.dropoffLat, lng: topRide.dropoffLng });
                    } else if (topRide.status === 'accepted' || topRide.status === 'in_progress') {
                        setRideStatus('in_progress');
                        setPickupCoords({ lat: topRide.pickupLat, lng: topRide.pickupLng });
                        setDropoffCoords({ lat: topRide.dropoffLat, lng: topRide.dropoffLng });
                    } else {
                        setRideStatus('idle');
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch rides', err);
        }
    };

    const handleInput = (e: any) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleToggle = (name: string) => {
        setFormData(prev => ({ ...prev, [name]: !prev[name as keyof typeof prev] }));
    };

    const handlePickupChange = (val: string, loc?: {lat: number, lng: number}) => {
        setFormData(prev => ({ ...prev, pickupAddress: val }));
        if (loc) setPickupCoords(loc);
    };

    const handleDropoffChange = (val: string, loc?: {lat: number, lng: number}) => {
        setFormData(prev => ({ ...prev, dropoffAddress: val }));
        if (loc) setDropoffCoords(loc);
    };

    const handleMapClick = (lat: number, lng: number) => {
        // Manually place pickup pin if not set
        if (!pickupCoords) {
           setPickupCoords({ lat, lng });
           setFormData(prev => ({ ...prev, pickupAddress: `Map Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})` }));
        } else if (!dropoffCoords) {
           setDropoffCoords({ lat, lng });
           setFormData(prev => ({ ...prev, dropoffAddress: `Map Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})` }));
        }
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowSummaryModal(true);
    };

    const confirmBroadcast = async () => {
        setShowSummaryModal(false);
        setIsSubmitting(true);
        // Using selected coordinates or defaulting to mock center
        const payload = {
            ...formData,
            promoCode: isPromoApplied ? promoCode : null,
            isFemaleOnly: user?.gender === 'male' ? false : formData.isFemaleOnlyRequest, // Map the renamed state for API backwards compatibility if needed
            passengerName: user ? `${user.firstName} ${user.lastName}` : 'Passenger',
            pickupLat: pickupCoords?.lat || 14.5995, 
            pickupLng: pickupCoords?.lng || 120.9842,
            dropoffLat: dropoffCoords?.lat || 14.5547, 
            dropoffLng: dropoffCoords?.lng || 121.0244,
            serviceType,
            requestedVehicleType
        };
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/rides/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                toast.success('Searching for drivers...');
                const rideId = data.rideId;
                setCurrentRideId(rideId);
                socketRef.current?.emit('joinRoom', `ride_${rideId}`);
                
                // Keep all form data intact so the Booking Summary overlay remains accurate while negotiating
                fetchRides();
                // Override status for instant feedback in the mock simulation
                setRideStatus('negotiating');
                
                // Remove auto-accept simulation so user can see bids
            } else {
                toast.error('Failed to create ride request');
            }
        } catch (err) {
            console.error('Failed to request ride', err);
            toast.error('Network Error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAcceptBid = async (bidId: number) => {
        const bid = activeBids.find(b => b.id === bidId);
        if (bid) {
            setAcceptingBidId(bidId);
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/bids/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        rideId: currentRideId,
                        winningDriverId: bid.driverId || bid.id
                    })
                });

                if (res.ok) {
                    toast.success('Bid Accepted!');
                    setAcceptedBid(bid);
                    setRideStatus('active_trip');
                    setActiveBids([]);
                    if (currentRideId) {
                        socketRef.current?.emit('acceptBid', {
                            rideId: currentRideId,
                            winningDriverId: bid.driverId || bid.id
                        });
                    }
                } else {
                    toast.error('Failed to accept bid');
                }
            } catch (err) {
                console.error('Failed to accept bid', err);
                toast.error('Network Error');
            } finally {
                setAcceptingBidId(null);
            }
        }
    };

    const handleTripEnd = () => {
        setRideStatus('idle');
        setAcceptedBid(null);
        setPickupCoords(null);
        setDropoffCoords(null);
        setFormData({ pickupAddress: '', dropoffAddress: '', proposedFare: '', isFemaleOnlyRequest: false, isEcoFriendly: false, isPool: false });
        setActiveBids([]);
        setCurrentRideId(null);
        setIsPromoApplied(false);
        setPromoCode('');
        setDiscountPercentage(0);
    };

    if (rideStatus === 'active_trip' && acceptedBid && pickupCoords && dropoffCoords) {
        return (
            <ActivePassengerTrip 
                bid={acceptedBid} 
                rideId={currentRideId}
                pickupCoords={pickupCoords} 
                dropoffCoords={dropoffCoords} 
                onTripEnd={handleTripEnd} 
            />
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 font-sans w-full overflow-hidden flex-col md:flex-row">
            {/* Column 1: Sleek Sidebar - Left */}
            <aside className="w-full md:w-[400px] lg:w-[420px] bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 flex flex-col h-screen shrink-0 overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-[100] transition-all">
                    <div className="flex items-center gap-3">
                        <NavigationDrawer />
                        <div>
                            <h2 className="font-extrabold text-2xl tracking-tight text-slate-900 font-display">FareGo</h2>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Passenger
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full shadow-sm">
                            <motion.div animate={{ rotateY: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-amber-500 shadow-inner">
                                <span className="text-[10px] font-black text-amber-900">G</span>
                            </motion.div>
                            <span className="text-sm font-bold text-amber-700">1,250 <span className="hidden sm:inline">Pts</span></span>
                        </div>
                        <button onClick={() => navigate('/profile')} className="p-2.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-500 flex-shrink-0">
                            <span className="font-bold">{user?.firstName ? user.firstName.charAt(0) : 'U'}</span>
                        </button>
                        <button onClick={() => { logout(); navigate('/'); }} className="p-2.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors text-slate-500 group flex-shrink-0">
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    {rideStatus !== 'idle' ? (
                       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-[2rem] border border-blue-100/50 text-center flex flex-col items-center justify-center min-h-[400px] shadow-inner">
                           <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-xl shadow-blue-500/20 flex items-center justify-center mb-6 relative">
                              <Navigation className="w-10 h-10 text-blue-600 relative z-10" />
                              <div className="absolute inset-0 bg-blue-400 rounded-[1.5rem] animate-ping opacity-20"></div>
                           </div>
                           <h3 className="text-2xl font-bold text-slate-900 mb-2 font-display">
                               {rideStatus === 'negotiating' ? 'Request Broadcasted' : 'Ride in Progress'}
                           </h3>
                           <p className="text-slate-500 font-medium">
                               {rideStatus === 'negotiating' ? 'Waiting for driver bids in your area.' : 'Follow the live tracking on the map.'}
                           </p>

                           {rideStatus === 'negotiating' && (
                               <div className="w-full mt-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-left">
                                   <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Booking Details</h4>
                                   <div className="space-y-3">
                                       <div className="flex gap-3">
                                           <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                               <Navigation className="w-4 h-4" />
                                           </div>
                                           <div>
                                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup</p>
                                               <p className="font-semibold text-slate-800 text-sm">{formData.pickupAddress || 'Current Location'}</p>
                                           </div>
                                       </div>
                                       <div className="flex gap-3">
                                           <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                               <Navigation className="w-4 h-4" />
                                           </div>
                                           <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dropoff</p>
                                                <p className="font-semibold text-slate-800 text-sm">{formData.dropoffAddress}</p>
                                           </div>
                                       </div>
                                       <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                           <div>
                                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Fare</p>
                                               <p className="font-bold text-slate-900 text-lg font-mono">₱{formData.proposedFare}</p>
                                           </div>
                                           <div>
                                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Class</p>
                                               <p className="font-semibold text-slate-800 text-sm flex items-center gap-1">
                                                   {requestedVehicleType === 'MC_TAXI' ? '🏍️ MC' : requestedVehicleType === 'VAN' ? '🚐 Van' : '🚗 Car'}
                                               </p>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           )}
                           
                           <button onClick={(e) => { e.preventDefault(); setRideStatus('idle'); setFormData({ pickupAddress: '', dropoffAddress: '', proposedFare: '', isFemaleOnlyRequest: false, isEcoFriendly: false, isPool: false }); setPickupCoords(null); setDropoffCoords(null); setActiveBids([]); setIsPromoApplied(false); setPromoCode(''); setDiscountPercentage(0); }} className="mt-8 px-8 py-3.5 bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-full font-bold hover:shadow-md transition-all">
                               Cancel Protocol
                           </button>
                       </motion.div>
                    ) : (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight font-display">Command Center</h3>
                        <form onSubmit={handleRequest} className="space-y-6">
                            
                            <div className="space-y-4 relative before:content-[''] before:absolute before:left-[21px] before:top-[44px] before:bottom-[44px] before:w-[2px] before:bg-slate-200 before:z-0">
                                <div className="relative z-20">
                                    <LocationAutocomplete 
                                        type="pickup" 
                                        value={formData.pickupAddress} 
                                        onChange={handlePickupChange} 
                                        placeholder="Enter Pickup Location"
                                    />
                                </div>
                                <div className="relative z-10">
                                    <LocationAutocomplete 
                                        type="dropoff" 
                                        value={formData.dropoffAddress} 
                                        onChange={handleDropoffChange} 
                                        placeholder="Enter Dropoff Location"
                                    />
                                </div>
                            </div>
                            
                            {/* Vehicle Type Selector */}
                            <div className="pt-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Vehicle Class</label>
                                <div className="flex gap-2 mb-2">
                                    {/* MC_TAXI */}
                                    <div 
                                        onClick={() => setRequestedVehicleType('MC_TAXI')}
                                        className={`flex-1 p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${requestedVehicleType === 'MC_TAXI' ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                    >
                                        <div className="text-2xl mb-1">🏍️</div>
                                        <span className="text-xs font-bold text-slate-900 leading-tight">MC Taxi</span>
                                        <span className="text-[10px] text-slate-500 font-medium">1 Seat • 0.7x Fare</span>
                                    </div>
                                    
                                    {/* CAR */}
                                    <div 
                                        onClick={() => setRequestedVehicleType('CAR')}
                                        className={`flex-1 p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${requestedVehicleType === 'CAR' ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                    >
                                        <div className="text-2xl mb-1">🚗</div>
                                        <span className="text-xs font-bold text-slate-900 leading-tight">Standard</span>
                                        <span className="text-[10px] text-slate-500 font-medium">4 Seats • 1.0x Fare</span>
                                    </div>
                                    
                                    {/* VAN */}
                                    <div 
                                        onClick={() => setRequestedVehicleType('VAN')}
                                        className={`flex-1 p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${requestedVehicleType === 'VAN' ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                    >
                                        <div className="text-2xl mb-1">🚐</div>
                                        <span className="text-xs font-bold text-slate-900 leading-tight">Premium Van</span>
                                        <span className="text-[10px] text-slate-500 font-medium">6+ Seats • 1.5x Fare</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-2">
                               <div className="mb-4">
                                   <button 
                                       type="button" 
                                       onClick={() => setShowPromoInput(!showPromoInput)}
                                       className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                                   >
                                       <span className="text-sm font-bold flex items-center gap-2 text-slate-700">
                                            <Tag className="w-4 h-4 text-emerald-600" /> Add Promo Code
                                       </span>
                                       {showPromoInput ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                   </button>
                                   <AnimatePresence>
                                       {showPromoInput && (
                                           <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                           >
                                                <div className="flex gap-2 mt-2">
                                                    <input 
                                                        type="text" 
                                                        value={promoCode}
                                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                        placeholder="e.g., FAREGO20"
                                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl uppercase font-bold text-sm"
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={async () => {
                                                            if (promoCode && !isPromoApplied) {
                                                                try {
                                                                    const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/promo/validate', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                        body: JSON.stringify({ code: promoCode })
                                                                    });
                                                                    if (res.ok) {
                                                                        const data = await res.json();
                                                                        setIsPromoApplied(true);
                                                                        setDiscountPercentage(data.discountPercentage || 0);
                                                                        setOriginalFare(formData.proposedFare);
                                                                        const discounted = (Number(formData.proposedFare) * (1 - (data.discountPercentage / 100))).toFixed(0);
                                                                        setFormData(prev => ({ ...prev, proposedFare: discounted }));
                                                                        toast.success(`Promo applied! ${data.discountPercentage}% off.`);
                                                                    } else {
                                                                        const err = await res.json();
                                                                        toast.error(err.error || 'Invalid promo code');
                                                                    }
                                                                } catch (err) {
                                                                    toast.error('Failed to validate promo code');
                                                                }
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                                {isPromoApplied && (
                                                    <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Promo Applied (20% off)
                                                    </p>
                                                )}
                                           </motion.div>
                                       )}
                                   </AnimatePresence>
                               </div>

                               <div className="flex items-center justify-between mb-3">
                                   <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Target Fare</label>
                                   <div className="flex items-center gap-2">
                                       {isPromoApplied && originalFare && (
                                           <span className="text-xs font-bold text-slate-400 line-through">
                                               ₱{originalFare}
                                           </span>
                                       )}
                                       {recommendedFare && (
                                           <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                               Recommended: ₱{recommendedFare}
                                           </span>
                                       )}
                                   </div>
                               </div>
                               <div className="relative rounded-2xl p-[2px] overflow-hidden focus-within:bg-gradient-to-r focus-within:from-blue-500 focus-within:to-indigo-500 bg-slate-200 transition-all duration-300">
                                   <NumericFormat 
                                       value={formData.proposedFare}
                                       onValueChange={(values) => {
                                           const { value } = values;
                                           setFormData(prev => ({ ...prev, proposedFare: value }));
                                       }}
                                       thousandSeparator={true}
                                       prefix={'₱'}
                                       placeholder="₱150"
                                       className={`w-full px-5 py-4 bg-white rounded-[14px] focus:outline-hidden text-3xl font-black transition-all font-display text-center ${isPromoApplied ? 'text-emerald-500' : 'text-slate-900'}`} 
                                       allowNegative={false}
                                   />
                               </div>
                            </div>

                            <div className="space-y-4 pt-6">
                                {/* VIP Priority Match Badge */}
                                <div className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 p-[2px] rounded-2xl shadow-lg shadow-amber-500/20 mb-2">
                                    <div className="bg-white rounded-[14px] px-5 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                                                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                            </div>
                                            <div>
                                                <p className="font-extrabold text-slate-900 leading-tight">Priority Match Active</p>
                                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-0.5">Gold Tier Benefit</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Women for Women Safety Toggle */}
                                {user?.gender !== 'male' && (
                                <div 
                                    onClick={() => handleToggle('isFemaleOnlyRequest')}
                                    className={`relative z-10 p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group overflow-hidden ${formData.isFemaleOnlyRequest ? 'border-rose-400 bg-rose-50 shadow-lg shadow-rose-100' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                >
                                    {formData.isFemaleOnlyRequest && (
                                        <div className="absolute inset-0 bg-linear-to-r from-rose-100/50 to-transparent opacity-50 z-0"></div>
                                    )}
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`p-3 rounded-xl transition-colors ${formData.isFemaleOnlyRequest ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-rose-400 group-hover:bg-rose-50'}`}>
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="block text-base font-bold text-slate-900 leading-tight">👩 Women for Women</span>
                                            <span className={`block text-xs font-medium mt-1 ${formData.isFemaleOnlyRequest ? 'text-rose-600' : 'text-slate-500'}`}>Only broadcast to verified female drivers</span>
                                        </div>
                                    </div>
                                    
                                    {/* Custom Animated Toggle */}
                                    <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${formData.isFemaleOnlyRequest ? 'bg-rose-500' : 'bg-slate-300'}`}>
                                        <motion.div 
                                            initial={false}
                                            animate={{ x: formData.isFemaleOnlyRequest ? 20 : 2 }}
                                            className="w-6 h-6 bg-white rounded-full absolute top-[2px] shadow-sm flex items-center justify-center"
                                        >
                                            {formData.isFemaleOnlyRequest && <CheckCircle className="w-4 h-4 text-rose-500" />}
                                        </motion.div>
                                    </div>
                                    <input type="checkbox" className="hidden" readOnly checked={formData.isFemaleOnlyRequest} name="isFemaleOnlyRequest" />
                                </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-all ${formData.isEcoFriendly ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                                        <Leaf className={`w-6 h-6 mb-2 ${formData.isEcoFriendly ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        <span className="text-sm font-bold text-slate-900">Eco-Drive</span>
                                        <input type="checkbox" name="isEcoFriendly" checked={formData.isEcoFriendly} onChange={handleInput} className="hidden" />
                                    </label>
                                    
                                    <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer hover:bg-blue-50 transition-all ${formData.isPool ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                                        <Users className={`w-6 h-6 mb-2 ${formData.isPool ? 'text-blue-500' : 'text-slate-400'}`} />
                                        <span className="text-sm font-bold text-slate-900">Pool Match</span>
                                        <input type="checkbox" name="isPool" checked={formData.isPool} onChange={handleInput} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting || !formData.pickupAddress || !formData.dropoffAddress || !formData.proposedFare} className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg tracking-wide hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Broadcast Request'}
                            </button>
                        </form>
                    </motion.div>
                    )}
                </div>
            </aside>

            {/* Column 2: The Live Map - Center */}
            <main className="flex-1 relative z-10 bg-slate-100 min-h-[50vh] md:min-h-screen">
                <LiveTrackingMap 
                    rideStatus={rideStatus} 
                    pickup={pickupCoords} 
                    dropoff={dropoffCoords}
                    onMapClick={handleMapClick}
                    bids={activeBids}
                />
                
                {/* Visual Overlay for Negotiating State */}
                <AnimatePresence>
                    {rideStatus === 'negotiating' && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-xl shadow-blue-900/10 border border-white flex items-center gap-3 z-[1000]"
                        >
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                            </span>
                            <span className="font-bold font-display tracking-tight text-slate-900">Broadcasting to Drivers...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Column 3: The Bidding & Negotiation Feed - Right */}
            <AnimatePresence>
                {rideStatus !== 'idle' && (
                    <motion.aside 
                        initial={{ x: '100%', width: 0, opacity: 0 }}
                        animate={{ x: 0, width: 'auto', opacity: 1 }}
                        exit={{ x: '100%', width: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-full md:w-[400px] lg:w-[450px] bg-white border-l border-slate-200 z-20 h-screen shrink-0 flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] overflow-y-auto"
                    >
                        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10 transition-all">
                            <h2 className="font-extrabold text-2xl tracking-tight text-slate-900 font-display flex items-center gap-3">
                                Live Bids
                                {rideStatus === 'negotiating' && (
                                   <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold ml-auto animate-pulse">
                                       Searching
                                   </span>
                                )}
                            </h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Review and accept driver offers</p>
                        </div>
                        
                        <div className={`flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 transition-opacity ${acceptingBidId !== null ? 'opacity-50 pointer-events-none' : ''}`}>
                            {rideStatus === 'in_progress' ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                                    <Clock className="w-12 h-12 text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium">Have a safe ride.</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {activeBids.map((bid, i) => (
                                        <motion.div 
                                            key={bid.id}
                                            initial={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
                                            animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
                                            exit={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                            className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 group relative mb-4 overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden relative border-2 border-white shadow-xs">
                                                        {/* Mock Avatar */}
                                                        <div className={`absolute inset-0 bg-gradient-to-b ${bid.isMale ? 'from-blue-300 to-blue-500' : 'from-rose-300 to-rose-500'}`}></div>
                                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/30 rounded-t-full"></div>
                                                        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-6 h-6 bg-white/40 rounded-full"></div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg">{bid.driverName}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                ★ {bid.rating}
                                                            </span>
                                                            <span className="text-xs font-medium text-slate-500">{bid.distance} away</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-2xl font-black tracking-tight ${bid.proposedFare > Number(formData.proposedFare) ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        ₱{bid.proposedFare}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${bid.proposedFare > Number(formData.proposedFare) ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {bid.proposedFare > Number(formData.proposedFare) ? 'Counter-Offer' : 'Matches Goal'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <div className="text-xs font-medium text-slate-500">
                                                    Pickup in ~{bid.time} mins
                                                </div>
                                                <div className="flex gap-2">
                                                    <button disabled={acceptingBidId !== null} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50">
                                                        Decline
                                                    </button>
                                                    <button 
                                                        disabled={acceptingBidId !== null}
                                                        onClick={() => handleAcceptBid(bid.id)}
                                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-full hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                                    >
                                                        {acceptingBidId === bid.id ? <><Loader2 className="w-4 h-4 animate-spin"/> Accepting...</> : 'Accept'}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Pre-Broadcast Booking Summary Modal */}
            <AnimatePresence>
                {showSummaryModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center sm:items-center sm:p-4"
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white w-full sm:w-[480px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">Booking Summary</h2>
                                <button onClick={() => setShowSummaryModal(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                    ✕
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 shrink-0 mt-1">
                                            <Navigation className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pickup</p>
                                            <p className="font-bold text-slate-900">{formData.pickupAddress}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0 mt-1">
                                            <Navigation className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dropoff</p>
                                            <p className="font-bold text-slate-900">{formData.dropoffAddress}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">
                                            {requestedVehicleType === 'MC_TAXI' ? '🏍️' : requestedVehicleType === 'VAN' ? '🚐' : '🚗'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Vehicle Class</p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {requestedVehicleType === 'MC_TAXI' ? 'MC Taxi' : requestedVehicleType === 'VAN' ? 'Premium Van' : 'Standard Car'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 text-xl font-mono">₱{formData.proposedFare}</p>
                                        {isPromoApplied && (
                                            <p className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1 flex items-center gap-1"><Tag className="w-3 h-3" />Promo Applied</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-white border-t border-slate-100">
                                <button 
                                    onClick={confirmBroadcast}
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg tracking-wide hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Starting...</> : 'Confirm & Broadcast'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

