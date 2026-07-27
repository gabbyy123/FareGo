import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Wallet, MapPin, ShieldCheck, ChevronLeft, 
    Camera, Star, Plus, CreditCard, Smartphone, 
    Home, Briefcase, GraduationCap, Link2, AlertTriangle, Gift, Loader2, Check 
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'wallet' | 'locations' | 'safety' | 'rewards';

export default function UserProfile() {
    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [autoShare, setAutoShare] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBack = () => {
        if (user?.role === 'driver') {
            navigate('/driver');
        } else {
            navigate('/passenger');
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
             const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/user/profile', {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify(editData)
             });
             const data = await res.json();
             if (res.ok) {
                 updateUser(data.user);
                 setIsEditing(false);
                 toast.success('Profile updated successfully');
             } else {
                 toast.error(data.error || 'Failed to update profile');
             }
        } catch (err) {
             toast.error('Network error');
        } finally {
             setIsSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0];
         if (file) {
             if (file.size > 2 * 1024 * 1024) {
                 toast.error('Image must be less than 2MB');
                 return;
             }
             const reader = new FileReader();
             reader.onloadend = async () => {
                  setIsSaving(true);
                  try {
                      const base64String = reader.result as string;
                      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/user/profile', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({ ...editData, profilePicture: base64String })
                      });
                      const data = await res.json();
                      if (res.ok) {
                          updateUser(data.user);
                          toast.success('Profile picture updated successfully');
                      } else {
                          toast.error(data.error || 'Failed to update picture');
                      }
                  } catch (err) {
                      toast.error('Network error');
                  } finally {
                      setIsSaving(false);
                  }
             };
             reader.readAsDataURL(file);
         }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-20 flex items-center gap-4 shadow-xs">
                <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-slate-700" />
                </button>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Account</h1>
            </div>

            {/* Sidebar Navigation */}
            <aside className="w-full md:w-80 bg-white border-r border-slate-200 shrink-0 md:h-screen md:sticky md:top-0 shadow-[20px_0_40px_rgba(0,0,0,0.02)] z-10 flex flex-col">
                <div className="hidden md:flex p-6 border-b border-slate-100 items-center justify-between">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account</h2>
                     <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900">
                         <ChevronLeft className="w-5 h-5" />
                     </button>
                </div>
                
                <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                    <div onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl relative group cursor-pointer border-2 border-white shadow-sm overflow-hidden bg-cover bg-center" style={{ backgroundImage: user?.profilePicture ? `url(${user.profilePicture})` : undefined }}>
                        {!user?.profilePicture && (user?.firstName ? user.firstName.charAt(0) : 'U')}
                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
                            {isSaving ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">{user?.firstName || 'User'} {user?.lastName}</h3>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5 mt-0.5">
                            <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                            <span className="font-bold text-slate-700">4.92</span> Rating
                        </p>
                    </div>
                </div>

                <nav className="flex-1 p-4 flex flex-row overflow-x-auto md:flex-col gap-2 no-scrollbar border-b md:border-b-0 border-slate-200">
                    <TabButton icon={<User size={20} />} label="Profile Overview" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                    <TabButton icon={<Wallet size={20} />} label="Payment Wallet" active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
                    <TabButton icon={<Gift size={20} />} label="Rewards Center" active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')} />
                    <TabButton icon={<MapPin size={20} />} label="Saved Locations" active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} />
                    <TabButton icon={<ShieldCheck size={20} />} label="Safety & Trust" active={activeTab === 'safety'} onClick={() => setActiveTab('safety')} />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl p-6 md:p-10 lg:p-12 overflow-y-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        {activeTab === 'profile' && (
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                     <h2 className="text-3xl font-black text-slate-900 tracking-tight">Personal Information</h2>
                                     {!isEditing ? (
                                         <button onClick={() => setIsEditing(true)} className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                                             Edit Profile
                                         </button>
                                     ) : (
                                         <div className="flex gap-2">
                                             <button onClick={() => {setIsEditing(false); setEditData({firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || ''})}} className="text-slate-500 font-bold text-sm bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">
                                                 Cancel
                                             </button>
                                             <button onClick={handleSaveProfile} disabled={isSaving} className="text-white font-bold text-sm bg-slate-900 px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                                                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>} Save
                                             </button>
                                         </div>
                                     )}
                                </div>
                                
                                <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs overflow-hidden">
                                    <div className="p-6 md:p-8 space-y-6">
                                        {!isEditing ? (
                                             <>
                                                 <InfoRow label="Display Name" value={`${user?.firstName} ${user?.lastName}`} />
                                                 <div className="h-px w-full bg-slate-100"></div>
                                                 <InfoRow label="Email Address" value={user?.email || 'user@example.com'} />
                                                 <div className="h-px w-full bg-slate-100"></div>
                                                 <InfoRow label="Phone Number" value={user?.phone || '+63 912 345 6789'} />
                                                 <div className="h-px w-full bg-slate-100"></div>
                                                 <InfoRow label="Gender" value={user?.gender === 'female' ? 'Female' : 'Male'} />
                                             </>
                                        ) : (
                                             <div className="space-y-4">
                                                 <div className="grid grid-cols-2 gap-4">
                                                     <div>
                                                         <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 block">First Name</label>
                                                         <input type="text" value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium" />
                                                     </div>
                                                     <div>
                                                         <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 block">Last Name</label>
                                                         <input type="text" value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium" />
                                                     </div>
                                                 </div>
                                                 <div>
                                                     <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 block">Phone Number</label>
                                                     <input type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium" />
                                                 </div>
                                                 <div>
                                                     <label className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email (Cannot be changed)</label>
                                                     <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed" />
                                                 </div>
                                             </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {activeTab === 'wallet' && (
                            <section>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Payment Methods</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <PaymentCard name="GCash" type="Linked" icon={<Smartphone />} color="bg-blue-50 text-blue-600" />
                                    <PaymentCard name="Maya" type="Not Linked" icon={<Smartphone />} color="bg-slate-100 text-slate-400" action="Link Account" />
                                    <PaymentCard name="•••• 4242" type="Visa Credit Card" icon={<CreditCard />} color="bg-indigo-50 text-indigo-600" />
                                </div>

                                <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
                                    <Plus className="w-5 h-5" /> Add Payment Method
                                </button>
                            </section>
                        )}

                        {activeTab === 'rewards' && (
                            <section>
                                <h2 className="text-3xl font-black text-amber-600 tracking-tight mb-8">Rewards Center</h2>
                                
                                <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 rounded-[2rem] p-10 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden mb-8 border border-amber-300">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                                        <div>
                                            <p className="text-amber-100 font-bold uppercase tracking-widest text-sm mb-1">Current Tier</p>
                                            <h3 className="text-5xl font-black tracking-tight mb-4 text-white">Gold</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                    <Star className="w-5 h-5 text-white fill-white" />
                                                </div>
                                                <p className="font-bold text-amber-50">Priority Matching Enabled</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 w-full md:w-auto">
                                            <p className="text-amber-100 font-bold uppercase tracking-widest text-xs mb-1">GoPoints Balance</p>
                                            <p className="text-4xl font-black text-white">1,250 <span className="text-xl">Pts</span></p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-10 relative z-10">
                                        <div className="flex justify-between text-sm font-bold text-amber-50 mb-3">
                                            <span>Gold Tier</span>
                                            <span>Platinum (32 Rides Left)</span>
                                        </div>
                                        <div className="h-4 bg-amber-700/30 rounded-full overflow-hidden border border-white/10 p-[2px]">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: '68%' }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                className="h-full bg-white rounded-full relative"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/50 animate-pulse"></div>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                                
                                <h3 className="text-xl font-bold text-slate-900 mb-6">Redeem Privileges</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex gap-4 opacity-50 grayscale">
                                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Gift className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg">₱50 OFF Ride</p>
                                            <p className="text-slate-500 font-medium text-sm mt-1 mb-3">Redeemable on next booking</p>
                                            <button className="text-sm font-bold text-white bg-slate-300 px-4 py-2 rounded-lg cursor-not-allowed">500 Pts (Redeemed)</button>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-400 transition-colors shadow-sm flex gap-4 cursor-pointer group">
                                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                                            <Star className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg">Premium Upgrade</p>
                                            <p className="text-slate-500 font-medium text-sm mt-1 mb-3">Get matched with a premium van</p>
                                            <button className="text-sm font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors px-4 py-2 rounded-lg">800 Pts</button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                        
                        {activeTab === 'locations' && (
                            <section>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Saved Coordinates</h2>
                                
                                <div className="space-y-4">
                                    <LocationCard icon={<Home />} label="Home" address="123 Serenity Lane, Quezon City" />
                                    <LocationCard icon={<Briefcase />} label="Work" address="BGC High Street, Taguig City" />
                                    <LocationCard icon={<GraduationCap />} label="School" address="Add address" empty />
                                </div>

                                <button className="w-full mt-6 py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
                                    <Plus className="w-5 h-5" /> Add New Location
                                </button>
                            </section>
                        )}

                        {activeTab === 'safety' && (
                            <section>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Safety & Trust Center</h2>
                                
                                <div className="bg-white rounded-[24px] border border-slate-200 shadow-xs overflow-hidden mb-6">
                                    <div className="p-6 md:p-8 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">Auto-Share Ride Details</h3>
                                            <p className="text-slate-500 font-medium text-sm mt-1 max-w-sm">Automatically send a live tracking link to your emergency contacts when a ride begins.</p>
                                        </div>
                                        <button 
                                            onClick={() => setAutoShare(!autoShare)}
                                            className={`relative w-14 h-8 rounded-full transition-colors ${autoShare ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        >
                                            <motion.div 
                                                className="w-6 h-6 bg-white rounded-full mx-1 shadow-sm"
                                                animate={{ x: autoShare ? 24 : 0 }}
                                            />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-4">Emergency Contacts</h3>
                                <div className="space-y-4 mb-6">
                                    <div className="bg-white rounded-[20px] border border-rose-100 p-5 flex items-center justify-between shadow-xs">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">React Emergency Services</h4>
                                                <p className="text-rose-500 font-medium text-sm">911</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[20px] border border-slate-200 p-5 flex items-center justify-between shadow-xs">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-lg">
                                                M
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Mom</h4>
                                                <p className="text-slate-500 font-medium text-sm">+63 999 123 4567</p>
                                            </div>
                                        </div>
                                        <button className="text-slate-400 hover:text-slate-700 font-medium text-sm px-3 py-1.5 border border-slate-200 rounded-lg">Remove</button>
                                    </div>
                                </div>

                                <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-2">
                                    <Plus className="w-5 h-5" /> Add Emergency Contact
                                </button>
                            </section>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
                active 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            {icon} {label}
        </button>
    );
}

function InfoRow({ label, value, editable }: { label: string, value: string, editable?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-lg font-bold text-slate-900">{value}</p>
            </div>
            {editable && (
                <button className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                    Edit
                </button>
            )}
        </div>
    );
}

function PaymentCard({ name, type, icon, color, action }: { name: string, type: string, icon: React.ReactNode, color: string, action?: string }) {
    return (
        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-slate-900">{name}</h4>
                    <p className="text-slate-500 text-sm font-medium">{type}</p>
                </div>
            </div>
            {action && (
                <button className="text-blue-600 font-bold text-sm hover:underline">
                    {action}
                </button>
            )}
        </div>
    );
}

function LocationCard({ icon, label, address, empty }: { icon: React.ReactNode, label: string, address: string, empty?: boolean }) {
    return (
        <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${empty ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-bold text-slate-900">{label}</h4>
                    <p className={`text-sm font-medium ${empty ? 'text-slate-400' : 'text-slate-500'}`}>{address}</p>
                </div>
            </div>
            {!empty && (
                <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    Edit
                </button>
            )}
        </div>
    );
}
