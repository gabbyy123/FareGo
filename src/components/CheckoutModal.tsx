import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CreditCard, Banknote, Smartphone, CheckCircle, Heart, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';

interface CheckoutModalProps {
    fare: number;
    rideId?: number | null;
    onComplete: () => void;
    recordedPath?: {lat: number, lng: number}[];
}

const MiniMapUpdater = ({ path }: { path: {lat: number, lng: number}[] }) => {
    const map = useMap();
    useEffect(() => {
        if (path && path.length > 0) {
            const bounds = L.latLngBounds(path.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [10, 10] });
        }
    }, [map, path]);
    return null;
};

export default function CheckoutModal({ fare, rideId, onComplete, recordedPath = [] }: CheckoutModalProps) {
    const [step, setStep] = useState<'payment' | 'rating' | 'summary'>('payment');
    const [selectedMethod, setSelectedMethod] = useState<string>('cash');
    const [rating, setRating] = useState(0);
    const [tip, setTip] = useState<number>(0);
    const [reviewText, setReviewText] = useState('');

    const paymentMethods = [
        { id: 'cash', name: 'Cash', icon: Banknote, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
        { id: 'gcash', name: 'GCash', icon: Smartphone, color: 'bg-blue-50 text-blue-600 border-blue-200' },
        { id: 'maya', name: 'Maya', icon: Smartphone, color: 'bg-slate-800 text-green-400 border-slate-700' },
        { id: 'card', name: 'Card', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    ];

    const { token } = useAuth();

    const tipOptions = [0, 20, 50, 100];

    const handleSubmitRating = async () => {
        if (rideId && rating > 0) {
            try {
                await fetch(`${import.meta.env.VITE_API_URL || ''}/api/rides/${rideId}/rate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ rating, reviewText })
                });
                toast.success('Thanks for your feedback!');
            } catch (err) {
                console.error('Failed to submit rating', err);
            }
        }
        
        if (recordedPath && recordedPath.length > 0) {
            setStep('summary');
        } else {
            onComplete();
        }
    };

    const handleConfirmPayment = () => {
        setStep('rating');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
            <AnimatePresence mode="wait">
                {step === 'payment' && (
                    <motion.div
                        key="payment"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10"
                    >
                        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 mb-2">You have arrived</h2>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Final Fare</p>
                            <div className="text-5xl font-black text-slate-900 mt-2 tracking-tighter">
                                ₱{fare.toLocaleString()}
                            </div>
                        </div>

                        <div className="p-8">
                            <h3 className="font-bold text-slate-900 mb-4">Select Payment Method</h3>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                {paymentMethods.map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setSelectedMethod(method.id)}
                                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 transition-all duration-200 ${
                                            selectedMethod === method.id 
                                            ? `${method.color} border-current shadow-md scale-105` 
                                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                        }`}
                                    >
                                        <method.icon className="w-8 h-8" />
                                        <span className="font-bold text-sm">{method.name}</span>
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={handleConfirmPayment}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-slate-900/20 active:scale-95"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </motion.div>
                )}
                {step === 'rating' && (
                    <motion.div
                        key="rating"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 p-8 text-center"
                    >
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Payment Successful</h2>
                        <p className="text-slate-500 font-medium mb-8">How was your ride?</p>

                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star} 
                                    onClick={() => setRating(star)}
                                    className="p-2 transition-transform hover:scale-110"
                                >
                                    <Star className={`w-10 h-10 ${rating >= star ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-slate-200'}`} />
                                </button>
                            ))}
                        </div>

                        <div className="mb-8">
                            <p className="text-sm font-bold text-slate-700 mb-3">Add a tip for the driver?</p>
                            <div className="flex justify-center gap-3">
                                {tipOptions.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setTip(amount)}
                                        className={`px-4 py-2 rounded-xl font-bold border-2 transition-all ${
                                            tip === amount 
                                            ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        {amount === 0 ? 'No Tip' : `₱${amount}`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <input 
                                type="text"
                                placeholder="Write a short review (optional)"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-hidden focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all outline-hidden text-center"
                            />
                        </div>

                        <button 
                            onClick={handleSubmitRating}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {recordedPath && recordedPath.length > 0 ? 'View Trip Summary' : 'Return to Home'}
                        </button>
                    </motion.div>
                )}
                {step === 'summary' && (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10 p-6 flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <MapIcon className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">Trip Summary</h2>
                        </div>
                        
                        <div className="bg-slate-100 rounded-2xl overflow-hidden h-48 relative mb-6">
                            {recordedPath.length > 0 ? (
                                <MapContainer 
                                    center={[recordedPath[0].lat, recordedPath[0].lng]}
                                    zoom={15} 
                                    scrollWheelZoom={false} 
                                    zoomControl={false}
                                    style={{ height: '100%', width: '100%' }}
                                    attributionControl={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MiniMapUpdater path={recordedPath} />
                                    <Polyline positions={recordedPath.map(p => [p.lat, p.lng])} color="#10b981" weight={5} />
                                </MapContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">Map Unavailable</div>
                            )}
                        </div>
                        
                        <div className="mb-6 bg-slate-50 p-4 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Final Fare</span>
                                <span className="text-lg font-black text-emerald-600">₱{fare + tip}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Payment</span>
                                <span className="text-sm font-bold text-slate-700 capitalize">{selectedMethod}</span>
                            </div>
                        </div>

                        <button 
                            onClick={onComplete}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95 flex flex-row items-center justify-center gap-2"
                        >
                            Done <Heart className="w-5 h-5 text-rose-400" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
