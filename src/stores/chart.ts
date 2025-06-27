import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ChartConfig {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'card'
  dataSourceId: string
  xAxis?: string | string[]
  yAxis?: string
  category?: string
  title: string
  backgroundColor: string
  borderColor: string
  createdAt: Date
  horizontal?: boolean // for bar chart orientation
  colorScheme?: string // for bar chart color scheme
  keyMetric?: string // for card chart
  previousMetric?: string // for card chart
  differenceType?: 'percentage' | 'value' // for card chart
}

export const useChartStore = defineStore('chart', () => {
  const charts = ref<ChartConfig[]>([])

  const getChartById = computed(() => {
    return (id: string) => charts.value.find(c => c.id === id)
  })

  const getChartsByDataSource = computed(() => {
    return (dataSourceId: string) => charts.value.filter(c => c.dataSourceId === dataSourceId)
  })

  const loadFromStorage = () => {
    const stored = localStorage.getItem('bi-charts')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        charts.value = parsed.map((chart: any) => ({
          ...chart,
          createdAt: new Date(chart.createdAt)
        }))
      } catch (e) {
        console.error('Failed to load charts from storage:', e)
      }
    }
  }

  const saveToStorage = () => {
    localStorage.setItem('bi-charts', JSON.stringify(charts.value))
  }

  const createChart = (config: Omit<ChartConfig, 'id' | 'createdAt'>) => {
    const chart: ChartConfig = {
      ...config,
      id: Date.now().toString(),
      createdAt: new Date()
    }
    charts.value.push(chart)
    saveToStorage()
    return chart
  }

  const updateChart = (id: string, updates: Partial<ChartConfig>) => {
    const chart = charts.value.find(c => c.id === id)
    if (chart) {
      Object.assign(chart, updates)
      saveToStorage()
    }
  }

  const deleteChart = (id: string) => {
    const index = charts.value.findIndex(c => c.id === id)
    if (index > -1) {
      charts.value.splice(index, 1)
      saveToStorage()
    }
  }

  // Initialize from storage
  loadFromStorage()

  return {
    charts,
    getChartById,
    getChartsByDataSource,
    createChart,
    updateChart,
    deleteChart
  }
})