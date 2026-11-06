import { useEffect, useState } from 'react'

const DB_NAME = 'isghub-egitim-dosyalari'
const STORE_NAME = 'dosyalar'
const REF_PREFIX = 'isghub-asset:'

const dbAc = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Dosya deposu açılamadı'))
  })

export const egitimDosyasiKaydet = async (file: File): Promise<string> => {
  const db = await dbAc()
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(file, id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Dosya kaydedilemedi'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Dosya kaydı iptal edildi'))
  })
  db.close()
  return `${REF_PREFIX}${id}`
}

const egitimDosyasiUrl = async (ref: string): Promise<string> => {
  if (!ref.startsWith(REF_PREFIX)) return ref
  const db = await dbAc()
  const id = ref.slice(REF_PREFIX.length)
  const file = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error ?? new Error('Dosya okunamadı'))
  })
  db.close()
  if (!file) throw new Error('Eğitim dosyası bulunamadı')
  return URL.createObjectURL(file)
}

export const useEgitimDosyaUrl = (ref?: string) => {
  // Sonuç, ürettiği ref ile birlikte tutulur; ref değiştiğinde eski URL effect içinde sıfırlanmadan düşer.
  const [sonuc, setSonuc] = useState<{ ref?: string; url?: string }>({})
  useEffect(() => {
    let aktif = true
    let olusanUrl: string | undefined
    if (ref) {
      void egitimDosyasiUrl(ref)
        .then((url) => {
          if (!aktif) {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url)
            return
          }
          if (url.startsWith('blob:')) olusanUrl = url
          setSonuc({ ref, url })
        })
        .catch(() => {
          if (aktif) setSonuc({ ref })
        })
    }
    return () => {
      aktif = false
      if (olusanUrl) URL.revokeObjectURL(olusanUrl)
    }
  }, [ref])
  return sonuc.ref === ref ? sonuc.url : undefined
}
