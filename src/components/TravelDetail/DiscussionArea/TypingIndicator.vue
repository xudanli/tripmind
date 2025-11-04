<template>
  <div class="typing-indicator">
    <div class="typing-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
    <span class="typing-text">AI 正在输入...</span>
  </div>
</template>

<style scoped>
.typing-indicator {
  --ink-4: #999;
}
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin-left: 48px;
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink-4);
  animation: typingDot 1.4s infinite;
}

.typing-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingDot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

.typing-text {
  font-size: 12px;
  color: var(--ink-4);
}
</style>
