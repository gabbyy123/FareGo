import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Heart, Map as MapIcon, DollarSign } from 'lucide-react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DriverEarningsModalProps {
    fare: number;
    recordedPath: {lat: number, lng: number}[];
    onComplete: () => void;
}

export default function DriverEarningsModal({ fare, recordedPath, onComplete }: DriverEarningsModalProps) {
    // Determine bounds for minimap
    const bounds = recordedPath.length > 0 ? L.latLngBounds(recordedPath.map(p => [p.lat, p.lng])) : undefined;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
            <AnimatePresence mode="wait">
                <motion.div
                    key="earnings"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 p-6 flex flex-col"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Trip Completed!</h2>
                    </div>
                    
                    <div className="bg-slate-100 rounded-2xl overflow-hidden h-48 relative mb-6">
                        {recordedPath.length > 0 ? (
                            <MapContainer 
                                bounds={bounds}
                                scrollWheelZoom={false} 
                                zoomControl={false}
                                style={{ height: '100%', width: '100%' }}
                                attributionControl={false}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Polyline positions={recordedPath.map(p => [p.lat, p.lng])} color="#10b981" weight={5} />
                            </MapContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">Map Unavailable</div>
                        )}
                    </div>
                    
                    <div className="mb-6 bg-slate-50 p-6 rounded-2xl text-center border border-slate-100 shadow-sm">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 block">Earnings</span>
                        <div className="text-4xl font-black text-emerald-600">₱{fare}</div>
                    </div>

                    <button 
                        onClick={onComplete}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95 flex flex-row items-center justify-center gap-2"
                    >
                        Keep Driving
                    </button>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
