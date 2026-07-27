import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-blue-600 p-2.5 rounded-[1.1rem] group-hover:scale-105 transition-transform duration-300 shadow-md shadow-blue-500/20">
               <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">FareGo</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/login" className="text-base font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Log In
            </Link>
            <Link to="/signup" className="text-base font-bold bg-slate-900 text-white px-8 py-3.5 rounded-full shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 pt-24">
        {children}
      </main>
      <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 p-2 rounded-xl">
                 <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white font-display">FareGo</span>
            </Link>
            <p className="text-base max-w-sm leading-relaxed text-slate-400 font-medium">
              Your Ride. Your Price. Your Choice. Creating a fair and transparent negotiation-driven mobility marketplace for everyone.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 font-display tracking-tight text-lg">Company</h4>
            <ul className="space-y-4 text-base font-medium">
              <li><Link to="#" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition-colors">Careers</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition-colors">Press</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 font-display tracking-tight text-lg">Legal</h4>
            <ul className="space-y-4 text-base font-medium">
              <li><Link to="#" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-blue-400 transition-colors">Driver Agreement</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-20 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm font-medium text-slate-500">
                 &copy; {new Date().getFullYear()} FareGo Technologies. All rights reserved.
            </div>
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:border-slate-700 cursor-pointer transition-all"></div>
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:border-slate-700 cursor-pointer transition-all"></div>
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:border-slate-700 cursor-pointer transition-all"></div>
            </div>
        </div>
      </footer>
    </div>
  );
}
