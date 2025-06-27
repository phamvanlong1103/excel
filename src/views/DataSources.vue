<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-bold text-gray-900">Data Sources</h1>
          <p class="mt-2 text-sm text-gray-700">
            Upload and manage CSV files to create data sources for your charts and dashboards.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            @click="showUploadModal = true"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Upload CSV
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="dataSourceStore.loading" class="mt-8">
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span class="ml-3 text-gray-600">Processing CSV file...</span>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="dataSourceStore.error" class="mt-8">
        <div class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Upload Error</h3>
              <div class="mt-2 text-sm text-red-700">
                {{ dataSourceStore.error }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search and Filter Controls -->
      <div class="mt-8 bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex-1 max-w-lg">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
                </div>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search data sources by name..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-700">
                {{ filteredDataSources.length }} of {{ dataSourceStore.dataSources.length }} data sources
              </span>
            </div>
          </div>
        </div>

        <!-- Data Sources Table -->
        <div class="overflow-hidden">
          <div v-if="filteredDataSources.length === 0 && !dataSourceStore.loading" class="text-center py-12">
            <TableCellsIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">
              {{ searchQuery ? 'No data sources found' : 'No data sources' }}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ searchQuery ? 'Try adjusting your search terms.' : 'Get started by uploading your first CSV file.' }}
            </p>
            <div v-if="!searchQuery" class="mt-6">
              <button
                type="button"
                @click="showUploadModal = true"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                <PlusIcon class="w-4 h-4 mr-2" />
                Upload CSV
              </button>
            </div>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="dataSource in paginatedDataSources"
                  :key="dataSource.id"
                  class="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <TableCellsIcon class="h-6 w-6 text-primary-600" />
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ dataSource.name }}</div>
                        <div class="text-sm text-gray-500">{{ dataSource.rows.length.toLocaleString() }} rows, {{ dataSource.columns.length }} columns</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 max-w-xs">
                      <p class="truncate">{{ dataSource.description || '-' }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getCategoryColor(dataSource.category || 'General')"
                    >
                      {{ dataSource.category || 'General' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(dataSource.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        @click="selectedDataSource = dataSource"
                        class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
                        title="View Details"
                      >
                        <EyeIcon class="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        @click="deleteDataSource(dataSource.id)"
                        class="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                        title="Delete"
                      >
                        <TrashIcon class="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing
                  <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
                  to
                  <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredDataSources.length) }}</span>
                  of
                  <span class="font-medium">{{ filteredDataSources.length }}</span>
                  results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Previous</span>
                    <ChevronLeftIcon class="h-5 w-5" />
                  </button>
                  
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="goToPage(page)"
                    :class="[
                      'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                      page === currentPage
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    ]"
                  >
                    {{ page }}
                  </button>
                  
                  <button
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Next</span>
                    <ChevronRightIcon class="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <TransitionRoot :show="showUploadModal" as="template">
      <Dialog @close="showUploadModal = false" class="relative z-10">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                      Upload CSV File
                    </DialogTitle>
                    <p class="text-sm text-gray-500 mt-1">
                      Add a new data source to your dashboard
                    </p>
                  </div>
                  <button
                    @click="showUploadModal = false"
                    class="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon class="h-6 w-6" />
                  </button>
                </div>

                <!-- Form Content -->
                <form @submit.prevent="handleUpload" class="space-y-4">
                  <!-- Data Source Name -->
                  <div>
                    <label for="dataSourceName" class="block text-sm font-medium text-gray-700 mb-2">
                      Data Source Name
                    </label>
                    <input
                      id="dataSourceName"
                      v-model="uploadForm.name"
                      type="text"
                      required
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Enter a descriptive name for your data source"
                    />
                  </div>

                  <!-- Data Source Description -->
                  <div>
                    <label for="dataSourceDescription" class="block text-sm font-medium text-gray-700 mb-2">
                      Description
                      <span class="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="dataSourceDescription"
                      v-model="uploadForm.description"
                      rows="3"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Describe what this data source contains..."
                    />
                  </div>

                  <!-- Data Source Category -->
                  <div>
                    <label for="dataSourceCategory" class="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="dataSourceCategory"
                      v-model="uploadForm.category"
                      class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="HR">HR</option>
                      <option value="Customer">Customer</option>
                      <option value="Product">Product</option>
                      <option value="Analytics">Analytics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <!-- File Upload Area -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      CSV File
                    </label>
                    <div
                      @drop="handleFileDrop"
                      @dragover.prevent
                      @dragenter.prevent
                      @dragleave="isDragOver = false"
                      @dragover="isDragOver = true"
                      class="relative"
                    >
                      <input
                        id="csvFile"
                        ref="fileInput"
                        type="file"
                        accept=".csv"
                        required
                        @change="handleFileSelect"
                        class="sr-only"
                      />
                      <label
                        for="csvFile"
                        :class="[
                          'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-200',
                          isDragOver || uploadForm.file
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        ]"
                      >
                        <div class="flex flex-col items-center justify-center pt-5 pb-6">
                          <div v-if="uploadForm.file" class="text-center">
                            <DocumentCheckIcon class="w-8 h-8 text-primary-600 mx-auto mb-2" />
                            <p class="text-sm font-medium text-primary-700">{{ uploadForm.file.name }}</p>
                            <p class="text-xs text-gray-500">{{ formatFileSize(uploadForm.file.size) }}</p>
                          </div>
                          <div v-else class="text-center">
                            <CloudArrowUpIcon class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p class="text-sm font-medium text-gray-700">
                              <span class="text-primary-600">Click to upload</span> or drag and drop
                            </p>
                            <p class="text-xs text-gray-500">CSV files only</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- File Requirements -->
                  <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <InformationCircleIcon class="h-5 w-5 text-blue-400" />
                      </div>
                      <div class="ml-3">
                        <h4 class="text-sm font-medium text-blue-800">File Requirements</h4>
                        <div class="mt-1 text-sm text-blue-700">
                          <ul class="list-disc list-inside space-y-1">
                            <li>First row should contain column headers</li>
                            <li>Maximum file size: 10MB</li>
                            <li>Supported format: CSV (.csv)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      @click="showUploadModal = false"
                      class="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      :disabled="!uploadForm.file || !uploadForm.name || dataSourceStore.loading"
                      class="inline-flex justify-center items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span v-if="dataSourceStore.loading" class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                      <span v-else class="flex items-center">
                        <DocumentArrowUpIcon class="w-4 h-4 mr-2" />
                        Upload & Process
                      </span>
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Data Source Detail Modal -->
    <TransitionRoot :show="!!selectedDataSource" as="template">
      <Dialog @close="selectedDataSource = null" class="relative z-10">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </TransitionChild>

        <div class="fixed inset-0 z-10 overflow-y-auto">
          <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as="template"
              enter="ease-out duration-300"
              enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enter-to="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leave-from="opacity-100 translate-y-0 sm:scale-100"
              leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div v-if="selectedDataSource">
                  <!-- Header Section -->
                  <div class="flex items-center justify-between mb-6">
                    <div>
                      <h3 class="text-lg font-medium text-gray-900">{{ selectedDataSource.name }}</h3>
                      <p class="text-sm text-gray-500">
                        {{ selectedDataSource.rows.length }} rows, {{ selectedDataSource.columns.length }} columns
                      </p>
                      <p v-if="selectedDataSource.description" class="text-sm text-gray-600 mt-1">
                        {{ selectedDataSource.description }}
                      </p>
                      <div class="mt-2">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getCategoryColor(selectedDataSource.category || 'General')"
                        >
                          {{ selectedDataSource.category || 'General' }}
                        </span>
                      </div>
                    </div>
                    <button
                      @click="selectedDataSource = null"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon class="h-6 w-6" />
                    </button>
                  </div>
                  
                  <!-- Separator -->
                  <div class="border-t border-gray-200 mb-6"></div>
                  
                  <!-- Columns Section -->
                  <div class="mb-6">
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Columns</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div
                        v-for="column in selectedDataSource.columns"
                        :key="column.name"
                        class="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span class="text-sm font-medium">{{ column.name }}</span>
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
                    </div>
                  </div>

                  <!-- Separator -->
                  <div class="border-t border-gray-200 mb-6"></div>

                  <!-- Data Preview Section -->
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Data Preview (First 10 rows)</h4>
                    <div class="overflow-x-auto">
                      <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                          <tr>
                            <th
                              v-for="column in selectedDataSource.columns"
                              :key="column.name"
                              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {{ column.name }}
                            </th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          <tr
                            v-for="(row, index) in selectedDataSource.rows.slice(0, 10)"
                            :key="index"
                            class="hover:bg-gray-50"
                          >
                            <td
                              v-for="column in selectedDataSource.columns"
                              :key="column.name"
                              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            >
                              {{ row[column.name] }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
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
import { ref, reactive, computed } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import {
  PlusIcon,
  TableCellsIcon,
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  CloudArrowUpIcon,
  InformationCircleIcon,
  EyeIcon,
  TrashIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { useDataSourceStore, type DataSource } from '../stores/dataSource'

const dataSourceStore = useDataSourceStore()

const showUploadModal = ref(false)
const selectedDataSource = ref<DataSource | null>(null)
const fileInput = ref<HTMLInputElement>()
const isDragOver = ref(false)

// Search and pagination
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const uploadForm = reactive({
  name: '',
  description: '',
  category: 'General',
  file: null as File | null
})

// Computed properties for filtering and pagination
const filteredDataSources = computed(() => {
  if (!searchQuery.value) {
    return dataSourceStore.dataSources
  }
  
  const query = searchQuery.value.toLowerCase()
  return dataSourceStore.dataSources.filter(ds =>
    ds.name.toLowerCase().includes(query) ||
    (ds.description && ds.description.toLowerCase().includes(query))
  )
})

const totalPages = computed(() => {
  return Math.ceil(filteredDataSources.value.length / itemsPerPage.value)
})

const paginatedDataSources = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredDataSources.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// Category color mapping
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'General': 'bg-gray-100 text-gray-800',
    'Sales': 'bg-blue-100 text-blue-800',
    'Marketing': 'bg-purple-100 text-purple-800',
    'Finance': 'bg-green-100 text-green-800',
    'Operations': 'bg-orange-100 text-orange-800',
    'HR': 'bg-pink-100 text-pink-800',
    'Customer': 'bg-indigo-100 text-indigo-800',
    'Product': 'bg-yellow-100 text-yellow-800',
    'Analytics': 'bg-teal-100 text-teal-800',
    'Other': 'bg-gray-100 text-gray-800'
  }
  return colors[category] || colors['General']
}

// Pagination methods
const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Reset to first page when search changes
const resetPagination = () => {
  currentPage.value = 1
}

// Watch search query to reset pagination
const unwatchSearch = computed(() => searchQuery.value)
unwatchSearch.value // Access to trigger reactivity
const searchWatcher = () => {
  resetPagination()
}
// Use a watcher effect
const stopWatcher = computed(() => {
  searchQuery.value // Access to trigger reactivity
  resetPagination()
  return null
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  uploadForm.file = target.files?.[0] || null
  if (uploadForm.file && !uploadForm.name) {
    uploadForm.name = uploadForm.file.name.replace(/\.[^/.]+$/, '')
  }
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      uploadForm.file = file
      if (!uploadForm.name) {
        uploadForm.name = file.name.replace(/\.[^/.]+$/, '')
      }
    } else {
      alert('Please upload a CSV file only.')
    }
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleUpload = async () => {
  if (uploadForm.file && uploadForm.name) {
    await dataSourceStore.parseCSV(uploadForm.file, uploadForm.name, uploadForm.description, uploadForm.category)
    if (!dataSourceStore.error) {
      showUploadModal.value = false
      uploadForm.name = ''
      uploadForm.description = ''
      uploadForm.category = 'General'
      uploadForm.file = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
  }
}

const deleteDataSource = (id: string) => {
  if (confirm('Are you sure you want to delete this data source? This action cannot be undone.')) {
    dataSourceStore.deleteDataSource(id)
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}
</script>