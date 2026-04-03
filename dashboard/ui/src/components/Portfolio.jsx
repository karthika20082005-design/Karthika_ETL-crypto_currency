import { useState, useEffect } from "react";

const COIN_LABELS = {
  bitcoin: "BTC", ethereum: "ETH", solana: "SOL", cardano: "ADA",
  ripple: "XRP", dogecoin: "DOGE", polkadot: "DOT", binancecoin: "BNB",
  chainlink: "LINK", cosmos: "ATOM", uniswap: "UNI", litecoin: "LTC",
  stellar: "XLM", vechain: "VET", "shiba-inu": "SHIB", tron: "TRX",
  tezos: "XTZ", neo: "NEO",
};

export default function Portfolio({ coins }) {
  const [holdings, setHoldings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("crypto_holdings") || "{}");
    } catch {
      return {};
    }
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    localStorage.setItem("crypto_holdings", JSON.stringify(holdings));
  }, [holdings]);

  const priceMap = {};
  (coins || []).forEach((c) => {
    priceMap[c.id] = c.price;
  });

  const totalValue = Object.entries(holdings).reduce((sum, [id, qty]) => {
    const price = priceMap[id] || 0;
    return sum + price * parseFloat(qty || 0);
  }, 0);

  const openEdit = () => {
    setDraft({ ...holdings });
    setEditing(true);
  };

  const saveEdit = () => {
    const cleaned = {};
    Object.entries(draft).forEach(([id, qty]) => {
      if (parseFloat(qty) > 0) cleaned[id] = qty;
    });
    setHoldings(cleaned);
    setEditing(false);
  };

  const formatValue = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${val.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    return `$${val.toFixed(2)}`;
  };

  const holdingEntries = Object.entries(holdings).filter(
    ([id, qty]) => parseFloat(qty) > 0 && priceMap[id]
  );

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.18em] muted">
          My Portfolio
        </p>
        <button
          onClick={openEdit}
          className="text-xs text-sky-700 hover:text-sky-500 border border-sky-200 rounded px-2 py-1"
        >
          {holdingEntries.length === 0 ? "+ Add Holdings" : "✏ Edit"}
        </button>
      </div>

      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-slate-900">
          {formatValue(totalValue)}
        </p>
        <p className="muted text-xs mt-1">Total Portfolio Value</p>
      </div>

      {holdingEntries.length === 0 ? (
        <p className="muted text-sm text-center py-4">
          No holdings yet. Click "+ Add Holdings" to start.
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {holdingEntries.map(([id, qty]) => {
            const price = priceMap[id] || 0;
            const value = price * parseFloat(qty);
            const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
            return (
              <div key={id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 w-12">
                    {COIN_LABELS[id] || id.toUpperCase()}
                  </span>
                  <span className="text-xs muted">{qty} coins</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-900 font-medium">
                    {formatValue(value)}
                  </p>
                  <p className="text-xs muted">{pct.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="panel p-6 w-80 max-h-[80vh] overflow-y-auto">
            <h3 className="text-slate-900 font-semibold mb-2">Edit Holdings</h3>
            <p className="muted text-xs mb-4">
              Enter how many coins you own. Leave blank or 0 to remove.
            </p>

            <div className="space-y-3">
              {Object.keys(COIN_LABELS).map((id) => (
                <div key={id} className="flex items-center justify-between gap-3">
                  <label className="text-slate-700 text-sm w-20">
                    {COIN_LABELS[id]}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={draft[id] || ""}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [id]: e.target.value }))
                    }
                    className="flex-1 bg-slate-100 border border-slate-200 rounded px-3 py-1 text-slate-900 text-sm focus:outline-none focus:border-sky-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 border border-slate-200 text-slate-500 rounded px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 bg-sky-600 text-white rounded px-4 py-2 text-sm hover:bg-sky-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
