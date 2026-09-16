<script setup lang="ts">
import { ref } from 'vue';
import { VdBarChart } from '@vanduo-oss/vd3-charts';
import '@vanduo-oss/vd3-charts/css';
const rows = [{ id: 'jan', month: 'Jan', sales: 120 }, { id: 'feb', month: 'Feb', sales: 180 }];
const selected = ref('');
</script>
<template>
  <VdBarChart :data="rows" x="month" y="sales" title="Monthly sales"
    description="Sales rose from 120 in January to 180 in February."
    data-table="visible" :height="320"
    @bar-click="selected = String($event.datum.month)" />
  <p aria-live="polite">Selected: {{ selected || 'None' }}</p>
</template>
