import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeftIcon, Squares2X2Icon, DocumentCheckIcon, ChartBarIcon, PresentationChartLineIcon, ChartPieIcon, CircleStackIcon, PencilIcon, ShareIcon } from '@heroicons/vue/24/outline';
import { GridStack } from 'gridstack';
import { useDataSourceStore } from '../stores/dataSource';
import { useDashboardStore } from '../stores/dashboard';
import { useChartStore } from '../stores/chart';
import ChartPreview from '../components/ChartPreview.vue';
import DataPanel from '../components/DataPanel.vue';
import ChartPanel from '../components/ChartPanel.vue';
import Toast from '../components/Toast.vue';
import { nanoid } from 'nanoid';
const router = useRouter();
const route = useRoute();
const dataSourceStore = useDataSourceStore();
const dashboardStore = useDashboardStore();
const chartStore = useChartStore();
const dashboardName = ref('');
const dashboardDescription = ref('');
const selectedDataSourceId = ref('');
const selectedChartType = ref('');
const gridStackContainer = ref();
const dataPanelRef = ref();
let gridStack = null;
// Toast notification state
const showToast = ref(false);
const toastType = ref('success');
const toastTitle = ref('');
const toastMessage = ref('');
// Current dashboard ID for updates
const currentDashboardId = ref(null);
const dashboardTabs = ref([
    { id: nanoid(), name: 'Tab 1', charts: [] }
]);
const activeTabId = ref(dashboardTabs.value[0].id);
const editingTabId = ref(null);
const editingTabName = ref('');
const tabHoverId = ref(null);
function addTab() {
    const newTab = { id: nanoid(), name: `Tab ${dashboardTabs.value.length + 1}`, charts: [] };
    dashboardTabs.value.push(newTab);
    activeTabId.value = newTab.id;
    nextTick(() => initializeGridStack());
}
function removeTab(tabId) {
    if (dashboardTabs.value.length === 1)
        return;
    const tab = dashboardTabs.value.find(t => t.id === tabId);
    if (!tab)
        return;
    if (confirm(`Are you sure you want to remove the tab "${tab.name}" and all its charts? This cannot be undone.`)) {
        const idx = dashboardTabs.value.findIndex(t => t.id === tabId);
        dashboardTabs.value.splice(idx, 1);
        if (activeTabId.value === tabId) {
            activeTabId.value = dashboardTabs.value[Math.max(0, idx - 1)].id;
            nextTick(() => initializeGridStack());
        }
    }
}
function startRenameTab(tabId) {
    const tab = dashboardTabs.value.find(t => t.id === tabId);
    if (tab) {
        editingTabId.value = tabId;
        editingTabName.value = tab.name;
        nextTick(() => {
            const input = document.getElementById(`tab-edit-input-${tabId}`);
            if (input)
                input.focus();
        });
    }
}
function finishRenameTab(tabId) {
    if (!editingTabName.value.trim())
        return;
    const tab = dashboardTabs.value.find(t => t.id === tabId);
    if (tab)
        tab.name = editingTabName.value.trim();
    editingTabId.value = null;
}
function cancelRenameTab() {
    editingTabId.value = null;
}
function handleTabEditKey(tabId, e) {
    if (e.key === 'Enter')
        finishRenameTab(tabId);
    if (e.key === 'Escape')
        cancelRenameTab();
}
// Proxy charts to the active tab
const charts = computed({
    get: () => dashboardTabs.value.find(t => t.id === activeTabId.value)?.charts || [],
    set: (val) => {
        const tab = dashboardTabs.value.find(t => t.id === activeTabId.value);
        if (tab)
            tab.charts = val;
    }
});
watch(activeTabId, () => {
    nextTick(() => initializeGridStack());
});
// Add color scheme options
const colorSchemes = [
    { value: 'default', label: 'Default' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'vivid', label: 'Vivid' },
    { value: 'earth', label: 'Earth' }
];
// Add color palettes for preview
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
const chartConfig = reactive({
    title: '',
    xAxis: [],
    yAxis: '',
    category: '',
    backgroundColor: '#3b82f6',
    borderColor: '#1d4ed8',
    horizontal: false,
    colorScheme: 'default',
    dataSourceId: ''
});
const chartTypes = [
    { value: 'bar', label: 'Bar', icon: ChartBarIcon },
    { value: 'line', label: 'Line', icon: PresentationChartLineIcon },
    { value: 'pie', label: 'Pie', icon: ChartPieIcon },
    { value: 'scatter', label: 'Scatter', icon: CircleStackIcon }
];
const selectedDataSource = computed(() => {
    if (!selectedDataSourceId.value)
        return null;
    return dataSourceStore.getDataSourceById(selectedDataSourceId.value);
});
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
const onDataSourceChange = () => {
    resetChartConfig();
};
const resetChartConfig = () => {
    chartConfig.title = '';
    chartConfig.xAxis = [];
    chartConfig.yAxis = '';
    chartConfig.category = '';
    chartConfig.horizontal = false;
    chartConfig.dataSourceId = '';
    selectedChartType.value = '';
};
const onFieldDragStart = (event, column, dataSourceId) => {
    if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', JSON.stringify({
            name: column.name,
            type: column.type,
            dataSourceId
        }));
    }
};
const onFieldDrop = (event, target) => {
    event.preventDefault();
    if (!event.dataTransfer)
        return;
    try {
        const fieldData = JSON.parse(event.dataTransfer.getData('text/plain'));
        // Validate field type for Y-axis (should be numeric)
        if (target === 'yAxis' && fieldData.type !== 'number') {
            alert('Y-axis requires a numeric field');
            return;
        }
        // Check if we already have fields from a different data source
        // Only check if we have multiple fields (for bar chart) or if we're not replacing a single field
        if (chartConfig.dataSourceId && chartConfig.dataSourceId !== fieldData.dataSourceId) {
            if (selectedChartType.value === 'bar' && Array.isArray(chartConfig.xAxis) && chartConfig.xAxis.length > 0) {
                alert('Cannot mix fields from different data sources in the same chart');
                return;
            }
            // For non-bar charts or when replacing a single field, allow the change
            // This will effectively replace the existing field and data source
        }
        if (target === 'xAxis' && selectedChartType.value === 'bar') {
            // Add to array, no duplicates
            if (Array.isArray(chartConfig.xAxis) && !chartConfig.xAxis.includes(fieldData.name)) {
                chartConfig.xAxis.push(fieldData.name);
            }
        }
        else {
            chartConfig[target] = fieldData.name;
        }
        // Store the data source ID for the chart
        chartConfig.dataSourceId = fieldData.dataSourceId;
    }
    catch (error) {
        console.error('Failed to parse dropped field data:', error);
    }
};
const openChartMenuId = ref(null);
const editingChartId = ref(null);
const chartTypeColRef = ref();
const toggleChartMenu = (id) => {
    openChartMenuId.value = openChartMenuId.value === id ? null : id;
};
const editChart = (chart) => {
    openChartMenuId.value = null;
    editingChartId.value = chart.id;
    selectedChartType.value = chart.config.type || '';
    chartConfig.title = chart.config.title || '';
    chartConfig.dataSourceId = chart.config.dataSourceId || '';
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
    chartConfig.horizontal = chart.config.horizontal || false;
    chartConfig.colorScheme = chart.config.colorScheme || 'default';
};
const exportChart = (chart, type) => {
    openChartMenuId.value = null;
    alert(`Exporting chart '${chart.config.title || chart.config.name}' as ${type.toUpperCase()} (stub)`);
};
const addOrUpdateChart = () => {
    if (!isChartConfigValid.value || !chartConfig.dataSourceId)
        return;
    if (editingChartId.value) {
        // Update existing chart
        const idx = charts.value.findIndex(c => c.id === editingChartId.value);
        if (idx !== -1) {
            charts.value[idx].config = {
                ...charts.value[idx].config,
                id: charts.value[idx].id,
                name: chartConfig.title || `Chart ${idx + 1}`,
                type: selectedChartType.value,
                dataSourceId: chartConfig.dataSourceId,
                xAxis: selectedChartType.value === 'bar' ? [...chartConfig.xAxis] : chartConfig.xAxis,
                yAxis: chartConfig.yAxis || undefined,
                category: chartConfig.category || undefined,
                title: chartConfig.title,
                backgroundColor: chartConfig.backgroundColor,
                borderColor: chartConfig.borderColor,
                horizontal: selectedChartType.value === 'bar' ? chartConfig.horizontal : undefined,
                colorScheme: selectedChartType.value === 'bar' ? chartConfig.colorScheme : undefined,
                createdAt: charts.value[idx].config.createdAt || new Date()
            };
        }
        editingChartId.value = null;
        resetChartConfig();
        nextTick(() => initializeGridStack());
        return;
    }
    // Add new chart
    addChart();
};
const cancelEdit = () => {
    editingChartId.value = null;
    resetChartConfig();
};
const addChart = () => {
    if (!isChartConfigValid.value || !chartConfig.dataSourceId)
        return;
    const chartId = Date.now().toString();
    const newChart = {
        id: chartId,
        config: {
            id: chartId,
            name: chartConfig.title || `Chart ${charts.value.length + 1}`,
            type: selectedChartType.value,
            dataSourceId: chartConfig.dataSourceId,
            xAxis: selectedChartType.value === 'bar' ? [...chartConfig.xAxis] : chartConfig.xAxis,
            yAxis: chartConfig.yAxis || undefined,
            category: chartConfig.category || undefined,
            title: chartConfig.title,
            backgroundColor: chartConfig.backgroundColor,
            borderColor: chartConfig.borderColor,
            horizontal: selectedChartType.value === 'bar' ? chartConfig.horizontal : undefined,
            colorScheme: selectedChartType.value === 'bar' ? chartConfig.colorScheme : undefined,
            createdAt: new Date()
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
};
const removeChart = (chartId) => {
    if (confirm('Are you sure you want to remove this chart?')) {
        charts.value = charts.value.filter(chart => chart.id !== chartId);
        nextTick(() => {
            initializeGridStack();
        });
    }
};
const initializeGridStack = async () => {
    if (!gridStackContainer.value || charts.value.length === 0)
        return;
    await nextTick();
    try {
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
        // Listen for layout changes
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
    }
    catch (error) {
        console.error('Failed to initialize GridStack:', error);
    }
};
// Toast notification functions
const showToastNotification = (type, title, message) => {
    toastType.value = type;
    toastTitle.value = title;
    toastMessage.value = message || '';
    showToast.value = true;
    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideToast();
    }, 3000);
};
const hideToast = () => {
    showToast.value = false;
};
const saveDashboard = () => {
    if (!dashboardName.value || charts.value.length === 0)
        return;
    try {
        // Save selected data source IDs
        const dataSourceIds = selectedDataSources.value.map(ds => ds.id);
        if (currentDashboardId.value) {
            // Update existing dashboard
            const dashboard = dashboardStore.getDashboardById(currentDashboardId.value);
            if (dashboard) {
                // Update dashboard properties
                dashboardStore.updateDashboard(currentDashboardId.value, {
                    name: dashboardName.value,
                    description: dashboardDescription.value,
                    dataSourceIds
                });
                // Clear existing widgets and charts
                dashboard.widgets.forEach(widget => {
                    chartStore.deleteChart(widget.chartId);
                });
                dashboard.widgets = [];
                // Create and save new charts, then add widgets
                charts.value.forEach(chartItem => {
                    // Create the chart in the chart store
                    const savedChart = chartStore.createChart({
                        name: chartItem.config.name,
                        type: chartItem.config.type,
                        dataSourceId: chartItem.config.dataSourceId,
                        xAxis: chartItem.config.xAxis,
                        yAxis: chartItem.config.yAxis,
                        category: chartItem.config.category,
                        title: chartItem.config.title,
                        backgroundColor: chartItem.config.backgroundColor,
                        borderColor: chartItem.config.borderColor
                    });
                    // Add widget to dashboard
                    dashboardStore.addWidget(currentDashboardId.value, savedChart.id);
                    // Update widget layout
                    const widget = dashboard.widgets[dashboard.widgets.length - 1];
                    if (widget) {
                        dashboardStore.updateWidgetLayout(currentDashboardId.value, widget.id, chartItem.layout);
                    }
                });
                showToastNotification('success', 'Dashboard Updated', 'Your dashboard has been successfully updated.');
            }
        }
        else {
            // Create new dashboard
            const dashboard = dashboardStore.createDashboard(dashboardName.value, dashboardDescription.value, dataSourceIds);
            currentDashboardId.value = dashboard.id;
            // Create and save charts, then add widgets
            charts.value.forEach(chartItem => {
                // Create the chart in the chart store
                const savedChart = chartStore.createChart({
                    name: chartItem.config.name,
                    type: chartItem.config.type,
                    dataSourceId: chartItem.config.dataSourceId,
                    xAxis: chartItem.config.xAxis,
                    yAxis: chartItem.config.yAxis,
                    category: chartItem.config.category,
                    title: chartItem.config.title,
                    backgroundColor: chartItem.config.backgroundColor,
                    borderColor: chartItem.config.borderColor
                });
                // Add widget to dashboard
                dashboardStore.addWidget(dashboard.id, savedChart.id);
                // Update widget layout
                const widget = dashboard.widgets[dashboard.widgets.length - 1];
                if (widget) {
                    dashboardStore.updateWidgetLayout(dashboard.id, widget.id, chartItem.layout);
                }
            });
            showToastNotification('success', 'Dashboard Created', 'Your dashboard has been successfully created.');
        }
    }
    catch (error) {
        console.error('Error saving dashboard:', error);
        showToastNotification('error', 'Save Failed', 'There was an error saving your dashboard. Please try again.');
    }
};
const goBack = () => {
    if (charts.value.length > 0) {
        if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
            router.push('/dashboard-store');
        }
    }
    else {
        router.push('/dashboard-store');
    }
};
// Resizable sidebar logic
const leftSidebarWidth = ref(240);
const chartTypeColWidth = ref(260);
const resizing = ref(null);
const startX = ref(0);
const startWidth = ref(0);
const startResizing = (which) => {
    resizing.value = which;
    startX.value = window.event instanceof MouseEvent ? window.event.clientX : 0;
    startWidth.value = which === 'left' ? leftSidebarWidth.value : chartTypeColWidth.value;
    document.addEventListener('mousemove', onResizing);
    document.addEventListener('mouseup', stopResizing);
};
const onResizing = (e) => {
    if (!resizing.value)
        return;
    const dx = e.clientX - startX.value;
    if (resizing.value === 'left') {
        let newWidth = startWidth.value + dx;
        newWidth = Math.max(180, Math.min(400, newWidth));
        leftSidebarWidth.value = newWidth;
    }
    else if (resizing.value === 'chartType') {
        let newWidth = startWidth.value + dx;
        newWidth = Math.max(200, Math.min(400, newWidth));
        chartTypeColWidth.value = newWidth;
    }
};
const stopResizing = () => {
    resizing.value = null;
    document.removeEventListener('mousemove', onResizing);
    document.removeEventListener('mouseup', stopResizing);
};
const previewMode = ref(false);
// Add new refs for data source management
const selectedDataSources = ref([]);
const expandedDataSources = ref([]);
// Add toggle function for data source expansion
const toggleDataSource = (id) => {
    const index = expandedDataSources.value.indexOf(id);
    if (index === -1) {
        expandedDataSources.value.push(id);
    }
    else {
        expandedDataSources.value.splice(index, 1);
    }
};
// Add function to check if a field is in use
const isFieldInUse = (fieldName, dataSourceId) => {
    if (!selectedChartType.value || !chartConfig.dataSourceId)
        return false;
    // Check if the field is from the same data source as the current chart
    if (chartConfig.dataSourceId !== dataSourceId)
        return false;
    // Check if the field is used in any of the chart properties
    if (selectedChartType.value === 'pie') {
        return chartConfig.category === fieldName;
    }
    else if (selectedChartType.value === 'bar') {
        return ((Array.isArray(chartConfig.xAxis) && chartConfig.xAxis.includes(fieldName)) ||
            chartConfig.yAxis === fieldName);
    }
    else {
        return chartConfig.xAxis === fieldName || chartConfig.yAxis === fieldName;
    }
};
// Data source manager methods
const openDataSourceManager = () => {
    if (dataPanelRef.value) {
        dataPanelRef.value.openDataSourceManager();
    }
};
const updateSelectedDataSources = (dataSources) => {
    selectedDataSources.value = dataSources;
};
const showDashboardTabs = ref(true);
function handleToggleDashboardTabs(show) {
    showDashboardTabs.value = show;
}
onMounted(async () => {
    const dashboardId = route.query.id;
    if (dashboardId) {
        // Load dashboard for editing
        const dashboard = dashboardStore.dashboards.find(d => d.id === dashboardId);
        if (dashboard) {
            currentDashboardId.value = dashboardId;
            dashboardName.value = dashboard.name;
            dashboardDescription.value = dashboard.description || '';
            // Restore selected data sources
            if (dashboard.dataSourceIds && dashboard.dataSourceIds.length > 0) {
                selectedDataSources.value = dataSourceStore.dataSources.filter(ds => dashboard.dataSourceIds.includes(ds.id));
            }
            // Load charts for this dashboard
            charts.value = dashboard.widgets.map(widget => {
                const chart = chartStore.charts.find(c => c.id === widget.chartId);
                return chart
                    ? {
                        id: chart.id,
                        config: { ...chart },
                        layout: {
                            x: widget.x,
                            y: widget.y,
                            w: widget.w,
                            h: widget.h
                        }
                    }
                    : null;
            }).filter(Boolean);
            await nextTick();
            initializeGridStack();
        }
    }
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    id: "dashboardName",
    value: (__VLS_ctx.dashboardName),
    type: "text",
    placeholder: "Enter dashboard name",
    ...{ class: "text-xl font-semibold text-gray-900 bg-transparent border-none focus:ring-0 focus:border-b-2 focus:border-primary-500 px-1 py-0.5 w-64" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center gap-3 ml-auto" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "inline-flex items-center px-4 py-2 border border-primary-200 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200" },
    title: "Share dashboard",
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
    ...{ onClick: (__VLS_ctx.saveDashboard) },
    disabled: (!__VLS_ctx.dashboardName || __VLS_ctx.charts.length === 0),
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
if (!__VLS_ctx.previewMode) {
    /** @type {[typeof DataPanel, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(DataPanel, new DataPanel({
        ...{ 'onOpenManager': {} },
        ...{ 'onToggleExpand': {} },
        ...{ 'onFieldDrag': {} },
        ...{ 'onUpdateSelectedDataSources': {} },
        ...{ 'onToggleDashboardTabs': {} },
        ref: "dataPanelRef",
        selectedDataSources: (__VLS_ctx.selectedDataSources),
        expandedDataSources: (__VLS_ctx.expandedDataSources),
        isFieldInUse: (__VLS_ctx.isFieldInUse),
        width: (__VLS_ctx.leftSidebarWidth),
    }));
    const __VLS_13 = __VLS_12({
        ...{ 'onOpenManager': {} },
        ...{ 'onToggleExpand': {} },
        ...{ 'onFieldDrag': {} },
        ...{ 'onUpdateSelectedDataSources': {} },
        ...{ 'onToggleDashboardTabs': {} },
        ref: "dataPanelRef",
        selectedDataSources: (__VLS_ctx.selectedDataSources),
        expandedDataSources: (__VLS_ctx.expandedDataSources),
        isFieldInUse: (__VLS_ctx.isFieldInUse),
        width: (__VLS_ctx.leftSidebarWidth),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    let __VLS_15;
    let __VLS_16;
    let __VLS_17;
    const __VLS_18 = {
        onOpenManager: (__VLS_ctx.openDataSourceManager)
    };
    const __VLS_19 = {
        onToggleExpand: (__VLS_ctx.toggleDataSource)
    };
    const __VLS_20 = {
        onFieldDrag: (__VLS_ctx.onFieldDragStart)
    };
    const __VLS_21 = {
        onUpdateSelectedDataSources: (__VLS_ctx.updateSelectedDataSources)
    };
    const __VLS_22 = {
        onToggleDashboardTabs: (__VLS_ctx.handleToggleDashboardTabs)
    };
    /** @type {typeof __VLS_ctx.dataPanelRef} */ ;
    var __VLS_23 = {};
    var __VLS_14;
}
if (!__VLS_ctx.previewMode) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (...[$event]) => {
                if (!(!__VLS_ctx.previewMode))
                    return;
                __VLS_ctx.startResizing('left');
            } },
        ...{ class: "resizer" },
        ...{ style: ({ cursor: 'col-resize', width: '6px', background: '#e5e7eb', zIndex: 20 }) },
    });
}
if (!__VLS_ctx.previewMode) {
    /** @type {[typeof ChartPanel, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(ChartPanel, new ChartPanel({
        ...{ 'onUpdate:selectedChartType': {} },
        ...{ 'onFieldDrop': {} },
        ...{ 'onRemoveXAxis': {} },
        ...{ 'onAddOrUpdateChart': {} },
        ...{ 'onCancelEdit': {} },
        chartTypes: (__VLS_ctx.chartTypes),
        selectedChartType: (__VLS_ctx.selectedChartType),
        chartConfig: (__VLS_ctx.chartConfig),
        colorSchemes: (__VLS_ctx.colorSchemes),
        colorPalettes: (__VLS_ctx.colorPalettes),
        isChartConfigValid: (__VLS_ctx.isChartConfigValid),
        editingChartId: (__VLS_ctx.editingChartId),
        selectedDataSources: (__VLS_ctx.selectedDataSources),
        width: (__VLS_ctx.chartTypeColWidth),
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onUpdate:selectedChartType': {} },
        ...{ 'onFieldDrop': {} },
        ...{ 'onRemoveXAxis': {} },
        ...{ 'onAddOrUpdateChart': {} },
        ...{ 'onCancelEdit': {} },
        chartTypes: (__VLS_ctx.chartTypes),
        selectedChartType: (__VLS_ctx.selectedChartType),
        chartConfig: (__VLS_ctx.chartConfig),
        colorSchemes: (__VLS_ctx.colorSchemes),
        colorPalettes: (__VLS_ctx.colorPalettes),
        isChartConfigValid: (__VLS_ctx.isChartConfigValid),
        editingChartId: (__VLS_ctx.editingChartId),
        selectedDataSources: (__VLS_ctx.selectedDataSources),
        width: (__VLS_ctx.chartTypeColWidth),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        'onUpdate:selectedChartType': (...[$event]) => {
            if (!(!__VLS_ctx.previewMode))
                return;
            __VLS_ctx.selectedChartType = $event;
        }
    };
    const __VLS_32 = {
        onFieldDrop: (__VLS_ctx.onFieldDrop)
    };
    const __VLS_33 = {
        onRemoveXAxis: ((idx) => { if (Array.isArray(__VLS_ctx.chartConfig.xAxis))
            __VLS_ctx.chartConfig.xAxis.splice(idx, 1); })
    };
    const __VLS_34 = {
        onAddOrUpdateChart: (__VLS_ctx.addOrUpdateChart)
    };
    const __VLS_35 = {
        onCancelEdit: (__VLS_ctx.cancelEdit)
    };
    var __VLS_27;
}
if (!__VLS_ctx.previewMode) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (...[$event]) => {
                if (!(!__VLS_ctx.previewMode))
                    return;
                __VLS_ctx.startResizing('chartType');
            } },
        ...{ class: "resizer" },
        ...{ style: ({ cursor: 'col-resize', width: '6px', background: '#e5e7eb', zIndex: 20 }) },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: (['flex-1 p-3']) },
    ...{ style: {} },
});
if (__VLS_ctx.showDashboardTabs) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "flex gap-2 px-1 mt-0 mb-2" },
        'aria-label': "Dashboard Tabs",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex gap-2" },
    });
    const __VLS_36 = {}.TransitionGroup;
    /** @type {[typeof __VLS_components.TransitionGroup, typeof __VLS_components.transitionGroup, typeof __VLS_components.TransitionGroup, typeof __VLS_components.transitionGroup, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        name: "fade",
        tag: "div",
        ...{ class: "flex gap-2" },
    }));
    const __VLS_38 = __VLS_37({
        name: "fade",
        tag: "div",
        ...{ class: "flex gap-2" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    for (const [tab] of __VLS_getVForSourceType((__VLS_ctx.dashboardTabs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onMouseenter: (...[$event]) => {
                    if (!(__VLS_ctx.showDashboardTabs))
                        return;
                    __VLS_ctx.tabHoverId = tab.id;
                } },
            ...{ onMouseleave: (...[$event]) => {
                    if (!(__VLS_ctx.showDashboardTabs))
                        return;
                    __VLS_ctx.tabHoverId = null;
                } },
            key: (tab.id),
            ...{ class: "relative group flex items-center" },
        });
        if (tab.id === __VLS_ctx.editingTabId) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onBlur: (...[$event]) => {
                        if (!(__VLS_ctx.showDashboardTabs))
                            return;
                        if (!(tab.id === __VLS_ctx.editingTabId))
                            return;
                        __VLS_ctx.finishRenameTab(tab.id);
                    } },
                ...{ onKeyup: (...[$event]) => {
                        if (!(__VLS_ctx.showDashboardTabs))
                            return;
                        if (!(tab.id === __VLS_ctx.editingTabId))
                            return;
                        __VLS_ctx.finishRenameTab(tab.id);
                    } },
                ...{ onKeyup: (...[$event]) => {
                        if (!(__VLS_ctx.showDashboardTabs))
                            return;
                        if (!(tab.id === __VLS_ctx.editingTabId))
                            return;
                        __VLS_ctx.cancelRenameTab();
                    } },
                ...{ onKeydown: (...[$event]) => {
                        if (!(__VLS_ctx.showDashboardTabs))
                            return;
                        if (!(tab.id === __VLS_ctx.editingTabId))
                            return;
                        __VLS_ctx.handleTabEditKey(tab.id, $event);
                    } },
                id: (`tab-edit-input-${tab.id}`),
                ...{ class: "px-2 py-1 border rounded text-sm w-28 mr-1 focus:ring-2 focus:ring-primary-500" },
                ...{ style: ('transition: box-shadow 0.2s;') },
                autofocus: true,
            });
            (__VLS_ctx.editingTabName);
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showDashboardTabs))
                            return;
                        if (!!(tab.id === __VLS_ctx.editingTabId))
                            return;
                        __VLS_ctx.activeTabId = tab.id;
                    } },
                ...{ class: ([
                        'py-2.5 px-4 text-center font-medium text-sm transition-all duration-200 flex items-center gap-2 rounded-lg shadow-sm border relative',
                        __VLS_ctx.activeTabId === tab.id
                            ? 'border-primary-200 text-primary-700 bg-primary-50 shadow-md z-10'
                            : 'border-gray-200 text-gray-600 bg-white hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                    ]) },
                title: (tab.name),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (tab.name);
            if (__VLS_ctx.tabHoverId === tab.id) {
                const __VLS_40 = {}.PencilIcon;
                /** @type {[typeof __VLS_components.PencilIcon, ]} */ ;
                // @ts-ignore
                const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
                    ...{ 'onClick': {} },
                    ...{ class: "h-4 w-4 ml-1 text-gray-400 hover:text-primary-600 cursor-pointer transition-opacity duration-150 opacity-80 group-hover:opacity-100" },
                }));
                const __VLS_42 = __VLS_41({
                    ...{ 'onClick': {} },
                    ...{ class: "h-4 w-4 ml-1 text-gray-400 hover:text-primary-600 cursor-pointer transition-opacity duration-150 opacity-80 group-hover:opacity-100" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_41));
                let __VLS_44;
                let __VLS_45;
                let __VLS_46;
                const __VLS_47 = {
                    onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showDashboardTabs))
                            return;
                        if (!!(tab.id === __VLS_ctx.editingTabId))
                            return;
                        if (!(__VLS_ctx.tabHoverId === tab.id))
                            return;
                        __VLS_ctx.startRenameTab(tab.id);
                    }
                };
                var __VLS_43;
            }
            if (__VLS_ctx.dashboardTabs.length > 1 && __VLS_ctx.tabHoverId === tab.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.showDashboardTabs))
                                return;
                            if (!!(tab.id === __VLS_ctx.editingTabId))
                                return;
                            if (!(__VLS_ctx.dashboardTabs.length > 1 && __VLS_ctx.tabHoverId === tab.id))
                                return;
                            __VLS_ctx.removeTab(tab.id);
                        } },
                    ...{ class: "ml-1 text-gray-400 hover:text-red-500 bg-transparent rounded-full p-0.5 transition-opacity duration-150 opacity-80 group-hover:opacity-100" },
                    ...{ style: {} },
                });
            }
        }
    }
    var __VLS_39;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.addTab) },
        ...{ class: "ml-2 px-2 py-1 bg-gray-100 text-gray-500 rounded hover:bg-primary-100 hover:text-primary-700 transition-colors duration-150 focus:outline-none border-none shadow-none" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg shadow-sm h-full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-6 h-full" },
});
if (__VLS_ctx.charts.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center h-full text-gray-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    const __VLS_48 = {}.Squares2X2Icon;
    /** @type {[typeof __VLS_components.Squares2X2Icon, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        ...{ class: "mx-auto h-12 w-12 mb-4" },
    }));
    const __VLS_50 = __VLS_49({
        ...{ class: "mx-auto h-12 w-12 mb-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
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
        if (!__VLS_ctx.previewMode) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(!__VLS_ctx.previewMode))
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
        }
        if (__VLS_ctx.openChartMenuId === chart.id && !__VLS_ctx.previewMode) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-30" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(__VLS_ctx.openChartMenuId === chart.id && !__VLS_ctx.previewMode))
                            return;
                        __VLS_ctx.editChart(chart);
                    } },
                ...{ class: "block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(__VLS_ctx.openChartMenuId === chart.id && !__VLS_ctx.previewMode))
                            return;
                        __VLS_ctx.exportChart(chart, 'pdf');
                    } },
                ...{ class: "block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(__VLS_ctx.openChartMenuId === chart.id && !__VLS_ctx.previewMode))
                            return;
                        __VLS_ctx.exportChart(chart, 'png');
                    } },
                ...{ class: "block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.charts.length === 0))
                            return;
                        if (!(__VLS_ctx.openChartMenuId === chart.id && !__VLS_ctx.previewMode))
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
        const __VLS_52 = __VLS_asFunctionalComponent(ChartPreview, new ChartPreview({
            chart: (chart.config),
            ...{ class: "w-full h-full" },
        }));
        const __VLS_53 = __VLS_52({
            chart: (chart.config),
            ...{ class: "w-full h-full" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_52));
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
/** @type {[typeof Toast, ]} */ ;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent(Toast, new Toast({
    ...{ 'onClose': {} },
    show: (__VLS_ctx.showToast),
    type: (__VLS_ctx.toastType),
    title: (__VLS_ctx.toastTitle),
    message: (__VLS_ctx.toastMessage),
}));
const __VLS_56 = __VLS_55({
    ...{ 'onClose': {} },
    show: (__VLS_ctx.showToast),
    type: (__VLS_ctx.toastType),
    title: (__VLS_ctx.toastTitle),
    message: (__VLS_ctx.toastMessage),
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
let __VLS_58;
let __VLS_59;
let __VLS_60;
const __VLS_61 = {
    onClose: (__VLS_ctx.hideToast)
};
var __VLS_57;
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
/** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['border-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-0']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-b-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-primary-500']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-64']} */ ;
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
/** @type {__VLS_StyleScopedClasses['resizer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-0']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-28']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-primary-500']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-primary-600']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-150']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-150']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-80']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary-100']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-primary-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-150']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['border-none']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-none']} */ ;
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
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
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
// @ts-ignore
var __VLS_24 = __VLS_23;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ArrowLeftIcon: ArrowLeftIcon,
            Squares2X2Icon: Squares2X2Icon,
            DocumentCheckIcon: DocumentCheckIcon,
            PencilIcon: PencilIcon,
            ShareIcon: ShareIcon,
            ChartPreview: ChartPreview,
            DataPanel: DataPanel,
            ChartPanel: ChartPanel,
            Toast: Toast,
            dashboardName: dashboardName,
            selectedChartType: selectedChartType,
            gridStackContainer: gridStackContainer,
            dataPanelRef: dataPanelRef,
            showToast: showToast,
            toastType: toastType,
            toastTitle: toastTitle,
            toastMessage: toastMessage,
            dashboardTabs: dashboardTabs,
            activeTabId: activeTabId,
            editingTabId: editingTabId,
            editingTabName: editingTabName,
            tabHoverId: tabHoverId,
            addTab: addTab,
            removeTab: removeTab,
            startRenameTab: startRenameTab,
            finishRenameTab: finishRenameTab,
            cancelRenameTab: cancelRenameTab,
            handleTabEditKey: handleTabEditKey,
            charts: charts,
            colorSchemes: colorSchemes,
            colorPalettes: colorPalettes,
            chartConfig: chartConfig,
            chartTypes: chartTypes,
            isChartConfigValid: isChartConfigValid,
            onFieldDragStart: onFieldDragStart,
            onFieldDrop: onFieldDrop,
            openChartMenuId: openChartMenuId,
            editingChartId: editingChartId,
            toggleChartMenu: toggleChartMenu,
            editChart: editChart,
            exportChart: exportChart,
            addOrUpdateChart: addOrUpdateChart,
            cancelEdit: cancelEdit,
            removeChart: removeChart,
            hideToast: hideToast,
            saveDashboard: saveDashboard,
            goBack: goBack,
            leftSidebarWidth: leftSidebarWidth,
            chartTypeColWidth: chartTypeColWidth,
            startResizing: startResizing,
            previewMode: previewMode,
            selectedDataSources: selectedDataSources,
            expandedDataSources: expandedDataSources,
            toggleDataSource: toggleDataSource,
            isFieldInUse: isFieldInUse,
            openDataSourceManager: openDataSourceManager,
            updateSelectedDataSources: updateSelectedDataSources,
            showDashboardTabs: showDashboardTabs,
            handleToggleDashboardTabs: handleToggleDashboardTabs,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
