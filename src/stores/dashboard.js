import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
export const useDashboardStore = defineStore('dashboard', () => {
    const dashboards = ref([]);
    const currentDashboard = ref(null);
    const getDashboardById = computed(() => {
        return (id) => dashboards.value.find(d => d.id === id);
    });
    const loadFromStorage = () => {
        const stored = localStorage.getItem('bi-dashboards');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                dashboards.value = parsed.map((dashboard) => ({
                    ...dashboard,
                    createdAt: new Date(dashboard.createdAt),
                    dataSourceIds: dashboard.dataSourceIds || []
                }));
            }
            catch (e) {
                console.error('Failed to load dashboards from storage:', e);
            }
        }
    };
    const saveToStorage = () => {
        localStorage.setItem('bi-dashboards', JSON.stringify(dashboards.value));
    };
    const createDashboard = (name, description, dataSourceIds) => {
        const dashboard = {
            id: Date.now().toString(),
            name,
            description,
            widgets: [],
            createdAt: new Date(),
            dataSourceIds: dataSourceIds || []
        };
        dashboards.value.push(dashboard);
        saveToStorage();
        return dashboard;
    };
    const updateDashboard = (id, updates) => {
        const dashboard = dashboards.value.find(d => d.id === id);
        if (dashboard) {
            Object.assign(dashboard, updates);
            saveToStorage();
        }
    };
    const deleteDashboard = (id) => {
        const index = dashboards.value.findIndex(d => d.id === id);
        if (index > -1) {
            dashboards.value.splice(index, 1);
            saveToStorage();
        }
    };
    const addWidget = (dashboardId, chartId) => {
        const dashboard = dashboards.value.find(d => d.id === dashboardId);
        if (dashboard) {
            const widget = {
                id: Date.now().toString(),
                chartId,
                x: 0,
                y: 0,
                w: 6,
                h: 4
            };
            dashboard.widgets.push(widget);
            saveToStorage();
        }
    };
    const removeWidget = (dashboardId, widgetId) => {
        const dashboard = dashboards.value.find(d => d.id === dashboardId);
        if (dashboard) {
            dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
            saveToStorage();
        }
    };
    const updateWidgetLayout = (dashboardId, widgetId, layout) => {
        const dashboard = dashboards.value.find(d => d.id === dashboardId);
        if (dashboard) {
            const widget = dashboard.widgets.find(w => w.id === widgetId);
            if (widget) {
                Object.assign(widget, layout);
                saveToStorage();
            }
        }
    };
    // Initialize from storage
    loadFromStorage();
    return {
        dashboards,
        currentDashboard,
        getDashboardById,
        createDashboard,
        updateDashboard,
        deleteDashboard,
        addWidget,
        removeWidget,
        updateWidgetLayout
    };
});
