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
// ===============================
/* =========================
   APS BATTERY PROGRAM CREDIT
   Tesla Powerwall 3 + FranklinWH only
   ========================= */

(function () {
  const el = (id) => document.getElementById(id);

  const programEl = el("program");
  const modelEl = el("batteryModel");
  const qtyEl = el("batteryQty");
  const commitKwEl = el("commitKw");
  const perfEl = el("perf");

  const usableKwhEl = el("usableKwh");
  const powerKwEl = el("powerKw");
  const creditedKwEl = el("creditedKw");

  const btnEl = el("calcBatteryBtn");
  const monthlyCreditEl = el("monthlyCredit");
  const annualCreditEl = el("annualCredit");
  const noteEl = el("creditNote");

  if (!programEl || !modelEl || !btnEl) return;

  const BATTERIES = [
    { key: "TESLA_PW3", name: "Tesla Powerwall 3", usableKwh: 13.5, maxKw: 11.5 },
    { key: "FRANKLIN_AWH", name: "FranklinWH aPower", usableKwh: 13.6, maxKw: 5.0 },
  ];

  // public/filing-level references commonly cite ~$110 per kW-year for APS storage rewards style programs
  // we apply it to "credited avg kW", not max inverter kW.
  const APS_DOLLARS_PER_KW_YEAR = 110;

  const fmtMoney0 = (n) =>
    (isFinite(n) ? n : 0).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const fmtNum = (n, d = 1) => (isFinite(n) ? Number(n).toFixed(d) : "0.0");

  function clamp(n, min, max) {
    n = Number(n);
    if (!isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function currentBattery() {
    const key = modelEl.value;
    return BATTERIES.find((b) => b.key === key) || BATTERIES[0];
  }

  function seedModels() {
    modelEl.innerHTML = BATTERIES.map(
      (b) => `<option value="${b.key}">${b.name}</option>`
    ).join("");
  }

  function updateReadonlyFields() {
    const b = currentBattery();
    const qty = clamp(qtyEl?.value ?? 1, 1, 99);
    const perf = clamp(perfEl?.value ?? 0.85, 0, 1);

    // committed avg kW per battery should not exceed max kW
    const commitPerBatt = clamp(commitKwEl?.value ?? 2.0, 0, b.maxKw);

    const totalUsable = b.usableKwh * qty * perf;
    const creditedKw = commitPerBatt * qty * perf;

    if (usableKwhEl) usableKwhEl.value = fmtNum(totalUsable, 1);
    if (powerKwEl) powerKwEl.value = fmtNum(b.maxKw * qty, 1);
    if (creditedKwEl) creditedKwEl.value = fmtNum(creditedKw, 2);
  }

  function calcApsCredit() {
    const b = currentBattery();
    const qty = clamp(qtyEl?.value ?? 1, 1, 99);
    const perf = clamp(perfEl?.value ?? 0.85, 0, 1);

    const commitPerBatt = clamp(commitKwEl?.value ?? 2.0, 0, b.maxKw);
    const creditedKw = commitPerBatt * qty * perf;

    const annual = creditedKw * APS_DOLLARS_PER_KW_YEAR;
    const monthly = annual / 12;

    if (monthlyCreditEl) monthlyCreditEl.textContent = fmtMoney0(monthly);
    if (annualCreditEl) annualCreditEl.textContent = fmtMoney0(annual);

    if (noteEl) {
      noteEl.textContent =
        `Credited kW = (committed avg kW per battery) × qty × performance. ` +
        `Rate used: $${APS_DOLLARS_PER_KW_YEAR}/kW-year. ` +
        `Tip: if your reps see ~2 kW typical, keep committed avg kW at 2.0.`;
    }
  }

  seedModels();
  updateReadonlyFields();

  modelEl.addEventListener("change", updateReadonlyFields);
  if (qtyEl) qtyEl.addEventListener("input", updateReadonlyFields);
  if (perfEl) perfEl.addEventListener("input", updateReadonlyFields);
  if (commitKwEl) commitKwEl.addEventListener("input", updateReadonlyFields);

  btnEl.addEventListener("click", calcApsCredit);
})();
  recalc();
});
