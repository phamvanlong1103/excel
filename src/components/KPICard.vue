<template>
  <div class="h-full bg-white rounded-lg shadow-sm overflow-hidden">
    <div class="h-full flex flex-col p-4">
      <div v-if="chart.title" class="mb-3">
        <h3 class="text-sm font-medium text-gray-900 truncate">{{ chart.title }}</h3>
      </div>
      
      <div v-if="error" class="flex items-center justify-center h-full text-red-500 text-sm">
        <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
        {{ error }}
      </div>
      
      <div v-else-if="!hasValidData" class="flex items-center justify-center h-full text-gray-500 text-sm">
        <ChartBarIcon class="h-8 w-8 mr-2" />
        No data available
      </div>
      
      <div v-else class="flex-1 flex flex-col justify-center">
        <!-- Key Metric -->
        <div class="text-center mb-2">
          <div class="text-2xl font-bold text-gray-900">
            {{ formatValue(keyMetricValue) }}
          </div>
          <div class="text-xs text-gray-500 uppercase tracking-wide">
            {{ chart.keyMetric }}
          </div>
        </div>
        
        <!-- Difference -->
        <div v-if="chart.previousMetric && previousMetricValue !== null" class="text-center">
          <div class="flex items-center justify-center">
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800': difference > 0,
                'bg-red-100 text-red-800': difference < 0,
                'bg-gray-100 text-gray-800': difference === 0
              }"
            >
              <ArrowUpIcon v-if="difference > 0" class="h-3 w-3 mr-1" />
              <ArrowDownIcon v-if="difference < 0" class="h-3 w-3 mr-1" />
              <MinusIcon v-if="difference === 0" class="h-3 w-3 mr-1" />
              {{ formatDifference(difference) }}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            vs {{ formatValue(previousMetricValue) }} ({{ chart.previousMetric }})
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon
} from '@heroicons/vue/24/outline'
import { useDataSourceStore } from '../stores/dataSource'
import type { ChartConfig } from '../stores/chart'

interface Props {
  chart: Partial<ChartConfig>
}

const props = defineProps<Props>()
const dataSourceStore = useDataSourceStore()

const hasValidData = computed(() => {
  if (!props.chart.dataSourceId || !props.chart.keyMetric) return false
  const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId)
  return !!(dataSource && dataSource.rows.length > 0)
})

const error = computed(() => {
  if (!props.chart.dataSourceId) return 'No data source selected'
  if (!props.chart.keyMetric) return 'No key metric selected'
  
  const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId)
  if (!dataSource) return 'Data source not found'
  
  const keyColumn = dataSource.columns.find(c => c.name === props.chart.keyMetric)
  if (!keyColumn) return 'Key metric column not found'
  
  if (keyColumn.type !== 'number') return 'Key metric must be a numeric field'
  
  if (props.chart.previousMetric) {
    const prevColumn = dataSource.columns.find(c => c.name === props.chart.previousMetric)
    if (!prevColumn) return 'Previous metric column not found'
    if (prevColumn.type !== 'number') return 'Previous metric must be a numeric field'
  }
  
  return ''
})

const keyMetricValue = computed(() => {
  if (!hasValidData.value || error.value) return 0
  
  const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId!)!
  const keyColumn = dataSource.columns.find(c => c.name === props.chart.keyMetric)!
  
  // Sum all values in the key metric column
  return keyColumn.values.reduce((sum, value) => {
    const num = Number(value)
    return sum + (isNaN(num) ? 0 : num)
  }, 0)
})

const previousMetricValue = computed(() => {
  if (!hasValidData.value || error.value || !props.chart.previousMetric) return null
  
  const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId!)!
  const prevColumn = dataSource.columns.find(c => c.name === props.chart.previousMetric)
  
  if (!prevColumn) return null
  
  // Sum all values in the previous metric column
  return prevColumn.values.reduce((sum, value) => {
    const num = Number(value)
    return sum + (isNaN(num) ? 0 : num)
  }, 0)
})

const difference = computed(() => {
  if (previousMetricValue.value === null) return 0
  
  if (props.chart.differenceType === 'percentage') {
    if (previousMetricValue.value === 0) return 0
    return ((keyMetricValue.value - previousMetricValue.value) / Math.abs(previousMetricValue.value)) * 100
  } else {
    return keyMetricValue.value - previousMetricValue.value
  }
})

const formatValue = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  } else {
    return value.toLocaleString()
  }
}

const formatDifference = (diff: number) => {
  if (props.chart.differenceType === 'percentage') {
    return Math.abs(diff).toFixed(1) + '%'
  } else {
    return formatValue(Math.abs(diff))
  }
}
</script>