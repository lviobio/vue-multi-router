<script lang="ts">
import { defineComponent, h, onBeforeUnmount, type PropType, provide, type Ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { multiRouterContextActivateCallbacksKey } from '@/injectionSymbols'
import { multiRouterContext } from '@/symbols'
import { useMultiRouter } from '@/composables/useMultiRouter'

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
    default: {
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

    manager.register(props.type, props.name, {
      location: props.location,
      initialLocation: props.initialLocation,
      historyEnabled: props.historyEnabled,
      default: props.default,
    })

    provide(multiRouterContext, props.name)

    withContextActivateCallbacks(props.name, activeContextKey)

    // Watch router navigation and emit location changes for v-model:location support.
    // If location prop was passed as an object, emit the resolved route object to match the format.
    const useObjectEmit = typeof props.location === 'object' && props.location !== null
    const router = manager.getRouter(props.name)
    router.afterEach((to) => {
      emit('update:location', useObjectEmit ? to : to.fullPath)
    })

    onBeforeUnmount(() => {
      manager.unregister(props.name)
    })

    if (!props.activator) {
      return () => slots.default?.()
    }

    const onActivate = (e: MouseEvent) => {
      e.stopPropagation()
      let shouldActivate = true

      const target = e.target as HTMLElement | null

      if (props.preventClass && target?.closest('.' + props.preventClass)) {
        shouldActivate = false
      }

      if (shouldActivate) {
        if (manager.setActive(props.name, true)) {
          console.debug('[MultiRouterContext] activated', props.name)
        }
      }
    }

    return () => {
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
     * Whether this context should be activated by default if no prior active context exists.
     * Only one context should have this set to true.
     * @default false
     */
    default: {
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
          default: props.default,
          activator: props.activator,
          preventClass: props.preventClass,
          'onUpdate:location': onUpdateLocation,
        },
        slots.default,
      )
  },
})
</script>
