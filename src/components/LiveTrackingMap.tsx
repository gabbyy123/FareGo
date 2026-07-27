import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AnimatePresence, motion } from 'motion/react';
import { Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues with Webpack/Vite
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CarIcon = L.divIcon({
  html: '<div style="background-color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); font-size: 20px; border: 2px solid #0f172a;">🚗</div>',
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface Point {
  lat: number;
  lng: number;
}

interface LiveTrackingMapProps {
  rideStatus: 'idle' | 'negotiating' | 'in_progress' | 'active_trip';
  pickup: Point | null;
  dropoff: Point | null;
  onMapClick?: (lat: number, lng: number) => void;
  bids?: any[];
}

const MapEvents = ({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export default function LiveTrackingMap({ rideStatus, pickup, dropoff, onMapClick, bids = [] }: LiveTrackingMapProps) {
  const [driverPos, setDriverPos] = useState<{lat: number, lng: number} | null>(null);
  const [eta, setEta] = useState(0);

  // Default to Manila center
  const center: [number, number] = [14.5995, 120.9842];

  // Component to update map view dynamically
  const MapUpdater = ({ pickup, dropoff }: { pickup: Point | null, dropoff: Point | null }) => {
    const map = useMap();
    useEffect(() => {
      if (pickup && dropoff) {
        const bounds = L.latLngBounds([pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (pickup) {
        map.flyTo([pickup.lat, pickup.lng], 15);
      } else if (dropoff) {
        map.flyTo([dropoff.lat, dropoff.lng], 15);
      }
    }, [map, pickup, dropoff]);
    return null;
  };

  useEffect(() => {
    let isUnmounted = false;
    let reqId: number;

    const startAnimate = async () => {
      if (rideStatus === 'in_progress' && pickup) {
        const startLat = pickup.lat - 0.015;
        const startLng = pickup.lng + 0.015;
        
        try {
          // You MUST import getRouteData at the top
          // Fetch route from our utility
          const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${pickup.lng},${pickup.lat}?overview=full&geometries=geojson`);
          const data = await response.json();
          let coords: {lat: number, lng: number}[] = [];
          if (data.routes && data.routes.length > 0) {
              coords = data.routes[0].geometry.coordinates.map((c: number[]) => ({
                lat: c[1], lng: c[0]
              }));
          } else {
              // fallback
              coords = [{lat: startLat, lng: startLng}, pickup];
          }

          if (isUnmounted) return;

          const totalTime = 10000;
          const startTime = performance.now();

          const animateDriver = (time: number) => {
            if (isUnmounted) return;
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / totalTime, 1);
            
            const totalSegments = coords.length - 1;
            const exactSegment = progress * totalSegments;
            const segmentIdx = Math.floor(exactSegment);
            
            if (segmentIdx >= totalSegments) {
                setDriverPos(coords[coords.length - 1]);
                setEta(0);
                return;
            }
            
            const segProgress = exactSegment - segmentIdx;
            const p1 = coords[segmentIdx];
            const p2 = coords[segmentIdx + 1];
            
            const lat = p1.lat + (p2.lat - p1.lat) * segProgress;
            const lng = p1.lng + (p2.lng - p1.lng) * segProgress;
            
            setDriverPos({ lat, lng });
            setEta(Math.ceil((1 - progress) * 5));
            
            reqId = requestAnimationFrame(animateDriver);
          }
          reqId = requestAnimationFrame(animateDriver);
        } catch (e) {
            console.error("OSRM Route Error", e);
        }
      } else {
        setDriverPos(null);
      }
    };
    startAnimate();

    return () => {
        isUnmounted = true;
        if (reqId) cancelAnimationFrame(reqId);
    };
  }, [rideStatus, pickup]);

  return (
    <div className="relative w-full h-full bg-slate-100 z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onMapClick={rideStatus === 'idle' ? onMapClick : undefined} />
        <MapUpdater pickup={pickup} dropoff={dropoff} />
        
        {pickup && (
           <Marker position={[pickup.lat, pickup.lng]}>
             <Popup>Pickup Location</Popup>
           </Marker>
        )}
        
        {dropoff && (
           <Marker position={[dropoff.lat, dropoff.lng]}>
             <Popup>Dropoff Location</Popup>
           </Marker>
        )}

        {rideStatus === 'negotiating' && bids.map((bid, i) => (
           <Marker key={bid.id} position={[bid.lat || pickup?.lat || 14.5995, bid.lng || pickup?.lng || 120.9842]} icon={CarIcon}>
               <Popup>
                   <div className="text-center font-sans tracking-tight">
                       <p className="font-bold text-slate-900">{bid.driverName}</p>
                       <p className="text-sm font-medium text-slate-500">★ {bid.rating} • {bid.distance}</p>
                   </div>
               </Popup>
           </Marker>
        ))}

        {pickup && dropoff && (rideStatus === 'negotiating' || rideStatus === 'in_progress') && (
           <Polyline 
              positions={[
                [pickup.lat, pickup.lng],
                [dropoff.lat, dropoff.lng]
              ]} 
              color="#3b82f6" 
              weight={4}
              dashArray="8 8"
           />
        )}
        
        {driverPos && rideStatus === 'in_progress' && (
           <Marker 
              position={[driverPos.lat, driverPos.lng]}
              icon={CarIcon}
           >
             <Popup>Driver Arriving!</Popup>
           </Marker>
        )}
      </MapContainer>

      {/* Floating Status Overlay */}
      <AnimatePresence>
         {rideStatus !== 'idle' && (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl border border-slate-200 flex items-center gap-4 z-[1000] min-w-[300px]"
            >
               {rideStatus === 'negotiating' ? (
                  <>
                     <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center animate-pulse">
                        <Search className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">Broadcasting Request...</p>
                        <p className="text-xs font-medium text-slate-500">Waiting for driver bids</p>
                     </div>
                  </>
               ) : (
                  <>
                     <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-xl font-extrabold">{eta}</span>
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">Driver is arriving</p>
                        <p className="text-xs font-medium text-slate-500">Juan D. • Toyota Vios</p>
                     </div>
                  </>
               )}
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
