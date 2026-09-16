<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { VdPieChart, type VdChartExposed } from '@vanduo-oss/vd3-charts';
import '@vanduo-oss/vd3-charts/css';
const chart = ref<VdChartExposed | null>(null);
const color = ref('#364fc7');
const rows = [{ id: 'new', label: 'New', value: 60 }, { id: 'returning', label: 'Returning', value: 40 }];
async function changeColor() { color.value = '#0b7285'; await nextTick(); chart.value?.refresh(); }
</script>
<template>
  <button type="button" @click="changeColor">Change chart color</button>
  <VdPieChart ref="chart" :data="rows" :style="{ '--vd-chart-1': color }"
    title="Customers" description="60 new and 40 returning customers." :height="320" />
</template>
