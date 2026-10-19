import React from 'react';

interface LatencyChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({
  data,
  color = '#6366f1',
  height = 36,
}) => {
  if (!data || data.length === 0) {
    return <div className="h-9 flex items-center text-xs text-slate-600">No data</div>;
  }

  const max = Math.max(...data, 50);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const width = 120;

  // Build SVG path
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1 || 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex items-center space-x-2">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={`url(#grad-${color})`}
        />
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <span className="text-[11px] font-mono text-slate-400">
        {data[data.length - 1]}ms
      </span>
    </div>
  );
};
