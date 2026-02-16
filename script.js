// Solar Savings Calculator — clean, robust
document.addEventListener('DOMContentLoaded', () => {
  // Inputs
  const billInput         = document.getElementById('bill');
  const solarInput        = document.getElementById('solarPayment');
  const yearsRange        = document.getElementById('yearsRange');
  const yearsDisplay      = document.getElementById('yearsDisplay');
  const utilityEscInput   = document.getElementById('utilityEsc');  // fixed 9%
  const solarEscSelect    = document.getElementById('solarEsc');

  // Totals
  const utilTotalEl  = document.getElementById('utilTotal');
  const solarTotalEl = document.getElementById('solarTotal');
  const savingsEl    = document.getElementById('savings');

  // Snapshot
  const snapYearEl           = document.getElementById('snapYear');
  const selMonthlyUtilityEl  = document.getElementById('selMonthlyUtility');
  const selMonthlySolarEl    = document.getElementById('selMonthlySolar');
  const selMonthlySavingsEl  = document.getElementById('selMonthlySavings');
  const selAnnualSavingsEl   = document.getElementById('selAnnualSavings');

  const runBtn = document.getElementById('runBtn');

  // Helpers
  const fmtMoney = n =>
    (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Sum a monthly series with annual escalator r across Y years.
  // Treat inputs as dollars/month; escalator applies annually (compounded monthly).
  function sumSeries(month0, r, years) {
    const m0 = Math.max(0, Number(month0) || 0);
    const Y  = Math.max(1, Math.min(30, Number(years) || 1));
    const rm = Number(r) ? (1 + Number(r)) ** (1/12) - 1 : 0;  // convert annual to monthly
    let total = 0, m = m0;
    for (let i = 0; i < Y * 12; i++) {
      total += m;
      m *= (1 + rm);
    }
    return total;
  }

  function monthAtYear(month0, r, year) {
    const m0 = Math.max(0, Number(month0) || 0);
    const rm = Number(r) ? (1 + Number(r)) ** (1/12) - 1 : 0;
    const months = Math.max(0, (Number(year) || 1) * 12 - 1);
    return m0 * (1 + rm) ** months;
  }

  function recalc() {
    const bill   = parseFloat(billInput.value) || 0;
    const solar  = parseFloat(solarInput.value) || 0;
    const years  = Math.max(1, Math.min(30, parseInt(yearsRange.value || '25', 10)));

    const utilEsc = parseFloat(utilityEscInput.value || '0.09') || 0.09; // fixed 9%
    const solEsc = Number(solarEscSelect.value);

    // Totals
    const utilTotal  = sumSeries(bill,  utilEsc, years);
    const solarTotal = sumSeries(solar, solEsc,  years);
    const savings    = utilTotal - solarTotal;

    utilTotalEl.textContent  = fmtMoney(utilTotal);
    solarTotalEl.textContent = fmtMoney(solarTotal);
    savingsEl.textContent    = fmtMoney(savings);

    // Yearly snapshot (selected end year)
    yearsDisplay.textContent = years;
    snapYearEl.textContent   = years;

    const uM = monthAtYear(bill,  utilEsc, years);
    const sM = monthAtYear(solar, solEsc,  years);
    const mS = Math.max(0, uM - sM);
    const aS = mS * 12;

    selMonthlyUtilityEl.textContent = fmtMoney(uM);
    selMonthlySolarEl.textContent   = fmtMoney(sM);
    selMonthlySavingsEl.textContent = fmtMoney(mS);
    selAnnualSavingsEl.textContent  = fmtMoney(aS);
  }

  // Live interactions
  [billInput, solarInput].forEach(el => el.addEventListener('input', recalc));
  yearsRange.addEventListener('input', recalc);
  solarEscSelect.addEventListener('change', recalc);
  runBtn.addEventListener('click', recalc);
// --- TaxHive FAQ accordion ---
document.querySelectorAll('.faq-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.getAttribute('aria-controls');
    const panel = document.getElementById(id);
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    // Close any other open item (keep this if you want one-at-a-time behavior)
    document.querySelectorAll('.faq-toggle[aria-expanded="true"]').forEach(openBtn => {
      if (openBtn !== btn) {
        openBtn.setAttribute('aria-expanded', 'false');
        const openPanel = document.getElementById(openBtn.getAttribute('aria-controls'));
        openPanel && openPanel.setAttribute('hidden', '');
      }
    });

    // Toggle this one
    btn.setAttribute('aria-expanded', String(!isOpen));
    if (panel) {
      isOpen ? panel.setAttribute('hidden', '')
             : panel.removeAttribute('hidden');
    }
  });
});
  // First paint
/* ========= BRZY Calculator script.js (DROP-IN REPLACEMENT) ========= */

/* ---------- helpers ---------- */
const $ = (id) => document.getElementById(id);

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function money(n) {
  const x = Number.isFinite(n) ? n : 0;
  return x.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function money2(n) {
  const x = Number.isFinite(n) ? n : 0;
  return x.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* =========================================================
   1) MAIN SOLAR SAVINGS CALCULATOR
   IDs expected in index.html:
   bill, solarPayment, yearsRange, yearsDisplay, utilityEsc, solarEsc, runBtn
   utilTotal, solarTotal, savings
   snapYear, selMonthlyUtility, selMonthlySolar, selMonthlySavings, selAnnualSavings
========================================================= */

function calcTotals({ monthlyBill, monthlySolar, years, utilEsc, solarEsc }) {
  let utilTotal = 0;
  let solarTotal = 0;

  for (let y = 1; y <= years; y++) {
    const utilYear = monthlyBill * 12 * Math.pow(1 + utilEsc, y - 1);
    const solarYear = monthlySolar * 12 * Math.pow(1 + solarEsc, y - 1);
    utilTotal += utilYear;
    solarTotal += solarYear;
  }

  return { utilTotal, solarTotal, savings: utilTotal - solarTotal };
}

function snapshotYear({ monthlyBill, monthlySolar, year, utilEsc, solarEsc }) {
  const utilMonthly = monthlyBill * Math.pow(1 + utilEsc, year - 1);
  const solarMonthly = monthlySolar * Math.pow(1 + solarEsc, year - 1);
  const monthlySavings = utilMonthly - solarMonthly;
  const annualSavings = monthlySavings * 12;

  return { utilMonthly, solarMonthly, monthlySavings, annualSavings };
}

function runMainCalc() {
  const billEl = $("bill");
  const solarEl = $("solarPayment");
  const yearsEl = $("yearsRange");
  const utilEscEl = $("utilityEsc");
  const solarEscEl = $("solarEsc");

  if (!billEl || !solarEl || !yearsEl || !utilEscEl || !solarEscEl) return;

  const monthlyBill = clamp(toNum(billEl.value, 0), 0, 1e9);
  const monthlySolar = clamp(toNum(solarEl.value, 0), 0, 1e9);
  const years = clamp(parseInt(yearsEl.value || "25", 10), 1, 30);

  const utilEsc = clamp(toNum(utilEscEl.value, 0.09), 0, 0.5);
  const solarEsc = clamp(toNum(solarEscEl.value, 0), 0, 0.5);

  const totals = calcTotals({ monthlyBill, monthlySolar, years, utilEsc, solarEsc });
  const snap = snapshotYear({ monthlyBill, monthlySolar, year: years, utilEsc, solarEsc });

  const utilTotalEl = $("utilTotal");
  const solarTotalEl = $("solarTotal");
  const savingsEl = $("savings");

  if (utilTotalEl) utilTotalEl.textContent = money(totals.utilTotal);
  if (solarTotalEl) solarTotalEl.textContent = money(totals.solarTotal);
  if (savingsEl) savingsEl.textContent = money(totals.savings);

  const snapYearEl = $("snapYear");
  const selMonthlyUtilityEl = $("selMonthlyUtility");
  const selMonthlySolarEl = $("selMonthlySolar");
  const selMonthlySavingsEl = $("selMonthlySavings");
  const selAnnualSavingsEl = $("selAnnualSavings");

  if (snapYearEl) snapYearEl.textContent = String(years);
  if (selMonthlyUtilityEl) selMonthlyUtilityEl.textContent = money2(snap.utilMonthly);
  if (selMonthlySolarEl) selMonthlySolarEl.textContent = money2(snap.solarMonthly);
  if (selMonthlySavingsEl) selMonthlySavingsEl.textContent = money2(snap.monthlySavings);
  if (selAnnualSavingsEl) selAnnualSavingsEl.textContent = money2(snap.annualSavings);
}

function wireMainCalc() {
  const yearsEl = $("yearsRange");
  const yearsDisplayEl = $("yearsDisplay");
  const runBtn = $("runBtn");

  if (yearsEl && yearsDisplayEl) {
    yearsDisplayEl.textContent = yearsEl.value || "25";
    yearsEl.addEventListener("input", () => {
      yearsDisplayEl.textContent = yearsEl.value;
    });
    yearsEl.addEventListener("change", runMainCalc);
  }

  ["bill", "solarPayment", "solarEsc"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("change", runMainCalc);
  });

  if (runBtn) runBtn.addEventListener("click", runMainCalc);

  runMainCalc();
}

/* =========================================================
   2) BATTERY CREDIT + ARBITRAGE
   IDs expected in index.html:
   program, batteryModel, batteryQty, perf, usableKwh, powerKw
   calcBatteryBtn, monthlyCredit, arbitrageMonthly, creditNote
   season, shiftKwhDay, rte, calcArbBtn, arbDetail
========================================================= */

/*
SRP Battery Partner (Greater Grid / SRP):
$55 per kW of additional capacity delivered EACH SEASON
Two seasons per year => $110 per kW-year
This script shows an annualized monthly average: (kW * 110) / 12

APS Storage Rewards style language:
Up to $110 per kW averaged across events during May 1–Oct 31 season
This script uses $110 per kW-year and shows annualized monthly average: (kW * 110) / 12
*/

const BATTERIES = [
  {
    id: "PW3",
    label: "Tesla Powerwall 3",
    usableKwh: 13.5,
    powerKw: 11.5,
    defaultAddlKw: 2.0
  },
  {
    id: "FRANKLIN",
    label: "FranklinWH (aPower)",
    usableKwh: 13.6,
    powerKw: 5.0,
    defaultAddlKw: 2.0
  }
];

const PROGRAMS = {
  SRP_BATTERY_PARTNER: {
    label: "SRP Battery Partner",
    ratePerKwSeason: 55,
    seasonsPerYear: 2,
    payoutNote: "SRP Battery Partner: $55 per kW per season (2 seasons/year). Paid as bill credits after each season."
  },
  APS_TESLA_VPP: {
    label: "APS Storage Rewards / VPP",
    ratePerKwSeason: 110,
    seasonsPerYear: 1,
    payoutNote: "APS-style programs: up to $110 per kW for the May–Oct season (annualized here). Actual depends on performance/events."
  }
};

// Arbitrage $/kWh peak value (edit these if you want different assumptions)
const ARB_DELTA = {
  SUMMER: 0.18,
  SUMMER_PEAK: 0.24,
  WINTER: 0.12
};

function fillBatteryModels() {
  const modelSel = $("batteryModel");
  if (!modelSel) return;

  modelSel.innerHTML = BATTERIES.map(b => `<option value="${b.id}">${b.label}</option>`).join("");
  if (!modelSel.value) modelSel.value = BATTERIES[0].id;
}

function getSelectedBattery() {
  const modelSel = $("batteryModel");
  const id = modelSel ? modelSel.value : BATTERIES[0].id;
  return BATTERIES.find(b => b.id === id) || BATTERIES[0];
}

function updateBatteryDerived() {
  const qtyEl = $("batteryQty");
  const perfEl = $("perf");
  const usableEl = $("usableKwh");
  const powerEl = $("powerKw");

  if (!qtyEl || !perfEl || !usableEl || !powerEl) return;

  const b = getSelectedBattery();
  const qty = clamp(parseInt(qtyEl.value || "1", 10), 0, 99);
  const perf = clamp(toNum(perfEl.value, 0.85), 0, 1);

  const usable = b.usableKwh * qty * perf;
  const power = b.powerKw * qty * perf;

  usableEl.value = usable.toFixed(1);
  powerEl.value = power.toFixed(1);
}

function estimateAdditionalKw() {
  const qtyEl = $("batteryQty");
  const perfEl = $("perf");
  const powerEl = $("powerKw");

  const b = getSelectedBattery();
  const qty = clamp(parseInt(qtyEl?.value || "1", 10), 0, 99);
  const perf = clamp(toNum(perfEl?.value, 0.85), 0, 1);
  const dischargeCap = clamp(toNum(powerEl?.value, 0), 0, 1e6);

  // reps are saying ~2 kW typical; use 2.0 kW per battery as default additional event capacity estimate
  const raw = b.defaultAddlKw * qty * perf;

  // additional capacity can’t exceed discharge capability
  return clamp(raw, 0, dischargeCap);
}

function calcProgramCredit() {
  const programSel = $("program");
  const monthlyCreditEl = $("monthlyCredit");
  const creditNoteEl = $("creditNote");

  if (!programSel || !monthlyCreditEl || !creditNoteEl) return;

  const programKey = programSel.value || "SRP_BATTERY_PARTNER";
  const p = PROGRAMS[programKey] || PROGRAMS.SRP_BATTERY_PARTNER;

  updateBatteryDerived();

  const addlKw = estimateAdditionalKw();

  const annual = addlKw * p.ratePerKwSeason * p.seasonsPerYear;
  const monthlyAvg = annual / 12;

  monthlyCreditEl.textContent = money(monthlyAvg);

  const model = getSelectedBattery();
  creditNoteEl.textContent =
    `${p.payoutNote} Estimated additional event capacity used: ${addlKw.toFixed(2)} kW. Battery: ${model.label}.`;
}

function calcArbitrage() {
  const seasonEl = $("season");
  const shiftEl = $("shiftKwhDay");
  const rteEl = $("rte");

  const outEl = $("arbitrageMonthly");
  const detailEl = $("arbDetail");

  if (!seasonEl || !shiftEl || !rteEl || !outEl || !detailEl) return;

  const season = seasonEl.value || "SUMMER";
  const kwhPerDay = clamp(toNum(shiftEl.value, 10), 0, 200);
  const rte = clamp(toNum(rteEl.value, 0.9), 0, 1);

  const delta = ARB_DELTA[season] ?? ARB_DELTA.SUMMER;

  // simple estimate: value = shifted_kWh * peak_delta * efficiency
  const monthly = kwhPerDay * 30 * delta * rte;

  outEl.textContent = money(monthly);
  detailEl.textContent =
    `Estimate uses peak value ${money2(delta)} per kWh, ${kwhPerDay} kWh/day shifted, round-trip efficiency ${Math.round(rte * 100)}%. This is NOT a guaranteed bill credit.`;
}

function wireBatteryCalc() {
  const programSel = $("program");
  const modelSel = $("batteryModel");
  const qtyEl = $("batteryQty");
  const perfEl = $("perf");

  const btnCredit = $("calcBatteryBtn");
  const btnArb = $("calcArbBtn");

  fillBatteryModels();
  updateBatteryDerived();

  if (programSel) programSel.addEventListener("change", () => { updateBatteryDerived(); calcProgramCredit(); });
  if (modelSel) modelSel.addEventListener("change", () => { updateBatteryDerived(); calcProgramCredit(); });
  if (qtyEl) qtyEl.addEventListener("input", () => { updateBatteryDerived(); });
  if (qtyEl) qtyEl.addEventListener("change", () => { updateBatteryDerived(); calcProgramCredit(); });
  if (perfEl) perfEl.addEventListener("input", () => { updateBatteryDerived(); });
  if (perfEl) perfEl.addEventListener("change", () => { updateBatteryDerived(); calcProgramCredit(); });

  if (btnCredit) btnCredit.addEventListener("click", calcProgramCredit);
  if (btnArb) btnArb.addEventListener("click", calcArbitrage);

  // seed outputs
  calcProgramCredit();
  calcArbitrage();
}

/* ---------- init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  wireMainCalc();
  wireBatteryCalc();
});
  recalc();
});
