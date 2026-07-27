import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, AlertOctagon, Phone, ShieldCheck, Info, MessageCircle, Send, X } from 'lucide-react';
import CheckoutModal from './CheckoutModal';
import { getRouteData } from '../utils/routing';
import { saveTripLog } from '../utils/tripLog';
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

interface ActivePassengerTripProps {
    bid: any;
    rideId: number | null;
    pickupCoords: {lat: number, lng: number};
    dropoffCoords: {lat: number, lng: number};
    onTripEnd: () => void;
}

type TripState = 'heading_to_pickup' | 'arrived' | 'in_transit' | 'completed';

// Utility for Haversine distance in meters
function getDistanceMeters(p1: {lat: number, lng: number}, p2: {lat: number, lng: number}) {
    const R = 6371e3; 
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Utility to check route deviation
function checkRouteDeviation(currentLoc: {lat: number, lng: number}, expectedRoute: {lat: number, lng: number}[]) {
    if (!expectedRoute || expectedRoute.length === 0) return false;
    let minDistance = Infinity;
    for (const point of expectedRoute) {
        const dist = getDistanceMeters(currentLoc, point);
        if (dist < minDistance) minDistance = dist;
    }
    return minDistance > 500; // 500 meters threshold
}

export default function ActivePassengerTrip({ bid, rideId, pickupCoords, dropoffCoords, onTripEnd }: ActivePassengerTripProps) {
    const cleanPickup = { lat: Number(pickupCoords.lat), lng: Number(pickupCoords.lng) };
    const cleanDropoff = { lat: Number(dropoffCoords.lat), lng: Number(dropoffCoords.lng) };

    const [tripState, setTripState] = useState<TripState>('heading_to_pickup');
    const [driverPos, setDriverPos] = useState<{lat: number, lng: number}>({ 
        lat: cleanPickup.lat - 0.015, 
        lng: cleanPickup.lng + 0.015 
    });
    
    const [routePath, setRoutePath] = useState<{lat: number, lng: number}[]>([]);
    const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
    const [durationRemaining, setDurationRemaining] = useState<number | null>(null);
    const [showSentinelWarning, setShowSentinelWarning] = useState(false);
    const [simulatingDeviation, setSimulatingDeviation] = useState(false);
    
    const simulatingDeviationRef = useRef(false);

    const routePathRef = useRef<{lat: number, lng: number}[]>([]);
    const recordedPathRef = useRef<{lat: number, lng: number}[]>([]);
    const socketRef = useRef<Socket | null>(null);
    
    // Chat state
    const [messages, setMessages] = useState<{sender: string, text: string, timestamp: number}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial setup: get route paths to draw
    useEffect(() => {
        let isUnmounted = false;
        const fetchRoutePaths = async () => {
             const toDropoff = await getRouteData(cleanPickup, cleanDropoff);
             if (!isUnmounted && toDropoff) {
                 setRoutePath(toDropoff.coordinates);
                 routePathRef.current = toDropoff.coordinates;
             }
        };
        fetchRoutePaths();
        return () => { isUnmounted = true; };
    }, [cleanPickup.lat, cleanPickup.lng, cleanDropoff.lat, cleanDropoff.lng]);

    // Socket listeners for actual syncing
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL || '/');
        if (rideId) {
            socketRef.current.emit('joinRoom', `ride_${rideId}`);
            console.log(`Passenger joined room ride_${rideId}`);
        }

        socketRef.current.on('driverLocationUpdate', (data: any) => {
            const lat = Number(data.lat);
            const lng = Number(data.lng);
            let currentPos = { lat, lng };

            if (simulatingDeviationRef.current) {
                currentPos = { lat: lat + 0.006, lng: lng + 0.006 };
            }

            if (checkRouteDeviation(currentPos, routePathRef.current)) {
                setShowSentinelWarning(true);
            }
            
            setDriverPos(currentPos);
            recordedPathRef.current = [...recordedPathRef.current, currentPos];
            
            if (data.distanceRemaining !== undefined && data.distanceRemaining !== null) {
                setDistanceRemaining(Number(data.distanceRemaining));
            }
            if (data.durationRemaining !== undefined && data.durationRemaining !== null) {
                setDurationRemaining(Number(data.durationRemaining));
            }
        });

        socketRef.current.on('tripStatusUpdate', (data: any) => {
            if (data.status) {
                setTripState(data.status);
            }
        });

        socketRef.current.on('rideStatusUpdate', (data: any) => {
            if (data.status === 'completed' && String(data.rideId) === String(rideId)) {
                setTripState('completed');
            }
        });

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
            rideId,
            sender: 'passenger',
            text: chatInput.trim(),
            timestamp: Date.now()
        };

        socketRef.current.emit('chatMessage', messageData);
        setMessages(prev => [...prev, messageData]);
        setChatInput('');
    };

    useEffect(() => {
        if (tripState === 'arrived') {
             // Let's check when it's actually completed.
        }
    }, [tripState]);

    const handleTriggerSafetyAlert = async () => {
        try {
            await fetch((import.meta.env.VITE_API_URL || '') + '/api/safety/trigger-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rideId,
                    driverName: bid.driverName,
                    location: driverPos
                })
            });
            setShowSentinelWarning(false);
            simulatingDeviationRef.current = false;
            alert('Emergency Contacts and Authorities have been notified.');
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusText = () => {
        switch (tripState) {
            case 'heading_to_pickup': return 'Driver is on the way';
            case 'arrived': return 'Driver arrived at pickup';
            case 'in_transit': return 'Ride in Progress';
            case 'completed': return 'You have arrived at your destination';
            default: return '';
        }
    };

    const getEtaInfo = () => {
        if (tripState === 'completed') return 'Completed';
        
        let info = '';
        if (durationRemaining !== null) {
            const mins = Math.max(1, Math.ceil(durationRemaining / 60));
            info += `${mins} min${mins !== 1 ? 's' : ''}`;
        }
        if (distanceRemaining !== null) {
            const km = (distanceRemaining / 1000).toFixed(1);
            info += ` • ${km} km away`;
        }
        return info || (tripState === 'heading_to_pickup' ? `${bid.time} mins away` : 'Dropping off in a few mins');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-100 font-sans overflow-hidden">
            {/* Background Map */}
            <div className="absolute inset-0 z-0">
                <MapContainer 
                    center={[cleanPickup.lat, cleanPickup.lng]}
                    zoom={14} 
                    scrollWheelZoom={false} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    
                    <Marker position={[cleanPickup.lat, cleanPickup.lng]}>
                        <Popup>Pickup</Popup>
                    </Marker>
                    <Marker position={[cleanDropoff.lat, cleanDropoff.lng]}>
                        <Popup>Dropoff</Popup>
                    </Marker>
                    
                    {(tripState === 'heading_to_pickup' || tripState === 'arrived') && routePath.length > 0 && (
                        <Polyline positions={routePath.map(p => [p.lat, p.lng])} color="#3b82f6" weight={5} dashArray="8 8" />
                    )}
                    {tripState === 'in_transit' && routePath.length > 0 && (
                        <Polyline positions={routePath.map(p => [p.lat, p.lng])} color="#10b981" weight={5} />
                    )}

                    <Marker 
                        position={[driverPos.lat, driverPos.lng]}
                        icon={L.divIcon({
                            html: '<div style="background-color: white; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 22px; border: 2px solid #0f172a;">🚗</div>',
                            className: '',
                            iconSize: [44, 44],
                            iconAnchor: [22, 22]
                        })}
                    />
                </MapContainer>
            </div>

            {/* Top HUD - Status */}
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-5 shadow-2xl z-10 flex flex-col gap-4"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            {getStatusText()}
                            {tripState !== 'completed' && (
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                            )}
                        </h2>
                        <p className="text-blue-600 font-bold text-sm mt-1">{getEtaInfo()}</p>
                    </div>
                    {tripState === 'in_transit' && (
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-emerald-100">
                            <Info className="w-5 h-5" /> On Route
                        </div>
                    )}
                </div>

                {(tripState === 'heading_to_pickup' || tripState === 'arrived') && (
                    <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(59,130,246,0.3)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Boarding PIN</p>
                            <p className="text-white text-sm font-medium">Show this PIN to your driver before boarding.</p>
                        </div>
                        <div className="relative z-10 bg-black/50 border border-blue-500/30 px-4 py-2 rounded-xl flex items-center justify-center">
                            <span className="text-3xl font-black text-blue-400 tracking-[0.2em]">{bid.boardingOTP || '1234'}</span>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Bottom HUD - Driver & Controls */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[32px] p-6 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] z-10"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-slate-100 relative overflow-hidden border-2 border-white shadow-md">
                            <div className={`absolute inset-0 bg-linear-to-b ${!bid.isMale ? 'from-rose-300 to-rose-500' : 'from-blue-300 to-blue-500'}`}></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-white/30 rounded-t-full"></div>
                            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-7 h-7 bg-white/40 rounded-full"></div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                {bid.driverName}
                                {!bid.isMale && <ShieldCheck className="w-5 h-5 text-rose-500" />}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="font-bold text-sm bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                                    ⭐ {bid.rating}
                                </span>
                                <span className="text-slate-500 font-medium text-sm">{bid.plateNumber || 'N/A'} • {bid.vehicleMake || 'Unknown'} {bid.vehicleModel || ''}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button className="py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200 shadow-xs">
                        <Share2 className="w-5 h-5" /> Share Location
                    </button>
                    <button className="py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors border border-rose-200 shadow-xs">
                        <AlertOctagon className="w-5 h-5" /> Emergency SOS
                    </button>
                    
                    <button 
                        onClick={() => {
                            simulatingDeviationRef.current = true;
                        }} 
                        className="col-span-2 py-3 bg-amber-50 text-amber-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors border border-amber-200 text-sm mt-2"
                    >
                        [Test] Trigger Route Deviation
                    </button>
                </div>
            </motion.div>

            {/* Safety Sentinel Modal */}
            <AnimatePresence>
                {showSentinelWarning && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-rose-950/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-rose-600 w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-rose-500"
                        >
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-bl-full blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-tr-full blur-2xl"></div>
                            
                            <div className="p-8 relative z-10 text-center">
                                <div className="w-20 h-20 bg-white shadow-[0_0_40px_rgba(255,255,255,0.3)] rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AlertOctagon className="w-10 h-10 text-rose-600" />
                                </div>
                                <h3 className="text-3xl font-black text-white tracking-tight mb-2">Unusual Route Detected</h3>
                                <p className="text-rose-100 font-medium text-lg leading-relaxed mb-8">
                                    We noticed your ride is over 500 meters off the expected route. Are you safe?
                                </p>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={handleTriggerSafetyAlert}
                                        className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-slate-900 transition-colors shadow-xl"
                                    >
                                        Call Police / Notify Contacts
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowSentinelWarning(false);
                                            simulatingDeviationRef.current = false;
                                        }}
                                        className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-lg hover:bg-rose-400 transition-colors border border-rose-400"
                                    >
                                        I am safe
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Chat Floating Window */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-4 z-[500] w-80 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex flex-col h-[400px]"
                    >
                        <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-blue-400" />
                                Chat with {bid.driverName}
                            </h3>
                            <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'passenger' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.sender === 'passenger' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-200 rounded-bl-sm'}`}>
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

            {/* Chat Floating Button */}
            {!isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-32 right-4 z-[90] w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-4 border-white"
                >
                    <MessageCircle className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {/* Payment Modal overlay when arrived */}
            <AnimatePresence>
                {tripState === 'completed' && (
                    <CheckoutModal 
                        fare={bid.proposedFare} 
                        rideId={rideId}
                        onComplete={onTripEnd} 
                        recordedPath={recordedPathRef.current}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
