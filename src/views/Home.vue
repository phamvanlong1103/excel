<template>
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div class="text-center">
        <ChartBarIcon class="mx-auto h-12 w-12 text-primary-500" />
        <h1 class="mt-4 text-3xl font-bold text-gray-900">Business Intelligence Dashboard</h1>
        <p class="mt-2 text-lg text-gray-600">
          Create powerful data visualizations and interactive dashboards from your CSV data
        </p>
      </div>

      <div class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
          <div class="p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <TableCellsIcon class="h-8 w-8 text-primary-500" />
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Data Sources</h3>
                <p class="text-sm text-gray-600">{{ dataSourceStore.dataSources.length }} data sources</p>
              </div>
            </div>
            <div class="mt-4">
              <p class="text-sm text-gray-500">
                Upload and manage CSV files to create data sources for your charts and dashboards.
              </p>
              <div class="mt-3">
                <router-link to="/data-sources"
                  class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 transition-colors duration-200">
                  Manage Data Sources
                  <ArrowRightIcon class="ml-2 h-4 w-4" />
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChartBarIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  Squares2X2Icon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'
import { useDataSourceStore } from '../stores/dataSource'
import { useChartStore } from '../stores/chart'
import { useDashboardStore } from '../stores/dashboard'

const dataSourceStore = useDataSourceStore()
const chartStore = useChartStore()
const dashboardStore = useDashboardStore()
</script>