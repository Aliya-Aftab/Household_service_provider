import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ServiceCard from '../components/ServiceCard';
import CategoryCard from '../components/CategoryCard';
import API, { transformProvider, transformBooking } from '../utils/api';
import { categories } from '../data/categories';
import { notifications } from '../data/bookings';
import { HiBell, HiCalendar, HiClock } from 'react-icons/hi';

export default function Dashboard() {
  const [recommended, setRecommended] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const statusColor = {
    confirmed: 'bg-blue-50 text-blue-600',
    completed: 'bg-emerald-50 text-emerald-600',
    pending: 'bg-amber-50 text-amber-600',
    cancelled: 'bg-red-50 text-red-600',
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch live providers for "Recommended for You"
        const provRes = await API.get('/providers');
        const formattedProviders = (provRes.data || []).map(transformProvider);
        setRecommended(formattedProviders.filter((p) => p.recommended));

        // 2. Read active authenticated session from localStorage
        const storedUser = localStorage.getItem('user');
        let parsedUser = null;

        if (storedUser) {
          try {
            parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
          } catch (e) {
            console.error('Error parsing session user:', e);
          }
        }

        // 3. Fetch real bookings from MongoDB for this authenticated user
        if (parsedUser?._id) {
          const bookRes = await API.get(`/bookings/user/${parsedUser._id}`).catch(() => ({ data: [] }));
          const formattedBookings = (bookRes.data || []).map(transformBooking);
          setUserBookings(formattedBookings);
        } else {
          setUserBookings([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;

    setCancellingId(bookingId);
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      setUserBookings((prev) =>
        prev.map((b) => ((b.id || b._id) === bookingId ? { ...b, status: 'cancelled' } : b))
      );
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert(err.response?.data?.message || 'Failed to cancel the booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const displayName = currentUser?.name ? currentUser.name.trim().split(' ')[0] : 'Guest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-text-secondary mt-1">Here's what's happening with your services</p>
        </div>
        <Link
          to="/services"
          className="inline-flex px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity self-start"
        >
          Book a Service
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended Section */}
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-4">⭐ Recommended for You</h2>
            {loading ? (
              <p className="text-sm text-text-secondary">Loading recommended providers...</p>
            ) : recommended.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommended.slice(0, 4).map((provider) => (
                  <ServiceCard key={provider.id || provider._id} provider={provider} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No recommended providers available.</p>
            )}
          </section>

          {/* Recent Bookings Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Recent Bookings</h2>
              <Link to="/services" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                Book Another
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-text-secondary">Loading your live bookings...</p>
            ) : userBookings.length > 0 ? (
              <div className="space-y-3">
                {userBookings.map((booking) => {
                  const bId = booking.id || booking._id;
                  const bStatus = (booking.status || 'pending').toLowerCase();
                  return (
                    <div
                      key={bId}
                      className="bg-white rounded-xl card-shadow p-4 flex flex-col sm:flex-row sm:items-center gap-3 border border-border/50 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-text-primary truncate">{booking.providerName}</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor[bStatus] || 'bg-gray-100 text-gray-600'}`}>
                            {booking.status || 'Pending'}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mt-0.5">{booking.service} • {booking.category}</p>
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

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-primary">₹{booking.price}</span>

                        {/* Cancel Action */}
                        {(bStatus === 'pending' || bStatus === 'confirmed') && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(bId)}
                            disabled={cancellingId === bId}
                            className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {cancellingId === bId ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}

                        <Link
                          to={`/provider/${booking.providerId}`}
                          className="text-xs font-medium px-3 py-1.5 bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl card-shadow p-6 text-center border border-border/50">
                <p className="text-text-secondary text-sm">
                  {currentUser
                    ? "You haven't placed any bookings yet."
                    : 'Please sign in to view your bookings.'}
                </p>
                <Link to="/services" className="mt-2 inline-block text-sm text-primary font-semibold hover:underline">
                  Find a service provider
                </Link>
              </div>
            )}
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-lg font-bold text-text-primary mb-4">Browse Categories</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories.slice(0, 6).map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <HiBell className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-text-primary">Notifications</h3>
              <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {notifications.filter((n) => !n.read).length} new
              </span>
            </div>
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-5 py-3.5 hover:bg-gray-50 transition-colors ${
                    !notif.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <p className={`text-sm ${!notif.read ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{notif.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl card-shadow border border-border/50 p-5">
            <h3 className="font-bold text-text-primary mb-4">Your Activity</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Bookings', value: userBookings.length, color: 'text-primary' },
                { label: 'Completed', value: userBookings.filter((b) => (b.status || '').toLowerCase() === 'completed').length, color: 'text-emerald-600' },
                { label: 'Pending', value: userBookings.filter((b) => (b.status || '').toLowerCase() === 'pending').length, color: 'text-amber-600' },
                { label: 'Confirmed', value: userBookings.filter((b) => (b.status || '').toLowerCase() === 'confirmed').length, color: 'text-blue-600' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{stat.label}</span>
                  <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
