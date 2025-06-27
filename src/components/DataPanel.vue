<template>
  <div class="bg-white border-r border-gray-200 flex flex-col" :style="{ minWidth: '180px', maxWidth: '400px', width: width + 'px' }">
    <!-- Tab Navigation -->
    <div class="border-b border-gray-200 p-3">
      <nav class="flex gap-2" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex-1 py-2.5 px-3 text-center font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 rounded-lg shadow-sm border',
            activeTab === tab.id
              ? 'border-primary-200 text-primary-700 bg-primary-50 shadow-md'
              : 'border-gray-200 text-gray-600 bg-white hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
          ]"
          :title="tab.name"
        >
          <component :is="tab.icon" class="h-5 w-5" />
          <!--<span class="text-xs font-medium">{{ tab.name }}</span>-->
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-y-auto">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="p-4">
        <div class="space-y-6">

          <!-- Category Section -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">
              Category
            </label>
            <select
              v-model="dashboardCategory"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Select category</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="HR">HR</option>
              <option value="Customer">Customer</option>
              <option value="Product">Product</option>
              <option value="Analytics">Analytics</option>
              <option value="Executive">Executive</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- Description Section -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              v-model="dashboardDescription"
              rows="4"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Dashboard description"
            />
          </div>
          <!-- Toggle Dashboard Tabs -->
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-gray-900">Show dashboard tabs</span>
            <label for="toggle-dashboard-tabs" class="flex items-center cursor-pointer select-none">
              <span class="relative">
                <input
                  id="toggle-dashboard-tabs"
                  type="checkbox"
                  v-model="showDashboardTabs"
                  @change="emit('toggle-dashboard-tabs', showDashboardTabs)"
                  class="sr-only peer"
                  :aria-checked="showDashboardTabs"
                />
                <span class="block w-10 h-6 bg-gray-200 rounded-full shadow-inner transition peer-checked:bg-primary-500"></span>
                <span class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4"></span>
              </span>
            </label>
          </div>
          <!-- Save as Template Section -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-900">Save as template</span>
            <label for="save-as-template" class="flex items-center cursor-pointer select-none">
              <span class="relative">
                <input
                  id="save-as-template"
                  type="checkbox"
                  v-model="saveAsTemplate"
                  class="sr-only peer"
                  :aria-checked="saveAsTemplate"
                />
                <span class="block w-10 h-6 bg-gray-200 rounded-full shadow-inner transition peer-checked:bg-primary-500"></span>
                <span class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4"></span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Data Sources Tab -->
      <div v-if="activeTab === 'data-sources'" class="flex-1">
        <div class="p-4 flex items-center justify-between">
          <h3 class="text-sm font-medium text-gray-700">Data Sources</h3>
          <button
            @click="$emit('open-manager')"
            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Cog6ToothIcon class="h-4 w-4 mr-1" />
            Manage
          </button>
        </div>
        <div class="px-4 pb-4 space-y-2">
          <div v-for="ds in selectedDataSources" :key="ds.id" class="border rounded-lg overflow-hidden">
            <button
              @click="$emit('toggle-expand', ds.id)"
              class="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
            >
              <span class="text-sm font-medium text-gray-900">{{ ds.name }}</span>
              <ChevronDownIcon
                class="h-5 w-5 text-gray-500 transform transition-transform"
                :class="{ 'rotate-180': expandedDataSources.includes(ds.id) }"
              />
            </button>
            <div v-if="expandedDataSources.includes(ds.id)" class="p-2 space-y-1">
              <!-- Normal fields -->
              <div
                v-for="column in ds.columns.filter(c => !c.isCustom)"
                :key="column.name"
                :draggable="true"
                @dragstart="$emit('field-drag', $event, column, ds.id)"
                class="flex items-center justify-between p-2 rounded cursor-move transition-colors duration-200"
                :class="{
                  'bg-primary-50': isFieldInUse(column.name, ds.id),
                  'bg-white hover:bg-gray-50': !isFieldInUse(column.name, ds.id)
                }"
              >
                <div class="flex items-center">
                  <CheckIcon
                    v-if="isFieldInUse(column.name, ds.id)"
                    class="h-4 w-4 text-primary-600 mr-2"
                  />
                  <span class="text-sm font-medium text-gray-900">{{ column.name }}</span>
                </div>
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-800': column.type === 'number',
                    'bg-green-100 text-green-800': column.type === 'date',
                    'bg-gray-100 text-gray-800': column.type === 'string'
                  }"
                >
                  {{ column.type }}
                </span>
              </div>
              <!-- Custom fields -->
              <div class="mt-2 border-t pt-2">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-primary-700">Custom Fields</span>
                  <button @click="openCustomFieldModal(ds)" class="text-xs text-primary-600 hover:underline">+ Add</button>
                </div>
                <div v-for="column in ds.columns.filter(c => c.isCustom)" :key="column.name" class="flex items-center justify-between p-2 rounded mt-1">
                  <div class="flex items-center">
                    <CheckIcon
                      v-if="isFieldInUse(column.name, ds.id)"
                      class="h-4 w-4 text-primary-600 mr-2"
                    />
                    <span class="text-sm font-medium text-yellow-700 cursor-move" :draggable="true" @dragstart="$emit('field-drag', $event, column, ds.id)">{{ column.name }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button @click="editCustomFieldModal(ds, column)" class="p-1 text-gray-500 hover:text-primary-600" title="Edit">
                      <PencilIcon class="h-4 w-4" />
                    </button>
                    <button @click="removeCustomFieldModal(ds, column)" class="p-1 text-red-500 hover:text-red-700" title="Remove">
                      <TrashIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tools Tab -->
      <div v-if="activeTab === 'tools'" class="p-4">
        <div class="text-center py-8">
          <div class="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h3 class="text-sm font-medium text-gray-900 mb-2">Dashboard Tools</h3>
          <p class="text-xs text-gray-500">
            Tools and utilities will be available here
          </p>
        </div>
      </div>
    </div>

    <!-- Data Source Manager Modal -->
    <TransitionRoot appear :show="showDataSourceManager" as="template">
      <Dialog as="div" @close="showDataSourceManager = false" class="relative z-50">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <!-- Modal Header -->
                <div class="px-6 py-4 border-b border-gray-200">
                  <div class="flex items-center justify-between">
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                      Choose datasets
                    </DialogTitle>
                    <button
                      @click="showDataSourceManager = false"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon class="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <!-- Search and Filter Controls -->
                <div class="px-6 py-4 border-b border-gray-200">
                  <div class="flex items-center gap-4">
                    <!-- Search Input -->
                    <div class="flex-1 relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search datasets"
                        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <!-- Category Filter -->
                    <div class="min-w-0 flex-shrink-0">
                      <select
                        v-model="selectedCategory"
                        class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="">All Categories</option>
                        <option v-for="category in availableCategories" :key="category" :value="category">
                          {{ category }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Data Sources Table -->
                <div class="px-6 py-4">
                  <div class="overflow-hidden border border-gray-200 rounded-lg">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th scope="col" class="w-12 px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              :checked="isAllSelected"
                              @change="toggleSelectAll"
                              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <tr
                          v-for="(ds, index) in paginatedDataSources"
                          :key="ds.id"
                          class="hover:bg-gray-50"
                        >
                          <td class="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              :checked="isDataSourceSelected(ds)"
                              @change="toggleDataSource(ds)"
                              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ ds.name }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ ds.category || 'General' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Pagination Info -->
                  <div class="mt-4 flex items-center justify-between text-sm text-gray-700">
                    <div>
                      {{ paginationInfo }}
                    </div>
                    <div class="flex items-center space-x-2">
                      <!-- Pagination Controls -->
                      <button
                        @click="goToPreviousPage"
                        :disabled="currentPage === 1"
                        class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <button
                        v-for="page in visiblePages"
                        :key="page"
                        @click="goToPage(page)"
                        :class="[
                          'px-3 py-1 border text-sm rounded',
                          page === currentPage
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        ]"
                      >
                        {{ page }}
                      </button>
                      
                      <button
                        @click="goToNextPage"
                        :disabled="currentPage === totalPages"
                        class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Modal Footer -->
                <div class="px-6 py-4 border-t border-gray-200 flex justify-between">
                  <button
                    @click="showDataSourceManager = false"
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Back
                  </button>
                  <button
                    @click="saveSelectedDataSources"
                    class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Save
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Custom Field Modal -->
    <TransitionRoot appear :show="showCustomFieldModal" as="template">
      <Dialog as="div" @close="closeCustomFieldModal" class="relative z-50">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>
        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                  {{ customFieldEditMode ? 'Edit Custom Field' : 'Add Custom Field' }}
                </DialogTitle>
                <div class="mt-4 space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Field Name</label>
                    <input v-model="customFieldForm.name" type="text" class="w-full rounded border-gray-300 text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Expression</label>
                    <input v-model="customFieldForm.expression" type="text" class="w-full rounded border-gray-300 text-sm" placeholder="e.g. revenue - cost" />
                    <p class="text-xs text-gray-500 mt-1">Use existing field names as variables. Example: <span class="font-mono">revenue - cost</span></p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select v-model="customFieldForm.type" class="w-full rounded border-gray-300 text-sm">
                      <option value="number">Number</option>
                      <option value="string">String</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                </div>
                <div class="mt-6 flex justify-end gap-2">
                  <button @click="closeCustomFieldModal" class="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
                  <button @click="saveCustomField" class="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700">Save</button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { 
  Cog6ToothIcon, 
  ChevronDownIcon, 
  CheckIcon, 
  PencilIcon, 
  TrashIcon,
  CircleStackIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useDataSourceStore, type DataSourceColumn } from '../stores/dataSource'

const props = defineProps<{
  selectedDataSources: Array<{ id: string; name: string; columns: DataSourceColumn[] }>
  expandedDataSources: string[]
  isFieldInUse: (fieldName: string, dataSourceId: string) => boolean
  width: number
}>()

const emit = defineEmits<{
  'open-manager': []
  'toggle-expand': [id: string]
  'field-drag': [event: DragEvent, column: DataSourceColumn, dataSourceId: string]
  'update-selected-data-sources': [dataSources: Array<{ id: string; name: string; columns: DataSourceColumn[] }>]
  'update-dashboard-info': [info: { category: string; description: string; saveAsTemplate: boolean }]
  'toggle-dashboard-tabs': [show: boolean]
}>()

const dataSourceStore = useDataSourceStore()
const { dataSources } = storeToRefs(dataSourceStore)
const { addCustomField, editCustomField, removeCustomField } = dataSourceStore

// Tab management
const activeTab = ref('overview')
const tabs = [
  { id: 'overview', name: 'Overview', icon: InformationCircleIcon },
  { id: 'data-sources', name: 'Data', icon: CircleStackIcon },
  { id: 'tools', name: 'Tools', icon: WrenchScrewdriverIcon }
]

// Overview tab state
const dashboardCategory = ref('')
const dashboardDescription = ref('')
const saveAsTemplate = ref(false)
const showDashboardTabs = ref(true)

// Watch for changes and emit to parent
const emitDashboardInfo = () => {
  emit('update-dashboard-info', {
    category: dashboardCategory.value,
    description: dashboardDescription.value,
    saveAsTemplate: saveAsTemplate.value
  })
}

// Watch for changes
computed(() => {
  emitDashboardInfo()
  return null
})

// Data source manager modal state
const showDataSourceManager = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(4)
const tempSelectedDataSources = ref<Array<{ id: string; name: string; columns: DataSourceColumn[] }>>([])

// Custom field modal state
const showCustomFieldModal = ref(false)
const customFieldForm = ref({ name: '', expression: '', type: 'number' })
const customFieldEditMode = ref(false)
let customFieldTargetDataSource: any = null
let customFieldOriginalName = ''

// Computed properties for data source manager
const availableCategories = computed(() => {
  const categories = new Set<string>()
  if (dataSources.value) {
    dataSources.value.forEach(ds => {
      categories.add(ds.category || 'General')
    })
  }
  return Array.from(categories).sort()
})

const filteredDataSources = computed(() => {
  let filtered = dataSources.value || []

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(ds =>
      ds.name.toLowerCase().includes(query) ||
      ds.id.toLowerCase().includes(query)
    )
  }

  // Apply category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(ds => (ds.category || 'General') === selectedCategory.value)
  }

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredDataSources.value.length / itemsPerPage.value)
})

const paginatedDataSources = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredDataSources.value.slice(start, end)
})

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(currentPage.value * itemsPerPage.value, filteredDataSources.value.length)
  const total = filteredDataSources.value.length
  return `${start} - ${end} of ${total} items`
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  // Show up to 5 pages around current page
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const isAllSelected = computed(() => {
  return paginatedDataSources.value.length > 0 && 
         paginatedDataSources.value.every(ds => isDataSourceSelected(ds))
})

// Data source manager methods
const openDataSourceManager = () => {
  showDataSourceManager.value = true
  tempSelectedDataSources.value = [...props.selectedDataSources]
  searchQuery.value = ''
  selectedCategory.value = ''
  currentPage.value = 1
}

const isDataSourceSelected = (dataSource: any) => {
  return tempSelectedDataSources.value.some(ds => ds.id === dataSource.id)
}

const toggleDataSource = (dataSource: any) => {
  const index = tempSelectedDataSources.value.findIndex(ds => ds.id === dataSource.id)
  if (index === -1) {
    tempSelectedDataSources.value.push(dataSource)
  } else {
    tempSelectedDataSources.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Deselect all visible items
    paginatedDataSources.value.forEach(ds => {
      const index = tempSelectedDataSources.value.findIndex(selected => selected.id === ds.id)
      if (index !== -1) {
        tempSelectedDataSources.value.splice(index, 1)
      }
    })
  } else {
    // Select all visible items
    paginatedDataSources.value.forEach(ds => {
      if (!isDataSourceSelected(ds)) {
        tempSelectedDataSources.value.push(ds)
      }
    })
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const saveSelectedDataSources = () => {
  emit('update-selected-data-sources', tempSelectedDataSources.value)
  showDataSourceManager.value = false
}

// Custom field modal methods
function openCustomFieldModal(ds: any) {
  showCustomFieldModal.value = true
  customFieldEditMode.value = false
  customFieldForm.value = { name: '', expression: '', type: 'number' }
  customFieldTargetDataSource = ds
  customFieldOriginalName = ''
}

function editCustomFieldModal(ds: any, column: any) {
  showCustomFieldModal.value = true
  customFieldEditMode.value = true
  customFieldForm.value = { name: column.name, expression: column.expression || '', type: column.type }
  customFieldTargetDataSource = ds
  customFieldOriginalName = column.name
}

function closeCustomFieldModal() {
  showCustomFieldModal.value = false
  customFieldTargetDataSource = null
  customFieldOriginalName = ''
}

function saveCustomField() {
  if (!customFieldTargetDataSource) return
  if (!customFieldForm.value.name || !customFieldForm.value.expression) return
  if (customFieldEditMode.value) {
    editCustomField(customFieldTargetDataSource, customFieldOriginalName, customFieldForm.value.name, customFieldForm.value.expression, customFieldForm.value.type as 'string' | 'number' | 'date')
  } else {
    addCustomField(customFieldTargetDataSource, customFieldForm.value.name, customFieldForm.value.expression, customFieldForm.value.type as 'string' | 'number' | 'date')
  }
  closeCustomFieldModal()
}

function removeCustomFieldModal(ds: any, column: any) {
  removeCustomField(ds, column.name)
}

// Expose the openDataSourceManager method to parent
defineExpose({
  openDataSourceManager
})
</script>