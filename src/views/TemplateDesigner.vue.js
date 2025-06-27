import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, Squares2X2Icon, DocumentCheckIcon, ChartBarIcon, PresentationChartLineIcon, ChartPieIcon, CircleStackIcon, ShareIcon } from '@heroicons/vue/24/outline';
import { GridStack } from 'gridstack';
import ChartPanel from '../components/ChartPanel.vue';
import ChartPreview from '../components/ChartPreview.vue';
const router = useRouter();
const chartTypeColWidth = ref(260);
const previewMode = ref(false);
const openChartMenuId = ref(null);
const editingChartId = ref(null);
const gridStackContainer = ref();
let gridStack = null;
const chartTypes = [
    { value: 'bar', label: 'Bar', icon: ChartBarIcon },
    { value: 'line', label: 'Line', icon: PresentationChartLineIcon },
    { value: 'pie', label: 'Pie', icon: ChartPieIcon },
    { value: 'scatter', label: 'Scatter', icon: CircleStackIcon }
];
const colorSchemes = [
    { value: 'default', label: 'Default' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'vivid', label: 'Vivid' },
    { value: 'earth', label: 'Earth' }
];
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
const selectedChartType = ref('bar');
const chartConfig = reactive({
    title: '',
    xAxis: [],
    yAxis: '',
    category: '',
    backgroundColor: '#3b82f6',
    borderColor: '#1d4ed8',
    horizontal: false,
    colorScheme: 'default'
});
const charts = ref([]);
const isChartConfigValid = computed(() => {
    if (!selectedChartType.value)
        return false;
    if (selectedChartType.value === 'pie') {
        return !!chartConfig.category;
    }
    else if (selectedChartType.value === 'bar') {
        return Array.isArray(chartConfig.xAxis) && chartConfig.xAxis.length > 0 && !!chartConfig.yAxis;
    }
    else {
        return !!chartConfig.xAxis && !!chartConfig.yAxis;
    }
});
function onFieldDrop(event, target) {
    event.preventDefault();
    // In template designer, allow any drop and just set the field name
    const fakeField = target === 'xAxis' ? 'Category' : target === 'yAxis' ? 'Value' : 'Category';
    if (target === 'xAxis' && selectedChartType.value === 'bar') {
        if (Array.isArray(chartConfig.xAxis) && !chartConfig.xAxis.includes(fakeField)) {
            chartConfig.xAxis.push(fakeField);
        }
    }
    else {
        chartConfig[target] = fakeField;
    }
}
function addOrUpdateChart() {
    if (!isChartConfigValid.value)
        return;
    if (editingChartId.value) {
        // Update existing chart
        const idx = charts.value.findIndex(c => c.id === editingChartId.value);
        if (idx !== -1) {
            charts.value[idx].config = {
                ...charts.value[idx].config,
                name: chartConfig.title || `Chart ${idx + 1}`,
                type: (selectedChartType.value || 'bar'),
                xAxis: selectedChartType.value === 'bar' ? [...chartConfig.xAxis] : chartConfig.xAxis,
                yAxis: chartConfig.yAxis || '',
                category: chartConfig.category || '',
                title: chartConfig.title || '',
                backgroundColor: chartConfig.backgroundColor || '#3b82f6',
                borderColor: chartConfig.borderColor || '#1d4ed8',
                horizontal: selectedChartType.value === 'bar' ? !!chartConfig.horizontal : false,
                colorScheme: selectedChartType.value === 'bar' ? (chartConfig.colorScheme || 'default') : 'default',
                data: getFakeChartData(selectedChartType.value)
            };
        }
        editingChartId.value = null;
        resetChartConfig();
        nextTick(() => initializeGridStack());
        return;
    }
    // Add new chart
    addChart();
}
function addChart() {
    if (!isChartConfigValid.value)
        return;
    const chartId = Date.now().toString();
    const newChart = {
        id: chartId,
        config: {
            name: chartConfig.title || `Chart ${charts.value.length + 1}`,
            type: (selectedChartType.value || 'bar'),
            xAxis: selectedChartType.value === 'bar' ? [...chartConfig.xAxis] : chartConfig.xAxis,
            yAxis: chartConfig.yAxis || '',
            category: chartConfig.category || '',
            title: chartConfig.title || '',
            backgroundColor: chartConfig.backgroundColor || '#3b82f6',
            borderColor: chartConfig.borderColor || '#1d4ed8',
            horizontal: selectedChartType.value === 'bar' ? !!chartConfig.horizontal : false,
            colorScheme: selectedChartType.value === 'bar' ? (chartConfig.colorScheme || 'default') : 'default',
            data: getFakeChartData(selectedChartType.value)
        },
        layout: {
            x: 0,
            y: 0,
            w: 6,
            h: 4
        }
    };
    charts.value.push(newChart);
    resetChartConfig();
    nextTick(() => {
        initializeGridStack();
    });
}
function getFakeChartData(type) {
    // Return visually pleasing fake data for each chart type
    if (type === 'bar') {
        return [
            { category: 'A', value: 40 },
            { category: 'B', value: 55 },
            { category: 'C', value: 30 },
            { category: 'D', value: 70 }
        ];
    }
    else if (type === 'line') {
        return [
            { x: 1, y: 10 },
            { x: 2, y: 30 },
            { x: 3, y: 20 },
            { x: 4, y: 50 },
            { x: 5, y: 40 }
        ];
    }
    else if (type === 'pie') {
        return [
            { category: 'Red', value: 30 },
            { category: 'Blue', value: 25 },
            { category: 'Green', value: 45 }
        ];
    }
    else if (type === 'scatter') {
        return [
            { x: 10, y: 20 },
            { x: 20, y: 30 },
            { x: 30, y: 10 },
            { x: 40, y: 50 }
        ];
    }
    return [];
}
function resetChartConfig() {
    chartConfig.title = '';
    chartConfig.xAxis = [];
    chartConfig.yAxis = '';
    chartConfig.category = '';
    chartConfig.horizontal = false;
    selectedChartType.value = 'bar';
}
function editChart(chart) {
    openChartMenuId.value = null;
    editingChartId.value = chart.id;
    selectedChartType.value = chart.config.type || 'bar';
    chartConfig.title = chart.config.title || '';
    if (chart.config.type === 'bar') {
        if (Array.isArray(chart.config.xAxis)) {
            chartConfig.xAxis = [...chart.config.xAxis];
        }
        else if (typeof chart.config.xAxis === 'string' && chart.config.xAxis) {
            chartConfig.xAxis = [chart.config.xAxis];
        }
        else {
            chartConfig.xAxis = [];
        }
    }
    else {
        chartConfig.xAxis = typeof chart.config.xAxis === 'string' ? chart.config.xAxis : '';
    }
    chartConfig.yAxis = chart.config.yAxis || '';
    chartConfig.category = chart.config.category || '';
    chartConfig.backgroundColor = chart.config.backgroundColor || '#3b82f6';
    chartConfig.borderColor = chart.config.borderColor || '#1d4ed8';
    chartConfig.horizontal = !!chart.config.horizontal;
    chartConfig.colorScheme = chart.config.colorScheme || 'default';
}
function removeChart(chartId) {
    if (confirm('Are you sure you want to remove this chart?')) {
        charts.value = charts.value.filter(chart => chart.id !== chartId);
        nextTick(() => {
            initializeGridStack();
        });
    }
}
function toggleChartMenu(id) {
    openChartMenuId.value = openChartMenuId.value === id ? null : id;
}
function exportChart(chart, type) {
    openChartMenuId.value = null;
    alert(`Exporting chart '${chart.config.title || chart.config.name}' as ${type.toUpperCase()} (stub)`);
}
function goBack() {
    router.push('/dashboard-store');
}
function saveTemplate() {
    alert('Template saved! (stub)');
}
function startResizing(which) {
    resizing.value = which;
    startX.value = window.event instanceof MouseEvent ? window.event.clientX : 0;
    startWidth.value = chartTypeColWidth.value;
    document.addEventListener('mousemove', onResizing);
    document.addEventListener('mouseup', stopResizing);
}
const resizing = ref(null);
const startX = ref(0);
const startWidth = ref(0);
function onResizing(e) {
    if (!resizing.value)
        return;
    const dx = e.clientX - startX.value;
    let newWidth = startWidth.value + dx;
    newWidth = Math.max(200, Math.min(400, newWidth));
    chartTypeColWidth.value = newWidth;
}
function stopResizing() {
    resizing.value = null;
    document.removeEventListener('mousemove', onResizing);
    document.removeEventListener('mouseup', stopResizing);
}
function initializeGridStack() {
    if (!gridStackContainer.value || charts.value.length === 0)
        return;
    nextTick(() => {
        if (gridStack) {
            gridStack.destroy(false);
            gridStack = null;
        }
        gridStack = GridStack.init({
            cellHeight: 70,
            margin: 10,
            minRow: 1,
            animate: true,
            resizable: {
                handles: 'e, se, s, sw, w'
            },
            draggable: {
                handle: '.grid-stack-item-content',
                scroll: false
            }
        }, gridStackContainer.value);
        gridStack.on('change', (event, items) => {
            items.forEach(item => {
                const chart = charts.value.find(c => c.id === item.id);
                if (chart && item.x !== undefined && item.y !== undefined && item.w !== undefined && item.h !== undefined) {
                    chart.layout = {
                        x: item.x,
                        y: item.y,
                        w: item.w,
                        h: item.h
                    };
                }
            });
        });
    });
}
function onDashboardDrop(event) {
    try {
        const data = event.dataTransfer?.getData('application/json');
        if (!data)
            return;
        const { chartType } = JSON.parse(data);
        if (!chartType)
            return;
        // Add a new chart with default config/data
        const chartId = Date.now().toString();
        const newChart = {
            id: chartId,
            config: {
                name: `Chart ${charts.value.length + 1}`,
                type: chartType,
                xAxis: chartType === 'bar' ? ['Category'] : 'Category',
                yAxis: 'Value',
                category: 'Category',
                title: '',
                backgroundColor: '#3b82f6',
                borderColor: '#1d4ed8',
                horizontal: false,
                colorScheme: 'default',
                data: getFakeChartData(chartType)
            },
            layout: {
                x: 0,
                y: 0,
                w: 6,
                h: 4
            }
        };
        charts.value.push(newChart);
        nextTick(() => {
            initializeGridStack();
        });
    }
    catch (e) {
        // Ignore
    }
}
onMounted(() => {
    initializeGridStack();
});
onUnmounted(() => {
    if (gridStack) {
        gridStack.destroy(false);
        gridStack = null;
    }
    document.removeEventListener('mousemove', onResizing);
    document.removeEventListener('mouseup', stopResizing);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['chart-menu-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-stack-item']} */ ;
/** @type {__VLS_StyleScopedClasses['resizer']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "min-h-screen bg-gray-50" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white shadow-sm border-b border-gray-200" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center h-16 justify-between" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "mr-4 text-gray-400 hover:text-gray-600" },
});
const __VLS_0 = {}.ArrowLeftIcon;
/** @type {[typeof __VLS_components.ArrowLeftIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "h-6 w-6" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "h-6 w-6" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-xl font-semibold text-gray-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3 ml-auto" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "inline-flex items-center px-4 py-2 border border-primary-200 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200" },
    title: "Share template",
});
const __VLS_4 = {}.ShareIcon;
/** @type {[typeof __VLS_components.ShareIcon, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "h-4 w-4 mr-2" },
}));
const __VLS_6 = __VLS_5({
    ...{ class: "h-4 w-4 mr-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.previewMode = true;
        } },
    disabled: (__VLS_ctx.charts.length === 0),
    ...{ class: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    ...{ class: "h-4 w-4 mr-2" },
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M15 10l4.553-2.276A2 2 0 0020 6.382V5a2 2 0 00-2-2H6a2 2 0 00-2 2v1.382a2 2 0 00.447 1.342L9 10m6 0v4m0 0l-4.553 2.276A2 2 0 014 17.618V19a2 2 0 002 2h12a2 2 0 002-2v-1.382a2 2 0 00-.447-1.342L15 14z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveTemplate) },
    disabled: (__VLS_ctx.charts.length === 0),
    ...{ class: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200" },
});
const __VLS_8 = {}.DocumentCheckIcon;
/** @type {[typeof __VLS_components.DocumentCheckIcon, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ class: "h-4 w-4 mr-2" },
}));
const __VLS_10 = __VLS_9({
    ...{ class: "h-4 w-4 mr-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex h-[calc(100vh-4rem)]" },
});
/** @type {[typeof ChartPanel, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(ChartPanel, new ChartPanel({
    ...{ 'onUpdate:selectedChartType': {} },
    ...{ 'onFieldDrop': {} },
    ...{ 'onRemoveXAxis': {} },
    ...{ 'onAddOrUpdateChart': {} },
    chartTypes: (__VLS_ctx.chartTypes),
    selectedChartType: (__VLS_ctx.selectedChartType),
    chartConfig: (__VLS_ctx.chartConfig),
    colorSchemes: (__VLS_ctx.colorSchemes),
    colorPalettes: (__VLS_ctx.colorPalettes),
    isChartConfigValid: (__VLS_ctx.isChartConfigValid),
    editingChartId: (__VLS_ctx.editingChartId),
    selectedDataSources: ([]),
    width: (__VLS_ctx.chartTypeColWidth),
    alwaysShowProperties: (true),
}));
const __VLS_13 = __VLS_12({
    ...{ 'onUpdate:selectedChartType': {} },
    ...{ 'onFieldDrop': {} },
    ...{ 'onRemoveXAxis': {} },
    ...{ 'onAddOrUpdateChart': {} },
    chartTypes: (__VLS_ctx.chartTypes),
    selectedChartType: (__VLS_ctx.selectedChartType),
    chartConfig: (__VLS_ctx.chartConfig),
    colorSchemes: (__VLS_ctx.colorSchemes),
    colorPalettes: (__VLS_ctx.colorPalettes),
    isChartConfigValid: (__VLS_ctx.isChartConfigValid),
    editingChartId: (__VLS_ctx.editingChartId),
    selectedDataSources: ([]),
    width: (__VLS_ctx.chartTypeColWidth),
    alwaysShowProperties: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
let __VLS_15;
let __VLS_16;
let __VLS_17;
const __VLS_18 = {
    'onUpdate:selectedChartType': (...[$event]) => {
        __VLS_ctx.selectedChartType = $event;
    }
};
const __VLS_19 = {
    onFieldDrop: (__VLS_ctx.onFieldDrop)
};
const __VLS_20 = {
    onRemoveXAxis: ((idx) => { if (Array.isArray(__VLS_ctx.chartConfig.xAxis))
        __VLS_ctx.chartConfig.xAxis.splice(idx, 1); })
};
const __VLS_21 = {
    onAddOrUpdateChart: (__VLS_ctx.addOrUpdateChart)
};
var __VLS_14;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMousedown: (...[$event]) => {
            __VLS_ctx.startResizing('chartType');
        } },
    ...{ class: "resizer" },
    ...{ style: ({ cursor: 'col-resize', width: '6px', background: '#e5e7eb', zIndex: 20 }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: (['flex-1 p-3']) },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg shadow-sm h-full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onDragover: () => { } },
    ...{ onDrop: (__VLS_ctx.onDashboardDrop) },
    ...{ class: "p-6 h-full" },
    ...{ style: {} },
});
if (__VLS_ctx.charts.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center h-full text-gray-500 border-2 border-dashed border-primary-300 rounded-lg bg-primary-50 transition-colors duration-200" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    const __VLS_22 = {}.Squares2X2Icon;
    /** @type {[typeof __VLS_components.Squares2X2Icon, ]} */ ;
    // @ts-ignore
    const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
        ...{ class: "mx-auto h-12 w-12 mb-4 text-primary-400" },
    }));
    const __VLS_24 = __VLS_23({
        ...{ class: "mx-auto h-12 w-12 mb-4 text-primary-400" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_23));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-medium text-gray-900 mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-gray-500" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ref: "gridStackContainer",
        ...{ class: "grid-stack h-full" },
    });
    /** @type {typeof __VLS_ctx.gridStackContainer} */ ;
    for (const [chart] of __VLS_getVForSourceType((__VLS_ctx.charts))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (chart.id),
            ...{ class: "grid-stack-item" },
            'gs-id': (chart.id),
            'gs-x': (chart.layout.x),
            'gs-y': (chart.layout.y),
            'gs-w': (chart.layout.w),
            'gs-h': (chart.layout.h),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid-stack-item-content" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "chart-header flex justify-end items-center gap-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "relative" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.charts.length === 0))
                        return;
                    __VLS_ctx.toggleChartMenu(chart.id);
                } },
            ...{ class: "chart-menu-btn p-1 rounded-full hover:bg-gray-100 focus:outline-none" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
            cx: "5",
            cy: "12",
            r: "1.5",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
            cx: "12",
            cy: "12",
            r: "1.5",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
            cx: "19",
            cy: "12",
            r: "1.5",
        });
        if (__VLS_ctx.openChartMenuId === chart.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-30" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(__VLS_ctx.openChartMenuId === chart.id))
                            return;
                        __VLS_ctx.editChart(chart);
                    } },
                ...{ class: "block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(__VLS_ctx.openChartMenuId === chart.id))
                            return;
                        __VLS_ctx.exportChart(chart, 'pdf');
                    } },
                ...{ class: "block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(__VLS_ctx.openChartMenuId === chart.id))
                            return;
                        __VLS_ctx.exportChart(chart, 'png');
                    } },
                ...{ class: "block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(__VLS_ctx.openChartMenuId === chart.id))
                            return;
                        __VLS_ctx.removeChart(chart.id);
                    } },
                ...{ class: "block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "chart-content" },
        });
        /** @type {[typeof ChartPreview, ]} */ ;
        // @ts-ignore
        const __VLS_26 = __VLS_asFunctionalComponent(ChartPreview, new ChartPreview({
            chart: (chart.config),
            ...{ class: "w-full h-full" },
        }));
        const __VLS_27 = __VLS_26({
            chart: (chart.config),
            ...{ class: "w-full h-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    }
}
if (__VLS_ctx.previewMode) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.previewMode))
                    return;
                __VLS_ctx.previewMode = false;
            } },
        ...{ class: "absolute top-4 right-4 z-50 px-4 py-2 bg-white text-primary-700 border border-gray-300 rounded shadow hover:bg-gray-50" },
    });
}
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-7xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:px-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary-700']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary-50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-primary-500']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary-700']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-primary-500']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary-700']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-offset-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-primary-500']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[calc(100vh-4rem)]']} */ ;
/** @type {__VLS_StyleScopedClasses['resizer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary-50']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-stack']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-stack-item']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-stack-item-content']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-header']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-menu-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-40']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['z-30']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-content']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-4']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary-700']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ArrowLeftIcon: ArrowLeftIcon,
            Squares2X2Icon: Squares2X2Icon,
            DocumentCheckIcon: DocumentCheckIcon,
            ShareIcon: ShareIcon,
            ChartPanel: ChartPanel,
            ChartPreview: ChartPreview,
            chartTypeColWidth: chartTypeColWidth,
            previewMode: previewMode,
            openChartMenuId: openChartMenuId,
            editingChartId: editingChartId,
            gridStackContainer: gridStackContainer,
            chartTypes: chartTypes,
            colorSchemes: colorSchemes,
            colorPalettes: colorPalettes,
            selectedChartType: selectedChartType,
            chartConfig: chartConfig,
            charts: charts,
            isChartConfigValid: isChartConfigValid,
            onFieldDrop: onFieldDrop,
            addOrUpdateChart: addOrUpdateChart,
            editChart: editChart,
            removeChart: removeChart,
            toggleChartMenu: toggleChartMenu,
            exportChart: exportChart,
            goBack: goBack,
            saveTemplate: saveTemplate,
            startResizing: startResizing,
            onDashboardDrop: onDashboardDrop,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
