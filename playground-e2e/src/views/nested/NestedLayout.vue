<template>
  <div>
    <!-- Ancestor layout above the multiRouterRoot route: must NOT render inside a context -->
    <div data-testid="nested-layout-marker">Nested layout</div>
    <RouterView />
  </div>
</template>
