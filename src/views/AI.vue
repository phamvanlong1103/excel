<template>
  <div class="ai-container">
    <h1>AI Task Generator (Free)</h1>
    <div class="prompt-input">
      <textarea v-model="userPrompt" placeholder="Nhập prompt..." rows="3"></textarea>
      <button @click="generateList" :disabled="isGenerating || !userPrompt.trim()">
        {{ isGenerating ? 'Đang tạo...' : 'Tạo list AI' }}
      </button>
    </div>

    <ul v-if="tasks.length" class="task-list">
      <li v-for="(task, idx) in tasks" :key="idx" class="task-item">
        <label>
          <input type="checkbox" v-model="task.done" @change="saveTasks" />
          <span :class="{ done: task.done }">{{ task.text }}</span>
        </label>
      </li>
    </ul>

    <p v-else class="no-tasks">Chưa có task nào. Hãy nhập prompt và tạo list.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import axios from 'axios'

// Task interface
type Task = { text: string; done: boolean }

// Lưu tasks vào localStorage key 'ai-tasks-free'
const tasks = useStorage<Task[]>('ai-tasks-free', [])
const userPrompt = ref('')
const isGenerating = ref(false)

// Hugging Face inference settings (free tier)
const HF_API_URL = import.meta.env.VITE_HF_API_URL || 'https://api-inference.huggingface.co/models/gpt2'
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || ''

async function generateList() {
  if (!userPrompt.value.trim()) return
  isGenerating.value = true
  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: userPrompt.value, options: { wait_for_model: true } },
      { headers: { Authorization: HF_API_KEY ? `Bearer ${HF_API_KEY}` : undefined } }
    )
    let text = ''
    if (typeof response.data === 'string') {
      text = response.data
    } else if (Array.isArray(response.data) && response.data[0].generated_text) {
      text = response.data[0].generated_text
    } else if (response.data.generated_text) {
      text = response.data.generated_text
    }
    // Tách thành từng dòng danh sách
    const lines = text.split(/\r?\n/)
      .map(line => line.replace(/^\s*\d+[\.|\)]?\s*/, '').trim())
      .filter(line => line)
    // Cập nhật tasks
    tasks.value = lines.map(t => ({ text: t, done: false }))
    userPrompt.value = ''
  } catch (error) {
    console.error('Lỗi HF Inference:', error)
  } finally {
    isGenerating.value = false
  }
}

function saveTasks() {
  tasks.value = [...tasks.value]
}
</script>

<style scoped>
.ai-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.ai-container h1 {
  text-align: center;
  margin-bottom: 12px;
}
.prompt-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}
button {
  align-self: flex-end;
  padding: 6px 12px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background: #9e9e9e;
  cursor: not-allowed;
}
.task-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.task-item label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.task-item .done {
  text-decoration: line-through;
  color: #999;
}
.no-tasks {
  text-align: center;
  color: #666;
}
</style>
