import { defineStore } from 'pinia'
import Papa from 'papaparse'

export interface Row { [key: string]: any }

/* Chuyển "70.000" / "90,000" / "1 200" => 70000 / 90000 / 1200 */
function toNumber(v: any): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const cleaned = v.replace(/\s+/g, '')            // xoá khoảng trắng
                     .replace(/\.(?=\d{3})/g, '')   // bỏ dot ngăn ngàn
                     .replace(/,(?=\d{3})/g, '')
                     .replace(',', '.')               // đổi dấu phẩy thập phân
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export const useCsvStore = defineStore('csv', {
  state: () => ({
    rows: [] as Row[],
    columns: [] as string[]
  }),

  actions: {
    /** Đọc CSV vào state */
    loadFile(file: File) {
      return new Promise<void>((resolve, reject) => {
        Papa.parse<Row>(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          transformHeader: h => h.trim(),
          complete: res => {
            this.rows    = res.data
            this.columns = res.meta.fields ?? []
            resolve()
          },
          error: err => reject(err)
        })
      })
    }
  },

  getters: {
    /**
     * Tính tổng hoặc đếm theo cột
     * - prodCol: cột nhóm (khách / sản phẩm ...)
     * - qtyCol : cột số liệu cần SUM hoặc COUNT
     * - normalize: true => toLowerCase + trim để gộp ignore‑case
     *   Đồng thời FILL‑DOWN giá trị prodCol nếu ô trống (do merge cell Excel)
     */
    totals: s => (prodCol: string, qtyCol: string, normalize = false) => {
      if (!prodCol || !qtyCol) return {}
      const numeric = s.rows.some(r => toNumber(r[qtyCol]) !== null)

      const acc: Record<string, number> = {}
      let lastKey = ''

      for (const row of s.rows) {
        let keyRaw = String(row[prodCol] ?? '').trim()
        if (!keyRaw) keyRaw = lastKey          // fill‑down khi ô trống
        if (!keyRaw) continue                  // bỏ dòng nếu vẫn trống đầu bảng

        let key = normalize ? keyRaw.toLowerCase() : keyRaw
        lastKey = key                          // cập nhật lastKey cho dòng sau

        if (numeric) {
          const val = toNumber(row[qtyCol])
          if (val !== null) acc[key] = (acc[key] || 0) + val
        } else {
          acc[key] = (acc[key] || 0) + 1       // COUNT row
        }
      }

      return acc
    }
  }
})
