/*
 * Risk modülü kayıt kapsamı — genel kapsam çözümleyicinin 'risk' modülü
 * için bağlanmış hâli. Bkz. src/lib/kapsam.ts
 */
import { kapsamdaMi as _k, useKapsam, type Kapsam } from '@/lib/kapsam'

export type RiskKapsam = Kapsam

export const useRiskKapsam = (): RiskKapsam => useKapsam('risk')

export const kapsamdaMi = _k
