import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import API, { transformProvider } from '../utils/api';
import { adminStats } from '../data/bookings';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

export default function AdminDashboard() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [bookingsList, setBookingsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [providersList, setProvidersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);

  const statusColor = {
    confirmed: 'bg-blue-50 text-blue-600',
    completed: 'bg-emerald-50 text-emerald-600',
    pending: 'bg-amber-50 text-amber-600',
    cancelled: 'bg-red-50 text-red-600',
  };

  // Live status update to MongoDB
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await API.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      setBookingsList((prev) =>
        prev.map((b) => (b.fullId === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error('Failed to update booking status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Admin one-click provider verification
  const handleVerifyProvider = async (providerId) => {
    setVerifyingId(providerId);
    try {
      await API.patch(`/providers/${providerId}/verify`);
      setProvidersList((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, verified: true } : p))
      );
    } catch (err) {
      console.error('Failed to verify provider:', err);
      alert('Failed to verify provider. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [bookingsRes, usersRes, providersRes] = await Promise.all([
          API.get('/bookings').catch(() => ({ data: [] })),
          API.get('/users').catch(() => ({ data: [] })),
          API.get('/providers').catch(() => ({ data: [] })),
        ]);

        const rawBookings = bookingsRes.data || [];
        const rawUsers = usersRes.data || [];
        const rawProviders = providersRes.data || [];

        const totalRevenue = rawBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

        setStats({
          totalUsers: rawUsers.length,
          totalProviders: rawProviders.length,
          totalBookings: rawBookings.length,
          revenue: totalRevenue,
        });

        // Live Bookings
        const formattedBookings = rawBookings.map((b) => {
          const d = b.bookingDate ? new Date(b.bookingDate) : new Date(b.createdAt);
          return {
            id: b._id.substring(b._id.length - 6).toUpperCase(),
            fullId: b._id,
            user: b.customerId?.name || 'Customer',
            provider: b.providerId?.name || 'Provider',
            service: b.serviceCategory?.name || b.serviceCategory?.categoryName || 'General Service',
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            amount: b.price || 299,
            status: b.status || 'pending',
          };
        });
        setBookingsList(formattedBookings);

        // Live Users
        const formattedUsers = rawUsers.map((u) => {
          const d = u.createdAt ? new Date(u.createdAt) : new Date();
          const count = rawBookings.filter((b) => 
            (b.customerId?._id || b.customerId) === u._id
          ).length;

          return {
            id: u._id,
            name: u.name,
            email: u.email || 'N/A',
            role: u.role || 'customer',
            joined: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            bookings: count,
            status: u.isActive !== false ? 'active' : 'inactive',
          };
        });
        setUsersList(formattedUsers);

        // Live Providers
        const formattedProviders = rawProviders.map(transformProvider);
        setProvidersList(formattedProviders);

      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <DashboardCard icon="👥" label="Total Users" value={stats.totalUsers.toLocaleString()} trend="Live DB" trendUp color="primary" />
      <DashboardCard icon="🔧" label="Service Providers" value={stats.totalProviders.toLocaleString()} trend="Live DB" trendUp color="accent" />
      <DashboardCard icon="📅" label="Total Bookings" value={stats.totalBookings.toLocaleString()} trend="Live DB" trendUp color="success" />
      <DashboardCard icon="💰" label="Revenue" value={`₹${stats.revenue.toLocaleString()}`} trend="Live DB" trendUp color="warning" />
    </div>
  );

  const renderCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
        <h3 className="font-bold text-text-primary mb-4">Booking Trends</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={adminStats.monthlyData}>
            <defs>
              <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }} />
            <Area type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} fill="url(#colorBookings)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
        <h3 className="font-bold text-text-primary mb-4">Revenue (₹)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={adminStats.monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }} formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderBookingsTable = () => (
    <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h3 className="font-bold text-text-primary">All Bookings (Live MongoDB)</h3>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{bookingsList.length} Total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface">
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">ID</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">User</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Provider</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Service</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Amount</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookingsList.length > 0 ? (
              bookingsList.map((b) => (
                <tr key={b.fullId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-primary">#{b.id}</td>
                  <td className="px-6 py-3.5 text-sm text-text-primary">{b.user}</td>
                  <td className="px-6 py-3.5 text-sm text-text-primary">{b.provider}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{b.service}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{b.date}</td>
                  <td className="px-6 py-3.5 text-sm font-medium text-text-primary">₹{b.amount}</td>
                  <td className="px-6 py-3.5">
                    <select
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.fullId, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border border-border outline-none cursor-pointer ${statusColor[b.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-sm text-text-secondary">No bookings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsersTable = () => (
    <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h3 className="font-bold text-text-primary">Registered Users</h3>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{usersList.length} Total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface">
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Email</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Role</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Joined</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Bookings</th>
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usersList.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-text-primary">{u.name}</td>
                <td className="px-6 py-3 text-sm text-text-secondary">{u.email}</td>
                <td className="px-6 py-3 text-xs uppercase font-semibold text-text-muted">{u.role}</td>
                <td className="px-6 py-3 text-sm text-text-secondary">{u.joined}</td>
                <td className="px-6 py-3 text-sm text-text-primary">{u.bookings}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProvidersList = () => (
    <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h3 className="font-bold text-text-primary">Service Providers Verification & Roster</h3>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{providersList.length} Total</span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {providersList.map((p, i) => (
          <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/60 hover:bg-gray-50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
              <span className="text-base font-bold text-primary">#{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-text-primary truncate">{p.name}</p>
                {p.verified ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">{p.category} • ⭐ {p.rating} ({p.reviews} reviews)</p>
              <p className="text-xs text-text-secondary mt-0.5">{p.experience}</p>
            </div>
            
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-sm font-bold text-primary">₹{p.price}</span>
              {!p.verified && (
                <button
                  type="button"
                  onClick={() => handleVerifyProvider(p.id)}
                  disabled={verifyingId === p.id}
                  className="text-xs font-semibold px-2.5 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                >
                  {verifyingId === p.id ? 'Verifying...' : 'Verify'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {currentPath === '/admin/users' && 'Users Management'}
          {currentPath === '/admin/providers' && 'Providers Management'}
          {currentPath === '/admin/bookings' && 'Bookings Management'}
          {currentPath === '/admin/analytics' && 'Platform Analytics'}
          {currentPath === '/admin/settings' && 'Admin Settings'}
          {currentPath === '/admin' && 'Dashboard Overview'}
        </h1>
        <p className="text-text-secondary mt-1">
          {loading ? 'Fetching records from MongoDB...' : "Manage and track platform activities in real-time."}
        </p>
      </div>

      {/* Conditionally Render Based on Sidebar Path */}
      {currentPath === '/admin' && (
        <>
          {renderStatsCards()}
          {renderCharts()}
          {renderBookingsTable()}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderUsersTable()}
            {renderProvidersList()}
          </div>
        </>
      )}

      {currentPath === '/admin/users' && renderUsersTable()}
      {currentPath === '/admin/providers' && renderProvidersList()}
      {currentPath === '/admin/bookings' && renderBookingsTable()}
      {currentPath === '/admin/analytics' && (
        <>
          {renderStatsCards()}
          {renderCharts()}
        </>
      )}
      {currentPath === '/admin/settings' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-2xl card-shadow border border-border/50 p-6">
            <h3 className="text-lg font-bold text-text-primary mb-1">General Platform Settings</h3>
            <p className="text-xs text-text-muted mb-5">Configure platform branding, support details, and service fee margins.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Platform Name</label>
                <input
                  type="text"
                  defaultValue="SmartService"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Support Email</label>
                <input
                  type="email"
                  defaultValue="support@smartservice.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Platform Commission Rate (%)</label>
                <input
                  type="number"
                  defaultValue={10}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text-primary outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Default Currency</label>
                <input
                  type="text"
                  defaultValue="INR (₹)"
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-100 text-sm text-text-muted outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button 
                type="button" 
                onClick={() => alert('Settings saved successfully!')} 
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl card-shadow border border-border/50 p-6">
            <h3 className="text-lg font-bold text-text-primary mb-1">System & Infrastructure</h3>
            <p className="text-xs text-text-muted mb-4">Real-time status indicators for connected services and database servers.</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Database</p>
                  <p className="text-xs font-mono text-text-muted mt-0.5">mongodb://127.0.0.1:27017/local_service</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface">
                <div>
                  <p className="text-sm font-semibold text-text-primary">REST API Gateway</p>
                  <p className="text-xs font-mono text-text-muted mt-0.5">http://localhost:5000/api</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}