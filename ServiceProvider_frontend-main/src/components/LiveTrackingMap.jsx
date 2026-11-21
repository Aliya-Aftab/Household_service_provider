import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

// Fix broken leaflet default icons in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const providerIcon = L.divIcon({
  className: '',
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🚗</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
const customerIcon = L.divIcon({
  className: '',
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">🏠</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Auto-fit map bounds to show both pins
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions, map]);
  return null;
};

export default function LiveTrackingMap({ bookingId, mode = 'customer', initialLat = 26.8467, initialLng = 80.9462 }) {
  // mode: 'customer' = watch for provider location
  //       'provider' = show own GPS location
  // initialLat/initialLng: fallback map center before GPS is acquired
  const [providerLoc, setProviderLoc] = useState(null);
  const [customerLoc, setCustomerLoc] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [trackingStopped, setTrackingStopped] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);
  const watchRef = useRef(null);

  // Always get the customer's own location
  useEffect(() => {
    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCustomerLoc(loc);
          setGpsReady(true);
        },
        () => { setGpsReady(false); }, // silent fail but mark GPS as unavailable
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  // Socket: Customer mode listens for provider's location
  useEffect(() => {
    if (mode !== 'customer') return;
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-booking', bookingId);
    });

    socket.on('location-updated', (data) => {
      setProviderLoc({ lat: data.lat, lng: data.lng });
      setLastUpdated(new Date(data.timestamp).toLocaleTimeString());
      setTrackingStopped(false);
    });

    socket.on('tracking-stopped', () => {
      setTrackingStopped(true);
      setIsConnected(false);
    });

    socket.on('disconnect', () => setIsConnected(false));

    return () => socket.disconnect();
  }, [bookingId, mode]);

  // Build positions list for map bounds
  const positions = [
    ...(customerLoc ? [[customerLoc.lat, customerLoc.lng]] : []),
    ...(providerLoc ? [[providerLoc.lat, providerLoc.lng]] : []),
  ];

  // Map center: use actual GPS if available, else fallback
  const mapCenter = customerLoc
    ? [customerLoc.lat, customerLoc.lng]
    : providerLoc
    ? [providerLoc.lat, providerLoc.lng]
    : [initialLat, initialLng];

  // Calculate distance between two points
  const getDistanceStr = () => {
    if (!customerLoc || !providerLoc) return null;
    const R = 6371;
    const dLat = ((providerLoc.lat - customerLoc.lat) * Math.PI) / 180;
    const dLng = ((providerLoc.lng - customerLoc.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((customerLoc.lat * Math.PI) / 180) *
        Math.cos((providerLoc.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return dist < 1 ? `${Math.round(dist * 1000)} m away` : `${dist.toFixed(1)} km away`;
  };

  const distanceStr = getDistanceStr();

  return (
    <div className="flex flex-col gap-3">
      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            {mode === 'customer' ? '🗺️ Provider Tracking' : '📍 Your Live Location'}
          </span>
          {mode === 'customer' && (
            isConnected ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                Waiting...
              </span>
            )
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {distanceStr && (
            <span className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">📏 {distanceStr}</span>
          )}
          {lastUpdated && <span>Updated: {lastUpdated}</span>}
        </div>
      </div>

      {/* Tracking Stopped Banner */}
      {trackingStopped && (
        <div className="p-3 text-center bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
          📍 Provider has stopped sharing their location. Map will update when they resume.
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 text-xs text-text-secondary">
        {mode === 'provider' ? (
          <span>🚗 Your live position (being shared)</span>
        ) : (
          <>
            <span>🏠 Your location</span>
            <span>🚗 Provider location</span>
            {providerLoc && customerLoc && <span className="text-primary font-medium">── Route between you</span>}
          </>
        )}
      </div>

      {/* Map — always renders, uses fallback center before GPS is ready */}
      <div className="h-72 w-full rounded-2xl overflow-hidden border border-border/50 shadow-sm" style={{ zIndex: 0, position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* In provider mode: show own GPS with vehicle icon */}
          {mode === 'provider' && customerLoc && (
            <Marker position={[customerLoc.lat, customerLoc.lng]} icon={providerIcon}>
              <Popup>🚗 Your current location — being shared with the customer</Popup>
            </Marker>
          )}

          {/* In customer mode: show customer's home pin */}
          {mode === 'customer' && customerLoc && (
            <Marker position={[customerLoc.lat, customerLoc.lng]} icon={customerIcon}>
              <Popup>🏠 Your location</Popup>
            </Marker>
          )}

          {/* Provider pin (only on customer view) */}
          {mode === 'customer' && providerLoc && (
            <Marker position={[providerLoc.lat, providerLoc.lng]} icon={providerIcon}>
              <Popup>🚗 Service Provider — en route to you!</Popup>
            </Marker>
          )}

          {/* Connecting line */}
          {customerLoc && providerLoc && mode === 'customer' && (
            <Polyline
              positions={[
                [customerLoc.lat, customerLoc.lng],
                [providerLoc.lat, providerLoc.lng],
              ]}
              color="#3B82F6"
              weight={3}
              dashArray="8,8"
              opacity={0.7}
            />
          )}

          {positions.length > 0 && <FitBounds positions={positions} />}
        </MapContainer>

        {/* GPS overlay — shown until we get a fix */}
        {mode === 'customer' && !gpsReady && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 pointer-events-none">
            <span className="text-2xl animate-pulse">📡</span>
            <p className="text-xs text-text-secondary mt-1">Acquiring your location...</p>
          </div>
        )}
      </div>
    </div>
  );
}
