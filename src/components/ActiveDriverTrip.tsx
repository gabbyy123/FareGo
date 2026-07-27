import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MessageCircle, AlertCircle, ShieldCheck, Loader2, Send, X } from 'lucide-react';
import { getRouteData } from '../utils/routing';
import { saveTripLog } from '../utils/tripLog';
import DriverEarningsModal from './DriverEarningsModal';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CarIcon = L.divIcon({
  html: '<div style="background-color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 20px; border: 2px solid #0f172a;">🚗</div>',
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface ActiveDriverTripProps {
    ride: any;
    onComplete: (amount: number) => void;
}

type TripState = 'heading_to_pickup' | 'arrived' | 'in_transit' | 'completed';

// Component to update map view dynamically
const MapUpdater = ({ driverLoc, destLoc }: { driverLoc: [number, number] | null, destLoc: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
      if (driverLoc && destLoc) {
        const bounds = L.latLngBounds(driverLoc, destLoc);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (driverLoc) {
        map.flyTo(driverLoc, 15);
      }
    }, [map, driverLoc, destLoc]);
    return null;
};

export default function ActiveDriverTrip({ ride, onComplete }: ActiveDriverTripProps) {
    const { token } = useAuth();
    const [tripState, setTripState] = useState<TripState>('heading_to_pickup');
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [enteredOTP, setEnteredOTP] = useState('');
    const [otpError, setOtpError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use dynamic coordinates from the ride request if available, otherwise fallback
    const pickupLoc = { lat: Number(ride.pickupLat) || 14.6050, lng: Number(ride.pickupLng) || 120.9850 };
    const dropoffLoc = { lat: Number(ride.dropoffLat) || 14.6100, lng: Number(ride.dropoffLng) || 120.9900 };
    
    // Safety check for math ops
    const initialDriver = { lat: Number(pickupLoc.lat) - 0.015, lng: Number(pickupLoc.lng) + 0.015 };
    
    const [driverPos, setDriverPos] = useState<{lat: number, lng: number}>(initialDriver);
    const [routePath, setRoutePath] = useState<{lat: number, lng: number}[]>([]);
    const [recordedPath, setRecordedPath] = useState<{lat: number, lng: number}[]>([]);
    
    const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
    const [durationRemaining, setDurationRemaining] = useState<number | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const actualRideId = ride.id || ride.rideId || ride.rideRequestId;

    // Chat state
    const [messages, setMessages] = useState<{sender: string, text: string, timestamp: number}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL || '/');
        if (actualRideId) {
            socketRef.current.emit('joinRoom', `ride_${actualRideId}`);
            console.log(`Driver joined room ride_${actualRideId}`);
        }
        
        socketRef.current.on('chatMessage', (data: any) => {
            setMessages(prev => [...prev, data]);
            setIsChatOpen(prevOpen => {
                if (!prevOpen) {
                    setUnreadCount(prevUnread => prevUnread + 1);
                }
                return prevOpen;
            });
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    useEffect(() => {
        if (isChatOpen) {
            setUnreadCount(0);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isChatOpen]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !socketRef.current) return;

        const messageData = {
            rideId: actualRideId,
            sender: 'driver',
            text: chatInput.trim(),
            timestamp: Date.now()
        };

        socketRef.current.emit('chatMessage', messageData);
        setMessages(prev => [...prev, messageData]);
        setChatInput('');
    };

    useEffect(() => {
        if (socketRef.current && actualRideId && driverPos) {
            socketRef.current.emit('driverLocationUpdate', {
                rideId: actualRideId,
                lat: Number(driverPos.lat),
                lng: Number(driverPos.lng),
                distanceRemaining,
                durationRemaining
            });
        }
    }, [driverPos.lat, driverPos.lng, distanceRemaining, durationRemaining]);

    useEffect(() => {
        if (socketRef.current && actualRideId) {
            socketRef.current.emit('tripStatusUpdate', {
                rideId: actualRideId,
                status: tripState
            });
        }
    }, [tripState]);

    // Fetch initial route and start animation when button is pressed
    useEffect(() => {
        let isUnmounted = false;
        let reqId: number;

        const startAnimate = async () => {
            let startCoord = driverPos;
            let endCoord = pickupLoc;
            
            if (tripState === 'in_transit') {
                startCoord = pickupLoc;
                endCoord = dropoffLoc;
            } else if (tripState === 'heading_to_pickup') {
                startCoord = initialDriver;
                endCoord = pickupLoc;
            } else {
                return;
            }
            
            const routeData = await getRouteData(startCoord, endCoord);
            if (!routeData || isUnmounted) return;
            
            setRoutePath(routeData.coordinates);
            
            const coords = routeData.coordinates;
            const durationSec = routeData.durationSeconds;
            const distanceM = routeData.distanceMeters;
            
            if (coords.length < 2) return;
            
            // Speed up simulation to 10 seconds per leg
            const simulationDuration = 10000; 
            let startTime = performance.now();

            const animate = (time: number) => {
                if (isUnmounted) return;
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / simulationDuration, 1);
                
                const totalSegments = coords.length - 1;
                const exactSegment = progress * totalSegments;
                const segmentIdx = Math.floor(exactSegment);
                
                if (segmentIdx >= totalSegments) {
                    setDriverPos(coords[coords.length - 1]);
                    setDistanceRemaining(0);
                    setDurationRemaining(0);
                    // We don't auto-transition state for the driver, let them tap the button
                    return;
                }
                
                const segProgress = exactSegment - segmentIdx;
                const p1 = coords[segmentIdx];
                const p2 = coords[segmentIdx + 1];
                
                const lat = p1.lat + (p2.lat - p1.lat) * segProgress;
                const lng = p1.lng + (p2.lng - p1.lng) * segProgress;
                
                setDriverPos({ lat, lng });
                setDistanceRemaining(Math.max(0, distanceM * (1 - progress)));
                setDurationRemaining(Math.max(0, durationSec * (1 - progress)));
                
                reqId = requestAnimationFrame(animate);
            };
            reqId = requestAnimationFrame(animate);
        };
        
        startAnimate();

        return () => {
            isUnmounted = true;
            if (reqId) cancelAnimationFrame(reqId);
        };
    }, [tripState]);

    const getStatusText = () => {
        switch (tripState) {
            case 'heading_to_pickup': return 'Heading to Pickup';
            case 'arrived': return 'Arrived at Pickup';
            case 'in_transit': return 'In Transit to Dropoff';
            case 'completed': return 'Trip Completed';
            default: return '';
        }
    };

    const handlePrimaryAction = async () => {
        if (tripState === 'heading_to_pickup') {
            setTripState('arrived');
            setDriverPos(pickupLoc);
            setRoutePath([]);
        } else if (tripState === 'arrived') {
            setShowOTPModal(true);
        } else if (tripState === 'in_transit') {
            setIsSubmitting(true);
            try {
                const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/rides/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ rideId: ride.id })
                });
                if (res.ok) {
                    toast.success('Trip completed successfully!');
                    // Save the transit route
                    setRecordedPath(routePath);
                    saveTripLog({
                        id: ride.id?.toString() || Math.random().toString(),
                        date: new Date().toISOString(),
                        role: 'driver',
                        recordedPath: routePath,
                        fare: ride.proposedFare
                    });
                    onComplete(ride.proposedFare);
                } else {
                     toast.error('Failed to complete trip');
                }
            } catch (err) {
                 toast.error('Network Error. Please check your connection.');
            } finally {
                 setIsSubmitting(false);
            }
        }
    };

    const verifyOTP = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/rides/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rideId: ride.id, otp: enteredOTP })
            });

            if (res.ok) {
                setShowOTPModal(false);
                setTripState('in_transit');
                setOtpError(false);
            } else {
                setOtpError(true);
                toast.error('Invalid PIN');
                setTimeout(() => setEnteredOTP(''), 500);
            }
        } catch (err) {
            toast.error('Network Error. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNumpad = (num: string) => {
        setOtpError(false);
        if (enteredOTP.length < 4) {
            const newOTP = enteredOTP + num;
            setEnteredOTP(newOTP);
        }
    };

    const renderOTPModal = () => (
        <AnimatePresence>
            {showOTPModal && (
                <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4">
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col items-center border border-slate-200"
                    >
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Verify Passenger</h3>
                        <p className="text-slate-500 font-medium mb-6 text-center">Enter the 4-digit PIN provided by {ride.passengerName}</p>
                        
                        <div className={`flex gap-3 mb-8 w-full justify-center ${otpError ? 'animate-shake' : ''}`}>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className={`w-14 h-16 rounded-xl flex items-center justify-center text-3xl font-bold border-2 ${otpError ? 'border-rose-500 text-rose-500 bg-rose-50' : enteredOTP[i] ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-slate-200 text-slate-300 bg-slate-50'}`}>
                                    {enteredOTP[i] || ''}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button key={num} onClick={() => handleNumpad(num.toString())} className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-2xl font-bold transition-colors">
                                    {num}
                                </button>
                            ))}
                            <button onClick={() => setEnteredOTP('')} className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 text-xl font-bold transition-colors uppercase tracking-wider">
                                CLR
                            </button>
                            <button onClick={() => handleNumpad('0')} className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-2xl font-bold transition-colors">
                                0
                            </button>
                            <button onClick={() => setEnteredOTP(enteredOTP.slice(0, -1))} className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-500 text-xl font-bold transition-colors flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-delete"><path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/></svg>
                            </button>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button onClick={() => { setShowOTPModal(false); setEnteredOTP(''); setOtpError(false); }} className="flex-1 py-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Cancel
                            </button>
                            <button onClick={verifyOTP} disabled={enteredOTP.length !== 4 || isSubmitting} className={`flex-1 py-4 rounded-xl font-bold text-white transition-colors flex items-center justify-center gap-2 ${enteredOTP.length === 4 ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30' : 'bg-slate-300'} disabled:opacity-50`}>
                                {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : 'Verify PIN'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    const getActionButtonText = () => {
        switch (tripState) {
            case 'heading_to_pickup': return 'Tap when Arrived';
            case 'arrived': return 'Verify Passenger PIN';
            case 'in_transit': return `Complete Trip & Collect ₱${ride.proposedFare}`;
            default: return '';
        }
    };
    
    const getEtaInfo = () => {
        if (tripState === 'arrived' || tripState === 'completed') return '0 mins • 0 km';
        
        let info = '';
        if (durationRemaining !== null) {
            const mins = Math.max(1, Math.ceil(durationRemaining / 60));
            info += `${mins} min${mins !== 1 ? 's' : ''}`;
        }
        if (distanceRemaining !== null) {
            const km = (distanceRemaining / 1000).toFixed(1);
            info += ` • ${km} km away`;
        }
        return info || ride.eta;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 font-sans overflow-hidden">
            {/* Background Map */}
            <div className="absolute inset-0 z-0">
                <MapContainer 
                    center={[pickupLoc.lat, pickupLoc.lng]}
                    zoom={14} 
                    scrollWheelZoom={false} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapUpdater 
                        driverLoc={[driverPos.lat, driverPos.lng]} 
                        destLoc={tripState === 'heading_to_pickup' ? [pickupLoc.lat, pickupLoc.lng] : tripState === 'in_transit' ? [dropoffLoc.lat, dropoffLoc.lng] : null} 
                    />
                    
                    {/* Markers */}
                    <Marker position={[pickupLoc.lat, pickupLoc.lng]}>
                        <Popup>Pickup</Popup>
                    </Marker>
                    <Marker position={[dropoffLoc.lat, dropoffLoc.lng]}>
                        <Popup>Dropoff</Popup>
                    </Marker>
                    
                    {/* Car Marker */}
                    <Marker position={[driverPos.lat, driverPos.lng]} icon={CarIcon}>
                        <Popup>You</Popup>
                    </Marker>
                    
                    {/* Route Line Example */}
                    {tripState === 'heading_to_pickup' && routePath.length > 0 && (
                        <Polyline positions={routePath.map(p => [p.lat, p.lng])} color="#3b82f6" weight={5} dashArray="8 8" />
                    )}
                    {tripState === 'in_transit' && routePath.length > 0 && (
                        <Polyline positions={routePath.map(p => [p.lat, p.lng])} color="#10b981" weight={5} />
                    )}
                </MapContainer>
            </div>

            {/* Top Overlay Card - Trip Info */}
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl z-10 flex justify-between items-center text-white"
            >
                <div>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                    <h2 className="text-xl font-extrabold flex items-center gap-2">
                        {getStatusText()}
                        {(tripState === 'heading_to_pickup' || tripState === 'in_transit') && (
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                        )}
                    </h2>
                </div>
                <div className="text-right border-l border-white/10 pl-5">
                    <p className="text-sm font-bold text-slate-400">ETA / DISTANCE</p>
                    <p className="text-xl font-extrabold text-emerald-400">{getEtaInfo()}</p>
                </div>
            </motion.div>

            {/* Bottom Overlay Card - Controls */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[32px] p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] z-10"
            >
                {/* Passenger Info & SOS */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-200 relative overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                            {/* Avatar placeholder */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${ride.isFemaleOnly ? 'from-purple-300 to-purple-500' : 'from-blue-300 to-blue-500'}`}></div>
                            <div className="relative text-white font-bold text-xl">{ride.passengerName.charAt(0)}</div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                {ride.passengerName}
                                {ride.isFemaleOnly && <ShieldCheck className="w-5 h-5 text-purple-600" />}
                            </h3>
                            <p className="text-slate-500 font-medium text-sm mt-0.5">⭐ {ride.rating.toFixed(1)} • {ride.distance}</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={() => setIsChatOpen(true)} className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm relative">
                            <MessageCircle className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white shadow-sm">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors shadow-sm">
                            <Phone className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors ml-2 shadow-sm border border-red-100 hidden sm:flex">
                            <AlertCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* State Machine Action Button */}
                <AnimatePresence mode="wait">
                    <motion.button
                        key={tripState}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        disabled={isSubmitting}
                        onClick={handlePrimaryAction}
                        className={`w-full py-5 rounded-2xl font-extrabold text-xl md:text-2xl shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2
                            ${tripState === 'heading_to_pickup' ? 'bg-blue-600 text-white shadow-blue-500/30' : 
                              tripState === 'arrived' ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 
                              'bg-emerald-500 text-white shadow-emerald-500/30'}
                        `}
                    >
                        {isSubmitting ? <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</> : getActionButtonText()}
                    </motion.button>
                </AnimatePresence>
            </motion.div>

            {/* Chat Floating Window */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-[280px] md:bottom-24 md:right-4 z-[500] w-[calc(100%-2rem)] mx-4 md:mx-0 md:w-80 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex flex-col h-[400px]"
                        style={{ left: window.innerWidth < 768 ? '0' : 'auto' }}
                    >
                        <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-blue-400" />
                                Chat with {ride.passengerName}
                            </h3>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm flex flex-col ${msg.sender === 'driver' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-200 rounded-bl-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button 
                                type="submit" 
                                disabled={!chatInput.trim()}
                                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Earnings Modal Overlay */}
            <AnimatePresence>
                {tripState === 'completed' && (
                    <DriverEarningsModal 
                        fare={ride.proposedFare} 
                        recordedPath={recordedPath} 
                        onComplete={() => onComplete(ride.proposedFare)} 
                    />
                )}
            </AnimatePresence>
            
            {renderOTPModal()}
        </div>
    );
}
