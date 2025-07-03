<template>
  <div class="journal-container">
    <h1>Nhật ký của tôi</h1>
    <div class="entry-input">
      <textarea
        v-model="newEntry"
        placeholder="Viết cảm nghĩ ngày hôm nay..."
        rows="4"
      ></textarea>
      <button @click="addEntry" :disabled="!newEntry.trim()">Thêm nhật ký</button>
    </div>
    <ul class="entry-list">
      <li
        v-for="(entry, index) in entries"
        :key="index"
        class="entry-item"
        :class="{ done: entry.done, editing: editingIndex === index }"
      >
        <!-- Done toggle -->
        <label class="done-toggle">
          <input type="checkbox" v-model="entry.done" @change="saveEntries" />
          <span>{{ entry.done ? 'Done' : 'Pending' }}</span>
        </label>

        <!-- Content / Edit mode -->
        <div v-if="editingIndex !== index" class="entry-content">
          <div class="entry-date">{{ formatDate(entry.date) }}</div>
          <div class="entry-text">{{ entry.text }}</div>
        </div>
        <div v-else class="edit-container">
          <textarea v-model="editingText" rows="3"></textarea>
          <div class="edit-actions">
            <button class="btn-save" @click="saveEdit(index)">Lưu</button>
            <button class="btn-cancel" @click="cancelEdit">Hủy</button>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="entry-actions" v-if="editingIndex !== index">
          <button class="edit-btn" @click="startEdit(index)">Sửa</button>
          <button class="delete-btn" @click="removeEntry(index)">×</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

interface Entry {
  text: string
  date: string
  done: boolean
}

const entries = useStorage<Entry[]>('journal-entries', [])
const newEntry = ref('')
const editingIndex = ref<number | null>(null)
const editingText = ref('')

function addEntry() {
  const entry: Entry = {
    text: newEntry.value.trim(),
    date: new Date().toISOString(),
    done: false
  }
  entries.value = [entry, ...entries.value]
  newEntry.value = ''
}

function removeEntry(index: number) {
  if (editingIndex.value === index) editingIndex.value = null
  entries.value.splice(index, 1)
}

function saveEntries() {
  entries.value = [...entries.value]
}

function startEdit(index: number) {
  editingIndex.value = index
  editingText.value = entries.value[index].text
}

function saveEdit(index: number) {
  if (editingText.value.trim()) {
    entries.value[index].text = editingText.value.trim()
    saveEntries()
  }
  editingIndex.value = null
}

function cancelEdit() {
  editingIndex.value = null
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.journal-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  font-family: Arial, sans-serif;
}
h1 {
  text-align: center;
  margin-bottom: 16px;
}
.entry-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  font-size: 14px;
}
button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}
.entry-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.entry-item {
  position: relative;
  padding: 12px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  transition: background 0.3s;
}
.entry-item.done {
  background: #e0ffe0;
}
.done-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #333;
  margin-left: 24px;
  margin-bottom: 6px;
}
.entry-content {
  margin-left: 24px;
}
.entry-date {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}
.entry-text {
  font-size: 14px;
  color: #333;
  white-space: pre-wrap;
}
.entry-item.done .entry-text {
  text-decoration: line-through;
  color: #999;
}
.entry-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}
.edit-btn {
  background: #ffeb3b;
}
.delete-btn {
  background: transparent;
  color: #999;
  font-size: 18px;
  line-height: 1;
}
.delete-btn:hover {
  color: #e74c3c;
}
/* Edit mode */
.entry-item.editing {
  background: #fff8e1;
}
.edit-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 24px;
}
.edit-actions {
  display: flex;
  gap: 8px;
}
.btn-save {
  background: #4caf50;
  color: white;
}
.btn-cancel {
  background: #e0e0e0;
}
</style>
