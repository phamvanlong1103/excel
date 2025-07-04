<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <router-link to="/instruct"
                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
                :class="$route.name === 'DashboardStore'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                Instruct
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