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
            <input
              id="dashboardName"
              v-model="dashboardName"
              type="text"
              placeholder="Enter dashboard name"
              class="text-xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 focus:border-b-2 focus:border-primary-500 px-1 py-0.5 w-64"
            />
          </div>
          <div class="flex items-center gap-3 ml-auto">
            <button
              class="inline-flex items-center px-4 py-2 border border-primary-200 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              title="Share dashboard"
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
              @click="saveDashboard"
              :disabled="!dashboardName || charts.length === 0"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <DocumentCheckIcon class="h-4 w-4 mr-2" />
              Save Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex h-[calc(100vh-4rem)]">
      <!-- Left Sidebar with Tabs -->
      <DataPanel
        v-if="!previewMode"
        ref="dataPanelRef"
        :selectedDataSources="selectedDataSources"
        :expandedDataSources="expandedDataSources"
        :isFieldInUse="isFieldInUse"
        :width="leftSidebarWidth"
        @open-manager="openDataSourceManager"
        @toggle-expand="toggleDataSource"
        @field-drag="onFieldDragStart"
        @update-selected-data-sources="updateSelectedDataSources"
        @toggle-dashboard-tabs="handleToggleDashboardTabs"
      />

      <!-- Draggable Divider (between left sidebar and chart type col) -->
      <div
        v-if="!previewMode"
        class="resizer"
        @mousedown="startResizing('left')"
        :style="{ cursor: 'col-resize', width: '6px', background: '#e5e7eb', zIndex: 20 }"
      ></div>

      <!-- Chart Type & Properties Column -->
      <ChartPanel
        v-if="!previewMode"
        :chartTypes="chartTypes"
        :selectedChartType="selectedChartType"
        :chartConfig="chartConfig"
        :colorSchemes="colorSchemes"
        :colorPalettes="colorPalettes"
        :isChartConfigValid="isChartConfigValid"
        :editingChartId="editingChartId"
        :selectedDataSources="selectedDataSources"
        :width="chartTypeColWidth"
        @update:selectedChartType="selectedChartType = $event"
        @field-drop="onFieldDrop"
        @remove-x-axis="(idx) => { if (Array.isArray(chartConfig.xAxis)) chartConfig.xAxis.splice(idx, 1) }"
        @add-or-update-chart="addOrUpdateChart"
        @cancel-edit="cancelEdit"
      />

      <!-- Draggable Divider (between chart type col and main dashboard) -->
      <div
        v-if="!previewMode"
        class="resizer"
        @mousedown="startResizing('chartType')"
        :style="{ cursor: 'col-resize', width: '6px', background: '#e5e7eb', zIndex: 20 }"
      ></div>

      <!-- Main Dashboard Area -->
      <div :class="['flex-1 p-3']" style="position:relative;">
        <!-- Tabs UI -->
        <nav v-if="showDashboardTabs" class="flex gap-2 px-1 mt-0 mb-2" aria-label="Dashboard Tabs" style="align-items: flex-start;">
          <div class="flex gap-2">
            <transition-group name="fade" tag="div" class="flex gap-2">
              <div
                v-for="tab in dashboardTabs"
                :key="tab.id"
                class="relative group flex items-center"
                @mouseenter="tabHoverId = tab.id"
                @mouseleave="tabHoverId = null"
              >
                <input
                  v-if="tab.id === editingTabId"
                  v-model="editingTabName"
                  :id="`tab-edit-input-${tab.id}`"
                  @blur="finishRenameTab(tab.id)"
                  @keyup.enter="finishRenameTab(tab.id)"
                  @keyup.esc="cancelRenameTab()"
                  @keydown="handleTabEditKey(tab.id, $event)"
                  class="px-2 py-1 border rounded text-sm w-28 mr-1 focus:ring-2 focus:ring-primary-500"
                  :style="'transition: box-shadow 0.2s;'"
                  autofocus
                />
                <button
                  v-else
                  @click="activeTabId = tab.id"
                  :class="[
                    'py-2.5 px-4 text-center font-medium text-sm transition-all duration-200 flex items-center gap-2 rounded-lg shadow-sm border relative',
                    activeTabId === tab.id
                      ? 'border-primary-200 text-primary-700 bg-primary-50 shadow-md z-10'
                      : 'border-gray-200 text-gray-600 bg-white hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                  ]"
                  :title="tab.name"
                >
                  <span>{{ tab.name }}</span>
                  <PencilIcon
                    v-if="tabHoverId === tab.id"
                    @click.stop="startRenameTab(tab.id)"
                    class="h-4 w-4 ml-1 text-gray-400 hover:text-primary-600 cursor-pointer transition-opacity duration-150 opacity-80 group-hover:opacity-100"
                  />
            <button
                    v-if="dashboardTabs.length > 1 && tabHoverId === tab.id"
                    @click.stop="removeTab(tab.id)"
                    class="ml-1 text-gray-400 hover:text-red-500 bg-transparent rounded-full p-0.5 transition-opacity duration-150 opacity-80 group-hover:opacity-100"
                    style="z-index:20"
                  >
                    &times;
            </button>
                </button>
          </div>
            </transition-group>
            <button @click="addTab" class="ml-2 px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-primary-100 hover:text-primary-700 transition-colors duration-150 focus:outline-none border-none shadow-none">+</button>
        </div>
        </nav>
        <div class="bg-white rounded-lg shadow-sm h-full">
          <div class="p-6 h-full">
            <div v-if="charts.length === 0" class="flex items-center justify-center h-full text-gray-500">
              <div class="text-center">
                <Squares2X2Icon class="mx-auto h-12 w-12 mb-4" />
                <h3 class="text-lg font-medium text-gray-900 mb-2">Start Building Your Dashboard</h3>
                <p class="text-sm text-gray-500">
                  Select a data source, choose a chart type, and drag fields to create your first chart.
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
                      <button v-if="!previewMode" @click="toggleChartMenu(chart.id)" class="chart-menu-btn p-1 rounded-full hover:bg-gray-100 focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                      </button>
                      <div v-if="openChartMenuId === chart.id && !previewMode" class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-30">
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

    <!-- Toast Notification -->
    <Toast
      :show="showToast"
      :type="toastType"
      :title="toastTitle"
      :message="toastMessage"
      @close="hideToast"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
  Cog6ToothIcon,
  ChevronDownIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { GridStack } from 'gridstack'
import { useDataSourceStore, type DataSourceColumn } from '../stores/dataSource'
import { useDashboardStore } from '../stores/dashboard'
import { useChartStore, type ChartConfig } from '../stores/chart'
import ChartPreview from '../components/ChartPreview.vue'
import DataPanel from '../components/DataPanel.vue'
import ChartPanel from '../components/ChartPanel.vue'
import Toast from '../components/Toast.vue'
import { nanoid } from 'nanoid'

const router = useRouter()
const route = useRoute()
const dataSourceStore = useDataSourceStore()
const dashboardStore = useDashboardStore()
const chartStore = useChartStore()

const dashboardName = ref('')
const dashboardDescription = ref('')
const selectedDataSourceId = ref('')
const selectedChartType = ref<ChartConfig['type'] | ''>('')
const gridStackContainer = ref<HTMLElement>()
const dataPanelRef = ref<InstanceType<typeof DataPanel>>()
let gridStack: GridStack | null = null

// Toast notification state
const showToast = ref(false)
const toastType = ref<'success' | 'warning' | 'error' | 'info'>('success')
const toastTitle = ref('')
const toastMessage = ref('')

// Current dashboard ID for updates
const currentDashboardId = ref<string | null>(null)

interface ChartItem {
  id: string
  config: Partial<ChartConfig>
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
}

// Tabs for dashboard sections
interface DashboardTab {
  id: string
  name: string
  charts: ChartItem[]
}

const dashboardTabs = ref<DashboardTab[]>([
  { id: nanoid(), name: 'Tab 1', charts: [] }
])
const activeTabId = ref(dashboardTabs.value[0].id)
const editingTabId = ref<string | null>(null)
const editingTabName = ref('')
const tabHoverId = ref<string | null>(null)

function addTab() {
  const newTab = { id: nanoid(), name: `Tab ${dashboardTabs.value.length + 1}`, charts: [] }
  dashboardTabs.value.push(newTab)
  activeTabId.value = newTab.id
  nextTick(() => initializeGridStack())
}
function removeTab(tabId: string) {
  if (dashboardTabs.value.length === 1) return
  const tab = dashboardTabs.value.find(t => t.id === tabId)
  if (!tab) return
  if (confirm(`Are you sure you want to remove the tab "${tab.name}" and all its charts? This cannot be undone.`)) {
    const idx = dashboardTabs.value.findIndex(t => t.id === tabId)
    dashboardTabs.value.splice(idx, 1)
    if (activeTabId.value === tabId) {
      activeTabId.value = dashboardTabs.value[Math.max(0, idx - 1)].id
      nextTick(() => initializeGridStack())
    }
  }
}
function startRenameTab(tabId: string) {
  const tab = dashboardTabs.value.find(t => t.id === tabId)
  if (tab) {
    editingTabId.value = tabId
    editingTabName.value = tab.name
    nextTick(() => {
      const input = document.getElementById(`tab-edit-input-${tabId}`) as HTMLInputElement
      if (input) input.focus()
    })
  }
}
function finishRenameTab(tabId: string) {
  if (!editingTabName.value.trim()) return
  const tab = dashboardTabs.value.find(t => t.id === tabId)
  if (tab) tab.name = editingTabName.value.trim()
  editingTabId.value = null
}
function cancelRenameTab() {
  editingTabId.value = null
}
function handleTabEditKey(tabId: string, e: KeyboardEvent) {
  if (e.key === 'Enter') finishRenameTab(tabId)
  if (e.key === 'Escape') cancelRenameTab()
}

// Proxy charts to the active tab
const charts = computed({
  get: () => dashboardTabs.value.find(t => t.id === activeTabId.value)?.charts || [],
  set: (val) => {
    const tab = dashboardTabs.value.find(t => t.id === activeTabId.value)
    if (tab) tab.charts = val
  }
})

watch(activeTabId, () => {
  nextTick(() => initializeGridStack())
})

// Add color scheme options
const colorSchemes = [
  { value: 'default', label: 'Default' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'vivid', label: 'Vivid' },
  { value: 'earth', label: 'Earth' }
]

// Add color palettes for preview
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

// Extend ChartConfigLike
interface ChartConfigLike {
  title: string
  xAxis: string[] | string
  yAxis: string
  category: string
  backgroundColor: string
  borderColor: string
  horizontal: boolean
  colorScheme: string
  dataSourceId: string
}

const chartConfig = reactive<ChartConfigLike>({
  title: '',
  xAxis: [],
  yAxis: '',
  category: '',
  backgroundColor: '#3b82f6',
  borderColor: '#1d4ed8',
  horizontal: false,
  colorScheme: 'default',
  dataSourceId: ''
})

const chartTypes = [
  { value: 'bar', label: 'Bar', icon: ChartBarIcon },
  { value: 'line', label: 'Line', icon: PresentationChartLineIcon },
  { value: 'pie', label: 'Pie', icon: ChartPieIcon },
  { value: 'scatter', label: 'Scatter', icon: CircleStackIcon }
] as const

const selectedDataSource = computed(() => {
  if (!selectedDataSourceId.value) return null
  return dataSourceStore.getDataSourceById(selectedDataSourceId.value)
})

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

const onDataSourceChange = () => {
  resetChartConfig()
}

const resetChartConfig = () => {
  chartConfig.title = ''
  chartConfig.xAxis = []
  chartConfig.yAxis = ''
  chartConfig.category = ''
  chartConfig.horizontal = false
  chartConfig.dataSourceId = ''
  selectedChartType.value = ''
}

const onFieldDragStart = (event: DragEvent, column: DataSourceColumn, dataSourceId: string) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      name: column.name,
      type: column.type,
      dataSourceId
    }))
  }
}

const onFieldDrop = (event: DragEvent, target: 'xAxis' | 'yAxis' | 'category') => {
  event.preventDefault()
  if (!event.dataTransfer) return
  try {
    const fieldData = JSON.parse(event.dataTransfer.getData('text/plain'))
    
    // Validate field type for Y-axis (should be numeric)
    if (target === 'yAxis' && fieldData.type !== 'number') {
      alert('Y-axis requires a numeric field')
      return
    }

    // Check if we already have fields from a different data source
    // Only check if we have multiple fields (for bar chart) or if we're not replacing a single field
    if (chartConfig.dataSourceId && chartConfig.dataSourceId !== fieldData.dataSourceId) {
      if (selectedChartType.value === 'bar' && Array.isArray(chartConfig.xAxis) && chartConfig.xAxis.length > 0) {
        alert('Cannot mix fields from different data sources in the same chart')
        return
      }
      // For non-bar charts or when replacing a single field, allow the change
      // This will effectively replace the existing field and data source
    }

    if (target === 'xAxis' && selectedChartType.value === 'bar') {
      // Add to array, no duplicates
      if (Array.isArray(chartConfig.xAxis) && !chartConfig.xAxis.includes(fieldData.name)) {
        chartConfig.xAxis.push(fieldData.name)
      }
    } else {
      chartConfig[target] = fieldData.name
    }
    // Store the data source ID for the chart
    chartConfig.dataSourceId = fieldData.dataSourceId
  } catch (error) {
    console.error('Failed to parse dropped field data:', error)
  }
}

const openChartMenuId = ref<string | null>(null)
const editingChartId = ref<string | null>(null)
const chartTypeColRef = ref<HTMLElement>()

const toggleChartMenu = (id: string) => {
  openChartMenuId.value = openChartMenuId.value === id ? null : id
}

const editChart = (chart: ChartItem) => {
  openChartMenuId.value = null
  editingChartId.value = chart.id
  selectedChartType.value = chart.config.type || ''
  chartConfig.title = chart.config.title || ''
  chartConfig.dataSourceId = chart.config.dataSourceId || ''
  
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
  chartConfig.horizontal = chart.config.horizontal || false
  chartConfig.colorScheme = chart.config.colorScheme || 'default'
}

const exportChart = (chart: ChartItem, type: 'pdf' | 'png') => {
  openChartMenuId.value = null
  alert(`Exporting chart '${chart.config.title || chart.config.name}' as ${type.toUpperCase()} (stub)`)
}

const addOrUpdateChart = () => {
  if (!isChartConfigValid.value || !chartConfig.dataSourceId) return
  if (editingChartId.value) {
    // Update existing chart
    const idx = charts.value.findIndex(c => c.id === editingChartId.value)
    if (idx !== -1) {
      charts.value[idx].config = {
        ...charts.value[idx].config,
        id: charts.value[idx].id,
        name: chartConfig.title || `Chart ${idx + 1}`,
        type: selectedChartType.value as ChartConfig['type'],
        dataSourceId: chartConfig.dataSourceId,
        xAxis: selectedChartType.value === 'bar' ? [...chartConfig.xAxis] : chartConfig.xAxis,
        yAxis: chartConfig.yAxis || undefined,
        category: chartConfig.category || undefined,
        title: chartConfig.title,
        backgroundColor: chartConfig.backgroundColor,
        borderColor: chartConfig.borderColor,
        horizontal: selectedChartType.value === 'bar' ? chartConfig.horizontal : undefined,
        colorScheme: selectedChartType.value === 'bar' ? chartConfig.colorScheme : undefined,
        createdAt: charts.value[idx].config.createdAt || new Date()
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

const cancelEdit = () => {
  editingChartId.value = null
  resetChartConfig()
}

const addChart = () => {
  if (!isChartConfigValid.value || !chartConfig.dataSourceId) return
  const chartId = Date.now().toString()
  const newChart: ChartItem = {
    id: chartId,
    config: {
      id: chartId,
      name: chartConfig.title || `Chart ${charts.value.length + 1}`,
      type: selectedChartType.value as ChartConfig['type'],
      dataSourceId: chartConfig.dataSourceId,
      xAxis: selectedChartType.value === 'bar' ? [...chartConfig.xAxis] : chartConfig.xAxis,
      yAxis: chartConfig.yAxis || undefined,
      category: chartConfig.category || undefined,
      title: chartConfig.title,
      backgroundColor: chartConfig.backgroundColor,
      borderColor: chartConfig.borderColor,
      horizontal: selectedChartType.value === 'bar' ? chartConfig.horizontal : undefined,
      colorScheme: selectedChartType.value === 'bar' ? chartConfig.colorScheme : undefined,
      createdAt: new Date()
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

const removeChart = (chartId: string) => {
  if (confirm('Are you sure you want to remove this chart?')) {
    charts.value = charts.value.filter(chart => chart.id !== chartId)
    
    nextTick(() => {
      initializeGridStack()
    })
  }
}

const initializeGridStack = async () => {
  if (!gridStackContainer.value || charts.value.length === 0) return

  await nextTick()

  try {
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

    // Listen for layout changes
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
  } catch (error) {
    console.error('Failed to initialize GridStack:', error)
  }
}

// Toast notification functions
const showToastNotification = (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => {
  toastType.value = type
  toastTitle.value = title
  toastMessage.value = message || ''
  showToast.value = true
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    hideToast()
  }, 3000)
}

const hideToast = () => {
  showToast.value = false
}

const saveDashboard = () => {
  if (!dashboardName.value || charts.value.length === 0) return

  try {
  // Save selected data source IDs
  const dataSourceIds = selectedDataSources.value.map(ds => ds.id)

    if (currentDashboardId.value) {
      // Update existing dashboard
      const dashboard = dashboardStore.getDashboardById(currentDashboardId.value)
      if (dashboard) {
        // Update dashboard properties
        dashboardStore.updateDashboard(currentDashboardId.value, {
          name: dashboardName.value,
          description: dashboardDescription.value,
          dataSourceIds
        })

        // Clear existing widgets and charts
        dashboard.widgets.forEach(widget => {
          chartStore.deleteChart(widget.chartId)
        })
        dashboard.widgets = []

        // Create and save new charts, then add widgets
        charts.value.forEach(chartItem => {
          // Create the chart in the chart store
          const savedChart = chartStore.createChart({
            name: chartItem.config.name!,
            type: chartItem.config.type!,
            dataSourceId: chartItem.config.dataSourceId!,
            xAxis: chartItem.config.xAxis,
            yAxis: chartItem.config.yAxis,
            category: chartItem.config.category,
            title: chartItem.config.title!,
            backgroundColor: chartItem.config.backgroundColor!,
            borderColor: chartItem.config.borderColor!
          })

          // Add widget to dashboard
          dashboardStore.addWidget(currentDashboardId.value!, savedChart.id)
          
          // Update widget layout
          const widget = dashboard.widgets[dashboard.widgets.length - 1]
          if (widget) {
            dashboardStore.updateWidgetLayout(currentDashboardId.value!, widget.id, chartItem.layout)
          }
        })

        showToastNotification('success', 'Dashboard Updated', 'Your dashboard has been successfully updated.')
      }
    } else {
      // Create new dashboard
  const dashboard = dashboardStore.createDashboard(dashboardName.value, dashboardDescription.value, dataSourceIds)
      currentDashboardId.value = dashboard.id

  // Create and save charts, then add widgets
  charts.value.forEach(chartItem => {
    // Create the chart in the chart store
    const savedChart = chartStore.createChart({
      name: chartItem.config.name!,
      type: chartItem.config.type!,
      dataSourceId: chartItem.config.dataSourceId!,
      xAxis: chartItem.config.xAxis,
      yAxis: chartItem.config.yAxis,
      category: chartItem.config.category,
      title: chartItem.config.title!,
      backgroundColor: chartItem.config.backgroundColor!,
      borderColor: chartItem.config.borderColor!
    })

    // Add widget to dashboard
    dashboardStore.addWidget(dashboard.id, savedChart.id)
    
    // Update widget layout
    const widget = dashboard.widgets[dashboard.widgets.length - 1]
    if (widget) {
      dashboardStore.updateWidgetLayout(dashboard.id, widget.id, chartItem.layout)
    }
  })

      showToastNotification('success', 'Dashboard Created', 'Your dashboard has been successfully created.')
    }
  } catch (error) {
    console.error('Error saving dashboard:', error)
    showToastNotification('error', 'Save Failed', 'There was an error saving your dashboard. Please try again.')
  }
}

const goBack = () => {
  if (charts.value.length > 0) {
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      router.push('/dashboard-store')
    }
  } else {
    router.push('/dashboard-store')
  }
}

// Resizable sidebar logic
const leftSidebarWidth = ref(240)
const chartTypeColWidth = ref(260)
const resizing = ref<'left' | 'chartType' | null>(null)
const startX = ref(0)
const startWidth = ref(0)

const startResizing = (which: 'left' | 'chartType') => {
  resizing.value = which
  startX.value = window.event instanceof MouseEvent ? window.event.clientX : 0
  startWidth.value = which === 'left' ? leftSidebarWidth.value : chartTypeColWidth.value
  document.addEventListener('mousemove', onResizing)
  document.addEventListener('mouseup', stopResizing)
}

const onResizing = (e: MouseEvent) => {
  if (!resizing.value) return
  const dx = e.clientX - startX.value
  if (resizing.value === 'left') {
    let newWidth = startWidth.value + dx
    newWidth = Math.max(180, Math.min(400, newWidth))
    leftSidebarWidth.value = newWidth
  } else if (resizing.value === 'chartType') {
    let newWidth = startWidth.value + dx
    newWidth = Math.max(200, Math.min(400, newWidth))
    chartTypeColWidth.value = newWidth
  }
}

const stopResizing = () => {
  resizing.value = null
  document.removeEventListener('mousemove', onResizing)
  document.removeEventListener('mouseup', stopResizing)
}

const previewMode = ref(false)

// Add new refs for data source management
const selectedDataSources = ref<Array<{ id: string; name: string; columns: DataSourceColumn[] }>>([])
const expandedDataSources = ref<string[]>([])

// Add toggle function for data source expansion
const toggleDataSource = (id: string) => {
  const index = expandedDataSources.value.indexOf(id)
  if (index === -1) {
    expandedDataSources.value.push(id)
  } else {
    expandedDataSources.value.splice(index, 1)
  }
}

// Add function to check if a field is in use
const isFieldInUse = (fieldName: string, dataSourceId: string) => {
  if (!selectedChartType.value || !chartConfig.dataSourceId) return false
  
  // Check if the field is from the same data source as the current chart
  if (chartConfig.dataSourceId !== dataSourceId) return false

  // Check if the field is used in any of the chart properties
  if (selectedChartType.value === 'pie') {
    return chartConfig.category === fieldName
  } else if (selectedChartType.value === 'bar') {
    return (
      (Array.isArray(chartConfig.xAxis) && chartConfig.xAxis.includes(fieldName)) ||
      chartConfig.yAxis === fieldName
    )
  } else {
    return chartConfig.xAxis === fieldName || chartConfig.yAxis === fieldName
  }
}

// Data source manager methods
const openDataSourceManager = () => {
  if (dataPanelRef.value) {
    dataPanelRef.value.openDataSourceManager()
  }
}

const updateSelectedDataSources = (dataSources: Array<{ id: string; name: string; columns: DataSourceColumn[] }>) => {
  selectedDataSources.value = dataSources
}

const showDashboardTabs = ref(true)

function handleToggleDashboardTabs(show: boolean) {
  showDashboardTabs.value = show
}

onMounted(async () => {
  const dashboardId = route.query.id as string | undefined
  if (dashboardId) {
    // Load dashboard for editing
    const dashboard = dashboardStore.dashboards.find(d => d.id === dashboardId)
    if (dashboard) {
      currentDashboardId.value = dashboardId
      dashboardName.value = dashboard.name
      dashboardDescription.value = dashboard.description || ''
      // Restore selected data sources
      if (dashboard.dataSourceIds && dashboard.dataSourceIds.length > 0) {
        selectedDataSources.value = dataSourceStore.dataSources.filter(ds => dashboard.dataSourceIds!.includes(ds.id))
      }
      // Load charts for this dashboard
      charts.value = dashboard.widgets.map(widget => {
        const chart = chartStore.charts.find(c => c.id === widget.chartId)
        return chart
          ? {
              id: chart.id,
              config: { ...chart },
              layout: {
                x: widget.x,
                y: widget.y,
                w: widget.w,
                h: widget.h
              }
            }
          : null
      }).filter(Boolean) as ChartItem[]
      await nextTick()
      initializeGridStack()
    }
  }
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

.chart-content {
  height: 100%;
  padding: 8px;
}

.grid-stack-item-content {
  position: relative;
  height: 100%;
  cursor: move;
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