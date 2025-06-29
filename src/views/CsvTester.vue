<template>
    <div class="p-6 space-y-6 max-w-6xl mx-auto">
        <h1 class="text-2xl font-semibold">CSV Tester by Ylc</h1>

        <!-- Upload CSV -->
        <input type="file" accept=".csv" @change="onFile" />

        <!-- Pickers & control -->
        <div v-if="columns.length" class="flex flex-wrap gap-6 items-end mt-4">
            <div>
                <label class="block text-sm">Cột nhóm (chuỗi)</label>
                <select v-model="prodCol" class="border rounded px-2 py-1">
                    <option v-for="h in prodOptions" :key="h" :value="h">{{ h }}</option>
                </select>
            </div>
            <div>
                <label class="block text-sm">Cột số liệu (số)</label>
                <select v-model="qtyCol" class="border rounded px-2 py-1">
                    <option v-for="h in qtyOptions" :key="h" :value="h">{{ h }}</option>
                </select>
            </div>
            <label class="inline-flex items-center gap-2">
                <input type="checkbox" v-model="normalize" />
                Gộp ignore case + dấu
            </label>
            <button class="ml-auto px-3 py-1.5 rounded bg-purple-600 text-white" @click="openModal">
                Chỉnh tên thủ công
            </button>
        </div>

        <!-- Search & table -->
        <div v-if="totalsArr.length" class="mt-6 space-y-3">
            <div class="flex items-center gap-3">
                <input v-model="searchTerm" placeholder="Tìm kiếm..." class="border rounded px-2 py-1 flex-1" />
                <button class="px-3 py-1.5 rounded border" @click="copyTable">Copy bảng</button>
                <button class="px-3 py-1.5 rounded border" @click="exportCsv">Xuất CSV</button>
                <button class="px-3 py-1.5 rounded border" @click="exportPdf">Xuất PDF</button>
                <!-- trong khối Pickers & control, sau nút rename -->
                <button class="px-3 py-1.5 rounded border" @click="openTypeModal">
                    Chỉnh loại cột
                </button>

                <!-- Modal chỉnh loại cột -->
                <div v-if="showTypeModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg w-[90vw] max-w-md p-6 space-y-4">
                        <h2 class="text-lg font-semibold">Chỉnh loại cột</h2>
                        <div class="max-h-[60vh] overflow-auto divide-y">
                            <div v-for="c in columns" :key="c" class="py-2 flex items-center space-x-4">
                                <span class="w-1/3 truncate">{{ c }}</span>
                                <label><input type="radio" v-model="typeDraft[c]" :value="'string'" /> Chuỗi</label>
                                <label><input type="radio" v-model="typeDraft[c]" :value="'number'" /> Số</label>
                            </div>
                        </div>
                        <div class="text-right space-x-2 pt-4">
                            <button class="px-3 py-1.5 rounded border" @click="closeTypeModal">Huỷ</button>
                            <button class="px-3 py-1.5 rounded bg-green-600 text-white"
                                @click="applyTypeOverrides">Lưu</button>
                        </div>
                    </div>
                </div>

            </div>

            <table class="min-w-full border-collapse text-sm">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border px-2 py-2"></th>
                        <th class="border px-4 py-2 text-left whitespace-nowrap">{{ prodCol || 'Nhóm' }}</th>
                        <th class="border px-4 py-2 text-right whitespace-nowrap">{{ qtyHeader }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="([k, v], i) in filteredTotals" :key="i">
                        <td class="border px-2 py-1 text-center">
                            <button @click="removeKey(k)" class="text-red-500">×</button>
                        </td>
                        <td class="border px-4 py-1">{{ k }}</td>
                        <td class="border px-4 py-1 text-right">
                            <template v-if="isNumeric">{{ formatNumber(v as number) }}</template>
                            <template v-else>{{ v }}</template>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal rename -->
        <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg w-[90vw] max-w-xl p-6 space-y-4">
                <h2 class="text-lg font-semibold">Chuẩn hoá "{{ prodCol }}"</h2>

                <input v-model="modalSearch" placeholder="Tìm..." class="border rounded px-2 py-1 w-full" />

                <div class="max-h-[60vh] overflow-auto divide-y text-sm">
                    <div v-for="key in modalKeysFiltered" :key="key" class="py-2 flex gap-2 items-center">
                        <span class="w-1/3 truncate" :title="key">{{ key }}</span>
                        <input v-model="renameDraft[key]" class="flex-1 border rounded px-2 py-1" />
                    </div>
                </div>
                <div class="text-right space-x-2 pt-2">
                    <button class="px-3 py-1.5 rounded border" @click="closeModal">Huỷ</button>
                    <button class="px-3 py-1.5 rounded bg-purple-600 text-white" @click="applyRenames">Lưu</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useCsvStore } from '../stores/csvStore'
import { TDocumentDefinitions, PageOrientation } from 'pdfmake/interfaces'
import pdfMakeOrig from 'pdfmake/build/pdfmake.js'
import vfsFonts from 'pdfmake/build/vfs_fonts.js'


// thêm sau reactive vars
const colTypeOverrides = reactive<Record<string, 'string' | 'number'>>({})

// auto-detect kiểu số
const autoNumericCols = computed(() =>
    // chọn tất cả cột mà mọi giá trị của sampleRows chuyển được thành số
    columns.value.filter(c =>
        sampleRows.value.every(r => toNumber(r[c]) !== null)
    )
)
// hợp nhất override + auto
const colTypes = computed<Record<string, 'string' | 'number'>>(() => {
    const types: Record<string, 'string' | 'number'> = {}
    columns.value.forEach(c => {
        if (colTypeOverrides[c]) types[c] = colTypeOverrides[c]
        else types[c] = autoNumericCols.value.includes(c) ? 'number' : 'string'
    })
    return types
})


// tuỳ lại options
const prodOptions = computed(() =>
    columns.value.filter(c => !isNumericColumn(c))
)
const qtyOptions = computed(() =>
    columns.value.filter(c => isNumericColumn(c))
)

// modal để chỉnh loại
const showTypeModal = ref(false)
const typeDraft = reactive<Record<string, 'string'>>({})

function openTypeModal() {
    Object.keys(typeDraft).forEach(k => delete typeDraft[k])
    columns.value.forEach(c => typeDraft[c] = colTypes.value[c])
    showTypeModal.value = true
}
function applyTypeOverrides() {
    Object.entries(typeDraft).forEach(([c, t]) => {
        colTypeOverrides[c] = t as 'string' | 'number'
    })
    showTypeModal.value = false
}
function closeTypeModal() {
    showTypeModal.value = false
}

/* --------------------------------------------------
   Helper utilities
-------------------------------------------------- */
const stripDiacritic = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '')
const canonicalBase = (s: string) => stripDiacritic(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')   // giữ chữ+số, chuyển kí tự khác thành space
    .replace(/\s+/g, ' ')          // gộp space
    .trim()

function toNumber(v: any): number | null {
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && /^[0-9\s.,]+$/.test(v.trim())) {
        const cleaned = v.trim()
            .replace(/\s+/g, '')         // remove spaces
            .replace(/\.(?=\d{3})/g, '') // dot thousand
            .replace(/,(?=\d{3})/g, '')   // comma thousand
            .replace(',', '.')            // decimal comma
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : null
    }
    return null
}
const formatNumber = (n: number) => n.toLocaleString('vi-VN')

/* --------------------------------------------------
   Pinia store & reactive vars
-------------------------------------------------- */
const csv = useCsvStore()
const prodCol = ref('')
const qtyCol = ref('')
const normalize = ref(false)
const searchTerm = ref('')

/* columns typing */
const columns = computed(() => csv.columns)
const sampleRows = computed(() => csv.rows.slice(0, 50))

const numericCols = computed(() => columns.value.filter(col => sampleRows.value.every(r => toNumber(r[col]) !== null)))
const stringCols = computed(() => columns.value.filter(c => !numericCols.value.includes(c)))
function defaultProd() { return prodOptions.value[0] || columns.value[0] || '' }
function defaultQty(exclude = '') { return qtyOptions.value.find(c => c !== exclude) || '' }

function resetAll() {
    prodCol.value = ''
    qtyCol.value = ''
    normalize.value = false
    searchTerm.value = ''
    modalSearch.value = ''
    showModal.value = false
    // xóa renameMap và removedKeys
    Object.keys(renameMap).forEach(k => delete renameMap[k])
    removedKeys.value.clear()
    // xóa luôn dữ liệu cũ trong store
    csv.rows = []
    csv.columns = []
}
async function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0]
    if (!f) return
    await csv.loadFile(f)
    prodCol.value = prodOptions.value[0] || columns.value[0] || ''
    qtyCol.value = qtyOptions.value[0] || columns.value.find(c => c !== prodCol.value) || ''
}

// 4) Tính flag isNumeric dùng chung
const isNumeric = computed(() =>
    qtyCol.value
        ? isNumericColumn(qtyCol.value)
        : false
)

/* prevent duplicate selection */
watch([prodCol, qtyCol], ([p, q]) => {
    if (p && p === q) qtyCol.value = defaultQty(p)
})

/* --------------------------------------------------
   Manual rename (modal)
-------------------------------------------------- */
const renameMap = reactive<Record<string, string>>({})   // canonical -> new display
const renameDraft = reactive<Record<string, string>>({})
const showModal = ref(false)
const modalSearch = ref('')

const canonical = (s: string) => (normalize.value ? canonicalBase(s) : s.trim())

function openModal() {
    modalSearch.value = ''
    Object.keys(renameDraft).forEach(k => delete renameDraft[k])
    uniqueKeys.value.forEach(k => renameDraft[k] = renameMap[canonical(k)] || k)
    showModal.value = true
}
function closeModal() { showModal.value = false }
function applyRenames() {
    Object.entries(renameDraft).forEach(([orig, to]) => {
        const ck = canonical(orig)
        if (ck && to && ck !== to) renameMap[ck] = to.trim()
    })
    closeModal()
}

function isNumericColumn(col: string) {
    return csv.rows.some(r => toNumber(r[col]) !== null)
}

/* data after rename */
const processedRows = computed(() => {
    if (!prodCol.value) return csv.rows
    return csv.rows.map(r => {
        const row = { ...r }
        const raw = String(r[prodCol.value] ?? '')
        const ck = canonical(raw)
        row[prodCol.value] = renameMap[ck] || raw.trim()
        return row
    })
})

const uniqueKeys = computed(() => Array.from(new Set(processedRows.value.map(r => String(r[prodCol.value])))))
const modalKeysFiltered = computed(() => {
    const kw = canonicalBase(modalSearch.value)
    return uniqueKeys.value.filter(k => canonicalBase(k).includes(kw))
})

/* --------------------------------------------------
   Totals calculation
-------------------------------------------------- */
const qtyHeader = computed(() =>
    qtyCol.value
        ? `${qtyCol.value} (${isNumeric.value ? 'tổng' : 'đếm'})`
        : 'Số liệu'
)

const totalsMap = computed(() => {
    const map = new Map<string, number>()
    if (!prodCol.value || !qtyCol.value) return map
    const numeric = numericCols.value.includes(qtyCol.value)
    processedRows.value.forEach(r => {
        const display = String(r[prodCol.value]).trim()
        if (!display) return
        const key = canonical(display)
        const num = numeric ? (toNumber(r[qtyCol.value]) || 0) : 1
        map.set(key, (map.get(key) || 0) + num)
    })
    return map
})
const totalsArr = computed<[string, number][]>(() => {
    if (!prodCol.value || !qtyCol.value) return []

    const map = new Map<string, number>()
    const rep = new Map<string, string>()
    let lastGroup = ''

    for (const r of csv.rows) {
        // 1) Lấy raw, trim, fill-down nếu blank
        let raw = String(r[prodCol.value] ?? '').trim()
        if (!raw) raw = lastGroup
        lastGroup = raw

        if (!raw) continue

        // 2) canonical key để gộp
        const key = normalize.value
            ? canonicalBase(raw)
            : raw

        // 3) rep map lưu display lần đầu (vẫn giữ dấu gốc)
        if (!rep.has(key)) rep.set(key, raw)

        // 4) Tính num: nếu isNumeric => toNumber, else 1
        const num = isNumericColumn(qtyCol.value)
            ? (toNumber(r[qtyCol.value]) || 0)
            : 1

        // 5) Cộng dồn
        map.set(key, (map.get(key) || 0) + num)
    }

    // 6) Trả mảng [display, total] giảm dần
    return Array.from(map.entries())
        .map(([k, v]) => [rep.get(k) as string, v])
        .sort((a, b) => b[1] - a[1])
})

const removedKeys = ref<Set<string>>(new Set())
function removeKey(key: string) {
    removedKeys.value.add(key)
}
/* search filter */
const filteredTotals = computed(() => {
    const kw = normalize.value
        ? canonicalBase(searchTerm.value)
        : searchTerm.value.trim()
    return totalsArr.value
        .filter(([k]) => !removedKeys.value.has(k))
        .filter(([k]) => !kw || canonicalBase(k).includes(kw))
})
/* copy table */
function copyTable() {
    const lines = [[prodCol.value, qtyHeader.value], ...filteredTotals.value.map(([k, v]) => [k, v.toString()])]
    const tsv = lines.map(l => l.join('\t')).join('\n')
    navigator.clipboard.writeText(tsv)
}
function exportCsv() {
    const rows = filteredTotals.value.map(([k, v]) => ({ [prodCol.value]: k, [qtyCol.value]: v }))
    const csvStr = [Object.keys(rows[0]).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'export.csv'
    link.click()
    URL.revokeObjectURL(link.href)
}
const pdfMake = pdfMakeOrig as any
// gán trực tiếp VFS từ module
pdfMake.vfs = vfsFonts

function exportPdf() {
    const body = [
        [prodCol.value, qtyHeader.value],
        ...filteredTotals.value.map(([k, v]) => [
            k,
            isNumeric.value ? formatNumber(v as number) : v,
        ]),
    ]

    const docDefinition: TDocumentDefinitions = {
        pageOrientation: 'landscape' as PageOrientation,
        content: [{ table: { headerRows: 1, widths: ['*', 'auto'], body } }],
        defaultStyle: { font: 'Roboto' }
    }

    pdfMake.createPdf(docDefinition).download('table.pdf')
}
</script>