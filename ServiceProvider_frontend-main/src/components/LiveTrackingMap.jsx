import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { HiLocationMarker, HiMap } from 'react-icons/hi';

const SOCKET_URL = (
  import.meta.env.VITE_API_URL || 'https://household-service-provider.onrender.com/api'
).replace(/\/api\/?$/, '');

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const providerIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:9999px;background:#2563EB;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const customerIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:9999px;background:#10B981;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const FitBounds = ({ cLat, cLng, pLat, pLng }) => {
  const map = useMap();
  useEffect(() => {
    const pts = [];
    if (cLat != null && cLng != null) pts.push([cLat, cLng]);
    if (pLat != null && pLng != null) pts.push([pLat, pLng]);

    if (pts.length === 2) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    } else if (pts.length === 1) {
      map.setView(pts[0], 15);
    }
  }, [cLat, cLng, pLat, pLng, map]);
  return null;
};

export default function LiveTrackingMap({
  bookingId,
  mode = 'customer',
  initialLat = 26.7606,
  initialLng = 83.3732,
}) {
  const [providerLoc, setProviderLoc] = useState(null);
  const [customerLoc, setCustomerLoc] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [trackingStopped, setTrackingStopped] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const watchRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCustomerLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode !== 'customer' || !bookingId) return;
    const socket = io(SOCKET_URL, { withCredentials: true });

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
    });

    socket.on('disconnect', () => setIsConnected(false));

    return () => socket.disconnect();
  }, [bookingId, mode]);

  const mapCenter = customerLoc
    ? [customerLoc.lat, customerLoc.lng]
    : providerLoc
    ? [providerLoc.lat, providerLoc.lng]
    : [initialLat, initialLng];

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
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            {mode === 'customer' ? (
              <>
                <HiMap className="w-4 h-4 text-primary" />
                <span>Provider Tracking</span>
              </>
            ) : (
              <>
                <HiLocationMarker className="w-4 h-4 text-primary" />
                <span>Your Live Location</span>
              </>
            )}
          </span>
          {mode === 'customer' &&
            (isConnected ? (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                Connecting...
              </span>
            ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {distanceStr && (
            <span className="font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">
              {distanceStr}
            </span>
          )}
          {lastUpdated && <span>Updated: {lastUpdated}</span>}
        </div>
      </div>

      {trackingStopped && (
        <div className="p-3 text-center bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
          Provider has stopped sharing their location. Map will update when they resume.
        </div>
      )}

      <div className="flex items-center gap-4 px-1 text-xs text-text-secondary">
        {mode === 'provider' ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            Your live position (being shared)
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Your location
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              Provider location
            </span>
            {providerLoc && customerLoc && (
              <span className="text-primary font-medium">&mdash; Route between you</span>
            )}
          </>
        )}
      </div>

      <div
        className="h-72 w-full rounded-2xl overflow-hidden border border-border/50 shadow-sm"
        style={{ zIndex: 0, position: 'relative' }}
      >
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

          {mode === 'provider' && customerLoc && (
            <Marker position={[customerLoc.lat, customerLoc.lng]} icon={providerIcon}>
              <Popup>Your current location &mdash; being shared with the customer</Popup>
            </Marker>
          )}

          {mode === 'customer' && customerLoc && (
            <Marker position={[customerLoc.lat, customerLoc.lng]} icon={customerIcon}>
              <Popup>Your location</Popup>
            </Marker>
          )}

          {mode === 'customer' && providerLoc && (
            <Marker position={[providerLoc.lat, providerLoc.lng]} icon={providerIcon}>
              <Popup>Service Provider &mdash; en route</Popup>
            </Marker>
          )}

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

          <FitBounds
            cLat={customerLoc?.lat}
            cLng={customerLoc?.lng}
            pLat={providerLoc?.lat}
            pLng={providerLoc?.lng}
          />
        </MapContainer>

        {mode === 'customer' && gpsLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 pointer-events-none">
            <p className="text-xs text-text-secondary mt-1">Acquiring your location...</p>
          </div>
        )}
      </div>
    </div>
  );
}