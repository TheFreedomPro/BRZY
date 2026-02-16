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
  /* ===== BATTERY CREDIT + E-28 CALCULATOR ===== */

const batteryCatalog = {
  "Tesla Powerwall 3": { usableKwh: 13.5, dischargeKw: 11.5 },
  "Tesla Powerwall 2": { usableKwh: 13.5, dischargeKw: 5.0 },
  "FranklinWH aPower": { usableKwh: 13.6, dischargeKw: 5.0 },
  "Enphase IQ Battery 10T": { usableKwh: 10.0, dischargeKw: 3.84 }
};

const programs = {
  SRP_BATTERY_PARTNER: { annualDollarsPerKw: 110 },
  APS_TESLA_VPP: { annualDollarsPerKw: 110 }
};

const srpE28Rates = {
  SUMMER:      { on: 0.1891, superOff: 0.0401 },
  SUMMER_PEAK: { on: 0.4026, superOff: 0.0667 },
  WINTER:      { on: 0.1514, superOff: 0.0438 }
};

function money(n) {
  return (Number.isFinite(n) ? n : 0)
    .toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function initBatteryCalc() {
  const programEl = document.getElementById('program');
  const modelEl = document.getElementById('batteryModel');
  const qtyEl = document.getElementById('batteryQty');
  const perfEl = document.getElementById('perf');

  const usableEl = document.getElementById('usableKwh');
  const powerEl = document.getElementById('powerKw');

  const monthlyEl = document.getElementById('monthlyCredit');
  const arbMonthlyEl = document.getElementById('arbitrageMonthly');

  const seasonEl = document.getElementById('season');
  const shiftEl = document.getElementById('shiftKwhDay');
  const rteEl = document.getElementById('rte');
  const arbDetailEl = document.getElementById('arbDetail');

  const calcBatteryBtn = document.getElementById('calcBatteryBtn');
  const calcArbBtn = document.getElementById('calcArbBtn');

  if (!programEl) return; // prevent errors if section removed later

  modelEl.innerHTML = Object.keys(batteryCatalog)
    .map(name => `<option value="${name}">${name}</option>`)
    .join('');

  function syncBatteryFields() {
    const b = batteryCatalog[modelEl.value];
    const qty = Math.max(0, Number(qtyEl.value || 0));
    usableEl.value = (b.usableKwh * qty).toFixed(1);
    powerEl.value = (b.dischargeKw * qty).toFixed(1);
  }

  function calcProgramCredit() {
    syncBatteryFields();

    const b = batteryCatalog[modelEl.value];
    const qty = Math.max(0, Number(qtyEl.value || 0));
    const perf = Math.max(0, Math.min(1, Number(perfEl.value || 0)));
    const p = programs[programEl.value];

    const eligibleKw = b.dischargeKw * qty;
    const annual = eligibleKw * p.annualDollarsPerKw * perf;
    const monthly = annual / 12;

    monthlyEl.textContent = money(monthly);
  }

  function calcArbitrage() {
    const season = seasonEl.value;
    const rates = srpE28Rates[season];

    const shiftKwhDay = Math.max(0, Number(shiftEl.value || 0));
    const rte = Math.max(0.01, Math.min(1, Number(rteEl.value || 0.9)));

    const chargedKwhDay = shiftKwhDay / rte;
    const dailyValue = (shiftKwhDay * rates.on) - (chargedKwhDay * rates.superOff);
    const monthlyValue = dailyValue * 30;

    arbMonthlyEl.textContent = money(monthlyValue);

    if (arbDetailEl) {
      arbDetailEl.textContent =
        `Assumes charging in super off-peak and discharging into 6–9 p.m. on SRP E-28 using ${rte.toFixed(2)} efficiency.`;
    }
  }

  modelEl.addEventListener('change', syncBatteryFields);
  qtyEl.addEventListener('input', syncBatteryFields);

  calcBatteryBtn.addEventListener('click', calcProgramCredit);
  calcArbBtn.addEventListener('click', calcArbitrage);

  syncBatteryFields();
  calcProgramCredit();
  calcArbitrage();
}

initBatteryCalc();
  recalc();
});
