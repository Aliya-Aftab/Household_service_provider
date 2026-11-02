import { useState, useEffect } from 'react';
import API, { transformBooking } from '../utils/api';
import ProviderTrackingToggle from '../components/ProviderTrackingToggle';
import { HiBell, HiCalendar, HiClock, HiStar, HiCheckCircle, HiCurrencyRupee, HiTrendingUp } from 'react-icons/hi';
import { notifications } from '../data/bookings';

const statusColor = {
  confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default function ProviderDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) return;
        const user = JSON.parse(stored);
        setCurrentUser(user);

        // Fetch bookings where this user is the provider
        const bookRes = await API.get(`/bookings/provider/${user._id}`).catch(() => ({ data: [] }));
        setBookings((bookRes.data || []).map(transformBooking));

        // Fetch provider profile for rating / category info
        const provRes = await API.get(`/providers/user/${user._id}`).catch(() => ({ data: null }));
        if (provRes.data) setProviderProfile(provRes.data);
      } catch (e) {
        console.error('Error loading provider dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const displayName = currentUser?.name?.trim().split(' ')[0] || 'Provider';
  const activeBookings = bookings.filter((b) => ['confirmed', 'pending'].includes(b.status.toLowerCase()));
  const completedBookings = bookings.filter((b) => b.status.toLowerCase() === 'completed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const stats = [
    { label: 'Total Jobs', value: bookings.length, color: 'text-primary', bg: 'bg-primary/10', icon: HiCalendar },
    { label: 'Completed', value: completedBookings.length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: HiCheckCircle },
    { label: 'Active', value: activeBookings.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: HiTrendingUp },
    { label: 'Earnings', value: `\u20b9${totalEarnings.toLocaleString()}`, color: 'text-amber-600', bg: 'bg-amber-50', icon: HiCurrencyRupee },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              🛠️ Service Provider Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Welcome, {displayName}! 👋
          </h1>
          <p className="text-text-secondary mt-1">
            {providerProfile?.servicesOffered?.[0]?.name
              ? `Managing your ${providerProfile.servicesOffered[0].name} services`
              : 'Manage your bookings and share your live location with customers'}
          </p>
        </div>

        {providerProfile?.averageRating > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl self-start">
            <HiStar className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-700 text-lg">{providerProfile.averageRating.toFixed(1)}</span>
            <span className="text-xs text-amber-600">({providerProfile.totalReviews || 0} reviews)</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-border/50 card-shadow p-4 flex items-center gap-3">
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
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">

          {/* Live Location Sharing */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary">📍 Live Location Sharing</h2>
            <p className="text-sm text-text-secondary -mt-1">
              Start sharing when you're heading to a customer. They'll see your live position on a map.
            </p>

            {loading ? (
              <p className="text-sm text-text-secondary">Loading active bookings...</p>
            ) : activeBookings.length > 0 ? (
              activeBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-2xl border border-border/50 card-shadow p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{booking.service}</p>
                      <p className="text-sm text-text-secondary">{booking.category} • {booking.date} at {booking.time}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusColor[booking.status.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {booking.status}
                    </span>
                  </div>
                  <ProviderTrackingToggle bookingId={booking.id} />
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-border/50 card-shadow p-5 space-y-3">
                <p className="text-sm text-text-secondary">No active bookings right now. You can still test the sharing feature below.</p>
                <ProviderTrackingToggle bookingId="demo-booking-provider" />
              </div>
            )}
          </section>

          {/* All Bookings */}
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-4">📋 All Bookings</h2>
            {loading ? (
              <p className="text-sm text-text-secondary">Loading...</p>
            ) : bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-xl card-shadow border border-border/50 p-4 hover:border-primary/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-text-primary">{booking.service}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${statusColor[booking.status.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary">{booking.category}</p>
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
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-primary">\u20b9{booking.price}</p>
                        <p className="text-xs text-text-muted">from customer</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl card-shadow p-6 text-center border border-border/50">
                <p className="text-text-secondary text-sm">No bookings yet. Once customers book your services, they appear here.</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">

          {/* Profile Card */}
          <div className="bg-white rounded-2xl card-shadow border border-border/50 p-5">
            <h3 className="font-bold text-text-primary mb-4">👤 Your Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Name</span>
                <span className="text-sm font-semibold text-text-primary">{currentUser?.name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Phone</span>
                <span className="text-sm font-semibold text-text-primary">{currentUser?.phone || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Role</span>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                  Service Provider
                </span>
              </div>
              {providerProfile?.experienceYears && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Experience</span>
                  <span className="text-sm font-semibold text-text-primary">{providerProfile.experienceYears} yrs</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Verified</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${providerProfile?.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {providerProfile?.isVerified ? '✅ Verified' : '⏳ Pending Verification'}
                </span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white rounded-2xl card-shadow border border-border/50 p-5">
            <h3 className="font-bold text-text-primary mb-4">📊 Performance</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Jobs', value: bookings.length, color: 'text-primary' },
                { label: 'Completed', value: completedBookings.length, color: 'text-emerald-600' },
                { label: 'Cancelled', value: bookings.filter((b) => b.status.toLowerCase() === 'cancelled').length, color: 'text-red-500' },
                { label: 'Total Earned', value: `\u20b9${totalEarnings.toLocaleString()}`, color: 'text-amber-600' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{stat.label}</span>
                  <span className={`text-base font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <HiBell className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text-primary">Notifications</h3>
              <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {notifications.filter((n) => !n.read).length} new
              </span>
            </div>
            <div className="divide-y divide-border">
              {notifications.slice(0, 4).map((notif) => (
                <div key={notif.id} className={`px-5 py-3.5 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                  <p className={`text-sm ${!notif.read ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{notif.time}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
