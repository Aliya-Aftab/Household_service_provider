import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API, { transformBooking } from '../utils/api';
import ProviderTrackingToggle from '../components/ProviderTrackingToggle';
import {
  HiBell,
  HiCalendar,
  HiClock,
  HiStar,
  HiCheckCircle,
  HiCurrencyRupee,
  HiTrendingUp,
  HiLocationMarker,
  HiUser,
} from 'react-icons/hi';

const statusColor = {
  confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default function ProviderDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [justConfirmedId, setJustConfirmedId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) return;

        let user = null;
        try {
          user = JSON.parse(stored);
        } catch {
          return;
        }
        if (!user?._id) return;
        setCurrentUser(user);

        const [bookRes, provRes, notifRes] = await Promise.all([
          API.get(`/bookings/provider/${user._id}`).catch(() => ({ data: [] })),
          API.get(`/providers/user/${user._id}`).catch(() => ({ data: null })),
          API.get('/notifications').catch(() => ({ data: [] })),
        ]);

        setBookings((bookRes.data || []).map(transformBooking));
        if (provRes.data) setProviderProfile(provRes.data);
        setLiveNotifications(notifRes.data || []);
      } catch (e) {
        console.error('Error loading provider dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    setNotice(null);
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      if (newStatus === 'confirmed') {
        setJustConfirmedId(bookingId);
        setTimeout(() => setJustConfirmedId(null), 1500);
      }
      setNotice({ type: 'success', text: `Booking marked as ${newStatus}.` });
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setNotice({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update booking status.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkRead = async (notifId) => {
    try {
      await API.patch(`/notifications/${notifId}/read`);
      setLiveNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setLiveNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const unreadCount = liveNotifications.filter((n) => !n.isRead).length;
  const displayName = currentUser?.name?.trim().split(' ')[0] || 'Provider';
  const activeBookings = bookings.filter((b) =>
    ['confirmed', 'pending'].includes(b.status.toLowerCase())
  );
  const completedBookings = bookings.filter((b) => b.status.toLowerCase() === 'completed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const ratingValue = providerProfile?.avgRating ?? providerProfile?.averageRating ?? 0;
  const ratingCount = providerProfile?.totalRatings ?? providerProfile?.totalReviews ?? 0;

  const stats = [
    { label: 'Total Jobs', value: bookings.length, color: 'text-primary', bg: 'bg-primary/10', icon: HiCalendar },
    { label: 'Completed', value: completedBookings.length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: HiCheckCircle },
    { label: 'Active', value: activeBookings.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: HiTrendingUp },
    { label: 'Earnings', value: `₹${totalEarnings.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50', icon: HiCurrencyRupee },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              Service Provider Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Welcome, {displayName}
          </h1>
          <p className="text-text-secondary mt-1">
            {providerProfile?.servicesOffered?.[0]?.name
              ? `Managing your ${providerProfile.servicesOffered[0].name} services`
              : 'Manage your bookings and share your live location with customers'}
          </p>
        </div>

        {ratingValue > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl self-start">
            <HiStar className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-700 text-lg">{Number(ratingValue).toFixed(1)}</span>
            <span className="text-xs text-amber-600">({ratingCount} reviews)</span>
          </div>
        )}
      </div>

      {notice && (
        <div
          className={`mb-6 p-3.5 rounded-xl text-xs font-medium border ${
            notice.type === 'error'
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-border/50 card-shadow p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <HiLocationMarker className="w-5 h-5 text-primary" />
              <span>Live Location Sharing</span>
            </h2>
            <p className="text-sm text-text-secondary -mt-1">
              Start sharing when heading to a customer so they can track your live position.
            </p>

            {loading ? (
              <p className="text-sm text-text-secondary">Loading active bookings...</p>
            ) : activeBookings.length > 0 ? (
              activeBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-border/50 card-shadow p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{booking.service}</p>
                      <p className="text-sm text-text-secondary">
                        {booking.customerName} &bull; {booking.date} at {booking.time}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                        statusColor[booking.status.toLowerCase()] ||
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <ProviderTrackingToggle bookingId={booking.id} />
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-border/50 card-shadow p-5">
                <p className="text-sm text-text-secondary">
                  No active bookings right now. Live location sharing activates when you have a pending or confirmed job.
                </p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary mb-4">All Bookings</h2>
            {loading ? (
              <p className="text-sm text-text-secondary">Loading...</p>
            ) : bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((booking) => {
                  const status = booking.status.toLowerCase();
                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl card-shadow border border-border/50 p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-text-primary">{booking.service}</p>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${
                                statusColor[status] || 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">
                            Customer: {booking.customerName} &bull; {booking.category}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <HiCalendar className="w-3.5 h-3.5" />
                              {booking.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <HiClock className="w-3.5 h-3.5" />
                              {booking.time}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {status === 'pending' && (
                            <button
                              type="button"
                              disabled={updatingId === booking.id}
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {updatingId === booking.id ? '...' : 'Confirm'}
                            </button>
                          )}
                          {status === 'confirmed' && (
                            <button
                              type="button"
                              disabled={updatingId === booking.id || justConfirmedId === booking.id}
                              onClick={() => handleStatusUpdate(booking.id, 'completed')}
                              className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {updatingId === booking.id
                                ? '...'
                                : justConfirmedId === booking.id
                                ? 'Confirmed'
                                : 'Mark Completed'}
                            </button>
                          )}
                          <div className="text-right ml-2">
                            <p className="text-sm font-bold text-primary">₹{booking.price}</p>
                            <p className="text-xs text-text-muted">{booking.customerName}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl card-shadow p-6 text-center border border-border/50">
                <p className="text-text-secondary text-sm">
                  No bookings yet. Once customers book your services, they appear here.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-2xl card-shadow border border-border/50 p-5">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <HiUser className="w-5 h-5 text-primary" />
              <span>Your Profile</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Name</span>
                <span className="text-sm font-semibold text-text-primary">
                  {currentUser?.name || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Phone</span>
                <span className="text-sm font-semibold text-text-primary">
                  {currentUser?.phone || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Role</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                  Service Provider
                </span>
              </div>
              {providerProfile?.experienceYears !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Experience</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {providerProfile.experienceYears} yrs
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Verified</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    providerProfile?.isVerified
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {providerProfile?.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              {providerProfile?._id && (
                <Link
                  to={`/provider/${providerProfile._id}`}
                  className="mt-2 block w-full text-center text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 py-2 rounded-xl transition-colors"
                >
                  View Public Profile &amp; Reviews
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl card-shadow border border-border/50 p-5">
            <h3 className="font-bold text-text-primary mb-4">Performance</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Jobs', value: bookings.length, color: 'text-primary' },
                {
                  label: 'Completed',
                  value: completedBookings.length,
                  color: 'text-emerald-600',
                },
                {
                  label: 'Cancelled',
                  value: bookings.filter((b) => b.status.toLowerCase() === 'cancelled').length,
                  color: 'text-red-500',
                },
                {
                  label: 'Total Earned',
                  value: `₹${totalEarnings.toLocaleString()}`,
                  color: 'text-amber-600',
                },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{stat.label}</span>
                  <span className={`text-base font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <HiBell className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text-primary">Notifications</h3>
              <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            </div>
            {unreadCount > 0 && (
              <div className="px-5 py-2 bg-gray-50 border-b border-border flex justify-end">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-primary hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>
            )}
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {liveNotifications.length > 0 ? (
                liveNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                    className={`px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notif.isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        !notif.isRead ? 'font-medium text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {notif.message}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="px-5 py-6 text-sm text-text-muted text-center">No notifications yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}