import { createJSONStorage, type StateStorage } from 'zustand/middleware'
import { toast } from 'sonner'

/**
 * Persist depolaması — tarayıcı localStorage kotası (genellikle ~5 MB) dolduğunda
 * yazma hatası sessizce yutulmaz: kullanıcıya bir kez bildirilir ve uygulama çökmez.
 * Kalıcı çözüm (büyük veri, paylaşım, yedekleme) sunucu tarafı depolamadır.
 */
let kotaUyarisiVerildi = false

const depo: StateStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      if (kotaUyarisiVerildi) return
      kotaUyarisiVerildi = true
      toast.error('Tarayıcı depolama alanı dolu; son değişiklikler kaydedilemedi. Verileri dışa aktarıp temizleyin.')
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      /* yoksay */
    }
  },
}

export const guvenliDepo = createJSONStorage(() => depo)
