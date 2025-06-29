import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import DataSources from '../views/DataSources.vue';
import QuickDashboard from '../views/QuickDashboard.vue';
import DashboardStore from '../views/DashboardStore.vue';
import TemplateDesigner from '../views/TemplateDesigner.vue';
import Total from '../views/Total.vue';
import CsvTester from '../views/CsvTester.vue';

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
        path: '/total',
        name: 'Total',
        component: Total
    },
    {
        path: '/csv-tester',
        name: 'CsvTester',
        component: CsvTester
    }
];
export const router = createRouter({
    history: createWebHistory(),
    routes
});
