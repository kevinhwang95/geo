//areaCalculator.ts
export function areaCalculatorToRaiNganTarangWa(decimalRai: number): {rai: number, ngan: number, tarangWa: number} {
  // Calculate full Rai
  const fullRai = Math.floor(decimalRai);

  // Calculate remaining Ngan from the decimal part
  const remainingRai = decimalRai - fullRai;
  const totalNgan = remainingRai * 4;
  const fullNgan = Math.floor(totalNgan);

  // Calculate remaining Tarang Wa from the decimal part of Ngan
  const remainingNgan = totalNgan - fullNgan;
  const tarangWa = Math.round(remainingNgan * 100); // Round to nearest whole number for Tarang Wa

  return {
      rai: fullRai,
      ngan: fullNgan,
      tarangWa: tarangWa,
  };
}

export function areaCalculatorToDecimalRai(rai: number, ngan: number, tarangWa: number): number {
  return rai + (ngan / 4) + (tarangWa / 100);
}

/**
 * Convert land size from square meters to Thai units display string
 * @param raiValue - Size in rai
 * @param t - Translation function for getting unit labels
 * @returns Formatted string with Thai units (rai, ngan, tarang wa)
 */
export function formatLandSizeToThaiUnits(raiValue: number, t: (key: string) => string): string {

  const breakdown = areaCalculatorToRaiNganTarangWa(raiValue);
  
  const parts = [];
  if (breakdown.rai > 0) {
    parts.push(`${breakdown.rai} ${t('dashboard.lands.wa')}`);
  }
  if (breakdown.ngan > 0) {
    parts.push(`${breakdown.ngan} ${t('dashboard.lands.ngan')}`);
  }
  if (breakdown.tarangWa > 0) {
    parts.push(`${breakdown.tarangWa} ${t('dashboard.lands.tarangWa')}`);
  }
  
  return parts.length > 0 ? parts.join(' ') : `0 ${t('dashboard.lands.wa')}`;
}