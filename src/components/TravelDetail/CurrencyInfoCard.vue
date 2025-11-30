<template>
  <a-card v-if="currencyInfo || currency" class="currency-info-card" title="💰 货币信息">
    <div class="currency-info-content">
      <div v-if="currencyInfo" class="currency-detail">
        <div class="currency-item">
          <div class="currency-label">
            <span class="currency-icon">💵</span>
            <strong>货币代码</strong>
          </div>
          <div class="currency-value">{{ currencyInfo.code }}</div>
        </div>
        
        <div class="currency-item">
          <div class="currency-label">
            <span class="currency-icon">💱</span>
            <strong>货币符号</strong>
          </div>
          <div class="currency-value">{{ currencyInfo.symbol }}</div>
        </div>
        
        <div class="currency-item">
          <div class="currency-label">
            <span class="currency-icon">🌍</span>
            <strong>货币名称</strong>
          </div>
          <div class="currency-value">{{ currencyInfo.name }}</div>
        </div>
      </div>
      
      <div v-else-if="currency" class="currency-simple">
        <div class="currency-item">
          <div class="currency-label">
            <span class="currency-icon">💵</span>
            <strong>货币代码</strong>
          </div>
          <div class="currency-value">{{ currency }}</div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
interface CurrencyInfo {
  code: string
  symbol: string
  name: string
}

defineProps<{
  currencyInfo?: CurrencyInfo
  currency?: string
}>()
</script>

<style scoped>
.currency-info-card {
  margin-bottom: 0;
}

.currency-info-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.currency-detail,
.currency-simple {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.currency-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.currency-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #1d1d1f;
}

.currency-icon {
  font-size: 16px;
}

.currency-value {
  font-size: 15px;
  font-weight: 500;
  color: #1890ff;
  padding-left: 22px;
}
</style>

