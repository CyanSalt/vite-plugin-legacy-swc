

## [1.2.2](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v1.2.1...v1.2.2) (2024-12-20)

### Bug Fixes

* generate sourcemap for polyfill chunks, https://github.com/vitejs/vite/commit/f311ff3c2b19636457c3023095ef32ab9a96b84a[#diff](https://github.com/CyanSalt/vite-plugin-legacy-swc/issues/diff)-84204d8a3f75f1603eb03a8aac4a229855fecee87636307619b9f499041466f8L144 ([a78574a](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/a78574a5556de7da3e0454f20d8142c8298a1c3e)), closes [/github.com/vitejs/vite/commit/f311ff3c2b19636457c3023095ef32ab9a96b84a#diff-84204d8a3f75f1603eb03a8aac4a229855fecee87636307619b9f499041466f8L144](https://github.com/CyanSalt//github.com/vitejs/vite/commit/f311ff3c2b19636457c3023095ef32ab9a96b84a/issues/diff-84204d8a3f75f1603eb03a8aac4a229855fecee87636307619b9f499041466f8L144)
* log label ([4e0687e](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/4e0687ef12dc9519dcb826daa466e1923094d444))

### Performance Improvements

* use crypto.hash when available, https://github.com/vitejs/vite/commit/2a148844cf2382a5377b75066351f00207843352[#diff](https://github.com/CyanSalt/vite-plugin-legacy-swc/issues/diff)-ab75c34fa418085884af97e74c9166830b9f0a3456f9d3336e0c075d6ae9b05aR974 ([be5b068](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/be5b068b39b16a3fdd55a0ce10754445e5e3c165)), closes [/github.com/vitejs/vite/commit/2a148844cf2382a5377b75066351f00207843352#diff-ab75c34fa418085884af97e74c9166830b9f0a3456f9d3336e0c075d6ae9b05aR974](https://github.com/CyanSalt//github.com/vitejs/vite/commit/2a148844cf2382a5377b75066351f00207843352/issues/diff-ab75c34fa418085884af97e74c9166830b9f0a3456f9d3336e0c075d6ae9b05aR974)

## [1.2.1](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v1.2.0...v1.2.1) (2024-08-14)


### Bug Fixes

* add ctxt on nodes ([bd21942](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/bd2194294a7daa81e58dae1cd99458527717928f))

## [1.2.0](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v1.1.0...v1.2.0) (2024-05-31)


### Features

* support `additionalModernPolyfills` ([4e880b3](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/4e880b3d7819a36f045019350345fb9b6ef3e6af))


### Bug Fixes

* group discovered polyfills by output ([98cd27f](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/98cd27f82038d7859eee9fb6a41c4f33367a9258))
* improve deterministic polyfills discovery ([f28f633](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/f28f633173b6c006055f8aa0484b3ae49157f8b6))

## [1.1.0](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v1.0.0...v1.1.0) (2024-03-19)


### Features

* align with @vitejs/plugin-legacy ([95579ef](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/95579ef5305f793b140014680989ccc61c3b14b2))

## [1.0.0](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.5.1...v1.0.0) (2023-12-08)


### Features

* build file name optimization ([8e96295](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/8e96295c8a7fc4f96d6979790765012f7850f7d9))


### Bug Fixes

* perserve async generator function invocation ([fb61e33](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/fb61e337971c7dac2ee963cff7fb7aeaabbf3759))

## [0.5.1](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.5.0...v0.5.1) (2023-10-18)


### Bug Fixes

* lower targets for swc ([29f3008](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/29f30080258a19f7840175f21efb816176fd770f))

## [0.5.0](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.4.2...v0.5.0) (2023-10-12)


### Features

* sync implementations from @vitejs/plugin-legacy ([879d384](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/879d384f896a98b4e0f834f3f9fc3a636d42f472))

### [0.4.2](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.4.1...v0.4.2) (2023-10-07)


### Bug Fixes

* broken build when renderModernChunks=false & polyfills=false ([f32154f](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/f32154f317e3157a0f0e92f336679c586345ce99))

### [0.4.1](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.4.0...v0.4.1) (2023-09-20)


### Bug Fixes

* type exports ([11520ca](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/11520ca71b912fc91794f14342f599f2ea26951c))

## [0.4.0](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.3.1...v0.4.0) (2023-09-10)


### Features

* add option to output only legacy builds ([1b346d5](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/1b346d54ad69cee298dde76be7241038cb94594e))

### [0.3.1](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.3.0...v0.3.1) (2023-05-08)


### Bug Fixes

* minify polyfill chunks ([7e5e74d](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/7e5e74dc3c32cd8fcda266d8098cf80d3c5ee3ec))
* severity vulnerability ([08420af](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/08420af503d06a2eda0f450ad89143b2dda8e5dd))

## [0.3.0](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.2.3...v0.3.0) (2023-02-17)


### Features

* support native esm ([05732ef](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/05732ef8e41d0dc70b0c87efb703304c7bf31462))

### [0.2.3](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.2.2...v0.2.3) (2023-02-15)


### Bug Fixes

* disable minification if minify is false ([c7bca76](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/c7bca76adf04ca64fe5908952aea84179b3bf660))

### [0.2.2](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.2.1...v0.2.2) (2023-02-09)


### Bug Fixes

* remove terser as peer deps ([ca0bd7d](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/ca0bd7dbd9e0851de9d81206989eac3830478e77))

### [0.2.1](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.2.0...v0.2.1) (2023-02-09)


### Bug Fixes

* export options type ([5908dbf](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/5908dbf7988d105c78d34b34e1fabb74bf2b6070))

## [0.2.0](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.1.2...v0.2.0) (2023-02-08)


### Features

* minify with swc instead of terser ([72c3791](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/72c3791fa4d05e189e660842d8ab0f3898766231))

### [0.1.2](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.1.1...v0.1.2) (2023-02-08)


### Bug Fixes

* apply swc plugins after transforming ([2e4e138](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/2e4e13851f1ceb3672125c09502750988fe30033))
* browserslist-rs compat ([d8aff61](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/d8aff618cf162f5b95562a1169b748fad14a6470))
* missing deps ([a600f7c](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/a600f7c3f1b7e8711d330d32cab55bff8d9d2c01))

### [0.1.1](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v0.1.0...v0.1.1) (2023-02-08)


### Bug Fixes

* core-js version ([e6fed36](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/e6fed36b25f95b88f7fa84493854eac98ef89b88))
* support `ignoreBrowserslistConfig` ([747d4cf](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/747d4cfa0a90aab1c1590e0ca0d843bb2adfb06b))
* swc error ([3422f17](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/3422f173fa64dbb4d15a60d89710086a68f82f47))

## 0.1.0 (2023-02-08)


### Features

* init ([a4e3cda](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/a4e3cdace03d082f006c589ad758018aa05d29d1))
