import React, { useMemo } from "react";

/**
 * OptionsChain
 *
 * Props:
 * - ticker: string
 * - chainData: {
 *     calls: Array<{ strike, bid, ask, volume, openInterest, impliedVolatility }>,
 *     puts:  Array<{ strike, bid, ask, volume, openInterest, impliedVolatility }>
 *   }
 * - currentPrice: number
 */
const OptionsChain = ({ ticker, chainData, currentPrice }) => {
  const { calls = [], puts = [] } = chainData || {};

  // Build a unified list of strikes from both calls and puts
  const rows = useMemo(() => {
    const strikeSet = new Set();
    calls.forEach((c) => strikeSet.add(c.strike));
    puts.forEach((p) => strikeSet.add(p.strike));

    const allStrikes = Array.from(strikeSet).filter(
      (s) => typeof s === "number" && !Number.isNaN(s)
    );
    allStrikes.sort((a, b) => a - b);

    return allStrikes.map((strike) => {
      const call = calls.find((c) => c.strike === strike) || {};
      const put = puts.find((p) => p.strike === strike) || {};
      return { strike, call, put };
    });
  }, [calls, puts]);

  const atTheMoneyStrike = useMemo(() => {
    if (!rows.length || typeof currentPrice !== "number") return null;
    let bestStrike = rows[0].strike;
    let bestDiff = Math.abs(rows[0].strike - currentPrice);
    for (let i = 1; i < rows.length; i += 1) {
      const diff = Math.abs(rows[i].strike - currentPrice);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestStrike = rows[i].strike;
      }
    }
    return bestStrike;
  }, [rows, currentPrice]);

  const formatNumber = (value, decimals = 2) => {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return "—";
    }
    return Number(value).toFixed(decimals);
  };

  const formatIv = (iv) => {
    if (iv === undefined || iv === null || Number.isNaN(iv)) {
      return "—";
    }
    // yfinance IV is usually in decimal (e.g. 0.25 = 25%)
    return `${(Number(iv) * 100).toFixed(1)}%`;
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-lg border border-slate-800 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold tracking-wide text-slate-50">
            Options Chain
          </h2>
          {ticker && (
            <span className="text-sm font-mono text-emerald-400">
              {ticker.toUpperCase()}
            </span>
          )}
        </div>
        {typeof currentPrice === "number" && (
          <div className="text-xs sm:text-sm text-slate-300 font-mono">
            Spot:{" "}
            <span className="text-emerald-400">
              {formatNumber(currentPrice, 2)}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm font-mono border-t border-slate-800">
          <thead className="bg-slate-900/90">
            <tr className="text-slate-300 text-[11px] sm:text-xs uppercase tracking-wide">
              <th
                colSpan={5}
                className="px-2 py-2 text-left border-r border-slate-800 text-emerald-300"
              >
                Calls
              </th>
              <th className="px-2 py-2 text-center border-r border-slate-800 text-slate-400">
                Strike
              </th>
              <th
                colSpan={5}
                className="px-2 py-2 text-right text-rose-300"
              >
                Puts
              </th>
            </tr>
            <tr className="text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wide border-b border-slate-800">
              <th className="px-2 py-1 text-left">Bid</th>
              <th className="px-2 py-1 text-left">Ask</th>
              <th className="px-2 py-1 text-right">Vol</th>
              <th className="px-2 py-1 text-right">OI</th>
              <th className="px-2 py-1 text-right border-r border-slate-800">
                IV
              </th>
              <th className="px-2 py-1 text-center border-r border-slate-800">
                Strike
              </th>
              <th className="px-2 py-1 text-left">Bid</th>
              <th className="px-2 py-1 text-left">Ask</th>
              <th className="px-2 py-1 text-right">Vol</th>
              <th className="px-2 py-1 text-right">OI</th>
              <th className="px-2 py-1 text-right">IV</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ strike, call, put }) => {
              const isAtm = atTheMoneyStrike === strike;
              return (
                <tr
                  key={strike}
                  className={[
                    "border-t border-slate-900/60",
                    "hover:bg-slate-900/60 transition-colors",
                    isAtm ? "bg-slate-900/80" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* Calls */}
                  <td className="px-2 py-1 text-left bg-emerald-950/30 text-emerald-300">
                    {formatNumber(call.bid)}
                  </td>
                  <td className="px-2 py-1 text-left bg-emerald-950/30 text-emerald-200">
                    {formatNumber(call.ask)}
                  </td>
                  <td className="px-2 py-1 text-right bg-emerald-950/20 text-emerald-200">
                    {call.volume ?? "—"}
                  </td>
                  <td className="px-2 py-1 text-right bg-emerald-950/20 text-emerald-200">
                    {call.openInterest ?? "—"}
                  </td>
                  <td className="px-2 py-1 text-right bg-emerald-950/10 text-emerald-200 border-r border-slate-800">
                    {formatIv(call.impliedVolatility)}
                  </td>

                  {/* Strike */}
                  <td
                    className={[
                      "px-2 py-1 text-center border-r border-slate-800",
                      isAtm
                        ? "bg-slate-900 text-amber-300 font-semibold"
                        : "bg-slate-950 text-slate-100",
                    ].join(" ")}
                  >
                    {formatNumber(strike, 2)}
                  </td>

                  {/* Puts */}
                  <td className="px-2 py-1 text-left bg-rose-950/30 text-rose-300">
                    {formatNumber(put.bid)}
                  </td>
                  <td className="px-2 py-1 text-left bg-rose-950/30 text-rose-200">
                    {formatNumber(put.ask)}
                  </td>
                  <td className="px-2 py-1 text-right bg-rose-950/20 text-rose-200">
                    {put.volume ?? "—"}
                  </td>
                  <td className="px-2 py-1 text-right bg-rose-950/20 text-rose-200">
                    {put.openInterest ?? "—"}
                  </td>
                  <td className="px-2 py-1 text-right bg-rose-950/10 text-rose-200">
                    {formatIv(put.impliedVolatility)}
                  </td>
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-6 text-center text-slate-500 text-sm"
                >
                  No options data available for this ticker / expiry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OptionsChain;

