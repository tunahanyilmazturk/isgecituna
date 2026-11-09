import { describe, expect, it } from 'vitest'
import { usePersonelStore } from './personeller-store'

describe('katılımcı şifre yönetimi', () => {
  it('ilk girişte değişim zorunlu kılar ve oturumları kapatır', () => {
    const h = usePersonelStore.getState().hesaplar[0]
    expect(h).toBeDefined()
    usePersonelStore.getState().sifreSifirla(h.id, 'pbkdf2-sha256$600000$x$y', 'Yönetici Ayşe')
    const guncel = usePersonelStore.getState().hesaplar.find((x) => x.id === h.id)
    expect(guncel?.sifreDegisimZorunlu).toBe(true)
    expect(guncel?.sifreDegisimTarihi).toBeTruthy()
    expect(guncel?.oturumlar).toEqual([])
    expect(guncel?.sifreHash).toBe('pbkdf2-sha256$600000$x$y')
  })

  it('sıfırlama personel geçmişine yönetici adıyla yazılır', () => {
    const h = usePersonelStore.getState().hesaplar[0]
    usePersonelStore.getState().sifreSifirla(h.id, 'pbkdf2-sha256$600000$a$b', 'Yönetici Ayşe')
    const personel = usePersonelStore.getState().personeller.find((p) => p.id === h.personelId)
    const son = personel?.islemGecmisi.at(-1)
    expect(son?.islem).toContain('Yönetici Ayşe')
  })

  it('şifre belirleme işlemi değişim tarihini kaydeder', () => {
    const h = usePersonelStore.getState().hesaplar[0]
    usePersonelStore.getState().sifreDegistir(h.id, 'pbkdf2-sha256$600000$c$d')
    const guncel = usePersonelStore.getState().hesaplar.find((x) => x.id === h.id)
    expect(guncel?.sifreDegisimTarihi).toBeTruthy()
    expect(guncel?.sifreDegisimZorunlu).toBe(false)
  })
})
