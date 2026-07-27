import React, { useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, CreditCard, ShieldCheck, Settings, 
  ChevronLeft, Upload, Car, Star, Link as LinkIcon, 
  MapPin, AlertOctagon, CheckCircle2, Clock, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DriverAccount() {
    const { user, token, updateUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSection user={user} token={token} updateUser={updateUser} />;
            case 'subscriptions':
                return <SubscriptionsSection user={user} />;
            case 'settings':
                return <SettingsSection />;
            case 'trust':
                return <TrustCenterSection />;
            default:
                return <ProfileSection user={user} token={token} updateUser={updateUser} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/driver')}
                            className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-full transition-colors text-slate-700"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-extrabold tracking-tight font-display text-slate-900">Account Management</h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-72 shrink-0">
                    <nav className="space-y-1">
                        {[
                            { id: 'profile', label: 'Driver Profile', icon: User },
                            { id: 'subscriptions', label: 'Wallet & Earnings', icon: CreditCard },
                            { id: 'settings', label: 'Account Settings', icon: Settings },
                            { id: 'trust', label: 'Trust Center', icon: ShieldCheck },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left font-bold transition-all ${
                                        isActive 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

// Sub-components for Sections
function ProfileSection({ user, token, updateUser }: { user: any, token: string | null, updateUser: any }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

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
                          body: JSON.stringify({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, profilePicture: base64String })
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
        <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="relative pt-12 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-16 h-16 text-slate-400" />
                            )}
                            {isSaving && (
                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all">
                                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                                 </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full border-2 border-white shadow-md hover:bg-blue-700 transition-colors pointer-events-auto z-10">
                            <Upload className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user?.firstName} {user?.lastName}</h2>
                                <p className="text-slate-500 font-medium">{user?.email}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-2xl border border-yellow-200">
                                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                <div>
                                    <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Trust Score</p>
                                    <p className="text-xl font-black text-yellow-800 tracking-tight">4.92</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                                <div className="flex items-center gap-2 justify-between">
                                    <p className="text-slate-900 font-semibold">+63 912 345 6789</p>
                                    <button className="text-blue-600 text-sm font-bold hover:underline">Edit</button>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Joined</p>
                                <p className="text-slate-900 font-semibold">October 2025</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                        <Car className="w-6 h-6 text-blue-600" />
                        Vehicle Details
                    </h3>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Make & Model</p>
                        <p className="text-slate-900 font-semibold text-lg">Toyota Vios XLE</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Color</p>
                        <p className="text-slate-900 font-semibold text-lg">Alumina Jade</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plate Number</p>
                        <p className="font-mono text-slate-900 font-bold text-lg bg-slate-100 px-3 py-1 rounded-xl inline-block border border-slate-200">NDX 1234</p>
                    </div>
                </div>
                
                <button className="text-blue-600 font-bold hover:underline w-full text-left flex items-center gap-2">
                    <Car className="w-4 h-4" /> Request vehicle update verification
                </button>
            </div>
        </div>
    );
}

function SubscriptionsSection({ user }: { user: any }) {
    const driverRating = user?.rating || 4.92;
    const isFuelAdvanceUnlocked = driverRating > 4.8;
    
    return (
        <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative">
                    <h3 className="text-slate-300 font-bold uppercase tracking-widest text-sm mb-2">Available Balance</h3>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
                        <div className="flex items-end gap-4">
                            <p className="text-6xl font-black tracking-tighter">₱2,450</p>
                            <p className="text-emerald-400 font-bold pb-2">Today's Earnings</p>
                        </div>
                        <button className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-6 py-4 rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all w-full sm:w-auto flex items-center justify-center gap-2">
                            Cashout to GCash/Maya
                        </button>
                    </div>
                </div>
            </div>

            <div className={`rounded-[2rem] p-8 border ${isFuelAdvanceUnlocked ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200' : 'bg-slate-50 border-slate-200'} shadow-xs relative overflow-hidden`}>
                {!isFuelAdvanceUnlocked && (
                    <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[2rem]">
                        <div className="bg-white px-6 py-4 rounded-2xl shadow-lg shadow-slate-200/50 flex items-center gap-4 text-slate-700 font-bold max-w-sm text-center">
                            <AlertOctagon className="w-8 h-8 text-slate-400 shrink-0" />
                            <p>Unlock Fuel Advances by maintaining a rating above 4.8.</p>
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        Fuel Advance <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold ml-2">Beta</span>
                    </h3>
                </div>
                <p className="text-slate-600 font-medium mb-6">Need fuel before your next payout? Request an advance and it will be automatically deducted from your next 5 trips.</p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <p className="font-bold text-slate-900 text-2xl">₱500.00</p>
                        <p className="text-slate-500 text-sm font-medium">Eligible Amount</p>
                    </div>
                    <button 
                        disabled={!isFuelAdvanceUnlocked}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all ${isFuelAdvanceUnlocked ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-200 text-slate-400'}`}
                    >
                        Request Advance
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xs">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Payment Methods</h3>
                    <button className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                        + Add New
                    </button>
                </div>
                
                <div className="space-y-4">
                    {/* GCash */}
                    <div className="flex justify-between items-center p-5 border border-slate-200 rounded-2xl bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-inner text-white font-black italic text-sm">
                                G
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-lg">GCash Linked</p>
                                <p className="text-slate-500 text-sm font-medium">0912 **** 789</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-rose-500 transition-colors p-2">
                             Unlink
                        </button>
                    </div>
                    
                    {/* Maya (Unlinked) */}
                    <div className="flex justify-between items-center p-5 border border-dashed border-slate-300 rounded-2xl bg-white hover:border-slate-400 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-emerald-600 font-black italic text-xs border border-slate-200 group-hover:bg-emerald-50 transition-colors">
                                maya
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-lg">Link Maya Account</p>
                                <p className="text-slate-500 text-sm font-medium">Connect for seamless payouts</p>
                            </div>
                        </div>
                        <LinkIcon className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>

                    {/* Credit Card (Unlinked) */}
                    <div className="flex justify-between items-center p-5 border border-dashed border-slate-300 rounded-2xl bg-white hover:border-slate-400 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200 group-hover:bg-blue-50 transition-colors">
                                <CreditCard className="w-6 h-6 group-hover:text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-lg">Link Credit/Debit Card</p>
                                <p className="text-slate-500 text-sm font-medium">For subscription billing</p>
                            </div>
                        </div>
                        <LinkIcon className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsSection() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xs">
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Verification Status</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Driver's License</p>
                                <p className="text-slate-500 text-sm">Verified on Oct 2025</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">NBI Clearance</p>
                                <p className="text-amber-700 text-sm">Pending Review (Est. 2 days)</p>
                            </div>
                        </div>
                        <button className="text-amber-700 font-bold bg-amber-100/50 hover:bg-amber-200 outline outline-1 outline-amber-200 px-4 py-2 rounded-xl transition-colors">
                            View Status
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xs">
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Security</h3>
                <div className="space-y-6">
                    <div>
                        <p className="font-bold text-slate-900 mb-1">Password</p>
                        <p className="text-slate-500 text-sm mb-3">Last changed 3 months ago</p>
                        <button className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                            Change Password
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xs">
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Preferences</h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-900">Push Notifications</p>
                            <p className="text-slate-500 text-sm">Receive alerts for new bids and messages</p>
                        </div>
                        <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-900">Email Updates</p>
                            <p className="text-slate-500 text-sm">Weekly earnings reports and news</p>
                        </div>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-xs"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrustCenterSection() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-rose-200 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-[80px] opacity-60 -translate-y-1/2 translate-x-1/3"></div>
                <div className="relative">
                     <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-8 h-8 text-rose-500" />
                        Safety Features
                    </h3>
                    <p className="text-slate-500 mb-8 max-w-lg">Configure your safety settings to ensure peace of mind during every trip on FareGo.</p>
                    
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0 mt-1 sm:mt-0">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-lg">Auto-Share Live Location</p>
                                    <p className="text-slate-500 text-sm mt-1 max-w-md">Automatically share your live trip tracking with trusted contacts when a ride starts.</p>
                                </div>
                            </div>
                            <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer shrink-0">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <AlertOctagon className="w-5 h-5 text-rose-500" />
                                    <p className="font-bold text-slate-900 text-lg">Emergency Contacts</p>
                                </div>
                                <button className="text-blue-600 font-bold hover:underline text-sm">+ Add Contact</button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                <div className="flex justify-between items-center p-5">
                                    <div>
                                        <p className="font-bold text-slate-900">Anna Cruz (Wife)</p>
                                        <p className="text-slate-500 text-sm font-medium">+63 945 678 1234</p>
                                    </div>
                                    <button className="text-slate-400 hover:text-rose-500">Remove</button>
                                </div>
                                <div className="p-5 bg-white text-center">
                                    <p className="text-slate-400 text-sm">You can add up to 4 more emergency contacts.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
