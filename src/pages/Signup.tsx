import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Activity } from 'lucide-react';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const initRole = searchParams.get('role') || 'passenger';
  
  const [role, setRole] = useState<'passenger' | 'driver'>(initRole as any);
  const [formData, setFormData] = useState({
      firstName: '', lastName: '', email: '', phone: '', password: '', gender: 'prefer_not_to_say'
  });
  const [vehicle, setVehicle] = useState({ make: '', model: '', plateNumber: '', vehicleTier: 'standard', vehicleType: 'CAR', isEcoFriendly: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = { ...formData, role, vehicleDetails: role === 'driver' ? vehicle : undefined };
      const u = await signup(payload);
      navigate(u.role === 'passenger' ? '/home' : `/${u.role}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleVehicle = (e: any) => setVehicle({ ...vehicle, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const getBrandSuggestions = () => {
      switch(vehicle.vehicleType) {
          case 'MC_TAXI': return ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Kymco', 'Vespa'];
          case 'VAN': return ['Toyota', 'Hyundai', 'Nissan', 'Ford', 'Foton', 'Isuzu'];
          case 'CAR':
          default: return ['Toyota', 'Honda', 'Mitsubishi', 'Nissan', 'Ford', 'Suzuki', 'Hyundai', 'Kia', 'Chevrolet'];
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center">
          <Link to="/">
             <Activity className="w-12 h-12 text-blue-600" />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Join FareGo
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Create your account to get started
          </p>
        </div>
        
        <div className="flex border-b border-slate-200">
            <button 
                className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${role === 'passenger' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setRole('passenger')}
            >
                Rider
            </button>
            <button 
                className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${role === 'driver' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setRole('driver')}
            >
                Driver
            </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input type="text" name="firstName" required onChange={handleInput} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input type="text" name="lastName" required onChange={handleInput} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" required onChange={handleInput} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="tel" name="phone" required onChange={handleInput} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select name="gender" onChange={handleInput} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs bg-white">
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" name="password" required minLength={8} onChange={handleInput} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs" />
            </div>
          </div>

          {role === 'driver' && (
              <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h3 className="font-semibold text-slate-900">Vehicle Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
                        <input type="text" name="make" list="brand-suggestions" required onChange={handleVehicle} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs" placeholder="e.g. Toyota" />
                        <datalist id="brand-suggestions">
                            {getBrandSuggestions().map(brand => <option key={brand} value={brand} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                        <input type="text" name="model" required onChange={handleVehicle} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs" placeholder="e.g. Vios" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plate Number</label>
                        <input type="text" name="plateNumber" required onChange={handleVehicle} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tier</label>
                        <select name="vehicleTier" onChange={handleVehicle} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs bg-white">
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="suv">SUV</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select name="vehicleType" onChange={handleVehicle} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-blue-500 focus:border-blue-500 shadow-xs bg-white text-sm">
                            <option value="CAR">Car</option>
                            <option value="MC_TAXI">MC Taxi (Motorcycle)</option>
                            <option value="VAN">Van</option>
                        </select>
                    </div>
                    <div className="col-span-2 flex items-center mt-2">
                        <input type="checkbox" name="isEcoFriendly" id="eco" onChange={handleVehicle} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                        <label htmlFor="eco" className="ml-2 block text-sm text-slate-700">This is an Eco-Friendly / EV vehicle</label>
                    </div>
                  </div>
              </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-md disabled:opacity-70"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
          
          <div className="text-center text-sm text-slate-600">
             Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
