// mfapi.in — free, no auth, CORS-enabled
const BASE = 'https://api.mfapi.in/mf';

// Search for scheme codes by fund name
export async function searchScheme(name) {
  try {
    const res = await fetch(`${BASE}/search?q=${encodeURIComponent(name)}`);
    const data = await res.json();
    return data || [];
  } catch { return []; }
}

// Get full historical NAV for a scheme code
export async function getSchemeNAV(schemeCode) {
  try {
    const res = await fetch(`${BASE}/${schemeCode}`);
    const data = await res.json();
    return data; // { meta, data: [{date, nav}] }
  } catch { return null; }
}

// Get latest NAV only (faster)
export async function getLatestNAV(schemeCode) {
  try {
    const res = await fetch(`${BASE}/${schemeCode}/latest`);
    const data = await res.json();
    return data;
  } catch { return null; }
}

// Calculate CAGR from historical NAV data
// Returns { cagr1Y, cagr3Y, cagr5Y, cagrInception, inceptionDate, currentNAV, inceptionNAV }
export function calculateCAGR(navData) {
  if (!navData?.data?.length) return null;
  
  const entries = navData.data
    .map(d => ({ date: parseAMFIDate(d.date), nav: parseFloat(d.nav) }))
    .filter(d => !isNaN(d.nav) && d.date)
    .sort((a, b) => b.date - a.date); // newest first

  if (entries.length < 2) return null;

  const latest = entries[0];
  const currentNAV = latest.nav;
  const today = latest.date;

  const cagrFor = (years) => {
    const targetDate = new Date(today);
    targetDate.setFullYear(targetDate.getFullYear() - years);
    // Find closest NAV entry to targetDate
    const closest = entries.reduce((prev, curr) => 
      Math.abs(curr.date - targetDate) < Math.abs(prev.date - targetDate) ? curr : prev
    );
    const actualYears = (today - closest.date) / (365.25 * 24 * 3600 * 1000);
    if (actualYears < years * 0.8) return null; // not enough history
    return (Math.pow(currentNAV / closest.nav, 1 / actualYears) - 1) * 100;
  };

  const oldest = entries[entries.length - 1];
  const inceptionYears = (today - oldest.date) / (365.25 * 24 * 3600 * 1000);
  const cagrInception = inceptionYears > 0.5
    ? (Math.pow(currentNAV / oldest.nav, 1 / inceptionYears) - 1) * 100
    : null;

  return {
    cagr1Y: cagrFor(1),
    cagr3Y: cagrFor(3),
    cagr5Y: cagrFor(5),
    cagrInception,
    inceptionDate: oldest.date,
    currentNAV,
    inceptionNAV: oldest.nav,
    inceptionYears: parseFloat(inceptionYears.toFixed(1)),
  };
}

// XIRR approximation for SIP given avg price, units, current NAV, monthly SIP amount
// Uses Newton-Raphson on the SIP cashflow model
export function estimateSIPXIRR(avgPrice, units, currentNAV, monthlySIP) {
  if (!avgPrice || !units || !currentNAV || !monthlySIP) return null;
  const invested = avgPrice * units;
  const currentValue = currentNAV * units;
  // Estimate months invested from avg cost and monthly SIP
  const months = Math.round(invested / monthlySIP);
  if (months < 1) return null;

  // Newton-Raphson XIRR on monthly cashflows
  const cashflows = Array.from({ length: months }, (_, i) => ({
    t: i / 12,        // years from start
    cf: -monthlySIP,  // outflow
  }));
  cashflows.push({ t: months / 12, cf: currentValue }); // final inflow

  let rate = 0.12; // initial guess 12%
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (const { t, cf } of cashflows) {
      const disc = Math.pow(1 + rate, t);
      npv += cf / disc;
      dnpv -= t * cf / (disc * (1 + rate));
    }
    const delta = npv / dnpv;
    rate -= delta;
    if (Math.abs(delta) < 1e-7) break;
    if (rate < -0.99) rate = -0.5;
    if (rate > 10) rate = 5;
  }
  return isFinite(rate) ? rate * 100 : null;
}

// Parse AMFI date format "dd-MMM-yyyy" or "dd-mm-yyyy"
function parseAMFIDate(str) {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
  const month = months[parts[1]] ?? (parseInt(parts[1]) - 1);
  return new Date(parseInt(parts[2]), month, parseInt(parts[0]));
}