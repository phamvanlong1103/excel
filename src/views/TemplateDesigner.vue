<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center h-16 justify-between">
          <div class="flex items-center gap-2">
            <button
              @click="goBack"
              class="mr-4 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon class="h-6 w-6" />
            </button>
            <span class="text-xl font-semibold text-gray-900">Template Designer</span>
          </div>
          <div class="flex items-center gap-3 ml-auto">
            <button
              class="inline-flex items-center px-4 py-2 border border-primary-200 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              title="Share template"
            >
              <ShareIcon class="h-4 w-4 mr-2" />
              Share
            </button>
            <button
              @click="previewMode = true"
              :disabled="charts.length === 0"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A2 2 0 0020 6.382V5a2 2 0 00-2-2H6a2 2 0 00-2 2v1.382a2 2 0 00.447 1.342L9 10m6 0v4m0 0l-4.553 2.276A2 2 0 014 17.618V19a2 2 0 002 2h12a2 2 0 002-2v-1.382a2 2 0 00-.447-1.342L15 14z" /></svg>
              Preview
            </button>
            <button
              @click="saveTemplate"
              :disabled="charts.length === 0"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <DocumentCheckIcon class="h-4 w-4 mr-2" />
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="flex h-[calc(100vh-4rem)]">
      <!-- Chart Type & Properties Column -->
      <ChartPanel
        :chartTypes="chartTypes"
        :selectedChartType="selectedChartType"
        :chartConfig="chartConfig"
        :colorSchemes="colorSchemes"
        :colorPalettes="colorPalettes"
        :isChartConfigValid="isChartConfigValid"
        :editingChartId="editingChartId"
        :selectedDataSources="[]"
        :width="chartTypeColWidth"
        :alwaysShowProperties="true"
        @update:selectedChartType="selectedChartType = $event"
        @field-drop="onFieldDrop"
        @remove-x-axis="(idx) => { if (Array.isArray(chartConfig.xAxis)) chartConfig.xAxis.splice(idx, 1) }"
        @add-or-update-chart="addOrUpdateChart"
      />
      <!-- Draggable Divider (between chart type col and main dashboard) -->
      <div
        class="resizer"
        @mousedown="startResizing('chartType')"
        :style="{ cursor: 'col-resize', width: '6px', background: '#e5e7eb', zIndex: 20 }"
      ></div>
      <!-- Main Dashboard Area -->
      <div :class="['flex-1 p-3']" style="position:relative;">
        <div class="bg-white rounded-lg shadow-sm h-full">
          <div class="p-6 h-full"
            @dragover.prevent
            @drop="onDashboardDrop"
            style="height:100%"
          >
            <div v-if="charts.length === 0" class="flex items-center justify-center h-full text-gray-500 border-2 border-dashed border-primary-300 rounded-lg bg-primary-50 transition-colors duration-200">
              <div class="text-center">
                <Squares2X2Icon class="mx-auto h-12 w-12 mb-4 text-primary-400" />
                <h3 class="text-lg font-medium text-gray-900 mb-2">Start Building Your Template</h3>
                <p class="text-sm text-gray-500">
                  Drag a chart type here to add your first chart.
                </p>
              </div>
            </div>
            <!-- GridStack Container -->
            <div v-else ref="gridStackContainer" class="grid-stack h-full">
              <div
                v-for="chart in charts"
                :key="chart.id"
                class="grid-stack-item"
                :gs-id="chart.id"
                :gs-x="chart.layout.x"
                :gs-y="chart.layout.y"
                :gs-w="chart.layout.w"
                :gs-h="chart.layout.h"
              >
                <div class="grid-stack-item-content">
                  <div class="chart-header flex justify-end items-center gap-2">
                    <!-- 3-dot menu -->
                    <div class="relative">
                      <button @click="toggleChartMenu(chart.id)" class="chart-menu-btn p-1 rounded-full hover:bg-gray-100 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                      </button>
                      <div v-if="openChartMenuId === chart.id" class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-30">
                        <button @click="editChart(chart)" class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Edit</button>
                        <button @click="exportChart(chart, 'pdf')" class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Export PDF</button>
                        <button @click="exportChart(chart, 'png')" class="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Export to PNG</button>
                        <button @click="removeChart(chart.id)" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Remove</button>
                      </div>
                    </div>
                  </div>
                  <div class="chart-content">
                    <ChartPreview :chart="chart.config" class="w-full h-full" />
                  </div>
                </div>
              </div>
            </div>
            <!-- Exit Preview Button -->
            <button v-if="previewMode" @click="previewMode = false" class="absolute top-4 right-4 z-50 px-4 py-2 bg-white text-primary-700 border border-gray-300 rounded shadow hover:bg-gray-50">Exit Preview</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  Squares2X2Icon,
  DocumentCheckIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  CircleStackIcon,
  ShareIcon
} from '@heroicons/vue/24/outline'
import { GridStack } from 'gridstack'
import ChartPanel from '../components/ChartPanel.vue'
import ChartPreview from '../components/ChartPreview.vue'

const router = useRouter()
const chartTypeColWidth = ref(260)
const previewMode = ref(false)
const openChartMenuId = ref<string | null>(null)
const editingChartId = ref<string | null>(null)
const gridStackContainer = ref<HTMLElement>()
let gridStack: GridStack | null = null

type ChartType = 'bar' | 'line' | 'pie' | 'scatter'

interface ChartConfigLike {
  title: string
  xAxis: string[] | string
  yAxis: string
  category: string
  backgroundColor: string
  borderColor: string
  horizontal: boolean
  colorScheme: string
}

interface ChartItem {
  id: string
  config: ChartConfigLike & { type: ChartType; name?: string; data?: any }
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
}

const chartTypes = [
  { value: 'bar', label: 'Bar', icon: ChartBarIcon },
  { value: 'line', label: 'Line', icon: PresentationChartLineIcon },
  { value: 'pie', label: 'Pie', icon: ChartPieIcon },
  { value: 'scatter', label: 'Scatter', icon: CircleStackIcon }
] as const

const colorSchemes = [
  { value: 'default', label: 'Default' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'vivid', label: 'Vivid' },
  { value: 'earth', label: 'Earth' }
]

const colorPalettes: Record<string, string[]> = {
  default: [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
    '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#eab308'
  ],
  pastel: [
    '#a5b4fc', '#fbcfe8', '#bbf7d0', '#fde68a', '#ddd6fe',
    '#bae6fd', '#fed7aa', '#d9f99d', '#f9a8d4', '#c7d2fe',
    '#99f6e4', '#fecdd3', '#e9d5ff', '#bbf7d0', '#fef08a'
  ],
  vivid: [
    '#e11d48', '#2563eb', '#059669', '#f59e42', '#a21caf',
    '#0ea5e9', '#f43f5e', '#22d3ee', '#facc15', '#7c3aed',
    '#f472b6', '#16a34a', '#fbbf24', '#f87171', '#38bdf8'
  ],
  earth: [
    '#a16207', '#713f12', '#166534', '#155e75', '#7c2d12',
    '#be185d', '#4d7c0f', '#b91c1c', '#0e7490', '#a21caf',
    '#ca8a04', '#ea580c', '#15803d', '#1e293b', '#f59e42'
  ]
}

const selectedChartType = ref<ChartType>('bar')
const chartConfig = reactive<ChartConfigLike>({
  title: '',
  xAxis: [],
  yAxis: '',
  category: '',
  backgroundColor: '#3b82f6',
  borderColor: '#1d4ed8',
  horizontal: false,
  colorScheme: 'default'
})

const charts = ref<ChartItem[]>([])

const isChartConfigValid = computed(() => {
  if (!selectedChartType.value) return false
  if (selectedChartType.value === 'pie') {
    return !!chartConfig.category
  } else if (selectedChartType.value === 'bar') {
    return Array.isArray(chartConfig.xAxis) && chartConfig.xAxis.length > 0 && !!chartConfig.yAxis
  } else {
    return !!chartConfig.xAxis && !!chartConfig.yAxis
  }
})

function onFieldDrop(event: DragEvent, target: 'xAxis' | 'yAxis' | 'category') {
  event.preventDefault()
  // In template designer, allow any drop and just set the field name
  const fakeField = target === 'xAxis' ? 'Category' : target === 'yAxis' ? 'Value' : 'Category'
  if (target === 'xAxis' && selectedChartType.value === 'bar') {
    if (Array.isArray(chartConfig.xAxis) && !chartConfig.xAxis.includes(fakeField)) {
      (chartConfig.xAxis as string[]).push(fakeField)
    }
  } else {
    (chartConfig as any)[target] = fakeField
  }
}

function addOrUpdateChart() {
  if (!isChartConfigValid.value) return
  if (editingChartId.value) {
    // Update existing chart
    const idx = charts.value.findIndex(c => c.id === editingChartId.value)
    if (idx !== -1) {
      charts.value[idx].config = {
        ...charts.value[idx].config,
        name: chartConfig.title || `Chart ${idx + 1}`,
        type: (selectedChartType.value || 'bar'),
        xAxis: selectedChartType.value === 'bar' ? [...(chartConfig.xAxis as string[])] : chartConfig.xAxis,
        yAxis: chartConfig.yAxis || '',
        category: chartConfig.category || '',
        title: chartConfig.title || '',
        backgroundColor: chartConfig.backgroundColor || '#3b82f6',
        borderColor: chartConfig.borderColor || '#1d4ed8',
        horizontal: selectedChartType.value === 'bar' ? !!chartConfig.horizontal : false,
        colorScheme: selectedChartType.value === 'bar' ? (chartConfig.colorScheme || 'default') : 'default',
        data: getFakeChartData(selectedChartType.value)
      }
    }
    editingChartId.value = null
    resetChartConfig()
    nextTick(() => initializeGridStack())
    return
  }
  // Add new chart
  addChart()
}

function addChart() {
  if (!isChartConfigValid.value) return
  const chartId = Date.now().toString()
  const newChart: ChartItem = {
    id: chartId,
    config: {
      name: chartConfig.title || `Chart ${charts.value.length + 1}`,
      type: (selectedChartType.value || 'bar'),
      xAxis: selectedChartType.value === 'bar' ? [...(chartConfig.xAxis as string[])] : chartConfig.xAxis,
      yAxis: chartConfig.yAxis || '',
      category: chartConfig.category || '',
      title: chartConfig.title || '',
      backgroundColor: chartConfig.backgroundColor || '#3b82f6',
      borderColor: chartConfig.borderColor || '#1d4ed8',
      horizontal: selectedChartType.value === 'bar' ? !!chartConfig.horizontal : false,
      colorScheme: selectedChartType.value === 'bar' ? (chartConfig.colorScheme || 'default') : 'default',
      data: getFakeChartData(selectedChartType.value)
    },
    layout: {
      x: 0,
      y: 0,
      w: 6,
      h: 4
    }
  }
  charts.value.push(newChart)
  resetChartConfig()
  nextTick(() => {
    initializeGridStack()
  })
}

function getFakeChartData(type: ChartType) {
  // Return visually pleasing fake data for each chart type
  if (type === 'bar') {
    return [
      { category: 'A', value: 40 },
      { category: 'B', value: 55 },
      { category: 'C', value: 30 },
      { category: 'D', value: 70 }
    ]
  } else if (type === 'line') {
    return [
      { x: 1, y: 10 },
      { x: 2, y: 30 },
      { x: 3, y: 20 },
      { x: 4, y: 50 },
      { x: 5, y: 40 }
    ]
  } else if (type === 'pie') {
    return [
      { category: 'Red', value: 30 },
      { category: 'Blue', value: 25 },
      { category: 'Green', value: 45 }
    ]
  } else if (type === 'scatter') {
    return [
      { x: 10, y: 20 },
      { x: 20, y: 30 },
      { x: 30, y: 10 },
      { x: 40, y: 50 }
    ]
  }
  return []
}

function resetChartConfig() {
  chartConfig.title = ''
  chartConfig.xAxis = []
  chartConfig.yAxis = ''
  chartConfig.category = ''
  chartConfig.horizontal = false
  selectedChartType.value = 'bar'
}

function editChart(chart: ChartItem) {
  openChartMenuId.value = null
  editingChartId.value = chart.id
  selectedChartType.value = chart.config.type || 'bar'
  chartConfig.title = chart.config.title || ''
  if (chart.config.type === 'bar') {
    if (Array.isArray(chart.config.xAxis)) {
      chartConfig.xAxis = [...chart.config.xAxis]
    } else if (typeof chart.config.xAxis === 'string' && chart.config.xAxis) {
      chartConfig.xAxis = [chart.config.xAxis]
    } else {
      chartConfig.xAxis = []
    }
  } else {
    chartConfig.xAxis = typeof chart.config.xAxis === 'string' ? chart.config.xAxis : ''
  }
  chartConfig.yAxis = chart.config.yAxis || ''
  chartConfig.category = chart.config.category || ''
  chartConfig.backgroundColor = chart.config.backgroundColor || '#3b82f6'
  chartConfig.borderColor = chart.config.borderColor || '#1d4ed8'
  chartConfig.horizontal = !!chart.config.horizontal
  chartConfig.colorScheme = chart.config.colorScheme || 'default'
}

function removeChart(chartId: string) {
  if (confirm('Are you sure you want to remove this chart?')) {
    charts.value = charts.value.filter(chart => chart.id !== chartId)
    nextTick(() => {
      initializeGridStack()
    })
  }
}

function toggleChartMenu(id: string) {
  openChartMenuId.value = openChartMenuId.value === id ? null : id
}

function exportChart(chart: ChartItem, type: 'pdf' | 'png') {
  openChartMenuId.value = null
  alert(`Exporting chart '${chart.config.title || chart.config.name}' as ${type.toUpperCase()} (stub)`)
}

function goBack() {
  router.push('/dashboard-store')
}

function saveTemplate() {
  alert('Template saved! (stub)')
}

function startResizing(which: 'chartType') {
  resizing.value = which
  startX.value = window.event instanceof MouseEvent ? window.event.clientX : 0
  startWidth.value = chartTypeColWidth.value
  document.addEventListener('mousemove', onResizing)
  document.addEventListener('mouseup', stopResizing)
}

const resizing = ref<'chartType' | null>(null)
const startX = ref(0)
const startWidth = ref(0)

function onResizing(e: MouseEvent) {
  if (!resizing.value) return
  const dx = e.clientX - startX.value
  let newWidth = startWidth.value + dx
  newWidth = Math.max(200, Math.min(400, newWidth))
  chartTypeColWidth.value = newWidth
}

function stopResizing() {
  resizing.value = null
  document.removeEventListener('mousemove', onResizing)
  document.removeEventListener('mouseup', stopResizing)
}

function initializeGridStack() {
  if (!gridStackContainer.value || charts.value.length === 0) return
  nextTick(() => {
    if (gridStack) {
      gridStack.destroy(false)
      gridStack = null
    }
    gridStack = GridStack.init({
      cellHeight: 70,
      margin: 10,
      minRow: 1,
      animate: true,
      resizable: {
        handles: 'e, se, s, sw, w'
      },
      draggable: {
        handle: '.grid-stack-item-content',
        scroll: false
      }
    }, gridStackContainer.value)
    gridStack.on('change', (event, items) => {
      items.forEach(item => {
        const chart = charts.value.find(c => c.id === item.id)
        if (chart && item.x !== undefined && item.y !== undefined && item.w !== undefined && item.h !== undefined) {
          chart.layout = {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h
          }
        }
      })
    })
  })
}

function onDashboardDrop(event: DragEvent) {
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) return
    const { chartType } = JSON.parse(data)
    if (!chartType) return
    // Add a new chart with default config/data
    const chartId = Date.now().toString()
    const newChart = {
      id: chartId,
      config: {
        name: `Chart ${charts.value.length + 1}`,
        type: chartType,
        xAxis: chartType === 'bar' ? ['Category'] : 'Category',
        yAxis: 'Value',
        category: 'Category',
        title: '',
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        horizontal: false,
        colorScheme: 'default',
        data: getFakeChartData(chartType)
      },
      layout: {
        x: 0,
        y: 0,
        w: 6,
        h: 4
      }
    }
    charts.value.push(newChart)
    nextTick(() => {
      initializeGridStack()
    })
  } catch (e) {
    // Ignore
  }
}

onMounted(() => {
  initializeGridStack()
})

onUnmounted(() => {
  if (gridStack) {
    gridStack.destroy(false)
    gridStack = null
  }
  document.removeEventListener('mousemove', onResizing)
  document.removeEventListener('mouseup', stopResizing)
})
</script>

<style scoped>
.chart-header {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.chart-menu-btn {
  color: #6b7280;
}
.chart-menu-btn:hover {
  color: #374151;
}

.chart-remove-btn {
  @apply bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 transition-opacity duration-200;
}

.grid-stack-item-content {
  position: relative;
  height: 100%;
  width: 100%;
  cursor: move;
  display: flex;
  flex-direction: column;
}

.chart-content {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 8px;
}

/* GridStack overrides */
:deep(.grid-stack-item.ui-draggable-dragging) {
  opacity: 0.8;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  opacity: 0.8;
}

/* Drag and drop styling */
.border-dashed:hover {
  @apply border-primary-400;
}

.resizer {
  transition: background 0.2s;
}
.resizer:hover {
  background: #d1d5db;
}
</style> 