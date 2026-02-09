import { useEffect, useRef, useState } from 'react';

export default function TemperatureGauge({ currentTemp, minTemp = 2, maxTemp = 8, size = 220 }) {
  const [displayTemp, setDisplayTemp] = useState(currentTemp);
  const prevTemp = useRef(currentTemp);

  useEffect(() => {
    const start = prevTemp.current;
    const end = currentTemp;
    const duration = 700;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayTemp(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prevTemp.current = currentTemp;
  }, [currentTemp]);

  const center = size / 2;
  const radius = (size / 2) - 24;
  const strokeWidth = 10;
  const innerRadius = radius - 18;
  const circumference = 2 * Math.PI * radius;

  const displayMin = -5;
  const displayMax = 20;
  const clamped = Math.max(displayMin, Math.min(displayMax, displayTemp));
  const ratio = (clamped - displayMin) / (displayMax - displayMin);
  const arcAngle = 270;
  const arcLength = ratio * (circumference * (arcAngle / 360));
  const totalArc = circumference * (arcAngle / 360);
  const startAngle = 135;

  let statusLabel = 'SAFE';
  let color1 = '#22c55e';
  let color2 = '#16a34a';

  if (currentTemp > 10 || currentTemp < 0) {
    statusLabel = 'CRITICAL';
    color1 = '#ef4444'; color2 = '#dc2626';
  } else if (currentTemp > maxTemp || currentTemp < minTemp) {
    statusLabel = 'WARNING';
    color1 = '#f59e0b'; color2 = '#d97706';
  }

  const safeMinRatio = (minTemp - displayMin) / (displayMax - displayMin);
  const safeMaxRatio = (maxTemp - displayMin) / (displayMax - displayMin);
  const safeStartAngle = startAngle + safeMinRatio * arcAngle;
  const safeEndAngle = startAngle + safeMaxRatio * arcAngle;

  const polarToCartesian = (angleDeg, r) => ({
    x: center + r * Math.cos((angleDeg * Math.PI) / 180),
    y: center + r * Math.sin((angleDeg * Math.PI) / 180),
  });

  const safeStart = polarToCartesian(safeStartAngle, innerRadius);
  const safeEnd = polarToCartesian(safeEndAngle, innerRadius);

  const gradId = `gauge-grad-${size}`;

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth}
          strokeDasharray={`${totalArc} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${center} ${center})`}
        />

        {/* Safe zone arc on inner ring */}
        <path
          d={`M ${safeStart.x} ${safeStart.y} A ${innerRadius} ${innerRadius} 0 0 1 ${safeEnd.x} ${safeEnd.y}`}
          fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={`url(#${gradId})`} strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${center} ${center})`}
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* Endpoint dot */}
        {(() => {
          const endAngle = startAngle + ratio * arcAngle;
          const dot = polarToCartesian(endAngle, radius);
          return (
            <circle cx={dot.x} cy={dot.y} r={5} fill={color1} stroke="white" strokeWidth={2}
              style={{ transition: 'cx 0.7s cubic-bezier(0.4,0,0.2,1), cy 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
          );
        })()}

        {/* Center content */}
        <text x={center} y={center - 14} textAnchor="middle" fill="#111827" fontSize="36" fontWeight="800" fontFamily="Inter, sans-serif">
          {displayTemp.toFixed(1)}°
        </text>
        <text x={center} y={center + 8} textAnchor="middle" fill="#9ca3af" fontSize="11" fontWeight="500" fontFamily="Inter, sans-serif">
          CELSIUS
        </text>

        {/* Status badge */}
        <rect x={center - 32} y={center + 18} width={64} height={22} rx={6}
          fill={statusLabel === 'SAFE' ? 'rgba(34,197,94,0.1)' : statusLabel === 'WARNING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}
        />
        <text x={center} y={center + 33} textAnchor="middle" fill={color1} fontSize="9" fontWeight="800" letterSpacing="1.5" fontFamily="Inter, sans-serif">
          {statusLabel}
        </text>
      </svg>

      {/* Range labels */}
      <div className="flex gap-6 text-xs text-gray-500 mt-2 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-info-500" />
          Min {minTemp}°C
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />
          Max {maxTemp}°C
        </span>
      </div>
    </div>
  );
}
