// Placeholder for App.js from canvas

// Moonshot V1 - Create React App Version
// Full CRA structure for Vercel compatibility

import React, { useState, useEffect } from "react";
import "./App.css";

const POLYGON_API_KEY = "VbcF6B4XePSbLsZCpGEx3SnmSQFP7BQC";
const USD_TO_CAD = 1.36035;

function App() {
  const [simPrice, setSimPrice] = useState(0);
  const [simShares, setSimShares] = useState(1000);
  const [simResult, setSimResult] = useState(null);
  const [altSimResults, setAltSimResults] = useState([]);
  const [redFlags, setRedFlags] = useState({ earningsSoon: false, dilutionRisk: false, splitUpcoming: false });
  const [filingHeadlines, setFilingHeadlines] = useState([]);
  const [buyDisabled, setBuyDisabled] = useState(false);
  const [price] = useState(0.5); // Placeholder price for now
  const [signal] = useState({ ticker: "OST" }); // Placeholder ticker

  const toCAD = (usd) => (usd * USD_TO_CAD).toFixed(2);

  const runSimulator = () => {
    const cost = price * simShares;
    const resultGain = (simPrice - price) * simShares;
    setSimResult({
      cost: cost.toFixed(2),
      costCAD: toCAD(cost),
      gain: resultGain.toFixed(2),
      gainCAD: toCAD(resultGain),
      roi: ((resultGain / cost) * 100).toFixed(1)
    });

    const up10 = price * 1.10;
    const down10 = price * 0.90;
    const gain10 = (up10 - price) * simShares;
    const loss10 = (down10 - price) * simShares;
    setAltSimResults([
      {
        label: "+10% Target",
        price: up10.toFixed(2),
        priceCAD: toCAD(up10),
        gain: gain10.toFixed(2),
        gainCAD: toCAD(gain10),
        roi: ((gain10 / cost) * 100).toFixed(1)
      },
      {
        label: "-10% Stop",
        price: down10.toFixed(2),
        priceCAD: toCAD(down10),
        gain: loss10.toFixed(2),
        gainCAD: toCAD(loss10),
        roi: ((loss10 / cost) * 100).toFixed(1)
      }
    ]);
  };

  const checkRedFlags = async (ticker) => {
    const now = new Date();
    const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const newsRes = await fetch(
        `https://api.polygon.io/v2/reference/news?ticker=${ticker}&limit=5&order=desc&sort=published_utc&published_utc.gte=${pastWeek}&apiKey=${POLYGON_API_KEY}`
      );

      const newsData = await newsRes.json();
      const headlines = newsData?.results?.map(n => n.title) || [];
      setFilingHeadlines(headlines);

      const dilutionRisk = headlines.some(h => /s-3|atm|dilution|offering|securities/i.test(h));
      const earningsSoon = headlines.some(h => /earnings|quarter|results|Q[1-4]/i.test(h));
      const splitUpcoming = headlines.some(h => /split|reverse/i.test(h));

      const redFlagsDetected = dilutionRisk || earningsSoon || splitUpcoming;
      setBuyDisabled(redFlagsDetected);
      setRedFlags({ dilutionRisk, earningsSoon, splitUpcoming });
    } catch (err) {
      console.error("Failed to fetch red flag data:", err);
      setFilingHeadlines([]);
      setRedFlags({ dilutionRisk: false, earningsSoon: false, splitUpcoming: false });
      setBuyDisabled(false);
    }
  };

  useEffect(() => {
    checkRedFlags(signal.ticker);
  }, [signal.ticker]);

  return (
    <div className="App">
      <h1>Moonshot Signal Tracker</h1>

      <div className="card">
        <h2>🚩 Red Flag Scanner</h2>
        <ul>
          {redFlags.earningsSoon && <li>📅 Possible upcoming earnings event</li>}
          {redFlags.dilutionRisk && <li>💧 Potential dilution (recent offering/S-3 filing)</li>}
          {redFlags.splitUpcoming && <li>🔀 Reverse split may be planned</li>}
          {!redFlags.earningsSoon && !redFlags.dilutionRisk && !redFlags.splitUpcoming && (
            <li>✅ No red flags detected in latest headlines</li>
          )}
        </ul>
        {filingHeadlines.length > 0 && (
          <div>
            <strong>📰 Recent Headlines:</strong>
            <ul>
              {filingHeadlines.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h2>🧪 Trade Simulator</h2>
        <p>
          Simulate Buying {simShares} shares @ ${price} (≈ CAD ${toCAD(price)}) and selling at:
        </p>
        <input
          type="number"
          value={simPrice}
          onChange={(e) => setSimPrice(parseFloat(e.target.value))}
          placeholder="Enter target sell price (e.g. 0.75)"
        />
        <button onClick={runSimulator} disabled={buyDisabled}>
          {buyDisabled ? "⚠️ Trade Disabled Due to Red Flags" : "Run Simulation"}
        </button>

        {simResult && (
          <div className="result">
            <div>🎯 Manual Target Result:</div>
            Cost: ${simResult.cost} (≈ CAD ${simResult.costCAD})<br />
            Gain/Loss: ${simResult.gain} (≈ CAD ${simResult.gainCAD})<br />
            ROI: {simResult.roi}%
          </div>
        )}

        {altSimResults.length > 0 && (
          <div className="result">
            <div><strong>📊 +10% and -10% Scenarios:</strong></div>
            {altSimResults.map((res, i) => (
              <div key={i}>
                {res.label}: Sell at ${res.price} (≈ CAD ${res.priceCAD}), Gain/Loss: ${res.gain} (≈ CAD ${res.gainCAD}), ROI: {res.roi}%
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
