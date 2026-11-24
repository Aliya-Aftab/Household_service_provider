import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import API, { transformProvider } from '../utils/api';
import {
  HiUsers,
  HiBriefcase,
  HiCalendar,
  HiCurrencyRupee,
  HiTrash,
  HiSearch,
  HiExternalLink,
  HiCheckCircle,
  HiPhone,
  HiLocationMarker,
  HiMail,
  HiChevronUp,
  HiChevronDown,
  HiDocumentText,
  HiShieldCheck,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
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
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setLightboxSrc(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const statusColor = {
    confirmed: 'bg-blue-50 text-blue-600',
    completed: 'bg-emerald-50 text-emerald-600',
    pending: 'bg-amber-50 text-amber-600',
    cancelled: 'bg-red-50 text-red-600',
  };

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

  const handleVerifyProvider = async (providerId) => {
    setVerifyingId(providerId);
    try {
      await API.patch(`/providers/${providerId}/verify`);
      setProvidersList((prev) =>
        prev.map((p) => (p.id === providerId || p._id === providerId ? { ...p, verified: true } : p))
      );
    } catch (err) {
      console.error('Failed to verify provider:', err);
      alert('Failed to verify provider. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleTelephonicVerify = async (providerId) => {
    setVerifyingId(`tel-${providerId}`);
    try {
      await API.patch(`/providers/${providerId}/telephonic-verify`);
      setProvidersList((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, telephonicVerified: true } : p))
      );
    } catch (err) {
      console.error('Failed to telephonic verify provider:', err);
      alert('Failed to update telephonic verification. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this provider request? This action cannot be undone.'
      )
    )
      return;

    try {
      await API.delete(`/providers/${providerId}`);
      setProvidersList((prev) => prev.filter((p) => p.id !== providerId));
    } catch (err) {
      console.error('Failed to delete provider:', err);
      alert('Failed to delete provider. Please try again.');
    }
  };

  const handleDeleteUser = async (userId, role) => {
    if (role === 'admin') {
      alert('Admin accounts cannot be deleted.');
      return;
    }
    if (
      !window.confirm(
        'Are you sure you want to delete this user? They will no longer appear in the system.'
      )
    )
      return;

    try {
      await API.delete(`/users/${userId}`);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user. Please try again.');
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [bookingsRes, usersRes, providersRes] = await Promise.all([
          API.get('/bookings').catch(() => ({ data: [] })),
          API.get('/users').catch(() => ({ data: [] })),
          API.get('/providers/admin/all').catch(() => ({ data: [] })),
        ]);

        const rawBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        const rawProviders = Array.isArray(providersRes.data) ? providersRes.data : [];

        const totalRevenue = rawBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

        setStats({
          totalUsers: rawUsers.length,
          totalProviders: rawProviders.length,
          totalBookings: rawBookings.length,
          revenue: totalRevenue,
        });

        const formattedBookings = rawBookings.map((b) => {
          const rawId = String(b._id || '000000');
          const d = b.bookingDate ? new Date(b.bookingDate) : new Date(b.createdAt || Date.now());
          return {
            id: rawId.length >= 6 ? rawId.substring(rawId.length - 6).toUpperCase() : rawId,
            fullId: b._id,
            rawDate: d,
            user: b.customerId?.name || 'Customer',
            provider: b.providerId?.name || 'Provider',
            service: b.serviceCategory?.name || b.serviceCategory?.categoryName || 'General Service',
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            amount: Number(b.price) || 299,
            status: b.status || 'pending',
          };
        });
        setBookingsList(formattedBookings);

        const formattedUsers = rawUsers.map((u) => {
          const d = u.createdAt ? new Date(u.createdAt) : new Date();
          const count = rawBookings.filter(
            (b) => (b.customerId?._id || b.customerId) === u._id
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

  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets = new Map();

    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      buckets.set(key, { month: months[dt.getMonth()], bookings: 0, revenue: 0 });
    }

    bookingsList.forEach((b) => {
      const dt = b.rawDate instanceof Date && !Number.isNaN(b.rawDate.getTime()) ? b.rawDate : new Date();
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (!buckets.has(key)) {
        buckets.set(key, { month: months[dt.getMonth()], bookings: 0, revenue: 0 });
      }
      const entry = buckets.get(key);
      entry.bookings += 1;
      entry.revenue += Number(b.amount) || 0;
    });

    return Array.from(buckets.values());
  }, [bookingsList]);

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <DashboardCard
        icon={<HiUsers className="w-5 h-5" />}
        label="Total Users"
        value={stats.totalUsers.toLocaleString()}
        trend="Live DB"
        trendUp
        color="primary"
      />
      <DashboardCard
        icon={<HiBriefcase className="w-5 h-5" />}
        label="Service Providers"
        value={stats.totalProviders.toLocaleString()}
        trend="Live DB"
        trendUp
        color="accent"
      />
      <DashboardCard
        icon={<HiCalendar className="w-5 h-5" />}
        label="Total Bookings"
        value={stats.totalBookings.toLocaleString()}
        trend="Live DB"
        trendUp
        color="success"
      />
      <DashboardCard
        icon={<HiCurrencyRupee className="w-5 h-5" />}
        label="Revenue"
        value={`₹${stats.revenue.toLocaleString()}`}
        trend="Live DB"
        trendUp
        color="warning"
      />
    </div>
  );

  const renderCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
        <h3 className="font-bold text-text-primary mb-4">Booking Trends</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyChartData}>
            <defs>
              <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
            />
            <Area
              type="monotone"
              dataKey="bookings"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorBookings)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-2xl card-shadow p-6 border border-border/50">
        <h3 className="font-bold text-text-primary mb-4">Revenue (&#8377;)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '13px' }}
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderBookingsTable = () => (
    <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h3 className="font-bold text-text-primary">All Bookings</h3>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">
          {bookingsList.length} Total
        </span>
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
                  <td className="px-6 py-3.5 text-sm font-medium text-text-primary">&#8377;{b.amount}</td>
                  <td className="px-6 py-3.5">
                    <select
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.fullId, e.target.value)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border border-border outline-none cursor-pointer ${
                        statusColor[b.status] || 'bg-gray-100 text-gray-600'
                      }`}
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
                <td colSpan="7" className="px-6 py-8 text-center text-sm text-text-secondary">
                  No bookings found.
                </td>
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
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">
          {usersList.length} Total
        </span>
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
              <th className="text-left text-xs font-semibold text-text-secondary px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {usersList.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-sm text-text-secondary">
                  No users found.
                </td>
              </tr>
            )}
            {usersList.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-sm font-medium text-text-primary">{u.name}</td>
                <td className="px-6 py-3 text-sm text-text-secondary">{u.email}</td>
                <td className="px-6 py-3 text-xs uppercase font-semibold text-text-muted">{u.role}</td>
                <td className="px-6 py-3 text-sm text-text-secondary">{u.joined}</td>
                <td className="px-6 py-3 text-sm text-text-primary">{u.bookings}</td>
                <td className="px-6 py-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      u.status === 'active'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {u.role !== 'admin' ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.role)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <HiTrash className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <span className="text-xs text-text-muted">&mdash;</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const isBase64 = (str) => typeof str === 'string' && str.startsWith('data:');
  const isPdfData = (str) => typeof str === 'string' && str.startsWith('data:application/pdf');

  const renderDoc = (src, label) => {
    if (!src || src === 'default_id_url') return null;

    if (isPdfData(src)) {
      return (
        <div key={label} className="mt-2">
          <p className="text-[10px] font-semibold text-text-muted mb-1">{label} (PDF)</p>
          <div className="w-full max-w-xs rounded-lg border border-border bg-white overflow-hidden">
            <iframe
              src={src}
              title={label}
              className="w-full h-36 border-0 pointer-events-none"
            />
            <button
              type="button"
              onClick={() => setLightboxSrc(src)}
              className="w-full py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
            >
              Open Full PDF
            </button>
          </div>
        </div>
      );
    }

    if (isBase64(src)) {
      return (
        <div key={label} className="mt-2">
          <p className="text-[10px] font-semibold text-text-muted mb-1">{label}</p>
          <div className="relative group inline-block">
            <img
              src={src}
              alt={label}
              onClick={() => setLightboxSrc(src)}
              className="w-full max-w-xs rounded-lg border border-border object-contain max-h-48 cursor-zoom-in hover:opacity-90 transition-opacity"
            />
            <div
              onClick={() => setLightboxSrc(src)}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition-all cursor-zoom-in"
            >
              <span className="inline-flex items-center gap-1 text-white text-xs font-bold opacity-0 group-hover:opacity-100 bg-black/60 px-2 py-1 rounded transition-opacity">
                <HiSearch className="w-3.5 h-3.5" /> Click to Expand
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <a
        key={label}
        href={src}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline bg-primary/10 px-2 py-1 rounded mt-1"
      >
        <HiExternalLink className="w-3.5 h-3.5" />
        <span>{label}</span>
      </a>
    );
  };

  const renderProvidersList = () => (
    <div className="bg-white rounded-2xl card-shadow border border-border/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h3 className="font-bold text-text-primary">Service Providers Verification &amp; Roster</h3>
        <span className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">
          {providersList.length} Total
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 gap-3">
        {providersList.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8">No providers registered yet.</p>
        )}
        {providersList.map((p) => (
          <div key={p.id} className="rounded-xl border border-border/60 overflow-hidden">
            <div
              className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setExpandedProvider(expandedProvider === p.id ? null : p.id)}
            >
              <div className="relative group shrink-0">
                <img
                  src={p.image}
                  alt={p.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxSrc(p.image);
                  }}
                  className="w-14 h-14 rounded-xl object-cover border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-text-primary">{p.name}</p>
                  {p.verified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                      <HiCheckCircle className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-semibold px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                  {p.telephonicVerified && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                      <HiPhone className="w-3 h-3" /> Called
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{p.category}</span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-0.5">
                    <HiLocationMarker className="w-3.5 h-3.5" />
                    {p.location}
                  </span>
                  <span>&bull;</span>
                  <span>Joined: {p.joinedAt}</span>
                </p>
                <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <HiPhone className="w-3.5 h-3.5" />
                    {p.phone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <HiMail className="w-3.5 h-3.5" />
                    {p.email}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-xs text-text-muted">
                {expandedProvider === p.id ? (
                  <>
                    <HiChevronUp className="w-4 h-4" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <HiChevronDown className="w-4 h-4" />
                    <span>Details</span>
                  </>
                )}
              </div>
            </div>

            {expandedProvider === p.id && (
              <div className="px-4 pb-4 pt-2 border-t border-border/40 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
                      <HiDocumentText className="w-4 h-4 text-primary" />
                      <span>Submitted Documents</span>
                    </p>
                    {renderDoc(p.aadhaarImage, 'Identity / Verification Proof')}
                    {p.certificates && p.certificates.length > 0 ? (
                      p.certificates.map((cert, idx) => renderDoc(cert, `Certificate ${idx + 1}`))
                    ) : (
                      <p className="text-xs text-text-muted mt-1">No certificates uploaded.</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-text-primary mb-1 flex items-center gap-1.5">
                      <HiShieldCheck className="w-4 h-4 text-primary" />
                      <span>Admin Actions</span>
                    </p>

                    {!p.telephonicVerified ? (
                      <button
                        type="button"
                        onClick={() => handleTelephonicVerify(p.id)}
                        disabled={verifyingId === `tel-${p.id}`}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <HiPhone className="w-3.5 h-3.5" />
                        <span>
                          {verifyingId === `tel-${p.id}` ? 'Saving...' : 'Mark Telephonic Verified'}
                        </span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5 text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-2 rounded-lg">
                        <HiPhone className="w-3.5 h-3.5" />
                        <span>Telephonic Verified</span>
                      </span>
                    )}

                    {!p.verified ? (
                      <button
                        type="button"
                        onClick={() => handleVerifyProvider(p.id)}
                        disabled={verifyingId === p.id}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <HiCheckCircle className="w-3.5 h-3.5" />
                        <span>{verifyingId === p.id ? 'Verifying...' : 'Approve & Verify'}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5 text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-2 rounded-lg">
                        <HiCheckCircle className="w-3.5 h-3.5" />
                        <span>Fully Verified</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteProvider(p.id)}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer mt-2"
                    >
                      <HiTrash className="w-3.5 h-3.5" />
                      <span>Delete Provider</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute top-4 right-4 text-white text-2xl font-bold bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-colors z-10"
            aria-label="Close document preview"
          >
            &times;
          </button>
          {isPdfData(lightboxSrc) ? (
            <iframe
              src={lightboxSrc}
              title="PDF Document Preview"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl h-[85vh] rounded-xl bg-white shadow-2xl border border-white/20"
            />
          ) : (
            <img
              src={lightboxSrc}
              alt="Document Preview"
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl border border-white/20"
            />
          )}
          <p className="absolute bottom-4 text-white/60 text-xs">
            Press Esc or click outside to close
          </p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {currentPath === '/admin/users' && 'Users Management'}
          {currentPath === '/admin/providers' && 'Providers Management'}
          {currentPath === '/admin/bookings' && 'Bookings Management'}
          {currentPath === '/admin/analytics' && 'Platform Analytics'}
          {currentPath === '/admin/settings' && 'System & Platform Info'}
          {currentPath === '/admin' && 'Dashboard Overview'}
        </h1>
        <p className="text-text-secondary mt-1">
          {loading
            ? 'Fetching records from MongoDB...'
            : 'Manage and track platform activities in real time.'}
        </p>
      </div>

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
            <h3 className="text-lg font-bold text-text-primary mb-1">Platform Configuration</h3>
            <p className="text-xs text-text-muted mb-5">
              Active platform defaults and operational parameters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-surface">
                <p className="text-xs text-text-muted">Platform Name</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">SmartService</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface">
                <p className="text-xs text-text-muted">Default Currency</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">INR (&#8377;)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface">
                <p className="text-xs text-text-muted">Geospatial Search Limit</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">
                  25 km Default (3&ndash;50 km adjustable)
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface">
                <p className="text-xs text-text-muted">Ranking Model</p>
                <p className="text-sm font-semibold text-text-primary mt-0.5">
                  Bayesian Weighted Score (m = 5, C = 3.5)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl card-shadow border border-border/50 p-6">
            <h3 className="text-lg font-bold text-text-primary mb-1">System &amp; Infrastructure</h3>
            <p className="text-xs text-text-muted mb-4">
              Connected services and active security policies.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Database Cluster</p>
                  <p className="text-xs font-mono text-text-muted mt-0.5">
                    MongoDB Atlas (2dsphere Geospatial + 30-day Notification TTL)
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface">
                <div>
                  <p className="text-sm font-semibold text-text-primary">REST API &amp; Socket.IO</p>
                  <p className="text-xs font-mono text-text-muted mt-0.5">
                    HttpOnly JWT Cookies + XSS Input Sanitization
                  </p>
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