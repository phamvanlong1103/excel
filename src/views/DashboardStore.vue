<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <!-- Header -->
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-bold text-gray-900">Dashboard Store</h1>
          <p class="mt-2 text-sm text-gray-700">
            Browse dashboard templates and manage your dashboards.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            @click="createBlankDashboard"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Create Dashboard
          </button>
        </div>
      </div>

      <!-- Dashboard Templates Section -->
      <div class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-medium text-gray-900">Dashboard Templates</h2>
          <div class="flex items-center space-x-4">
            <!-- Template Search -->
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
              </div>
              <input
                v-model="templateSearchQuery"
                type="text"
                placeholder="Search templates..."
                class="block w-48 pl-8 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <!-- Expand/Collapse Button -->
            <button
              @click="showAllTemplates = !showAllTemplates"
              class="inline-flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              {{ showAllTemplates ? 'Show Less' : 'Show More' }}
              <ChevronDownIcon
                class="ml-1 h-4 w-4 transform transition-transform duration-200"
                :class="{ 'rotate-180': showAllTemplates }"
              />
            </button>
          </div>
        </div>
        <div
          v-if="!showAllTemplates"
          class="flex gap-4 flex-nowrap overflow-hidden pb-2 justify-between"
        >
          <!-- Blank Dashboard Template -->
          <div
            @click="createBlankDashboard"
            class="flex-1 basis-0 bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary-400"
          >
            <div class="p-3">
              <div class="flex items-center justify-center h-20 bg-gray-50 rounded">
                <div class="text-center">
                  <PlusIcon class="mx-auto h-6 w-6 text-gray-400" />
                  <p class="mt-1 text-xs font-medium text-gray-900">Blank Dashboard</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Template Dashboards -->
          <div
            v-for="template in visibleTemplates"
            :key="template.id"
            @click="createFromTemplate(template)"
            class="flex-1 basis-0 bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div class="p-3">
              <div class="h-20 bg-gradient-to-br rounded overflow-hidden" :class="template.gradient">
                <div class="h-full flex items-center justify-center">
                  <component :is="template.icon" class="h-8 w-8 text-white opacity-80" />
                </div>
              </div>
              <div class="mt-2">
                <h3 class="text-xs font-medium text-gray-900 truncate">{{ template.name }}</h3>
                <p class="text-xs text-gray-500 truncate">{{ template.description }}</p>
                <div class="mt-1">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {{ template.category }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="grid gap-4 transition-all duration-300"
          style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));"
        >
          <!-- Blank Dashboard Template -->
          <div
            @click="createBlankDashboard"
            class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary-400"
          >
            <div class="p-3">
              <div class="flex items-center justify-center h-20 bg-gray-50 rounded">
                <div class="text-center">
                  <PlusIcon class="mx-auto h-6 w-6 text-gray-400" />
                  <p class="mt-1 text-xs font-medium text-gray-900">Blank Dashboard</p>
                </div>
              </div>
            </div>
          </div>
          <!-- Template Dashboards -->
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            @click="createFromTemplate(template)"
            class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div class="p-3">
              <div class="h-20 bg-gradient-to-br rounded overflow-hidden" :class="template.gradient">
                <div class="h-full flex items-center justify-center">
                  <component :is="template.icon" class="h-8 w-8 text-white opacity-80" />
                </div>
              </div>
              <div class="mt-2">
                <h3 class="text-xs font-medium text-gray-900 truncate">{{ template.name }}</h3>
                <p class="text-xs text-gray-500 truncate">{{ template.description }}</p>
                <div class="mt-1">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {{ template.category }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard Management Section -->
      <div class="mt-12">
        <div class="sm:flex sm:items-center sm:justify-between">
          <h2 class="text-lg font-medium text-gray-900">My Dashboards</h2>
          <div class="mt-4 sm:mt-0 flex items-center space-x-4">
            <!-- Search -->
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search dashboards..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <!-- Filter -->
            <select
              v-model="selectedFilter"
              class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="all">All Dashboards</option>
              <option value="my">My Dashboards</option>
              <option value="shared">Shared with Me</option>
            </select>
          </div>
        </div>

        <!-- Dashboard Table -->
        <div class="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
          <div v-if="filteredDashboards.length === 0" class="text-center py-12">
            <Squares2X2Icon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900">No dashboards found</h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating your first dashboard.' }}
            </p>
          </div>
          <table v-else class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Widgets
                </th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="dashboard in filteredDashboards"
                :key="dashboard.id"
                class="hover:bg-gray-50"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Squares2X2Icon class="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ dashboard.name }}</div>
                      <div class="text-sm text-gray-500">{{ dashboard.widgets.length }} widgets</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                  {{ dashboard.description || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(dashboard.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-blue-100 text-blue-800': dashboard.type === 'my',
                      'bg-green-100 text-green-800': dashboard.type === 'shared'
                    }"
                  >
                    {{ dashboard.type === 'my' ? 'My Dashboard' : 'Shared' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ dashboard.owner }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ dashboard.widgets.length }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="viewDashboard(dashboard.id)"
                      class="text-primary-600 hover:text-primary-900"
                      title="View Dashboard"
                    >
                      <EyeIcon class="h-5 w-5" />
                    </button>
                    <button
                      @click="editDashboard(dashboard.id)"
                      class="text-gray-600 hover:text-gray-900"
                      title="Edit Dashboard"
                    >
                      <PencilIcon class="h-5 w-5" />
                    </button>
                    <button
                      @click="cloneDashboard(dashboard)"
                      class="text-gray-600 hover:text-gray-900"
                      title="Clone Dashboard"
                    >
                      <DocumentDuplicateIcon class="h-5 w-5" />
                    </button>
                    <button
                      @click="shareDashboard(dashboard)"
                      class="text-gray-600 hover:text-gray-900"
                      title="Share Dashboard"
                    >
                      <ShareIcon class="h-5 w-5" />
                    </button>
                    <button
                      @click="deleteDashboard(dashboard.id)"
                      class="text-red-600 hover:text-red-900"
                      title="Delete Dashboard"
                    >
                      <TrashIcon class="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Share Dashboard Modal -->
    <TransitionRoot :show="showShareModal" as="template">
      <Dialog @close="showShareModal = false" class="relative z-10">
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
                <div>
                  <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                    <ShareIcon class="h-6 w-6 text-primary-600" />
                  </div>
                  <div class="mt-3 text-center sm:mt-5">
                    <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                      Share Dashboard
                    </DialogTitle>
                    <div class="mt-2">
                      <p class="text-sm text-gray-500">
                        Share "{{ selectedDashboard?.name }}" with others by providing them with this link.
                      </p>
                    </div>
                  </div>
                </div>
                <div class="mt-5 sm:mt-6">
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Share Link
                    </label>
                    <div class="flex rounded-md shadow-sm">
                      <input
                        :value="shareLink"
                        readonly
                        class="flex-1 block w-full rounded-none rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <button
                        @click="copyShareLink"
                        class="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100"
                      >
                        <ClipboardIcon class="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div class="sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      @click="showShareModal = false"
                      class="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      @click="showShareModal = false"
                      class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                    >
                      Cancel
                    </button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import {
  PlusIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  ClipboardIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  ChartPieIcon,
  TableCellsIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TruckIcon,
  BuildingOfficeIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'
import { useDashboardStore, type Dashboard } from '../stores/dashboard'

const router = useRouter()
const dashboardStore = useDashboardStore()

const searchQuery = ref('')
const selectedFilter = ref('all')
const showShareModal = ref(false)
const selectedDashboard = ref<Dashboard | null>(null)

// Dashboard templates
const dashboardTemplates = [
  {
    id: 'sales-analytics',
    name: 'Sales Analytics',
    description: 'Track sales performance and revenue metrics',
    category: 'Sales',
    icon: ChartBarIcon,
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    id: 'financial-overview',
    name: 'Financial Overview',
    description: 'Monitor financial KPIs and budget tracking',
    category: 'Finance',
    icon: CurrencyDollarIcon,
    gradient: 'from-green-500 to-green-600'
  },
  {
    id: 'marketing-dashboard',
    name: 'Marketing Dashboard',
    description: 'Analyze marketing campaigns and ROI',
    category: 'Marketing',
    icon: PresentationChartLineIcon,
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    id: 'hr-analytics',
    name: 'HR Analytics',
    description: 'Employee metrics and workforce insights',
    category: 'HR',
    icon: UserGroupIcon,
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    id: 'operations-dashboard',
    name: 'Operations Dashboard',
    description: 'Operational efficiency and process metrics',
    category: 'Operations',
    icon: TruckIcon,
    gradient: 'from-red-500 to-red-600'
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level business overview for executives',
    category: 'Executive',
    icon: BuildingOfficeIcon,
    gradient: 'from-gray-600 to-gray-700'
  },
  // --- Additional Templates ---
  {
    id: 'customer-insights',
    name: 'Customer Insights',
    description: 'Understand customer behavior and segmentation',
    category: 'Customer',
    icon: UserGroupIcon,
    gradient: 'from-pink-500 to-pink-600'
  },
  {
    id: 'project-tracking',
    name: 'Project Tracking',
    description: 'Monitor project progress and milestones',
    category: 'Project',
    icon: ChartBarIcon,
    gradient: 'from-yellow-500 to-yellow-600'
  },
  {
    id: 'website-analytics',
    name: 'Website Analytics',
    description: 'Track website traffic and user engagement',
    category: 'Web',
    icon: ChartPieIcon,
    gradient: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    description: 'Visualize supply chain and inventory metrics',
    category: 'Supply Chain',
    icon: TruckIcon,
    gradient: 'from-teal-500 to-teal-600'
  },
  {
    id: 'it-monitoring',
    name: 'IT Monitoring',
    description: 'Monitor IT systems and uptime',
    category: 'IT',
    icon: PresentationChartLineIcon,
    gradient: 'from-cyan-500 to-cyan-600'
  },
  {
    id: 'product-performance',
    name: 'Product Performance',
    description: 'Analyze product sales and feedback',
    category: 'Product',
    icon: ChartBarIcon,
    gradient: 'from-lime-500 to-lime-600'
  },
  {
    id: 'employee-engagement',
    name: 'Employee Engagement',
    description: 'Track employee satisfaction and engagement',
    category: 'HR',
    icon: UserGroupIcon,
    gradient: 'from-orange-400 to-orange-500'
  },
  {
    id: 'budget-vs-actual',
    name: 'Budget vs Actual',
    description: 'Compare budgeted vs actual spend',
    category: 'Finance',
    icon: CurrencyDollarIcon,
    gradient: 'from-green-400 to-green-500'
  },
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Monitor social media reach and engagement',
    category: 'Marketing',
    icon: ChartPieIcon,
    gradient: 'from-blue-400 to-blue-500'
  },
  {
    id: 'retail-performance',
    name: 'Retail Performance',
    description: 'Track retail sales and store metrics',
    category: 'Retail',
    icon: ChartBarIcon,
    gradient: 'from-fuchsia-500 to-fuchsia-600'
  }
]

// Add new refs for template management
const showAllTemplates = ref(false)
const templateSearchQuery = ref('')

// Track number of columns for responsive grid and row
const templateRowCount = ref(4)

function updateTemplateRowCount() {
  const width = window.innerWidth
  if (width >= 1280) {
    templateRowCount.value = 6
  } else if (width >= 1024) {
    templateRowCount.value = 5
  } else if (width >= 640) {
    templateRowCount.value = 4
  } else {
    templateRowCount.value = 2
  }
}

onMounted(() => {
  updateTemplateRowCount()
  window.addEventListener('resize', updateTemplateRowCount)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateTemplateRowCount)
})

const visibleTemplates = computed(() => {
  if (!templateSearchQuery.value) {
    return dashboardTemplates.slice(0, templateRowCount.value - 1) // -1 for blank template
  }
  const query = templateSearchQuery.value.toLowerCase()
  return dashboardTemplates.filter(template =>
    template.name.toLowerCase().includes(query) ||
    template.description.toLowerCase().includes(query) ||
    template.category.toLowerCase().includes(query)
  ).slice(0, templateRowCount.value - 1)
})

const filteredTemplates = computed(() => {
  if (!templateSearchQuery.value) {
    return dashboardTemplates
  }
  const query = templateSearchQuery.value.toLowerCase()
  return dashboardTemplates.filter(template =>
    template.name.toLowerCase().includes(query) ||
    template.description.toLowerCase().includes(query) ||
    template.category.toLowerCase().includes(query)
  )
})

// Enhanced dashboard data with additional properties
const enhancedDashboards = computed(() => {
  return dashboardStore.dashboards.map(dashboard => ({
    ...dashboard,
    type: 'my' as 'my' | 'shared',
    owner: 'me',
    description: dashboard.description || ''
  }))
})

const filteredDashboards = computed(() => {
  let filtered = enhancedDashboards.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(dashboard =>
      dashboard.name.toLowerCase().includes(query)
    )
  }

  // Apply type filter
  if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(dashboard => dashboard.type === selectedFilter.value)
  }

  return filtered
})

const shareLink = computed(() => {
  if (!selectedDashboard.value) return ''
  return `${window.location.origin}/dashboard/${selectedDashboard.value.id}?shared=true`
})

const createBlankDashboard = () => {
  router.push('/quick-dashboard')
}

const createFromTemplate = (template: any) => {
  // For now, just create a blank dashboard with the template name
  const dashboard = dashboardStore.createDashboard(`${template.name} Dashboard`)
  router.push(`/dashboard/${dashboard.id}`)
}

const viewDashboard = (id: string) => {
  router.push(`/dashboard/${id}`)
}

const editDashboard = (id: string) => {
  router.push(`/quick-dashboard?id=${id}`)
}

const cloneDashboard = (dashboard: Dashboard) => {
  const clonedName = `${dashboard.name} (Copy)`
  const clonedDashboard = dashboardStore.createDashboard(clonedName)
  
  // Copy widgets from original dashboard
  dashboard.widgets.forEach(widget => {
    dashboardStore.addWidget(clonedDashboard.id, widget.chartId)
    const newWidget = clonedDashboard.widgets[clonedDashboard.widgets.length - 1]
    if (newWidget) {
      dashboardStore.updateWidgetLayout(clonedDashboard.id, newWidget.id, {
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h
      })
    }
  })
  
  router.push(`/dashboard/${clonedDashboard.id}`)
}

const shareDashboard = (dashboard: Dashboard) => {
  selectedDashboard.value = dashboard
  showShareModal.value = true
}

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    // You could add a toast notification here
    alert('Share link copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

const deleteDashboard = (id: string) => {
  if (confirm('Are you sure you want to delete this dashboard? This action cannot be undone.')) {
    dashboardStore.deleteDashboard(id)
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