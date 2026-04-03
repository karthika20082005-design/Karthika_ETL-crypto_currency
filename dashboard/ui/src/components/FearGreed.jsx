import { useState, useEffect } from "react";

export default function FearGreed() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.alternative.me/fng/?limit=1")
      .then((r) => r.json())
      .then((json) => {
        setData(json.data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel p-5 text-sm muted">Loading sentiment...</div>;
  if (!data) return null;

  const value = parseInt(data.value);
  const label = data.value_classification;

  const getColor = () => {
    if (value <= 25) return "#ef4444";
    if (value <= 45) return "#f97316";
    if (value <= 55) return "#eab308";
    if (value <= 75) return "#84cc16";
    return "#22c55e";
  };

  const getEmoji = () => {
    if (value <= 25) return "😨";
    if (value <= 45) return "😟";
    if (value <= 55) return "😐";
    if (value <= 75) return "😊";
    return "🤑";
  };

  return (
    <div className="panel p-5 flex flex-col items-center">
      <p className="text-[10px] uppercase tracking-[0.18em] muted mb-4">
        Market Sentiment
      </p>

      <div className="relative w-40 h-24 mb-2">
        <svg viewBox="0 0 160 90" className="w-full h-full">
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke={getColor()}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 220} 220`}
          />
          <text
            x="80"
            y="72"
            textAnchor="middle"
            fontSize="28"
            fontWeight="bold"
            fill={getColor()}
          >
            {value}
          </text>
        </svg>
      </div>

      <div className="text-center">
        <span className="text-2xl">{getEmoji()}</span>
        <p className="text-slate-900 font-semibold text-sm mt-1">{label}</p>
        <p className="muted text-xs mt-1">
          Updated: {new Date(data.timestamp * 1000).toLocaleDateString()}
        </p>
      </div>

      <div className="flex justify-between w-full mt-4 text-xs muted border-t border-slate-100 pt-3">
        <span>😨 Fear</span>
        <span>😐 Neutral</span>
        <span>🤑 Greed</span>
      </div>
    </div>
  );
}
