<script lang="ts">
import {
  defineComponent,
  h,
  inject,
  onBeforeUnmount,
  type PropType,
  provide,
  type Ref,
  shallowRef,
  watch,
} from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { multiRouterContextActivateCallbacksKey } from '@/injectionSymbols'
import { multiRouterContext } from '@/symbols'
import { useMultiRouter } from '@/composables/useMultiRouter'
import { mapMaybePromise } from '@/history'

type LocationProp = string | RouteLocationRaw

function withContextActivateCallbacks(name: string, activeContextKey: Ref<string | undefined>) {
  const multiRouterActivatedCallbacks: Array<(name: string) => void> = []
  provide(multiRouterContextActivateCallbacksKey, multiRouterActivatedCallbacks)

  watch(activeContextKey, (newName) => {
    if (newName === name) {
      multiRouterActivatedCallbacks.forEach((callback) => callback(name))
    }
  })
}

const MultiRouterContextInner = defineComponent({
  name: 'MultiRouterContextInner',
  props: {
    type: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      type: [String, Object] as PropType<LocationProp>,
      required: false,
    },
    initialLocation: {
      type: [String, Object] as PropType<LocationProp>,
      required: false,
    },
    historyEnabled: {
      type: Boolean,
      default: true,
    },
    keepHistory: {
      type: Boolean,
      default: false,
    },
    default: {
      type: Boolean,
      default: false,
    },
    asRoot: {
      type: Boolean,
      default: false,
    },
    activator: {
      type: Boolean,
      default: true,
    },
    preventClass: {
      type: String as PropType<string | null>,
      default: null,
    },
  },
  emits: ['update:location'],
  setup(props, { slots, emit }) {
    const { manager, activeContextKey } = useMultiRouter()

    console.debug('[MultiRouterContext] setup', {
      type: props.type,
      name: props.name,
      location: props.location,
      initialLocation: props.initialLocation,
    })

    if (manager.has(props.name)) {
      console.warn(`[MultiRouterContext] Context "${props.name}" already registered, skipping`)
      return () => slots.default?.()
    }

    // With an async storage adapter registration resolves later — children
    // (and anything touching $route/$router) must not render until the
    // context's router exists. Sync adapters resolve immediately, so `ready`
    // is true before the first render and behavior is unchanged.
    const ready = shallowRef(false)
    let unmounted = false

    // The enclosing context (if this one is rendered inside another context's
    // content). Injected before we provide our own key, so it resolves to the
    // parent — making nested contexts a first-class, auto-detected relationship.
    const parent = inject(multiRouterContext, undefined)

    const registration = manager.register(props.type, props.name, {
      location: props.location,
      initialLocation: props.initialLocation,
      historyEnabled: props.historyEnabled,
      keepHistory: props.keepHistory,
      default: props.default,
      asRoot: props.asRoot,
      parent,
    })

    provide(multiRouterContext, props.name)

    withContextActivateCallbacks(props.name, activeContextKey)

    mapMaybePromise(registration, () => {
      if (unmounted) {
        // Unmounted while the async registration was in flight — drop the
        // context right away so it doesn't leak
        manager.unregister(props.name)
        return
      }

      // Watch router navigation and emit location changes for v-model:location support.
      // If location prop was passed as an object, emit the resolved route object to match the format.
      const useObjectEmit = typeof props.location === 'object' && props.location !== null
      const router = manager.getRouter(props.name)
      router.afterEach((to) => {
        emit('update:location', useObjectEmit ? to : to.fullPath)
      })

      ready.value = true
    })

    onBeforeUnmount(() => {
      unmounted = true
      if (manager.has(props.name)) {
        manager.unregister(props.name)
      }
    })

    if (!props.activator) {
      return () => (ready.value ? slots.default?.() : null)
    }

    const onActivate = (e: MouseEvent) => {
      e.stopPropagation()
      let shouldActivate = true

      const target = e.target as HTMLElement | null

      const preventClasses = props.preventClass ? props.preventClass.split(' ') : []

      preventClasses.forEach((className) => {
        if (target?.closest('.' + className)) {
          shouldActivate = false
        }
      })

      if (shouldActivate) {
        if (manager.setActive(props.name, true)) {
          console.debug('[MultiRouterContext] activated', props.name)
        }
      }
    }

    return () => {
      if (!ready.value) return null

      const children = slots.default?.()

      if (children && children.length === 1) {
        return h(children[0], { onMousedown: onActivate })
      }

      return h('div', { onMousedown: onActivate }, children)
    }
  },
})

export default defineComponent({
  name: 'MultiRouterContext',
  props: {
    type: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      type: [String, Object] as PropType<LocationProp>,
      required: false,
    },
    initialLocation: {
      type: [String, Object] as PropType<LocationProp>,
      required: false,
    },
    /**
     * Whether this context should store its navigation history in the browser history.
     * When false, navigation within this context won't affect browser back/forward.
     * @default true
     */
    historyEnabled: {
      type: Boolean,
      default: true,
    },
    /**
     * Whether the persisted history of this context should survive unmounting.
     * When true, unregistering the context keeps its virtual stack in storage,
     * so the next registration of the same context restores it (location and
     * position included) instead of starting from initialLocation.
     * @default false
     */
    keepHistory: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether this context should be activated by default if no prior active context exists.
     * Only one context should have this set to true.
     * @default false
     */
    default: {
      type: Boolean,
      default: false,
    },
    /**
     * Render the full route tree (layouts and all) instead of collapsing to the
     * deepest route with `meta.multiRouterRoot`. Set this on the main/shell
     * context so it shows whole pages, while sub-contexts (panels, drawers) still
     * render only the fragment from the multiRouterRoot down.
     * @default false
     */
    asRoot: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether this context should act as an activator, activating the context on mousedown.
     * Set false to opt out of built-in activation behavior.
     * @default true
     */
    activator: {
      type: Boolean,
      default: true,
    },
    /**
     * CSS class that prevents activation when the mousedown target matches.
     * Only used when activator is true.
     * @default null
     */
    preventClass: {
      type: String as PropType<string | null>,
      default: null,
    },
  },
  emits: ['update:location'],
  setup(props, { slots, emit }) {
    // Render inner component with key=name+location to force full re-mount when either changes
    // initialLocation is not in key because it's only used as fallback
    const locationKey = (loc: LocationProp | undefined) =>
      loc === undefined || loc === null ? '' : typeof loc === 'string' ? loc : JSON.stringify(loc)

    const onUpdateLocation = (location: LocationProp) => {
      emit('update:location', location)
    }

    return () =>
      h(
        MultiRouterContextInner,
        {
          key: `${props.name}:${locationKey(props.location)}`,
          type: props.type,
          name: props.name,
          location: props.location,
          initialLocation: props.initialLocation,
          historyEnabled: props.historyEnabled,
          keepHistory: props.keepHistory,
          default: props.default,
          asRoot: props.asRoot,
          activator: props.activator,
          preventClass: props.preventClass,
          'onUpdate:location': onUpdateLocation,
        },
        slots.default,
      )
  },
})
</script>
