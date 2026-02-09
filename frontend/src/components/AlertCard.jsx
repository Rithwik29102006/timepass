export default function AlertCard({ alert, onAcknowledge }) {
  const severityConfig = {
    critical: {
      bg: 'bg-danger-50',
      border: 'border-danger-100',
      text: 'text-danger-600',
      badge: 'bg-danger-100 text-danger-700',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-100',
      text: 'text-warning-600',
      badge: 'bg-warning-100 text-warning-600',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-info-50',
      border: 'border-info-100',
      text: 'text-info-600',
      badge: 'bg-info-100 text-info-600',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = severityConfig[alert.severity] || severityConfig.info;
  const timeAgo = getTimeAgo(alert.timestamp);

  return (
    <div className={`group relative bg-white rounded-xl border ${config.border} p-4 transition-all duration-200 hover:shadow-card-hover ${alert.acknowledged ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Checkmark icon */}
          <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center ${config.text}`}>
            {alert.acknowledged ? (
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">{alert.message}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`badge text-[10px] ${config.badge}`}>{alert.severity}</span>
              <span className="text-xs text-gray-400">{alert.shipmentId}</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Thumbnail placeholder */}
        <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
          <img
            src={`https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop&q=60`}
            alt="" className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Acknowledge action */}
      {!alert.acknowledged && onAcknowledge && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); onAcknowledge(alert.id); }}
            className="btn-primary text-xs px-4 py-1.5"
          >
            Acknowledge
          </button>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 30) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return `${secs}s ago`;
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
