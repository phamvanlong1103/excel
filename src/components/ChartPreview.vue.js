import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, BarController, LineController, PieController, ScatterController } from 'chart.js';
import { ExclamationTriangleIcon, ChartBarIcon } from '@heroicons/vue/24/outline';
import { useDataSourceStore } from '../stores/dataSource';
import KPICard from './KPICard.vue';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, BarController, LineController, PieController, ScatterController);
const props = defineProps();
const dataSourceStore = useDataSourceStore();
const canvasRef = ref();
const error = ref('');
let chartInstance = null;
const hasValidData = computed(() => {
    if (props.chart.data && Array.isArray(props.chart.data) && props.chart.data.length > 0)
        return true;
    if (!props.chart.dataSourceId || !props.chart.type)
        return false;
    const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId);
    if (!dataSource || dataSource.rows.length === 0)
        return false;
    if (props.chart.type === 'card') {
        return !!props.chart.keyMetric;
    }
    else if (props.chart.type === 'pie') {
        return !!props.chart.category;
    }
    else if (props.chart.type === 'bar') {
        return Array.isArray(props.chart.xAxis) ? props.chart.xAxis.length > 0 && !!props.chart.yAxis : !!props.chart.xAxis && !!props.chart.yAxis;
    }
    else {
        return !!props.chart.xAxis && !!props.chart.yAxis;
    }
});
// Add color palettes
const colorPalettes = {
    default: [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
        '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#eab308'
    ],
    pastel: [
        '#a5b4fc', '#fbcfe8', '#bbf7d0', '#fde68a', '#ddd6fe',
        '#bae6fd', '#fed7aa', '#d9f99d', '#f9a8d4', '#c7d2fe',
        '#99f6e4', '#fecdd3', '#e9d5ff', '#bbf7d0', '#fef08a'
    ],
    vivid: [
        '#e11d48', '#2563eb', '#059669', '#f59e42', '#a21caf',
        '#0ea5e9', '#f43f5e', '#22d3ee', '#facc15', '#7c3aed',
        '#f472b6', '#16a34a', '#fbbf24', '#f87171', '#38bdf8'
    ],
    earth: [
        '#a16207', '#713f12', '#166534', '#155e75', '#7c2d12',
        '#be185d', '#4d7c0f', '#b91c1c', '#0e7490', '#a21caf',
        '#ca8a04', '#ea580c', '#15803d', '#1e293b', '#f59e42'
    ]
};
function getPalette(scheme, count) {
    const palette = colorPalettes[scheme] || colorPalettes['default'];
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(palette[i % palette.length]);
    }
    return result;
}
const createChart = async () => {
    error.value = '';
    if (!canvasRef.value || !hasValidData.value || props.chart.type === 'card')
        return;
    try {
        // If chart.data exists, use it directly
        if (props.chart.data && Array.isArray(props.chart.data) && props.chart.data.length > 0) {
            let chartData, chartOptions;
            // Build chartData/chartOptions for each chart type using props.chart.data
            if (props.chart.type === 'pie') {
                const labels = props.chart.data.map((d) => d.category);
                const values = props.chart.data.map((d) => d.value);
                chartData = {
                    labels,
                    datasets: [{
                            data: values,
                            backgroundColor: generateColors(labels.length),
                            borderColor: props.chart.borderColor || '#ffffff',
                            borderWidth: 1
                        }]
                };
            }
            else if (props.chart.type === 'bar' || props.chart.type === 'line') {
                const labels = props.chart.data.map((d) => d.category || d.x);
                const values = props.chart.data.map((d) => d.value || d.y);
                chartData = {
                    labels,
                    datasets: [{
                            label: props.chart.yAxis,
                            data: values,
                            backgroundColor: props.chart.backgroundColor || '#3b82f6',
                            borderColor: props.chart.borderColor || '#1d4ed8',
                            borderWidth: props.chart.type === 'line' ? 2 : 1,
                            fill: props.chart.type === 'line' ? false : true,
                            tension: props.chart.type === 'line' ? 0.4 : 0,
                            pointRadius: props.chart.type === 'line' ? 2 : 0,
                            pointHoverRadius: props.chart.type === 'line' ? 4 : 0
                        }]
                };
            }
            else if (props.chart.type === 'scatter') {
                chartData = {
                    datasets: [{
                            label: `${props.chart.yAxis} vs ${props.chart.xAxis}`,
                            data: props.chart.data,
                            backgroundColor: props.chart.backgroundColor || '#3b82f6',
                            borderColor: props.chart.borderColor || '#1d4ed8',
                            pointRadius: 3,
                            pointHoverRadius: 4
                        }]
                };
            }
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top', labels: { boxWidth: 12, padding: 8, font: { size: 10 } } },
                    title: { display: !!props.chart.title, text: props.chart.title || '', font: { size: 12 }, padding: { top: 5, bottom: 10 } },
                    tooltip: { titleFont: { size: 11 }, bodyFont: { size: 10 } }
                },
                animation: { duration: 0 },
                layout: { padding: { top: 5, right: 5, bottom: 5, left: 5 } }
            };
            if (props.chart.type === 'bar' || props.chart.type === 'line') {
                chartOptions.scales = {
                    y: { beginAtZero: true, title: { display: true, text: props.chart.yAxis, font: { size: 10 } }, ticks: { font: { size: 9 } } },
                    x: { title: { display: true, text: props.chart.xAxis, font: { size: 10 } }, ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 0 } }
                };
                chartOptions.indexAxis = props.chart.horizontal ? 'y' : 'x';
            }
            // Destroy existing chart
            if (chartInstance) {
                chartInstance.destroy();
                chartInstance = null;
            }
            await nextTick();
            if (canvasRef.value) {
                chartInstance = new ChartJS(canvasRef.value, { type: props.chart.type, data: chartData, options: chartOptions });
            }
            return;
        }
        const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId);
        if (!dataSource) {
            error.value = 'Data source not found';
            return;
        }
        // Destroy existing chart
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        let chartData;
        let chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: {
                            size: 10
                        }
                    }
                },
                title: {
                    display: !!props.chart.title,
                    text: props.chart.title || '',
                    font: {
                        size: 12
                    },
                    padding: {
                        top: 5,
                        bottom: 10
                    }
                },
                tooltip: {
                    titleFont: {
                        size: 11
                    },
                    bodyFont: {
                        size: 10
                    }
                }
            },
            animation: {
                duration: 0 // Disable animations for better performance
            },
            layout: {
                padding: {
                    top: 5,
                    right: 5,
                    bottom: 5,
                    left: 5
                }
            }
        };
        if (props.chart.type === 'pie') {
            const categoryColumn = dataSource.columns.find(c => c.name === props.chart.category);
            if (!categoryColumn) {
                error.value = 'Category column not found';
                return;
            }
            // Count occurrences of each category
            const categoryCounts = {};
            categoryColumn.values.forEach(value => {
                if (value != null && value !== '') {
                    const key = String(value);
                    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
                }
            });
            const labels = Object.keys(categoryCounts);
            const values = Object.values(categoryCounts);
            if (labels.length === 0) {
                error.value = 'No valid data for pie chart';
                return;
            }
            chartData = {
                labels,
                datasets: [{
                        data: values,
                        backgroundColor: generateColors(labels.length),
                        borderColor: props.chart.borderColor || '#ffffff',
                        borderWidth: 1
                    }]
            };
        }
        else if (props.chart.type === 'bar') {
            // Multi-dimension grouping for bar chart
            const xAxes = Array.isArray(props.chart.xAxis) ? props.chart.xAxis : props.chart.xAxis ? [props.chart.xAxis] : [];
            const yAxis = props.chart.yAxis;
            if (!yAxis || xAxes.length === 0) {
                error.value = 'X and Y axis required';
                return;
            }
            // Group rows by all xAxes fields
            if (xAxes.every(f => typeof f === 'string')) {
                const groupKey = (row) => {
                    let key = '';
                    for (let i = 0; i < xAxes.length; i++) {
                        if (i > 0)
                            key += ' | ';
                        const field = xAxes[i];
                        key += row[field];
                    }
                    return key;
                };
                const grouped = {};
                dataSource.rows.forEach(row => {
                    const key = groupKey(row);
                    if (typeof yAxis === 'string') {
                        const yVal = Number(row[yAxis]);
                        if (key && !isNaN(yVal)) {
                            grouped[key] = (grouped[key] || 0) + yVal;
                        }
                    }
                });
                const labels = Object.keys(grouped);
                const values = Object.values(grouped);
                if (labels.length === 0) {
                    error.value = 'No valid data for chart';
                    return;
                }
                // Use color scheme for bar colors
                const barColors = getPalette(props.chart.colorScheme || 'default', labels.length);
                chartData = {
                    labels,
                    datasets: [{
                            label: yAxis,
                            data: values,
                            backgroundColor: barColors,
                            borderColor: props.chart.borderColor || '#1d4ed8',
                            borderWidth: 1
                        }]
                };
                chartOptions.scales = {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: !props.chart.horizontal,
                            text: props.chart.yAxis,
                            font: { size: 10 }
                        },
                        ticks: { font: { size: 9 } }
                    },
                    x: {
                        title: {
                            display: props.chart.horizontal,
                            text: xAxes.join(', '),
                            font: { size: 10 }
                        },
                        ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 0 }
                    }
                };
                chartOptions.indexAxis = props.chart.horizontal ? 'y' : 'x';
            }
            else {
                error.value = 'Invalid X-axis fields';
                return;
            }
        }
        else {
            const xColumn = dataSource.columns.find(c => c.name === props.chart.xAxis);
            const yColumn = dataSource.columns.find(c => c.name === props.chart.yAxis);
            if (!xColumn || !yColumn) {
                error.value = 'Required columns not found';
                return;
            }
            // Filter out null/undefined values and ensure numeric y-values
            const validData = dataSource.rows
                .map((row, index) => ({
                x: row[props.chart.xAxis],
                y: Number(row[props.chart.yAxis])
            }))
                .filter(item => item.x != null && item.x !== '' && !isNaN(item.y));
            if (validData.length === 0) {
                error.value = 'No valid data points found';
                return;
            }
            if (props.chart.type === 'scatter') {
                chartData = {
                    datasets: [{
                            label: `${props.chart.yAxis} vs ${props.chart.xAxis}`,
                            data: validData,
                            backgroundColor: props.chart.backgroundColor || '#3b82f6',
                            borderColor: props.chart.borderColor || '#1d4ed8',
                            pointRadius: 3,
                            pointHoverRadius: 4
                        }]
                };
                chartOptions.scales = {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: props.chart.xAxis,
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            font: {
                                size: 9
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: props.chart.yAxis,
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            font: {
                                size: 9
                            }
                        }
                    }
                };
            }
            else {
                // For bar and line charts, group by x-axis and sum y-values
                const groupedData = {};
                validData.forEach(item => {
                    const key = String(item.x);
                    groupedData[key] = (groupedData[key] || 0) + item.y;
                });
                const labels = Object.keys(groupedData);
                const values = Object.values(groupedData);
                if (labels.length === 0) {
                    error.value = 'No valid data for chart';
                    return;
                }
                chartData = {
                    labels,
                    datasets: [{
                            label: props.chart.yAxis,
                            data: values,
                            backgroundColor: props.chart.backgroundColor || '#3b82f6',
                            borderColor: props.chart.borderColor || '#1d4ed8',
                            borderWidth: props.chart.type === 'line' ? 2 : 1,
                            fill: props.chart.type === 'line' ? false : true,
                            tension: props.chart.type === 'line' ? 0.4 : 0,
                            pointRadius: props.chart.type === 'line' ? 2 : 0,
                            pointHoverRadius: props.chart.type === 'line' ? 4 : 0
                        }]
                };
                chartOptions.scales = {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: props.chart.yAxis,
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            font: {
                                size: 9
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: props.chart.xAxis,
                            font: {
                                size: 10
                            }
                        },
                        ticks: {
                            font: {
                                size: 9
                            },
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                };
            }
        }
        const config = {
            type: props.chart.type,
            data: chartData,
            options: chartOptions
        };
        // Wait for next tick to ensure canvas is ready
        await nextTick();
        if (canvasRef.value) {
            chartInstance = new ChartJS(canvasRef.value, config);
        }
    }
    catch (err) {
        console.error('Chart creation error:', err);
        error.value = `Failed to create chart: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
};
const generateColors = (count) => {
    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
        '#14b8a6', '#f43f5e', '#a855f7', '#22c55e', '#eab308'
    ];
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
};
// Watch for changes and recreate chart
watch(() => [
    props.chart.dataSourceId,
    props.chart.type,
    props.chart.xAxis,
    props.chart.yAxis,
    props.chart.category,
    props.chart.backgroundColor,
    props.chart.borderColor,
    props.chart.title,
    props.chart.keyMetric,
    props.chart.previousMetric,
    props.chart.differenceType
], () => {
    if (hasValidData.value && props.chart.type !== 'card') {
        nextTick(() => {
            createChart();
        });
    }
}, { deep: true });
onMounted(() => {
    if (hasValidData.value && props.chart.type !== 'card') {
        nextTick(() => {
            createChart();
        });
    }
});
onUnmounted(() => {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-container" },
});
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center h-full text-red-500 text-sm" },
    });
    const __VLS_0 = {}.ExclamationTriangleIcon;
    /** @type {[typeof __VLS_components.ExclamationTriangleIcon, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "h-5 w-5 mr-2" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-5 w-5 mr-2" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    (__VLS_ctx.error);
}
else if (!__VLS_ctx.hasValidData) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center h-full text-gray-500 text-sm" },
    });
    const __VLS_4 = {}.ChartBarIcon;
    /** @type {[typeof __VLS_components.ChartBarIcon, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ class: "h-8 w-8 mr-2" },
    }));
    const __VLS_6 = __VLS_5({
        ...{ class: "h-8 w-8 mr-2" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
else if (__VLS_ctx.chart.type === 'card') {
    /** @type {[typeof KPICard, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(KPICard, new KPICard({
        chart: (__VLS_ctx.chart),
        ...{ class: "w-full h-full" },
    }));
    const __VLS_9 = __VLS_8({
        chart: (__VLS_ctx.chart),
        ...{ class: "w-full h-full" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.canvas, __VLS_intrinsicElements.canvas)({
        ref: "canvasRef",
        ...{ class: "w-full h-full" },
    });
    /** @type {typeof __VLS_ctx.canvasRef} */ ;
}
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ExclamationTriangleIcon: ExclamationTriangleIcon,
            ChartBarIcon: ChartBarIcon,
            KPICard: KPICard,
            canvasRef: canvasRef,
            error: error,
            hasValidData: hasValidData,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
