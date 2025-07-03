<script setup lang="ts">
import { ref } from 'vue'

const user = ref({
    fullName: 'Hoàng Yến Anh',
    position: '',
    email: 'chinh@example.com',
    phone: '0981512863',
    avatar: 'https://res.cloudinary.com/dleqwa8rj/image/upload/v1751528706/lbwsqiy3i8va1llh7cj5.png'
})
// bên trong <script setup>
const resources = [
    { title: 'Cách cài đặt tài khoản veo3', url: 'https://docs.google.com/document/d/1-8g1fMhHKbM5d9URjFS_DvlCzYxP3PuQqQq27R9A9hQ/edit?usp=sharing' },
    { title: 'Prompt tổng hợp VEO3 Triệu View', url: 'https://docs.google.com/document/d/1-8g1fMhHKbM5d9URjFS_DvlCzYxP3PuQqQq27R9A9hQ/edit?usp=sharing' },
]

</script>

<template>
    <div class="min-h-screen bg-gray-50 py-10">
        <div class="max-w-3xl mx-auto px-4">
            <div class="bg-white shadow rounded-2xl p-8 flex flex-col items-center gap-6">
                <img :src="user.avatar" alt="avatar"
                    class="h-28 w-28 rounded-full object-cover ring-4 ring-primary-200" />
                <div class="text-center">
                    <h1 class="text-2xl font-semibold text-gray-900">{{ user.fullName }}</h1>
                    <p class="text-sm text-gray-500 mt-1">{{ user.position }}</p>
                </div>
                <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <!-- EMAIL -->
                    <div class="flex items-center gap-3">
                        <svg class="h-5 w-5 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <!-- phong bì: đường viền + nếp gấp -->
                            <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                            <polyline points="3 7.5 12 13 21 7.5" />
                        </svg>
                        <span class="text-sm break-all">{{ user.email }}</span>
                    </div>

                    <!-- PHONE -->
                    <div class="flex items-center gap-3">
                        <svg class="h-5 w-5 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <!-- ống nghe điện thoại cố định -->
                            <path
                                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72 12.35 12.35 0 0 0 .57 2.57 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.51-1.51a2 2 0 0 1 2.11-.45 12.35 12.35 0 0 0 2.57.57A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span class="text-sm">{{ user.phone }}</span>
                    </div>
                </div>

                <!-- Khu vực button chỉnh sửa hoặc hành động khác -->
                <ul class="w-full mt-6 space-y-3">
                    <li v-for="r in resources" :key="r.url" class="flex items-start gap-2">
                        <!-- chấm tròn nhỏ để căn thẳng hàng, có thể bỏ nếu không thích -->
                        <span class="mt-1 h-1.5 w-1.5 rounded-full bg-primary-500 shrink-0"></span>

                        <!-- link mở tab mới -->
                        <a :href="r.url" target="_blank" rel="noopener noreferrer"
                            class="text-sm text-primary-600 hover:underline">
                            {{ r.title }}
                        </a>
                    </li>
                </ul>

            </div>
        </div>
    </div>
</template>
