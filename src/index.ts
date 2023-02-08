import { createHash } from 'crypto'
import path from 'path'
import type {
  EnvConfig,
  JsMinifyOptions,
  Options as SwcOptions,
  Plugin as SwcPlugin,
  Statement,
} from '@swc/core'
import browserslist from 'browserslist'
import MagicString from 'magic-string'
import colors from 'picocolors'
import type {
  NormalizedOutputOptions,
  OutputBundle,
  OutputOptions,
  PreRenderedChunk,
  RenderedChunk,
} from 'rollup'
import type {
  BuildOptions,
  HtmlTagDescriptor,
  Plugin,
  ResolvedConfig,
} from 'vite'
import { build, normalizePath } from 'vite'
import {
  detectModernBrowserCode,
  dynamicFallbackInlineCode,
  legacyEntryId,
  legacyPolyfillId,
  modernChunkLegacyGuard,
  safari10NoModuleFix,
  systemJSInlineCode,
} from './snippets'
import type { Options } from './types'

// lazy load swc since it's not used during dev
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let loadedSwc: typeof import('@swc/core') | undefined
async function loadSwc() {
  if (!loadedSwc) {
    loadedSwc = await import('@swc/core')
  }
  return loadedSwc
}

// The requested module 'browserslist' is a CommonJS module
// which may not support all module.exports as named exports
const { loadConfig: browserslistLoadConfig } = browserslist

// Duplicated from build.ts in Vite Core, at least while the feature is experimental
// We should later expose this helper for other plugins to use
function toOutputFilePathInHtml({
  filename,
  type,
  hostId,
  hostType,
  config,
  toRelative,
}: {
  filename: string,
  type: 'asset' | 'public',
  hostId: string,
  hostType: 'js' | 'css' | 'html',
  config: ResolvedConfig,
  toRelative: (filename: string, importer: string) => string,
}): string {
  const { renderBuiltUrl } = config.experimental
  let relative = config.base === '' || config.base === './'
  if (renderBuiltUrl) {
    const result = renderBuiltUrl(filename, {
      hostId,
      hostType,
      type,
      ssr: Boolean(config.build.ssr),
    })
    if (typeof result === 'object') {
      if (result.runtime) {
        throw new Error(
          `{ runtime: "${result.runtime}" } is not supported for assets in ${hostType} files: ${filename}`,
        )
      }
      if (typeof result.relative === 'boolean') {
        relative = result.relative
      }
    } else if (result) {
      return result
    }
  }
  if (relative && !config.build.ssr) {
    return toRelative(filename, hostId)
  } else {
    return config.base + filename
  }
}
function getBaseInHTML(urlRelativePath: string, config: ResolvedConfig) {
  // Prefer explicit URL if defined for linking to assets and public files from HTML,
  // even when base relative is specified
  return config.base === './' || config.base === ''
    ? path.posix.join(
      path.posix.relative(urlRelativePath, '').slice(0, -2),
      './',
    )
    : config.base
}

function toAssetPathFromHtml(
  filename: string,
  htmlPath: string,
  config: ResolvedConfig,
): string {
  const relativeUrlPath = normalizePath(path.relative(config.root, htmlPath))
  const toRelative = (filePath: string, hostId: string) =>
    getBaseInHTML(relativeUrlPath, config) + filePath
  return toOutputFilePathInHtml({
    filename,
    type: 'asset',
    hostId: htmlPath,
    hostType: 'html',
    config,
    toRelative,
  })
}

const legacyEnvVarMarker = `__VITE_IS_LEGACY__`

function viteLegacyPlugin(options: Options = {}): Plugin[] {
  let resolvedConfig: ResolvedConfig
  let targets: Options['targets']

  const genLegacy = options.renderLegacyChunks !== false

  const debugFlags = (process.env.DEBUG ?? '').split(',')
  const isDebug
    = debugFlags.includes('vite:*') || debugFlags.includes('vite:legacy')

  const facadeToLegacyChunkMap = new Map()
  const facadeToLegacyPolyfillMap = new Map()
  const facadeToModernPolyfillMap = new Map()
  const modernPolyfills = new Set<string>()
  const legacyPolyfills = new Set<string>()

  if (Array.isArray(options.modernPolyfills)) {
    options.modernPolyfills.forEach((i) => {
      modernPolyfills.add(
        i.includes('/') ? `core-js/${i}` : `core-js/modules/${i}.js`,
      )
    })
  }
  if (Array.isArray(options.polyfills)) {
    options.polyfills.forEach((i) => {
      if (i.startsWith(`regenerator`)) {
        legacyPolyfills.add(`regenerator-runtime/runtime.js`)
      } else {
        legacyPolyfills.add(
          i.includes('/') ? `core-js/${i}` : `core-js/modules/${i}.js`,
        )
      }
    })
  }
  if (Array.isArray(options.additionalLegacyPolyfills)) {
    options.additionalLegacyPolyfills.forEach((i) => {
      legacyPolyfills.add(i)
    })
  }

  let overriddenBuildTarget = false
  const legacyConfigPlugin: Plugin = {
    name: 'vite:legacy-config',

    config(config, env) {
      if (env.command === 'build') {
        if (!config.build) {
          config.build = {}
        }

        if (!config.build.cssTarget) {
          // Hint for esbuild that we are targeting legacy browsers when minifying CSS.
          // Full CSS compat table available at https://github.com/evanw/esbuild/blob/78e04680228cf989bdd7d471e02bbc2c8d345dc9/internal/compat/css_table.go
          // But note that only the `HexRGBA` feature affects the minify outcome.
          // HSL & rebeccapurple values will be minified away regardless the target.
          // So targeting `chrome61` suffices to fix the compatibility issue.
          config.build.cssTarget = 'chrome61'
        }

        if (genLegacy) {
          // Vite's default target browsers are **not** the same.
          // See https://github.com/vitejs/vite/pull/10052#issuecomment-1242076461
          overriddenBuildTarget = config.build.target !== undefined
          // browsers supporting ESM + dynamic import + import.meta + async generator
          config.build.target = [
            'es2020',
            'edge79',
            'firefox67',
            'chrome64',
            'safari12',
          ]
        }
      }

      return {
        define: {
          'import.meta.env.LEGACY':
            env.command === 'serve' || config.build?.ssr
              ? false
              : legacyEnvVarMarker,
        },
      }
    },
    configResolved(config) {
      if (overriddenBuildTarget) {
        config.logger.warn(
          colors.yellow(
            `plugin-legacy overrode 'build.target'. You should pass 'targets' as an option to this plugin with the list of legacy browsers to support instead.`,
          ),
        )
      }
    },
  }

  const legacyGenerateBundlePlugin: Plugin = {
    name: 'vite:legacy-generate-polyfill-chunk',
    apply: 'build',

    async generateBundle(opts, bundle) {
      if (resolvedConfig.build.ssr) {
        return
      }

      if (!isLegacyBundle(bundle, opts)) {
        if (!modernPolyfills.size) {
          return
        }
        if (isDebug) {
          console.log(
            `[vite-plugin-legacy-swc] modern polyfills:`,
            modernPolyfills,
          )
        }
        await buildPolyfillChunk({
          mode: resolvedConfig.mode,
          imports: modernPolyfills,
          bundle,
          facadeToChunkMap: facadeToModernPolyfillMap,
          buildOptions: resolvedConfig.build,
          format: 'es',
          rollupOutputOptions: opts,
          excludeSystemJS: true,
        })
        return
      }

      if (!genLegacy) {
        return
      }

      // legacy bundle
      if (legacyPolyfills.size) {
        // check if the target needs Promise polyfill because SystemJS relies on it
        // https://github.com/systemjs/systemjs#ie11-support
        await detectPolyfills(
          `Promise.resolve(); Promise.all();`,
          targets,
          legacyPolyfills,
        )

        if (isDebug) {
          console.log(
            `[vite-plugin-legacy-swc] legacy polyfills:`,
            legacyPolyfills,
          )
        }

        await buildPolyfillChunk({
          mode: resolvedConfig.mode,
          imports: legacyPolyfills,
          bundle,
          facadeToChunkMap: facadeToLegacyPolyfillMap,
          buildOptions: resolvedConfig.build,
          format: 'iife',
          rollupOutputOptions: opts,
          excludeSystemJS: options.externalSystemJS,
        })
      }
    },
  }

  const legacyPostPlugin: Plugin = {
    name: 'vite:legacy-post-process',
    enforce: 'post',
    apply: 'build',

    configResolved(config) {
      if (config.build.lib) {
        throw new Error('vite-plugin-legacy-swc does not support library mode.')
      }
      resolvedConfig = config

      if (!genLegacy || resolvedConfig.build.ssr) {
        return
      }

      targets
        = options.targets
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        || (
          options.ignoreBrowserslistConfig
            ? undefined
            : browserslistLoadConfig({ path: resolvedConfig.root })
        )
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        || 'last 2 versions and not dead, > 0.3%, Firefox ESR'
      if (isDebug) {
        console.log(`[vite-plugin-legacy-swc] targets:`, targets)
      }

      const getLegacyOutputFileName = (
        fileNames:
        | string
        | ((chunkInfo: PreRenderedChunk) => string)
        | undefined,
        defaultFileName = '[name]-legacy-[hash].js',
      ): string | ((chunkInfo: PreRenderedChunk) => string) => {
        if (!fileNames) {
          return path.posix.join(resolvedConfig.build.assetsDir, defaultFileName)
        }

        return (chunkInfo) => {
          let fileName
            = typeof fileNames === 'function' ? fileNames(chunkInfo) : fileNames

          if (fileName.includes('[name]')) {
            // [name]-[hash].[format] -> [name]-legacy-[hash].[format]
            fileName = fileName.replace('[name]', '[name]-legacy')
          } else {
            // entry.js -> entry-legacy.js
            fileName = fileName.replace(/(.+)\.(.+)/, '$1-legacy.$2')
          }

          return fileName
        }
      }

      const createLegacyOutput = (
        output: OutputOptions = {},
      ): OutputOptions => {
        return {
          ...output,
          format: 'system',
          entryFileNames: getLegacyOutputFileName(output.entryFileNames),
          chunkFileNames: getLegacyOutputFileName(output.chunkFileNames),
        }
      }

      const { rollupOptions } = resolvedConfig.build
      const { output } = rollupOptions
      if (Array.isArray(output)) {
        rollupOptions.output = [...output.map(createLegacyOutput), ...output]
      } else {
        rollupOptions.output = [createLegacyOutput(output), output ?? {}]
      }
    },

    async renderChunk(raw, chunk, opts) {
      if (resolvedConfig.build.ssr) {
        return null
      }

      if (!isLegacyChunk(chunk, opts)) {
        if (
          options.modernPolyfills
          && !Array.isArray(options.modernPolyfills)
        ) {
          // analyze and record modern polyfills
          await detectPolyfills(raw, 'supports es6-module', modernPolyfills)
        }

        const ms = new MagicString(raw)

        if (genLegacy && chunk.isEntry) {
          // append this code to avoid modern chunks running on legacy targeted browsers
          ms.prepend(modernChunkLegacyGuard)
        }

        if (raw.includes(legacyEnvVarMarker)) {
          const re = new RegExp(legacyEnvVarMarker, 'g')
          let match
          while ((match = re.exec(raw))) {
            ms.overwrite(
              match.index,
              match.index + legacyEnvVarMarker.length,
              `false`,
            )
          }
        }

        if (resolvedConfig.build.sourcemap) {
          return {
            code: ms.toString(),
            map: ms.generateMap({ hires: true }),
          }
        }
        return {
          code: ms.toString(),
        }
      }

      if (!genLegacy) {
        return null
      }

      // @ts-expect-error avoid esbuild transform on legacy chunks since it produces
      // legacy-unsafe code - e.g. rewriting object properties into shorthands
      opts.__vite_skip_esbuild__ = true

      // @ts-expect-error In the `generateBundle` hook,
      // we'll delete the assets from the legacy bundle to avoid emitting duplicate assets.
      // But that's still a waste of computing resource.
      // So we add this flag to avoid emitting the asset in the first place whenever possible.
      opts.__vite_skip_asset_emit__ = true

      // avoid emitting assets for legacy bundle
      const needPolyfills
        = options.polyfills !== false && !Array.isArray(options.polyfills)

      // transform the legacy chunk with @swc/core
      const sourceMaps = Boolean(resolvedConfig.build.sourcemap)
      const swc = await loadSwc()
      const swcOptions: SwcOptions = {
        swcrc: false,
        configFile: false,
        sourceMaps,
        env: createSwcEnvOptions(targets, {
          needPolyfills,
        }),
        jsc: {
          transform: {
            optimizer: {
              globals: {
                vars: { [legacyEnvVarMarker]: 'true' },
              },
            },
          },
          minify: {
            compress: {
              // Different defaults between terser and swc
              dead_code: true,
              keep_fargs: true,
              passes: 1,
            },
            mangle: true,
            safari10: true,
            ...resolvedConfig.build.terserOptions as JsMinifyOptions,
            sourceMap: Boolean(opts.sourcemap),
            module: opts.format.startsWith('es'),
            toplevel: opts.format === 'cjs',
          },
        },
      }
      const transformResult = await swc.transform(raw, {
        ...swcOptions,
        inputSourceMap: undefined, // sourceMaps ? chunk.map : undefined, `.map` TODO: moved to OutputChunk?
      })
      const plugin = swc.plugins([
        recordAndRemovePolyfillSwcPlugin(legacyPolyfills),
        wrapIIFESwcPlugin(),
      ])
      const ast = await swc.parse(transformResult.code)
      const result = await swc.print(plugin(ast), {
        ...swcOptions,
        inputSourceMap: transformResult.map,
        minify: Boolean(resolvedConfig.build.minify),
      })

      return result
    },

    transformIndexHtml(html, { chunk }) {
      if (resolvedConfig.build.ssr) return
      if (!chunk) return
      if (chunk.fileName.includes('-legacy')) {
        // The legacy bundle is built first, and its index.html isn't actually
        // emitted. Here we simply record its corresponding legacy chunk.
        facadeToLegacyChunkMap.set(chunk.facadeModuleId, chunk.fileName)
        return
      }

      const tags: HtmlTagDescriptor[] = []
      const htmlFilename = chunk.facadeModuleId?.replace(/\?.*$/, '')

      // 1. inject modern polyfills
      const modernPolyfillFilename = facadeToModernPolyfillMap.get(
        chunk.facadeModuleId,
      )

      if (modernPolyfillFilename) {
        tags.push({
          tag: 'script',
          attrs: {
            type: 'module',
            crossorigin: true,
            src: toAssetPathFromHtml(
              modernPolyfillFilename,
              chunk.facadeModuleId!,
              resolvedConfig,
            ),
          },
        })
      } else if (modernPolyfills.size) {
        throw new Error(
          `No corresponding modern polyfill chunk found for ${htmlFilename}`,
        )
      }

      if (!genLegacy) {
        return { html, tags }
      }

      // 2. inject Safari 10 nomodule fix
      tags.push({
        tag: 'script',
        attrs: { nomodule: true },
        children: safari10NoModuleFix,
        injectTo: 'body',
      })

      // 3. inject legacy polyfills
      const legacyPolyfillFilename = facadeToLegacyPolyfillMap.get(
        chunk.facadeModuleId,
      )
      if (legacyPolyfillFilename) {
        tags.push({
          tag: 'script',
          attrs: {
            nomodule: true,
            crossorigin: true,
            id: legacyPolyfillId,
            src: toAssetPathFromHtml(
              legacyPolyfillFilename,
              chunk.facadeModuleId!,
              resolvedConfig,
            ),
          },
          injectTo: 'body',
        })
      } else if (legacyPolyfills.size) {
        throw new Error(
          `No corresponding legacy polyfill chunk found for ${htmlFilename}`,
        )
      }

      // 4. inject legacy entry
      const legacyEntryFilename = facadeToLegacyChunkMap.get(
        chunk.facadeModuleId,
      )
      if (legacyEntryFilename) {
        // `assets/foo.js` means importing "named register" in SystemJS
        tags.push({
          tag: 'script',
          attrs: {
            nomodule: true,
            crossorigin: true,
            // we set the entry path on the element as an attribute so that the
            // script content will stay consistent - which allows using a constant
            // hash value for CSP.
            id: legacyEntryId,
            'data-src': toAssetPathFromHtml(
              legacyEntryFilename,
              chunk.facadeModuleId!,
              resolvedConfig,
            ),
          },
          children: systemJSInlineCode,
          injectTo: 'body',
        })
      } else {
        throw new Error(
          `No corresponding legacy entry chunk found for ${htmlFilename}`,
        )
      }

      // 5. inject dynamic import fallback entry
      if (/* genLegacy && */legacyPolyfillFilename && legacyEntryFilename) {
        tags.push({
          tag: 'script',
          attrs: { type: 'module' },
          children: detectModernBrowserCode,
          injectTo: 'head',
        })
        tags.push({
          tag: 'script',
          attrs: { type: 'module' },
          children: dynamicFallbackInlineCode,
          injectTo: 'head',
        })
      }

      return {
        html,
        tags,
      }
    },

    generateBundle(opts, bundle) {
      if (resolvedConfig.build.ssr) {
        return
      }

      if (isLegacyBundle(bundle, opts)) {
        // avoid emitting duplicate assets
        for (const name of Object.keys(bundle)) {
          if (bundle[name].type === 'asset' && !/.+\.map$/.test(name)) {
            delete bundle[name]
          }
        }
      }
    },
  }

  return [legacyConfigPlugin, legacyGenerateBundlePlugin, legacyPostPlugin]
}

export async function detectPolyfills(
  code: string,
  targets: any,
  list: Set<string>,
): Promise<void> {
  const swc = await loadSwc()
  const result = await swc.transform(code, {
    swcrc: false,
    configFile: false,
    env: createSwcEnvOptions(targets),
  })
  const ast = await swc.parse(result.code)
  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      const source = node.source.value
      if (
        source.startsWith('core-js/')
        || source.startsWith('regenerator-runtime/')
      ) {
        list.add(source)
      }
    }
  }
}

function createSwcEnvOptions(
  targets: any,
  {
    needPolyfills = true,
  }: { needPolyfills?: boolean } = {},
): EnvConfig {
  return {
    targets,
    loose: false,
    mode: needPolyfills ? 'usage' : undefined,
    coreJs: needPolyfills
      ? require('core-js/package.json').version
      : undefined,
    shippedProposals: true,
  }
}

const polyfillId = '\0vite/legacy-polyfills'

async function buildPolyfillChunk({
  mode,
  imports,
  bundle,
  facadeToChunkMap,
  buildOptions,
  format,
  rollupOutputOptions,
  excludeSystemJS,
}: {
  mode: string,
  imports: Set<string>,
  bundle: OutputBundle,
  facadeToChunkMap: Map<string, string>,
  buildOptions: BuildOptions,
  format: 'iife' | 'es',
  rollupOutputOptions: NormalizedOutputOptions,
  excludeSystemJS?: boolean,
}) {
  let { assetsDir } = buildOptions
  const res = await build({
    mode,
    // so that everything is resolved from here
    root: path.dirname(__filename),
    configFile: false,
    logLevel: 'error',
    plugins: [polyfillsPlugin(imports, excludeSystemJS)],
    build: {
      write: false,
      minify: false,
      assetsDir,
      rollupOptions: {
        input: {
          polyfills: polyfillId,
        },
        output: {
          format,
          entryFileNames: rollupOutputOptions.entryFileNames,
        },
      },
    },
    // Don't run esbuild for transpilation or minification
    // because we don't want to transpile code.
    esbuild: false,
    optimizeDeps: {
      esbuildOptions: {
        // If a value above 'es5' is set, esbuild injects helper functions which uses es2015 features.
        // This limits the input code not to include es2015+ codes.
        // But core-js is the only dependency which includes commonjs code
        // and core-js doesn't include es2015+ codes.
        target: 'es5',
      },
    },
  })
  const rollupOutput = Array.isArray(res) ? res[0] : res
  if (!('output' in rollupOutput)) return
  const polyfillChunk = rollupOutput.output[0]

  // associate the polyfill chunk to every entry chunk so that we can retrieve
  // the polyfill filename in index html transform
  for (const key of Object.keys(bundle)) {
    const chunk = bundle[key]
    if (chunk.type === 'chunk' && chunk.facadeModuleId) {
      facadeToChunkMap.set(chunk.facadeModuleId, polyfillChunk.fileName)
    }
  }

  // add the chunk to the bundle
  bundle[polyfillChunk.fileName] = polyfillChunk
}

function polyfillsPlugin(
  imports: Set<string>,
  excludeSystemJS?: boolean,
): Plugin {
  return {
    name: 'vite:legacy-polyfills',
    resolveId(id) {
      if (id === polyfillId) {
        return id
      }
    },
    load(id) {
      if (id === polyfillId) {
        return (
          [...imports].map((i) => `import ${JSON.stringify(i)};`).join('')
          + (excludeSystemJS ? '' : `import "systemjs/dist/s.min.js";`)
        )
      }
    },
  }
}

function isLegacyChunk(chunk: RenderedChunk, options: NormalizedOutputOptions) {
  return options.format === 'system' && chunk.fileName.includes('-legacy')
}

function isLegacyBundle(
  bundle: OutputBundle,
  options: NormalizedOutputOptions,
) {
  if (options.format === 'system') {
    const entryChunk = Object.values(bundle).find(
      (output) => output.type === 'chunk' && output.isEntry,
    )

    return Boolean(entryChunk?.fileName.includes('-legacy'))
  }

  return false
}

function recordAndRemovePolyfillSwcPlugin(
  polyfills: Set<string>,
): SwcPlugin {
  return program => {
    program.body = program.body.filter((node) => {
      if (node.type === 'ImportDeclaration') {
        polyfills.add(node.source.value)
        return false
      }

      if (node.type === 'VariableDeclaration') {
        node.declarations = node.declarations.filter((declaration) => {
          if (
            declaration.init
            && declaration.init.type === 'CallExpression'
            && declaration.init.callee.type === 'Identifier'
            && declaration.init.callee.value === 'require'
            && declaration.init.arguments[0].expression.type === 'StringLiteral'
          ) {
            polyfills.add(declaration.init.arguments[0].expression.value)
            return false
          }

          return true
        })

        if (node.declarations.length === 0) {
          return false
        }
      }

      return true
    })
    return program
  }
}

function wrapIIFESwcPlugin(): SwcPlugin {
  return program => {
    program.body = [
      {
        type: 'ExpressionStatement',
        span: { start: 0, end: 0, ctxt: 0 },
        expression: {
          type: 'CallExpression',
          span: { start: 0, end: 0, ctxt: 0 },
          callee: {
            type: 'ParenthesisExpression',
            span: { start: 0, end: 0, ctxt: 0 },
            expression: {
              type: 'FunctionExpression',
              params: [],
              decorators: [],
              span: { start: 0, end: 0, ctxt: 0 },
              body: {
                type: 'BlockStatement',
                span: { start: 0, end: 0, ctxt: 0 },
                stmts: program.body as Statement[],
              },
              generator: false,
              async: false,
            },
          },
          arguments: [],
        },
      },
    ]
    return program
  }
}

export const cspHashes = [
  safari10NoModuleFix,
  systemJSInlineCode,
  detectModernBrowserCode,
  dynamicFallbackInlineCode,
].map((i) => createHash('sha256').update(i).digest('base64'))

export default viteLegacyPlugin
