import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import DataSources from '../views/DataSources.vue'
import QuickDashboard from '../views/QuickDashboard.vue'
import DashboardStore from '../views/DashboardStore.vue'
import TemplateDesigner from '../views/TemplateDesigner.vue'
import JournalComponent from '../views/JournalComponent.vue'
import CsvTester from '../views/CsvTester.vue'
import AI from '../views/AI.vue'
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/data-sources',
    name: 'DataSources',
    component: DataSources
  },
  {
    path: '/dashboards',
    name: 'DashboardStore',
    component: DashboardStore
  },
  {
    path: '/dashboard-store',
    name: 'DashboardStoreAlias',
    component: DashboardStore
  },
  {
    path: '/quick-dashboard',
    name: 'QuickDashboard',
    component: QuickDashboard
  },
  {
    path: '/template-designer',
    name: 'TemplateDesigner',
    component: TemplateDesigner
  },
  {
    path: '/diary',
    name: 'diary',
    component: JournalComponent
  },
  {
    path:'/csv-tester',
    name: 'CsvTester',
    component:CsvTester
  },
   {
    path:'/AI',
    name: 'AI',
    component:AI
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})