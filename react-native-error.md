› Scan the QR code above to open in Expo Go.
› Metro: exp://192.168.0.136:8081
› Web: http://localhost:8081

› Using Expo Go
› Press s │ switch to development build

› Press a │ open Android
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› shift+m │ more tools
› Press o │ open project code in your editor

› Press ? │ show all commands

Logs for your project will appear below. Press Ctrl+C to exit.
Web Bundled 23998ms node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/entry.js (2602 modules)
Web Bundled 3066ms node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/entry.js (1 module)
λ Bundled 24430ms node_modules/.bun/@expo+router-server@57.0.10+c8068cbb06d5c9f1/node_modules/@expo/router-server/node/render.js (2681 modules)
λ Bundled 3493ms node_modules/.bun/@expo+router-server@57.0.10+c8068cbb06d5c9f1/node_modules/@expo/router-server/node/render.js (1 module)
λ  WARN  [expo-notifications] Listening to push token changes is not yet fully supported on web. Adding a listener will have no effect.
λ  WARN  props.pointerEvents is deprecated. Use style.pointerEvents
λ  WARN  [expo-notifications] Listening to push token changes is not yet fully supported on web. Adding a listener will have no effect.
λ  WARN  props.pointerEvents is deprecated. Use style.pointerEvents
Web Bundled 9893ms node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/entry.js (2607 modules)
Web  INFO  %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
Web  LOG  Running application "main" with appParams:
 {"hydrate": undefined, "rootTag": "#root"}
Development-level warnings: ON.
Performance optimizations: OFF.
Web  WARN  [expo-notifications] Listening to push token changes is not yet fully supported on web. Adding a listener will have no effect.
Web  WARN  props.pointerEvents is deprecated. Use style.pointerEvents
Web  INFO  HeroUI Native Styling Principles
• className: this is your go-to styling solution. Use Tailwind CSS classes via className prop on all components.
• StyleSheet precedence: The style prop (StyleSheet API) has precedence over className when both are provided. This allows you to override Tailwind classes when needed.
• Animated styles: Some style properties are animated using react-native-reanimated and have precedence over className. To identify which styles are animated:
  - Hover over className in your IDE - TypeScript definitions show which properties are occupied by animated styles
  - Check component documentation - Each component page includes a link to the component's style source
• If styles are occupied by animation, modify them via the animation prop on components that support it.
• To deactivate animated style completely and apply your own styles, use isAnimatedStyleActive prop.
💡 To disable this message, set config.devInfo.stylingPrinciples to false
Web  WARN  [Reanimated] Selected easing is not currently supported on web. Using linear easing instead.
Web  WARN  [Reanimated] Selected easing is not currently supported on web. Using linear easing instead.
Web  WARN  [Reanimated] Selected easing is not currently supported on web. Using linear easing instead.
Web  WARN  [Reanimated] Selected easing is not currently supported on web. Using linear easing instead.
Web  ERROR  The action 'GO_BACK' was not handled by any navigator.

Is there any screen to go back to?

This is a development-only warning and won't be shown in production.

Code: setupHMR.ts
  79 | function captureCurrentStack() {
  80 |   // If you're reading this, look deeper into the call stack to find the actual error source.
> 81 |   return new NamelessError().stack;
     |          ^
  82 | }
  83 |
Call Stack
  captureCurrentStack (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:81:10)
  addErrorStacks (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:59:19)
  console.level (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:22:48)
  consoleErrorMiddleware (node_modules/.bun/@expo+log-box@57.0.4+fc9872531f105734/node_modules/@expo/log-box/src/LogBox.ts:101:23)
  console.error (node_modules/.bun/@expo+log-box@57.0.4+fc9872531f105734/node_modules/@expo/log-box/src/LogBox.ts:33:25)
  onUnhandledAction (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:183:17)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useNavigationBuilder.js:611:32)
  latestCallback (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/utils/useLatestCallback.js:52:28)
  dispatch (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useNavigationHelpers.js:57:34)
  listeners.focus._$argument_0 (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/BaseNavigationContainer.js:120:59)
  listener (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useFocusedListenersChildrenAdapter.js:54:45)
  listener (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useFocusedListenersChildrenAdapter.js:49:45)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/BaseNavigationContainer.js:120:31)
  latestCallback (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/utils/useLatestCallback.js:52:28)
  exports.routingQueue.run (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/global-state/routingQueue.js:40:33)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/imperative-api.js:12:32)
  callCreate.react_stack_bottom_frame (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:25989:20)
  runWithFiberInDEV (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:871:30)
  commitHookEffectListMount (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:13249:29)
  commitHookPassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:13336:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15484:13)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15718:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15718:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15504:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)

Code: ExpoRoot.js
(/home/chrisdev/Desktop/dingdongdash/node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:135:120)

... 134 |     }
> 135 |     return ((0, jsx_runtime_1.jsx)(storeContext_1.StoreCont...
                                                                                         ^
(error truncated)
Call Stack
  ContextNavigator (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:135:121)
  ExpoRoot (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:85:33)
  App (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/qualified-entry.js:20:91)
  WithDevTools (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/launch/withDevTools.web.tsx:11:9)
Web  ERROR  The action 'GO_BACK' was not handled by any navigator.

Is there any screen to go back to?

This is a development-only warning and won't be shown in production.

Code: setupHMR.ts
  79 | function captureCurrentStack() {
  80 |   // If you're reading this, look deeper into the call stack to find the actual error source.
> 81 |   return new NamelessError().stack;
     |          ^
  82 | }
  83 |
Call Stack
  captureCurrentStack (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:81:10)
  addErrorStacks (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:59:19)
  console.level (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:22:48)
  consoleErrorMiddleware (node_modules/.bun/@expo+log-box@57.0.4+fc9872531f105734/node_modules/@expo/log-box/src/LogBox.ts:101:23)
  console.error (node_modules/.bun/@expo+log-box@57.0.4+fc9872531f105734/node_modules/@expo/log-box/src/LogBox.ts:33:25)
  onUnhandledAction (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:183:17)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useNavigationBuilder.js:611:32)
  latestCallback (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/utils/useLatestCallback.js:52:28)
  dispatch (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useNavigationHelpers.js:57:34)
  listeners.focus._$argument_0 (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/BaseNavigationContainer.js:120:59)
  listener (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useFocusedListenersChildrenAdapter.js:54:45)
  listener (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useFocusedListenersChildrenAdapter.js:49:45)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/BaseNavigationContainer.js:120:31)
  latestCallback (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/utils/useLatestCallback.js:52:28)
  exports.routingQueue.run (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/global-state/routingQueue.js:40:33)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/imperative-api.js:12:32)
  callCreate.react_stack_bottom_frame (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:25989:20)
  runWithFiberInDEV (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:871:30)
  commitHookEffectListMount (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:13249:29)
  commitHookPassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:13336:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15484:13)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15718:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15718:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15504:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)

Code: ExpoRoot.js
(/home/chrisdev/Desktop/dingdongdash/node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:135:120)

... 134 |     }
> 135 |     return ((0, jsx_runtime_1.jsx)(storeContext_1.StoreCont...
                                                                                         ^
(error truncated)
Call Stack
  ContextNavigator (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:135:121)
  ExpoRoot (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:85:33)
  App (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/qualified-entry.js:20:91)
  WithDevTools (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/launch/withDevTools.web.tsx:11:9)
Web  ERROR  The action 'GO_BACK' was not handled by any navigator.

Is there any screen to go back to?

This is a development-only warning and won't be shown in production.

Code: setupHMR.ts
  79 | function captureCurrentStack() {
  80 |   // If you're reading this, look deeper into the call stack to find the actual error source.
> 81 |   return new NamelessError().stack;
     |          ^
  82 | }
  83 |
Call Stack
  captureCurrentStack (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:81:10)
  addErrorStacks (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:59:19)
  console.level (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/async-require/setupHMR.ts:22:48)
  consoleErrorMiddleware (node_modules/.bun/@expo+log-box@57.0.4+fc9872531f105734/node_modules/@expo/log-box/src/LogBox.ts:101:23)
  console.error (node_modules/.bun/@expo+log-box@57.0.4+fc9872531f105734/node_modules/@expo/log-box/src/LogBox.ts:33:25)
  onUnhandledAction (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:183:17)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useNavigationBuilder.js:611:32)
  latestCallback (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/utils/useLatestCallback.js:52:28)
  dispatch (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useNavigationHelpers.js:57:34)
  listeners.focus._$argument_0 (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/BaseNavigationContainer.js:120:59)
  listener (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useFocusedListenersChildrenAdapter.js:54:45)
  listener (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/useFocusedListenersChildrenAdapter.js:49:45)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/react-navigation/core/BaseNavigationContainer.js:120:31)
  latestCallback (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/utils/useLatestCallback.js:52:28)
  exports.routingQueue.run (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/global-state/routingQueue.js:40:33)
  <anonymous> (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/imperative-api.js:12:32)
  callCreate.react_stack_bottom_frame (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:25989:20)
  runWithFiberInDEV (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:871:30)
  commitHookEffectListMount (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:13249:29)
  commitHookPassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:13336:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15484:13)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15718:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15718:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15504:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)
  recursivelyTraversePassiveMountEffects (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15439:11)
  commitPassiveMountOnFiber (node_modules/.bun/react-dom@19.2.3+83d5fd7b249dbeef/node_modules/react-dom/cjs/react-dom-client.development.js:15476:11)

Code: ExpoRoot.js
(/home/chrisdev/Desktop/dingdongdash/node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:135:120)

... 134 |     }
> 135 |     return ((0, jsx_runtime_1.jsx)(storeContext_1.StoreCont...
                                                                                         ^
(error truncated)
Call Stack
  ContextNavigator (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:135:121)
  ExpoRoot (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/ExpoRoot.js:85:33)
  App (node_modules/.bun/expo-router@57.0.22+7341693bb48874d7/node_modules/expo-router/build/qualified-entry.js:20:91)
  WithDevTools (node_modules/.bun/expo@57.0.24+fc9872531f105734/node_modules/expo/src/launch/withDevTools.web.tsx:11:9)