import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, Area, ComposedChart } from 'recharts';

export default function TemperatureChart({ data, minTemp = 2, maxTemp = 8 }) {
  const chartData = data.map((d, i) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: d.temperature,
    index: i,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const temp = payload[0].value;
    const isSafe = temp >= minTemp && temp <= maxTemp;
    const isCritical = temp > 10 || temp < 0;
    const color = isCritical ? '#ef4444' : isSafe ? '#22c55e' : '#f59e0b';
    return (
      <div className="bg-white rounded-xl px-4 py-3 shadow-card-lg border border-gray-100">
        <p className="text-lg font-bold font-mono" style={{ color }}>
          {temp.toFixed(1)}°C
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{payload[0].payload.time}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          <span className="text-[10px] font-semibold" style={{ color }}>
            {isCritical ? 'CRITICAL' : isSafe ? 'SAFE' : 'WARNING'}
          </span>
        </div>
      </div>
    );
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;
    const temp = payload.temperature;
    if (temp > maxTemp || temp < minTemp) {
      const isCritical = temp > 10 || temp < 0;
      const color = isCritical ? '#ef4444' : '#f59e0b';
      return (
        <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 6" stroke="#f3f4f6" vertical={false} />

          <ReferenceArea y1={minTemp} y2={maxTemp} fill="#22c55e" fillOpacity={0.04} />
          <ReferenceLine y={maxTemp} stroke="#22c55e" strokeDasharray="4 6" strokeOpacity={0.4}
            label={{ value: `${maxTemp}°C`, position: 'right', fontSize: 10, fill: '#22c55e', fontFamily: 'Inter' }} />
          <ReferenceLine y={minTemp} stroke="#22c55e" strokeDasharray="4 6" strokeOpacity={0.4}
            label={{ value: `${minTemp}°C`, position: 'right', fontSize: 10, fill: '#22c55e', fontFamily: 'Inter' }} />
          <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="2 6" strokeOpacity={0.2} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 6" strokeOpacity={0.2} />

          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={[-2, 15]} tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'Inter' }} axisLine={false} tickLine={false} unit="°" />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '4 4' }} />

          <Area type="monotone" dataKey="temperature" fill="url(#tempAreaGrad)" stroke="none" />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#22c55e"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: '#22c55e', stroke: 'white', strokeWidth: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
