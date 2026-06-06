<template>
  <div data-testid="nested-child-content">
    <p>Nested child (multiRouterRoot)</p>
    <nav class="page-links">
      <RouterLink data-testid="go-deep" to="/nested/child/deep">Deep</RouterLink>
      <RouterLink data-testid="go-child-b" to="/nested/child-b">Child B</RouterLink>
    </nav>
    <!-- Nested RouterView inside the context -->
    <RouterView />
  </div>
</template>
