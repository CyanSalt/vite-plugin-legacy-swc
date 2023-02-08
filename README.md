# vite-plugin-legacy-swc

Provides legacy browsers support for the production build with [SWC](https://github.com/swc-project/swc).

This package is intended to replace [`@vitejs/plugin-legacy`](https://www.npmjs.com/package/@vitejs/plugin-legacy) in performance-sensitive situations. It is basically an implementation of [vitejs/vite#4105](https://github.com/vitejs/vite/pull/4105).

**WARNING: This package is not yet stable. Please take special care before using it in a production environment.**

---

Vite's default browser support baseline is [Native ESM](https://caniuse.com/es6-module), [native ESM dynamic import](https://caniuse.com/es6-module-dynamic-import), and [`import.meta`](https://caniuse.com/mdn-javascript_operators_import_meta). This plugin provides support for legacy browsers that do not support those features when building for production.

By default, this plugin will:

- Generate a corresponding legacy chunk for every chunk in the final bundle, transformed with [@swc/core](https://swc.rs/docs/configuration/supported-browsers) and emitted as [SystemJS modules](https://github.com/systemjs/systemjs) (code splitting is still supported!).

- Generate a polyfill chunk including SystemJS runtime, and any necessary polyfills determined by specified browser targets and **actual usage** in the bundle.

- Inject `<script nomodule>` tags into generated HTML to conditionally load the polyfills and legacy bundle only in browsers without widely-available features support.

- Inject the `import.meta.env.LEGACY` env variable, which will only be `true` in the legacy production build, and `false` in all other cases.

## Usage

```js
// vite.config.js
import legacy from 'vite-plugin-legacy-swc'

export default {
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
}
```

## Options

### `targets`

- **Type:** `string | string[] | { [key: string]: string }`
- **Default:** [`'last 2 versions and not dead, > 0.3%, Firefox ESR'`](https://browsersl.ist/#q=last+2+versions+and+not+dead%2C+%3E+0.3%25%2C+Firefox+ESR)

  If explicitly set, it's passed on to [`@swc/core`](https://swc.rs/docs/configuration/supported-browsers#targets).

  The query is also [Browserslist compatible](https://github.com/browserslist/browserslist). See [Browserslist Best Practices](https://github.com/browserslist/browserslist#best-practices) for more details.

### `polyfills`

- **Type:** `boolean | string[]`
- **Default:** `true`

  By default, a polyfills chunk is generated based on the target browser ranges and actual usage in the final bundle (detected via `@swc/core`'s `mode: 'usage'`).

  Set to a list of strings to explicitly control which polyfills to include. See [Polyfill Specifiers](#polyfill-specifiers) for details.

  Set to `false` to avoid generating polyfills and handle it yourself (will still generate legacy chunks with syntax transformations).

### `additionalLegacyPolyfills`

- **Type:** `string[]`

  Add custom imports to the legacy polyfills chunk. Since the usage-based polyfill detection only covers ES language features, it may be necessary to manually specify additional DOM API polyfills using this option.

  Note: if additional polyfills are needed for both the modern and legacy chunks, they can simply be imported in the application source code.

### `ignoreBrowserslistConfig`

- **Type:** `boolean`
- **Default:** `false`

  The legacy plugin automatically detects [`browserslist` config sources](https://github.com/browserslist/browserslist#browserslist-):

  - `browserslist` field in `package.json`
  - `.browserslistrc` file in cwd.

  Set to `false` to ignore these sources.

### `modernPolyfills`

- **Type:** `boolean | string[]`
- **Default:** `false`

  Defaults to `false`. Enabling this option will generate a separate polyfills chunk for the modern build (targeting browsers with [native ESM support](https://caniuse.com/es6-module)).

  Set to a list of strings to explicitly control which polyfills to include. See [Polyfill Specifiers](#polyfill-specifiers) for details.

  Note it is **not recommended** to use the `true` value (which uses auto-detection) because `core-js@3` is very aggressive in polyfill inclusions due to all the bleeding edge features it supports. Even when targeting native ESM support, it injects 15kb of polyfills!

  If you don't have hard reliance on bleeding edge runtime features, it is not that hard to avoid having to use polyfills in the modern build altogether. Alternatively, consider using an on-demand service like [Polyfill.io](https://polyfill.io/v3/) to only inject necessary polyfills based on actual browser user-agents (most modern browsers will need nothing!).

### `renderLegacyChunks`

- **Type:** `boolean`
- **Default:** `true`

  Set to `false` to disable legacy chunks. This is only useful if you are using `modernPolyfills`, which essentially allows you to use this plugin for injecting polyfills to the modern build only:

  ```js
  import legacy from 'vite-plugin-legacy-swc'

  export default {
    plugins: [
      legacy({
        modernPolyfills: [
          /* ... */
        ],
        renderLegacyChunks: false,
      }),
    ],
  }
  ```

### `externalSystemJS`

- **Type:** `boolean`
- **Default:** `false`

  Defaults to `false`. Enabling this option will exclude `systemjs/dist/s.min.js` inside polyfills-legacy chunk.

## Browsers that supports ESM but does not support widely-available features

The legacy plugin offers a way to use widely-available features natively in the modern build, while falling back to the legacy build in browsers with native ESM but without those features supported (e.g. Legacy Edge). This feature works by injecting a runtime check and loading the legacy bundle with SystemJs runtime if needed. There are the following drawbacks:

- Modern bundle is downloaded in all ESM browsers
- Modern bundle throws `SyntaxError` in browsers without those features support

The following syntax are considered as widely-available:

- dynamic import
- `import.meta`
- async generator

## Polyfill Specifiers

Polyfill specifier strings for `polyfills` and `modernPolyfills` can be either of the following:

- Any [`core-js` 3 sub import paths](https://unpkg.com/browse/core-js@latest/) - e.g. `es/map` will import `core-js/es/map`

- Any [individual `core-js` 3 modules](https://unpkg.com/browse/core-js@latest/modules/) - e.g. `es.array.iterator` will import `core-js/modules/es.array.iterator.js`

**Example**

```js
import legacy from 'vite-plugin-legacy-swc'

export default {
  plugins: [
    legacy({
      polyfills: ['es.promise.finally', 'es/map', 'es/set'],
      modernPolyfills: ['es.promise.finally'],
    }),
  ],
}
```

## Content Security Policy

The legacy plugin requires inline scripts for [Safari 10.1 `nomodule` fix](https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc), SystemJS initialization, and dynamic import fallback. If you have a strict CSP policy requirement, you will need to [add the corresponding hashes to your `script-src` list](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script):

- `sha256-MS6/3FCg4WjP9gwgaBGwLpRCY6fZBgwmhVCdrPrNf3E=`
- `sha256-tQjf8gvb2ROOMapIxFvFAYBeUJ0v1HCbOcSmDNXGtDo=`
- `sha256-BoFUHKsYhJ9tbsHugtNQCmnkBbZ11pcW6kZguu+T+EU=`
- `sha256-A18HC3jLpyEc9B8oyxq/NBFCyFBJFSsRLt0gmT9kft8=`

<!--
Run `node --input-type=module -e "import {cspHashes} from 'vite-plugin-legacy-swc'; console.log(cspHashes.map(h => 'sha256-'+h))"` to retrieve the value.
-->

These values (without the `sha256-` prefix) can also be retrieved via

```js
import { cspHashes } from 'vite-plugin-legacy-swc'
```

When using the `regenerator-runtime` polyfill, it will attempt to use the `globalThis` object to register itself. If `globalThis` is not available (it is [fairly new](https://caniuse.com/?search=globalThis) and not widely supported, including IE 11), it attempts to perform dynamic `Function(...)` call which violates the CSP. To avoid dynamic `eval` in the absence of `globalThis` consider adding `core-js/proposals/global-this` to `additionalLegacyPolyfills` to define it.

## References

- [Vue CLI modern mode](https://cli.vuejs.org/guide/browser-compatibility.html#modern-mode)
- [Using Native JavaScript Modules in Production Today](https://philipwalton.com/articles/using-native-javascript-modules-in-production-today/)
- [rollup-native-modules-boilerplate](https://github.com/philipwalton/rollup-native-modules-boilerplate)
