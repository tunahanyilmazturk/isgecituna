import { describe, expect, it } from 'vitest'
import { sifreDogrula, sifreHashle, sifreYukseltilmeli } from './sifre'

/** Eski FNV-1a özeti — yalnızca eski kayıtların doğrulanabildiğini test etmek için. */
const eskiFnv = (s: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `fnv1a$${(h >>> 0).toString(16)}`
}

describe('sifreHashle / sifreDogrula', () => {
  it('doğru şifreyi kabul eder, yanlış şifreyi reddeder', async () => {
    const ozet = await sifreHashle('Gizli-1234')
    expect(ozet.startsWith('pbkdf2-sha256$600000$')).toBe(true)
    expect(await sifreDogrula('Gizli-1234', ozet)).toBe(true)
    expect(await sifreDogrula('Gizli-1235', ozet)).toBe(false)
  })

  it('aynı şifre için her seferinde farklı tuz üretir', async () => {
    const a = await sifreHashle('ayni-sifre')
    const b = await sifreHashle('ayni-sifre')
    expect(a).not.toBe(b)
    expect(await sifreDogrula('ayni-sifre', a)).toBe(true)
    expect(await sifreDogrula('ayni-sifre', b)).toBe(true)
  })

  it('kayıt yoksa ya da tanınmayan biçimse reddeder', async () => {
    expect(await sifreDogrula('x', undefined)).toBe(false)
    expect(await sifreDogrula('x', '')).toBe(false)
    expect(await sifreDogrula('x', 'bilinmeyen$format')).toBe(false)
  })

  it('eski FNV-1a kaydını doğrular', async () => {
    expect(await sifreDogrula('isg2026', eskiFnv('isg2026'))).toBe(true)
    expect(await sifreDogrula('isg2027', eskiFnv('isg2026'))).toBe(false)
  })
})

describe('sifreYukseltilmeli', () => {
  it('yalnızca eski biçim kayıtlarda true döner', async () => {
    expect(sifreYukseltilmeli(eskiFnv('x'))).toBe(true)
    expect(sifreYukseltilmeli(await sifreHashle('x'))).toBe(false)
    expect(sifreYukseltilmeli(undefined)).toBe(false)
  })
})
