import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GEO_DATA, GeoLocation } from '../utils/geoData';

interface LocationAutocompleteProps {
  type: 'pickup' | 'dropoff';
  value: string;
  onChange: (value: string, location?: GeoLocation) => void;
  placeholder: string;
}

export default function LocationAutocomplete({ type, value, onChange, placeholder }: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<GeoLocation[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`farego_search_history`);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const saveToHistory = (loc: GeoLocation) => {
    const newHistory = [loc, ...history.filter(h => h.name !== loc.name)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem(`farego_search_history`, JSON.stringify(newHistory));
  };

  const filteredLocations = GEO_DATA.filter(loc => 
    loc.name.toLowerCase().includes(value.toLowerCase()) || 
    loc.category.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showHistory = isOpen && value.length < 2 && history.length > 0;
  const showResults = isOpen && value.length >= 2 && filteredLocations.length > 0;

  return (
    <div className="relative rounded-2xl p-[2px] transition-all duration-300 focus-within:bg-gradient-to-r focus-within:from-blue-500 focus-within:to-indigo-500 bg-slate-200" ref={wrapperRef}>
      <div className="absolute top-[1.15rem] left-[1.15rem] z-10">
        {type === 'pickup' ? (
           <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
        ) : (
           <span className="block w-2.5 h-2.5 rounded-sm bg-slate-900 shadow-[0_0_8px_rgba(15,23,42,0.3)]"></span>
        )}
      </div>
      <input 
        type="text" 
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value.length >= 2 || e.target.value.length === 0) {
              setIsOpen(true);
          }
        }}
        onFocus={() => {
            setIsOpen(true);
        }}
        placeholder={placeholder} 
        className="w-full pl-11 pr-4 py-4 bg-white rounded-[14px] focus:outline-hidden text-sm font-medium transition-all" 
      />

      <AnimatePresence>
        {(showHistory || showResults) && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
          >
            <ul className="max-h-72 overflow-auto divide-y divide-slate-100">
              {showHistory && !showResults && history.map((loc, index) => (
                <li 
                  key={`hist-${index}`}
                  className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    onChange(loc.name, loc);
                    saveToHistory(loc);
                    setIsOpen(false);
                  }}
                >
                  <Clock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{loc.name}</span>
                      <span className="text-xs font-medium text-slate-500">Recent Search</span>
                  </div>
                </li>
              ))}
              {showResults && filteredLocations.map((loc, index) => (
                <li 
                  key={`res-${index}`}
                  className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    onChange(loc.name, loc);
                    saveToHistory(loc);
                    setIsOpen(false);
                  }}
                >
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{loc.name}</span>
                      <span className="text-xs font-medium text-slate-500">{loc.category}</span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
