// Türkçe Excel uyumu için UTF-8 BOM + noktalı virgül ayıracı
export function downloadCsv(dosyaAdi: string, rows: (string | number | undefined)[][]) {
  const hucre = (v: string | number | undefined) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const csv = '﻿' + rows.map((r) => r.map(hucre).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: dosyaAdi })
  a.click()
  URL.revokeObjectURL(url)
}
