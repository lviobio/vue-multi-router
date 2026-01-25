import { inject, onBeforeUnmount } from 'vue'
import { multiRouterContextActivateCallbacksKey } from '@/injectionSymbols'
import { useMultiRouterContext } from '@/composables/useMultiRouterContext'

export function onMultiRouterContextActivate(callback: (name: string) => void) {
  const { isActive, contextKey } = useMultiRouterContext()
  const multiRouterActivateCallbacks = inject(multiRouterContextActivateCallbacksKey)

  if (!multiRouterActivateCallbacks) {
    console.warn('[onMultiRouterContextActivate] No multi-router-activate-callbacks found')
    return
  }

  if (isActive.value) {
    callback(contextKey)
  }

  multiRouterActivateCallbacks.push(callback)
  onBeforeUnmount(() => {
    multiRouterActivateCallbacks.splice(multiRouterActivateCallbacks.indexOf(callback), 1)
  })
}
