<template>
  <div class="hello-world">
    <h1>{{ msg }}</h1>
    <p>欢迎使用 AI 旅行伴侣！</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<style scoped>
.hello-world {
  text-align: center;
  padding: 2rem;
}

h1 {
  color: #42b883;
  margin-bottom: 1rem;
}

p {
  color: #666;
  font-size: 1.1rem;
}
</style>
