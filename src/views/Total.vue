<template>
    <div>
      <h2 class="mt-2 ml-2">Tổng số lượng theo sản phẩm</h2>
  
      <!-- Tùy chọn grouping -->
      <div class="mt-4 ml-2 flex items-center space-x-6">
        <label class="inline-flex items-center">
          <input
            type="radio"
            class="form-radio"
            value="original"
            v-model="groupMode"
          />
          <span class="ml-2">Giữ nguyên tên</span>
        </label>
        <label class="inline-flex items-center">
          <input
            type="radio"
            class="form-radio"
            value="normalize"
            v-model="groupMode"
          />
          <span class="ml-2">Gộp tên giống nhau (ignore case)</span>
        </label>
      </div>
  
      <!-- Bảng kết quả -->
      <table class="min-w-full border-collapse mt-5">
        <thead>
          <tr>
            <th class="border px-4 py-2 text-left">Sản phẩm</th>
            <th class="border px-4 py-2 text-right">Tổng số lượng</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tot, prod) in totals" :key="prod">
            <td class="border px-4 py-2">{{ prod }}</td>
            <td class="border px-4 py-2 text-right">{{ tot }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useDataSourceStore } from '../stores/dataSource'
  
  // store và tên header y như trước
  const dsStore = useDataSourceStore()
  const HEADER_PRODUCT  = 'Sản phầm '
  const HEADER_QUANTITY = 'Số lượng '
  
  // trạng thái nhóm: 'original' hoặc 'normalize'
  const groupMode = ref<'original' | 'normalize'>('original')
  
  // computed trả về object totals
  const totals = computed<Record<string, number>>(() => {
    const rawRows = dsStore.dataSources[0]?.rows || []
    const acc: Record<string, number> = {}
  
    rawRows.forEach((row: Record<string, any>) => {
      let key = String(row[HEADER_PRODUCT] ?? '').trim()
      // nếu chế độ normalize thì convert lowercase
      if (groupMode.value === 'normalize') {
        key = key.toLowerCase()
      }
      const qty = Number(row[HEADER_QUANTITY] ?? 0)
      if (!key) return
      acc[key] = (acc[key] || 0) + qty
    })
  
    return acc
  })
  </script>
  