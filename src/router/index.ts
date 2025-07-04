import { createRouter, createWebHistory } from 'vue-router'
import instruct from '../views/instruct.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: instruct
  }

]

export const router = createRouter({
  history: createWebHistory(),
  routes
})