import { computed } from 'vue';
import { ExclamationTriangleIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/vue/24/outline';
import { useDataSourceStore } from '../stores/dataSource';
const props = defineProps();
const dataSourceStore = useDataSourceStore();
const hasValidData = computed(() => {
    if (!props.chart.dataSourceId || !props.chart.keyMetric)
        return false;
    const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId);
    return !!(dataSource && dataSource.rows.length > 0);
});
const error = computed(() => {
    if (!props.chart.dataSourceId)
        return 'No data source selected';
    if (!props.chart.keyMetric)
        return 'No key metric selected';
    const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId);
    if (!dataSource)
        return 'Data source not found';
    const keyColumn = dataSource.columns.find(c => c.name === props.chart.keyMetric);
    if (!keyColumn)
        return 'Key metric column not found';
    if (keyColumn.type !== 'number')
        return 'Key metric must be a numeric field';
    if (props.chart.previousMetric) {
        const prevColumn = dataSource.columns.find(c => c.name === props.chart.previousMetric);
        if (!prevColumn)
            return 'Previous metric column not found';
        if (prevColumn.type !== 'number')
            return 'Previous metric must be a numeric field';
    }
    return '';
});
const keyMetricValue = computed(() => {
    if (!hasValidData.value || error.value)
        return 0;
    const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId);
    const keyColumn = dataSource.columns.find(c => c.name === props.chart.keyMetric);
    // Sum all values in the key metric column
    return keyColumn.values.reduce((sum, value) => {
        const num = Number(value);
        return sum + (isNaN(num) ? 0 : num);
    }, 0);
});
const previousMetricValue = computed(() => {
    if (!hasValidData.value || error.value || !props.chart.previousMetric)
        return null;
    const dataSource = dataSourceStore.getDataSourceById(props.chart.dataSourceId);
    const prevColumn = dataSource.columns.find(c => c.name === props.chart.previousMetric);
    if (!prevColumn)
        return null;
    // Sum all values in the previous metric column
    return prevColumn.values.reduce((sum, value) => {
        const num = Number(value);
        return sum + (isNaN(num) ? 0 : num);
    }, 0);
});
const difference = computed(() => {
    if (previousMetricValue.value === null)
        return 0;
    if (props.chart.differenceType === 'percentage') {
        if (previousMetricValue.value === 0)
            return 0;
        return ((keyMetricValue.value - previousMetricValue.value) / Math.abs(previousMetricValue.value)) * 100;
    }
    else {
        return keyMetricValue.value - previousMetricValue.value;
    }
});
const formatValue = (value) => {
    if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    }
    else if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    else {
        return value.toLocaleString();
    }
};
const formatDifference = (diff) => {
    if (props.chart.differenceType === 'percentage') {
        return Math.abs(diff).toFixed(1) + '%';
    }
    else {
        return formatValue(Math.abs(diff));
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-full bg-white rounded-lg shadow-sm overflow-hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "h-full flex flex-col p-4" },
});
if (__VLS_ctx.chart.title) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-sm font-medium text-gray-900 truncate" },
    });
    (__VLS_ctx.chart.title);
}
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
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex-1 flex flex-col justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-2xl font-bold text-gray-900" },
    });
    (__VLS_ctx.formatValue(__VLS_ctx.keyMetricValue));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-xs text-gray-500 uppercase tracking-wide" },
    });
    (__VLS_ctx.chart.keyMetric);
    if (__VLS_ctx.chart.previousMetric && __VLS_ctx.previousMetricValue !== null) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" },
            ...{ class: ({
                    'bg-green-100 text-green-800': __VLS_ctx.difference > 0,
                    'bg-red-100 text-red-800': __VLS_ctx.difference < 0,
                    'bg-gray-100 text-gray-800': __VLS_ctx.difference === 0
                }) },
        });
        if (__VLS_ctx.difference > 0) {
            const __VLS_8 = {}.ArrowUpIcon;
            /** @type {[typeof __VLS_components.ArrowUpIcon, ]} */ ;
            // @ts-ignore
            const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
                ...{ class: "h-3 w-3 mr-1" },
            }));
            const __VLS_10 = __VLS_9({
                ...{ class: "h-3 w-3 mr-1" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        }
        if (__VLS_ctx.difference < 0) {
            const __VLS_12 = {}.ArrowDownIcon;
            /** @type {[typeof __VLS_components.ArrowDownIcon, ]} */ ;
            // @ts-ignore
            const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
                ...{ class: "h-3 w-3 mr-1" },
            }));
            const __VLS_14 = __VLS_13({
                ...{ class: "h-3 w-3 mr-1" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        }
        if (__VLS_ctx.difference === 0) {
            const __VLS_16 = {}.MinusIcon;
            /** @type {[typeof __VLS_components.MinusIcon, ]} */ ;
            // @ts-ignore
            const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
                ...{ class: "h-3 w-3 mr-1" },
            }));
            const __VLS_18 = __VLS_17({
                ...{ class: "h-3 w-3 mr-1" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        }
        (__VLS_ctx.formatDifference(__VLS_ctx.difference));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-xs text-gray-500 mt-1" },
        });
        (__VLS_ctx.formatValue(__VLS_ctx.previousMetricValue));
        (__VLS_ctx.chart.previousMetric);
    }
}
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
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
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-800']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-800']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ExclamationTriangleIcon: ExclamationTriangleIcon,
            ChartBarIcon: ChartBarIcon,
            ArrowUpIcon: ArrowUpIcon,
            ArrowDownIcon: ArrowDownIcon,
            MinusIcon: MinusIcon,
            hasValidData: hasValidData,
            error: error,
            keyMetricValue: keyMetricValue,
            previousMetricValue: previousMetricValue,
            difference: difference,
            formatValue: formatValue,
            formatDifference: formatDifference,
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
