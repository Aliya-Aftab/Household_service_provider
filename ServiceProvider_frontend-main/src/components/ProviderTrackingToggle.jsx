import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { HiLocationMarker } from 'react-icons/hi';
import LiveTrackingMap from './LiveTrackingMap';

const SOCKET_URL = 'http://localhost:5000';

export default function ProviderTrackingToggle({ bookingId }) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-booking', bookingId);
    });

    return () => {
      socket.disconnect();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [bookingId]);

  const toggleTracking = () => {
    if (isSharing) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Notify customers that tracking has ended
      if (socketRef.current) {
        socketRef.current.emit('provider-stopped-tracking', { bookingId });
      }
      setIsSharing(false);
    } else {
      // Start tracking
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        return;
      }

      setError('');
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (socketRef.current) {
            socketRef.current.emit('provider-location-update', {
              bookingId,
              lat: latitude,
              lng: longitude,
            });
          }
        },
        (err) => {
          console.error(err);
          setError('Failed to get location. Please allow location permissions.');
          setIsSharing(false);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );

      watchIdRef.current = id;
      setIsSharing(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle Card */}
      <div className="bg-white rounded-2xl border border-border/50 p-5 card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSharing ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            <HiLocationMarker className={`w-6 h-6 ${isSharing ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary">Live Location Sharing</h3>
            <p className="text-sm text-text-secondary">
              {isSharing
                ? '✅ Your location is being shared with the customer in real-time.'
                : 'Share your live location during this active booking.'}
            </p>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>

        <button
          onClick={toggleTracking}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
            isSharing
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
              : 'bg-primary text-white hover:opacity-90'
          }`}
        >
          {isSharing ? '⏹ Stop Sharing' : '▶ Start Sharing'}
        </button>
      </div>

      {/* Provider's own location preview map */}
      {isSharing && (
        <div className="bg-white rounded-2xl border border-border/50 p-5 card-shadow">
          <h3 className="font-bold text-text-primary mb-1">📍 Your Current Location</h3>
          <p className="text-xs text-text-muted mb-3">This is what the customer sees as your live position.</p>
          {/* Provider uses 'provider' mode — only shows their own GPS, no incoming socket */}
          <LiveTrackingMap bookingId={bookingId} mode="provider" />
        </div>
      )}
    </div>
  );
}
