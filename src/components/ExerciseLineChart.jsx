import { useState } from 'react';

const ExerciseLineChart = ({ sortedHistory, maxWeight, minWeight, range }) => {
    const [activeIdx, setActiveIdx] = useState(null);

    return (
        <svg className="line-chart" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            <line x1="50" y1="200" x2="550" y2="200" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="50" y1="150" x2="550" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="50" y1="100" x2="550" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="50" y1="50" x2="550" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* Y-axis labels */}
            <text x="35" y="205" fill="var(--text-muted)" fontSize="10" textAnchor="end">{minWeight.toFixed(1)}</text>
            <text x="35" y="55" fill="var(--text-muted)" fontSize="10" textAnchor="end">{maxWeight.toFixed(1)}</text>

            {/* Gradient definition */}
            <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
            </defs>

            {/* Line path */}
            <polyline
                points={sortedHistory.map((record, idx) => {
                    const weight = parseFloat(record.weightKg) || 0;
                    const x = 50 + (idx / (sortedHistory.length - 1 || 1)) * 500;
                    const y = 200 - (range > 0 ? ((weight - minWeight) / range) * 150 : 75);
                    return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Data points */}
            {sortedHistory.map((record, idx) => {
                const weight = parseFloat(record.weightKg) || 0;
                const x = 50 + (idx / (sortedHistory.length - 1 || 1)) * 500;
                const y = 200 - (range > 0 ? ((weight - minWeight) / range) * 150 : 75);
                const date = new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const lbs = (weight * 2.20462).toFixed(1);
                const isActive = activeIdx === idx;

                return (
                    <g key={idx} onClick={() => setActiveIdx(isActive ? null : idx)} style={{ cursor: 'pointer' }}>
                        {/* Larger invisible hit area for touch */}
                        <circle cx={x} cy={y} r="18" fill="transparent" />
                        <circle
                            cx={x}
                            cy={y}
                            r={isActive ? 7 : 5}
                            fill="var(--primary)"
                            stroke="white"
                            strokeWidth="2"
                            className="data-point"
                        />
                        {/* X-axis label */}
                        <text x={x} y="220" fontSize="9" textAnchor="middle" fill="var(--text-muted)">{date}</text>
                        {/* Tap tooltip */}
                        {isActive && (
                            <g>
                                <rect
                                    x={Math.min(Math.max(x - 52, 2), 496)}
                                    y={y - 46}
                                    width="104"
                                    height="36"
                                    rx="6"
                                    fill="var(--bg-dark)"
                                    stroke="var(--primary)"
                                    strokeWidth="1"
                                />
                                <text x={Math.min(Math.max(x, 54), 546)} y={y - 28} fontSize="10" textAnchor="middle" fill="white" fontWeight="bold">
                                    {weight}kg / {lbs}lbs
                                </text>
                                <text x={Math.min(Math.max(x, 54), 546)} y={y - 15} fontSize="9" textAnchor="middle" fill="var(--text-muted)">
                                    {date}
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

export default ExerciseLineChart;
