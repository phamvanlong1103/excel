import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
export const useChartStore = defineStore('chart', () => {
    const charts = ref([]);
    const getChartById = computed(() => {
        return (id) => charts.value.find(c => c.id === id);
    });
    const getChartsByDataSource = computed(() => {
        return (dataSourceId) => charts.value.filter(c => c.dataSourceId === dataSourceId);
    });
    const loadFromStorage = () => {
        const stored = localStorage.getItem('bi-charts');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                charts.value = parsed.map((chart) => ({
                    ...chart,
                    createdAt: new Date(chart.createdAt)
                }));
            }
            catch (e) {
                console.error('Failed to load charts from storage:', e);
            }
        }
    };
    const saveToStorage = () => {
        localStorage.setItem('bi-charts', JSON.stringify(charts.value));
    };
    const createChart = (config) => {
        const chart = {
            ...config,
            id: Date.now().toString(),
            createdAt: new Date()
        };
        charts.value.push(chart);
        saveToStorage();
        return chart;
    };
    const updateChart = (id, updates) => {
        const chart = charts.value.find(c => c.id === id);
        if (chart) {
            Object.assign(chart, updates);
            saveToStorage();
        }
    };
    const deleteChart = (id) => {
        const index = charts.value.findIndex(c => c.id === id);
        if (index > -1) {
            charts.value.splice(index, 1);
            saveToStorage();
        }
    };
    // Initialize from storage
    loadFromStorage();
    return {
        charts,
        getChartById,
        getChartsByDataSource,
        createChart,
        updateChart,
        deleteChart
    };
});
