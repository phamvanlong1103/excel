import { defineStore } from 'pinia'
import Papa from 'papaparse'
import { rollup } from 'd3-array'

export type Row = Record<string, any>

export const useSummaryStore = defineStore('summary', {
  state: () => ({
    rows: [] as Row[],
    columns: [] as string[]
  }),
  actions: {
    async loadCsv(file: File) {
      return new Promise<void>((resolve, reject) => {
        Papa.parse<Row>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: h => h.trim(),
          complete: res => {
            this.rows = res.data
            this.columns = res.meta.fields || []
            resolve()
          },
          error: err => reject(err)
        })
      })
    }
  },
  getters: {
    summarize: state => (
      groupCol: string,
      valueCol: string,
      filterCol: string | null,
      filterVal: string | null
    ): Record<string, number> => {
      let data = state.rows
      if (filterCol && filterVal) {
        data = data.filter(r => String(r[filterCol]) === filterVal)
      }
      const numericAll = data.every(r => !isNaN(Number(r[valueCol])))
      return Object.fromEntries(
        rollup(
          data,
          v => numericAll
            ? v.reduce((sum, r) => sum + Number(r[valueCol] || 0), 0)
            : v.length,
          r => String(r[groupCol] || '').trim()
        )
      )
    }
  }
})
