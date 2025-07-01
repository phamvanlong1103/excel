<template>
  <div class="p-4 border rounded bg-white shadow text-center">
    <h3 class="font-semibold text-lg">{{ chart.title }}</h3>
    <ul class="mt-2 text-left text-sm text-gray-600">
      <li v-for="(v, k) in donutData" :key="k">
        {{ k }}: {{ v }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { ChartConfig } from '../stores/chart'
import { computed } from 'vue'

const props = defineProps<{
  chart: ChartConfig
  data: any[]
}>()

const donutData = computed(() => {
  const result: Record<string, number> = {}
  const x = props.chart.xAxis as string
  const y = props.chart.yAxis as string
  for (const row of props.data) {
    const group = String(row[x] ?? '').trim()
    const value = Number(row[y] ?? 0)
    result[group] = (result[group] || 0) + value
  }
  return result
})
</script>
