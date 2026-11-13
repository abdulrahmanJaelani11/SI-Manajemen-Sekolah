export interface BobotConfig {
  bobotTugas: number
  bobotPts: number
  bobotPas: number
}

export function calculateNilaiAkhir(
  nilaiTugas: number,
  nilaiPts: number,
  nilaiPas: number,
  bobot: BobotConfig = { bobotTugas: 40, bobotPts: 25, bobotPas: 35 }
): number {
  const totalWeight = bobot.bobotTugas + bobot.bobotPts + bobot.bobotPas || 100
  const raw =
    (Number(nilaiTugas || 0) * bobot.bobotTugas +
      Number(nilaiPts || 0) * bobot.bobotPts +
      Number(nilaiPas || 0) * bobot.bobotPas) /
    totalWeight
  return Math.round(raw * 10) / 10
}

export function getPredikat(nilaiAkhir: number, kkm: number = 75): string {
  if (nilaiAkhir >= 90) return 'A'
  if (nilaiAkhir >= 80) return 'B'
  if (nilaiAkhir >= kkm) return 'C'
  return 'D'
}

export function getPredikatLabel(predikat: string): string {
  switch (predikat) {
    case 'A':
      return 'Sangat Baik'
    case 'B':
      return 'Baik'
    case 'C':
      return 'Cukup'
    default:
      return 'Perlu Bimbingan'
  }
}

