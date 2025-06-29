<template>
  <div>
    <h2 class="mt-2 ml-2">Tổng theo cột {{ qtyCol || '...' }} trên từng {{ productCol || 'sản phẩm' }}</h2>

    <!-- Chọn cột & tuỳ chọn grouping -->
    <div class="mt-4 ml-2 flex flex-wrap items-center gap-6">
      <div>
        <label class="block text-sm font-medium">Cột sản phẩm</label>
        <select v-model="productCol" class="mt-1 border rounded px-2 py-1">
          <option v-for="h in headers" :key="h" :value="h">{{ h }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium">Cột số liệu</label>
        <select v-model="qtyCol" class="mt-1 border rounded px-2 py-1">
          <option v-for="h in headers" :key="h" :value="h">{{ h }}</option>
        </select>
      </div>

      <div class="flex items-center space-x-4">
        <label class="inline-flex items-center">
          <input type="radio" class="form-radio" value="original" v-model="groupMode" />
          <span class="ml-2">Giữ nguyên tên</span>
        </label>
        <label class="inline-flex items-center">
          <input type="radio" class="form-radio" value="normalize" v-model="groupMode" />
          <span class="ml-2">Gộp tên giống nhau</span>
        </label>
      </div>
    </div>

    <!-- Bảng kết quả -->
    <table class="min-w-full border-collapse mt-5">
      <thead>
        <tr>
          <th class="border px-4 py-2 text-left">{{ productCol || 'Sản phẩm' }}</th>
          <th class="border px-4 py-2 text-right">{{ qtyCol || 'Tổng' }}</th>
        </tr>
      </thead>
      <tbody v-if="Object.keys(totals).length">
        <tr v-for="(tot, prod) in totals" :key="prod">
          <td class="border px-4 py-2">{{ prod }}</td>
          <td class="border px-4 py-2 text-right">{{ tot }}</td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="2" class="border px-4 py-6 text-center text-gray-500">
            Chưa có dữ liệu phù hợp
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDataSourceStore } from '../stores/dataSource'

/*************************************************
 1. Lấy dataSource động theo id trên route
 *************************************************/
const route = useRoute()
const dsStore = useDataSourceStore()

const ds = computed(() => {
  const id = route.params.id as string | undefined
  return id ? dsStore.dataSources.find(d => d.id === id) ?? null
            : dsStore.dataSources[0] ?? null
})

const headers = computed(() => ds.value ? ds.value.columns.map(c => c.name) : [])

/*************************************************
 2. Chọn cột sản phẩm & số liệu
 *************************************************/
const productCol = ref('')
const qtyCol     = ref('')

watch(headers, () => {
  if (!ds.value) return
  const h = headers.value
  productCol.value = h[0] || ''
  qtyCol.value     = h[1] || h[0] || ''
}, { immediate: true })

/*************************************************
 3. Chế độ gộp tên sản phẩm
 *************************************************/
const groupMode = ref<'original' | 'normalize'>('original')

function normalizeKey (s: string) {
  return s.toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-z0-9 ]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
}

/*************************************************
 4. Tính totals
 *************************************************/
const totals = computed<Record<string, number>>(() => {
  if (!ds.value || !productCol.value || !qtyCol.value) return {}

  const numeric = ds.value.rows.every(r => !isNaN(+r[qtyCol.value]))
  const acc: Record<string, number | Set<string>> = {}

  for (const r of ds.value.rows) {
    let key = String(r[productCol.value] ?? '').trim()
    if (!key) continue
    if (groupMode.value === 'normalize') key = normalizeKey(key)

    if (numeric) {
      const val = +r[qtyCol.value]
      if (!isFinite(val)) continue
      acc[key] = ((acc[key] as number) || 0) + val
    } else {
      const who = String(r[qtyCol.value] ?? '').trim()
      if (!who) continue
      if (!acc[key]) acc[key] = new Set<string>()
      ;(acc[key] as Set<string>).add(who)
    }
  }

  // Nếu là dạng set (đếm khách), chuyển sang number
  return Object.fromEntries(
    Object.entries(acc).map(([k, v]) => [k, typeof v === 'number' ? v : (v as Set<string>).size])
  )
})
</script>
