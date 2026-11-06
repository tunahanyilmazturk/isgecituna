export const formatKisa = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })

export const gunFarki = (from: string, to: string) =>
  Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000)

/** "4 Kasım 2026 Salı" biçiminde okunabilir tarih */
export const formatUzun = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  })

/** ISO (saatli olabilir) → "Bugün 14:22" / "Dün" / "3 gün önce" */
export const zamanOnce = (iso: string, bugun: string) => {
  const gun = gunFarki(iso.slice(0, 10), bugun)
  if (gun <= 0) {
    const saat = iso.slice(11, 16)
    return saat ? `Bugün ${saat}` : 'Bugün'
  }
  if (gun === 1) return 'Dün'
  if (gun < 30) return `${gun} gün önce`
  const ay = Math.floor(gun / 30)
  return ay === 1 ? '1 ay önce' : `${ay} ay önce`
}

/** ISO tarihten N gün geriye/ileriye kaydırılmış tarih */
export const gunKaydir = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Son N ayın YYYY-MM etiket listesi (bugunun ayı dahil, eski→yeni) */
export const sonAylar = (bugun: string, n: number) => {
  const [y, m] = bugun.split('-').map(Number)
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

export const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
export const ayKisa = (ym: string) => AY_KISA[Number(ym.split('-')[1]) - 1]
