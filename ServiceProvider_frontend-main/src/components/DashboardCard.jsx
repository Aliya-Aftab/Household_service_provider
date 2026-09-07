export default function DashboardCard({ icon, label, value, trend, trendUp, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-blue-50 text-primary',
    success: 'bg-emerald-50 text-success',
    warning: 'bg-amber-50 text-warning',
    accent: 'bg-indigo-50 text-accent',
  };

  return (
    <div className="bg-white rounded-2xl card-shadow p-5 hover:card-shadow-hover transition-all duration-300 border border-border/50">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${colorMap[color]} flex items-center justify-center text-xl`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trendUp ? 'bg-emerald-50 text-success' : 'bg-red-50 text-danger'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-sm text-text-secondary mt-0.5">{label}</p>
      </div>
    </div>
  );
}
