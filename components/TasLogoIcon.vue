<script setup lang="ts">
import tasLogoIcon from '~/assets/hero_icon/ts_rocket_logo_full_canvas.svg'

defineProps<{
  class?: string
}>()
</script>

<template>
  <span
    :class="['tas-logo-icon', $props.class]"
    :style="{
      WebkitMaskImage: `url(${tasLogoIcon})`,
      maskImage: `url(${tasLogoIcon})`,
    }"
    aria-hidden="true"
  />
</template>

<style scoped>
.tas-logo-icon {
  display: inline-block;
  background:
    linear-gradient(180deg, rgb(207 250 254), rgb(103 232 249));
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: 172% 172%;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: 172% 172%;
  filter:
    drop-shadow(0 0 6px rgb(103 232 249 / 0.28))
    drop-shadow(0 0 14px rgb(34 211 238 / 0.24));
}
</style>
