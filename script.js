/* =========================================================
   BRZY - script.js (FULL REPLACEMENT)
   Drop this in as your ONLY script.js

   Works with your current index IDs:
   bill, solarPayment, yearsRange, yearsDisplay, utilityEsc, solarEsc, runBtn
   utilTotal, solarTotal, savings
   snapYear, selMonthlyUtility, selMonthlySolar, selMonthlySavings, selAnnualSavings

   Battery section IDs (from your index):
   program, batteryModel, batteryQty, perf, usableKwh, powerKw
   calcBatteryBtn, monthlyCredit, arbitrageMonthly, creditNote
   season, shiftKwhDay, rte, calcArbBtn, arbDetail

   FAQ accordion IDs/classes:
   .faq-toggle with aria-controls pointing to panel IDs
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmtMoney0 = (n) =>
    (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const fmtMoney2 = (n) =>
    (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /* =========================================================
     1) MAIN SOLAR SAVINGS CALCULATOR (monthly compounding)
  ========================================================= */
  const billInput = $("bill");
  const solarInput = $("solarPayment");
  const yearsRange = $("yearsRange");
  const yearsDisplay = $("yearsDisplay");
  const utilityEscInput = $("utilityEsc"); // hidden fixed 0.09
  const solarEscSelect = $("solarEsc");
  const runBtn = $("runBtn");

  const utilTotalEl = $("utilTotal");
  const solarTotalEl = $("solarTotal");
  const savingsEl = $("savings");

  const snapYearEl = $("snapYear");
  const selMonthlyUtilityEl = $("selMonthlyUtility");
  const selMonthlySolarEl = $("selMonthlySolar");
  const selMonthlySavingsEl = $("selMonthlySavings");
  const selAnnualSavingsEl = $("selAnnualSavings");

  function annualToMonthlyRate(rAnnual) {
    const r = toNum(rAnnual, 0);
    if (!Number.isFinite(r) || r === 0) return 0;
    return Math.pow(1 + r, 1 / 12) - 1;
  }

  // sum monthly series over Y years using monthly compounded rate
  function sumSeries(month0, rAnnual, years) {
    const m0 = clamp(toNum(month0, 0), 0, 1e12);
    const Y = clamp(parseInt(years, 10) || 1, 1, 30);
    const rm = annualToMonthlyRate(rAnnual);

    let total = 0;
    let m = m0;
    for (let i = 0; i < Y * 12; i++) {
      total += m;
      m *= 1 + rm;
    }
    return total;
  }

  // monthly value at end of selected year (month Y*12)
  function monthAtEndOfYear(month0, rAnnual, year) {
    const m0 = clamp(toNum(month0, 0), 0, 1e12);
    const y = clamp(parseInt(year, 10) || 1, 1, 30);
    const rm = annualToMonthlyRate(rAnnual);
    const months = y * 12 - 1;
    return m0 * Math.pow(1 + rm, months);
  }

  function recalcMain() {
    if (!billInput || !solarInput || !yearsRange || !solarEscSelect) return;

    const bill = clamp(toNum(billInput.value, 0), 0, 1e9);
    const solar = clamp(toNum(solarInput.value, 0), 0, 1e9);
    const years = clamp(parseInt(yearsRange.value || "25", 10), 1, 30);

    const utilEsc = toNum(utilityEscInput?.value, 0.09);
    const solarEsc = toNum(solarEscSelect.value, 0);

    const utilTotal = sumSeries(bill, utilEsc, years);
    const solarTotal = sumSeries(solar, solarEsc, years);
    const savings = utilTotal - solarTotal;

    if (utilTotalEl) utilTotalEl.textContent = fmtMoney0(utilTotal);
    if (solarTotalEl) solarTotalEl.textContent = fmtMoney0(solarTotal);
    if (savingsEl) savingsEl.textContent = fmtMoney0(savings);

    if (yearsDisplay) yearsDisplay.textContent = String(years);
    if (snapYearEl) snapYearEl.textContent = String(years);

    const uM = monthAtEndOfYear(bill, utilEsc, years);
    const sM = monthAtEndOfYear(solar, solarEsc, years);
    const mS = uM - sM; // allow negative if solar > utility
    const aS = mS * 12;

    if (selMonthlyUtilityEl) selMonthlyUtilityEl.textContent = fmtMoney2(uM);
    if (selMonthlySolarEl) selMonthlySolarEl.textContent = fmtMoney2(sM);
    if (selMonthlySavingsEl) selMonthlySavingsEl.textContent = fmtMoney2(mS);
    if (selAnnualSavingsEl) selAnnualSavingsEl.textContent = fmtMoney2(aS);
  }

  function wireMain() {
    if (billInput) billInput.addEventListener("input", recalcMain);
    if (solarInput) solarInput.addEventListener("input", recalcMain);

    if (yearsRange) {
      yearsRange.addEventListener("input", () => {
        if (yearsDisplay) yearsDisplay.textContent = yearsRange.value;
        recalcMain();
      });
    }

    if (solarEscSelect) solarEscSelect.addEventListener("change", recalcMain);
    if (runBtn) runBtn.addEventListener("click", recalcMain);

    recalcMain();
  }

  /* =========================================================
     2) FAQ ACCORDION
  ========================================================= */
  function wireFAQ() {
    document.querySelectorAll(".faq-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("aria-controls");
        const panel = id ? document.getElementById(id) : null;
        const isOpen = btn.getAttribute("aria-expanded") === "true";

        // close others (one-at-a-time behavior)
        document
          .querySelectorAll('.faq-toggle[aria-expanded="true"]')
          .forEach((openBtn) => {
            if (openBtn !== btn) {
              openBtn.setAttribute("aria-expanded", "false");
              const openPanelId = openBtn.getAttribute("aria-controls");
              const openPanel = openPanelId
                ? document.getElementById(openPanelId)
                : null;
              if (openPanel) openPanel.setAttribute("hidden", "");
            }
          });

        btn.setAttribute("aria-expanded", String(!isOpen));
        if (panel) {
          if (isOpen) panel.setAttribute("hidden", "");
          else panel.removeAttribute("hidden");
        }
      });
    });
  }

  /* =========================================================
     3) BATTERY CREDIT + ARBITRAGE
     NOTE:
     - APS VPP/Storage payouts vary by program + season + performance.
       This uses a conservative ESTIMATE based on "committed additional kW"
       of ~2.0 kW per battery unless limited by discharge capacity.
     - SRP Battery Partner uses $55 per kW per season; 2 seasons/year.
       This returns an annualized monthly average.
  ========================================================= */

  // Only show Tesla PW3 and Franklin (as you requested)
  const BATTERIES = [
    {
      id: "PW3",
      label: "Tesla Powerwall 3",
      usableKwh: 13.5,
      powerKw: 11.5,
      defaultAddlKw: 2.0,
    },
    {
      id: "FRANKLIN",
      label: "FranklinWH (aPower)",
      usableKwh: 13.6,
      powerKw: 5.0,
      defaultAddlKw: 2.0,
    },
  ];

  const PROGRAMS = {
    APS_TESLA_VPP: {
      label: "APS Tesla VPP (Powerwall)",
      // Placeholder estimate — you can change these after you confirm APS exact $/kW terms
      ratePerKwSeason: 110, // dollars per kW per season (estimate)
      seasonsPerYear: 1, // one season (May-Oct)
      payoutNote:
        "APS VPP estimate uses assumed $/kW seasonal value and a typical additional event capacity estimate. Actual depends on APS terms + events + performance.",
    },
    SRP_BATTERY_PARTNER: {
      label: "SRP Battery Partner",
      ratePerKwSeason: 55, // dollars per kW per season (per SRP docs)
      seasonsPerYear: 2,
      payoutNote:
        "SRP Battery Partner uses $55 per kW per season (2 seasons/year). Displayed as an annualized monthly average. Actual depends on measured additional event capacity.",
    },
  };

  // Arbitrage delta assumptions ($/kWh value of shifting into peak)
  // This is NOT a utility credit; it's a rough value estimate.
  const ARB_DELTA = {
    SUMMER: 0.18,
    SUMMER_PEAK: 0.24,
    WINTER: 0.12,
  };

  const programSel = $("program");
  const batteryModelSel = $("batteryModel");
  const batteryQtyEl = $("batteryQty");
  const perfEl = $("perf");
  const usableKwhEl = $("usableKwh");
  const powerKwEl = $("powerKw");

  const calcBatteryBtn = $("calcBatteryBtn");
  const monthlyCreditEl = $("monthlyCredit");
  const arbitrageMonthlyEl = $("arbitrageMonthly");
  const creditNoteEl = $("creditNote");

  const seasonEl = $("season");
  const shiftKwhDayEl = $("shiftKwhDay");
  const rteEl = $("rte");
  const calcArbBtn = $("calcArbBtn");
  const arbDetailEl = $("arbDetail");

  function fillBatteryModels() {
    if (!batteryModelSel) return;
    batteryModelSel.innerHTML = BATTERIES.map(
      (b) => `<option value="${b.id}">${b.label}</option>`
    ).join("");
    if (!batteryModelSel.value) batteryModelSel.value = BATTERIES[0].id;
  }

  function getBattery() {
    const id = batteryModelSel?.value || BATTERIES[0].id;
    return BATTERIES.find((b) => b.id === id) || BATTERIES[0];
  }

  function updateBatteryDerived() {
    if (!batteryQtyEl || !perfEl || !usableKwhEl || !powerKwEl) return;

    const b = getBattery();
    const qty = clamp(parseInt(batteryQtyEl.value || "1", 10), 0, 99);
    const perf = clamp(toNum(perfEl.value, 0.85), 0, 1);

    const usable = b.usableKwh * qty * perf;
    const power = b.powerKw * qty * perf;

    usableKwhEl.value = usable.toFixed(1);
    powerKwEl.value = power.toFixed(1);
  }

  // Conservative additional event capacity estimate:
  // defaultAddlKw * qty * perf, capped by discharge capability
  function estimateAdditionalKw() {
    const b = getBattery();
    const qty = clamp(parseInt(batteryQtyEl?.value || "1", 10), 0, 99);
    const perf = clamp(toNum(perfEl?.value, 0.85), 0, 1);
    const dischargeCap = clamp(toNum(powerKwEl?.value, 0), 0, 1e6);

    const raw = b.defaultAddlKw * qty * perf;
    return clamp(raw, 0, dischargeCap);
  }

  function calcProgramCredit() {
    if (!programSel || !monthlyCreditEl || !creditNoteEl) return;

    updateBatteryDerived();

    const key = programSel.value || "SRP_BATTERY_PARTNER";
    const p = PROGRAMS[key] || PROGRAMS.SRP_BATTERY_PARTNER;

    const addlKw = estimateAdditionalKw();

    const annual = addlKw * p.ratePerKwSeason * p.seasonsPerYear;
    const monthlyAvg = annual / 12;

    monthlyCreditEl.textContent = fmtMoney0(monthlyAvg);

    const b = getBattery();
    creditNoteEl.textContent = `${p.payoutNote} Est. additional event capacity used: ${addlKw.toFixed(
      2
    )} kW. Battery: ${b.label}.`;
  }

  function calcArbitrage() {
    if (!seasonEl || !shiftKwhDayEl || !rteEl || !arbitrageMonthlyEl || !arbDetailEl)
      return;

    const season = seasonEl.value || "SUMMER";
    const kwhPerDay = clamp(toNum(shiftKwhDayEl.value, 10), 0, 300);
    const rte = clamp(toNum(rteEl.value, 0.9), 0, 1);

    const delta = ARB_DELTA[season] ?? ARB_DELTA.SUMMER;

    const monthly = kwhPerDay * 30 * delta * rte;

    arbitrageMonthlyEl.textContent = fmtMoney0(monthly);
    arbDetailEl.textContent = `Estimate uses value ${fmtMoney2(
      delta
    )} per kWh, ${kwhPerDay} kWh/day shifted, RTE ${Math.round(
      rte * 100
    )}%. Not a guaranteed credit.`;
  }

  function wireBattery() {
    // If battery section doesn't exist on page, skip quietly
    if (!programSel || !batteryModelSel) return;

    // Keep SRP + APS in the dropdown (you wanted SRP back)
    // If your HTML options differ, this still works as long as values match:
    // SRP_BATTERY_PARTNER and APS_TESLA_VPP
    fillBatteryModels();
    updateBatteryDerived();

    if (programSel)
      programSel.addEventListener("change", () => {
        updateBatteryDerived();
        calcProgramCredit();
      });

    if (batteryModelSel)
      batteryModelSel.addEventListener("change", () => {
        updateBatteryDerived();
        calcProgramCredit();
      });

    if (batteryQtyEl) {
      batteryQtyEl.addEventListener("input", updateBatteryDerived);
      batteryQtyEl.addEventListener("change", () => {
        updateBatteryDerived();
        calcProgramCredit();
      });
    }

    if (perfEl) {
      perfEl.addEventListener("input", updateBatteryDerived);
      perfEl.addEventListener("change", () => {
        updateBatteryDerived();
        calcProgramCredit();
      });
    }

    if (calcBatteryBtn) calcBatteryBtn.addEventListener("click", calcProgramCredit);
    if (calcArbBtn) calcArbBtn.addEventListener("click", calcArbitrage);

    calcProgramCredit();
    calcArbitrage();
  }

  /* ---------- init ---------- */
  wireMain();
  wireFAQ();
  wireBattery();
});
