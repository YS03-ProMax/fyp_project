/** Clamp helper (0..100) */
const clamp01_100 = (x: number) => Math.max(0, Math.min(100, x));

/** --- Calculate DO saturation (mg/L) at 1 atm given temperature (°C) --- */
export function calcDOsat(temp: number): number {
  return (
    14.652 -
    0.41022 * temp +
    0.0079910 * temp * temp -
    0.000077774 * temp * temp * temp
  );
}

export function statusWQI(wqi: number): 'Polluted' | 'Slightly Polluted' | 'Clean' {
  if (wqi <= 59) return 'Polluted';
  if (wqi <= 80) return 'Slightly Polluted';
  return 'Clean';
}

export function getWqiStatus(wqi: number) {
  if (wqi >= 80) return { status: "Clean", color: "#2e7d32" }; // green
  if (wqi >= 60) return { status: "Slightly Polluted", color: "#388e3c" };
  if (wqi >= 0) return { status: "Polluted", color: "#f57c00" }; // orange
  return { status: "Very Poor", color: "#d32f2f" }; // red
}


/** --- Calculate DO % saturation from measured DO and temperature --- */
export function calcDOsatPercent(doMgL: number, temp: number): number {
  const dosat = calcDOsat(temp);
  if (dosat === 0) return 0;
  return (doMgL / dosat) * 100;
}

/** --- Subindex for DO (% saturation) --- */
export function calcSIDO(x: number): number {
  if (x <= 8) return 0;
  if (x >= 92) return 100;
  return clamp01_100(-0.395 + 0.030 * x * x - 0.00020 * Math.pow(x, 3));
}

/** --- Subindex for BOD --- */
export function calcSIBOD(x: number): number {
  if (x <= 5) return clamp01_100(100.4 - 4.23 * x);
  return clamp01_100(108 * Math.exp(-0.055 * x) - 0.1 * x);
}

/** --- Subindex for COD --- */
export function calcSICOD(x: number): number {
  if (x <= 20) return clamp01_100(-1.33 * x + 99.1);
  return clamp01_100(103 * Math.exp(-0.0157 * x) - 0.04 * x);
}

/** --- Subindex for NH3-N --- */
export function calcSIAN(x: number): number {
  if (x <= 0.3) return clamp01_100(100.5 - 105 * x);
  if (x < 4) return clamp01_100(94 * Math.exp(-0.573 * x) - 5 * Math.abs(x - 2));
  return 0;
}

/** --- Subindex for Suspended Solids (SS) --- */
export function calcSISS(x: number): number {
  if (x <= 100) return clamp01_100(97.5 * Math.exp(-0.00676 * x) + 0.05 * x);
  if (x < 1000) return clamp01_100(71 * Math.exp(-0.0016 * x) - 0.015 * x);
  return 0;
}

/** --- Subindex for pH --- */
export function calcSIpH(x: number): number {
  if (x < 5.5)   return clamp01_100(17.2 - 17.2 * x + 5.02 * x * x);
  if (x < 7.0)   return clamp01_100(-242 + 95.5 * x - 6.67 * x * x);
  if (x < 8.75)  return clamp01_100(-181 + 82.4 * x - 6.05 * x * x);
  return clamp01_100(536 - 77.0 * x + 2.76 * x * x);
}

/** --- Main WQI --- 
 * Inputs:
 *  - do: DO in % saturation (NOT mg/L)
 *  - bod, cod, ph, ammonia (NH3-N), ss (mg/L)
 */
export function calculateWQI(
  params: {
    do: number;
    bod: number;
    cod: number;
    ph: number;
    ammonia: number;
    ss: number;
  }
): number {
  const { do: doValue, bod, cod, ph, ammonia, ss } = params;
  const SIDO = calcSIDO(doValue);
  const SIBOD = calcSIBOD(bod);
  const SICOD = calcSICOD(cod);
  const SIAN = calcSIAN(ammonia);
  const SISS = calcSISS(ss);
  const SIpH = calcSIpH(ph);

  const wqi =
    0.22 * SIDO +
    0.19 * SIBOD +
    0.16 * SICOD +
    0.15 * SIAN +
    0.16 * SISS +
    0.12 * SIpH;

  return clamp01_100(wqi);
}

/** Optional: classify WQI (common Malaysia WQI bands) */
export function classifyWQI(wqi: number): 'Class I' | 'Class II' | 'Class III' | 'Class IV' | 'Class V' {
  if (wqi >= 92) return 'Class I';
  if (wqi >= 76) return 'Class II';
  if (wqi >= 51) return 'Class III';
  if (wqi >= 31) return 'Class IV';
  return 'Class V';

}