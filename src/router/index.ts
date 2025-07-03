import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import DataSources from '../views/DataSources.vue'
import QuickDashboard from '../views/QuickDashboard.vue'
import DashboardStore from '../views/DashboardStore.vue'
import TemplateDesigner from '../views/TemplateDesigner.vue'
import JournalComponent from '../views/JournalComponent.vue'
import CsvTester from '../views/CsvTester.vue'
import AI from '../views/AI.vue'
import Profile from '../views/Profile.vue' 

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path:'/Profile',
    name: 'Profile',
    component:Profile
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})