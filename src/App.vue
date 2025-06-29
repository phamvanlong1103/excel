<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">BI Dashboard</h1>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link
                to="/"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                :class="$route.name === 'Home' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                <ChartBarIcon class="w-4 h-4 mr-2" />
                Home
              </router-link>
              <router-link
                to="/data-sources"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                :class="$route.name === 'DataSources' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                <TableCellsIcon class="w-4 h-4 mr-2" />
                Data Sources
              </router-link>
              
              <router-link
                to="/csv-tester"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                :class="$route.name === 'CsvTester' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              >
                <ChartBarIcon class="w-4 h-4 mr-2" />
                Csv Tester
            </router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { 
  ChartBarIcon, 
  TableCellsIcon, 
  PresentationChartLineIcon, 
  Squares2X2Icon,
  BoltIcon,
  BuildingStorefrontIcon
} from '@heroicons/vue/24/outline'
</script>