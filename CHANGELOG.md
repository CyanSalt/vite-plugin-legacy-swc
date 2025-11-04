

## [2.0.1](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v2.0.0...v2.0.1) (2025-11-04)

### Bug Fixes

* `modernTargets` should set `build.target` ([c0dd049](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/c0dd049aa6123657a31437a1394b7032739c99e3))

## [2.0.0](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v1.2.3...v2.0.0) (2025-07-23)

### ⚠ BREAKING CHANGES

* esm only
* remove `location.protocol!="file:"` condition for modern android webview, https://github.com/vitejs/vite/pull/20179

### Features

* add `assumptions` option, https://github.com/vitejs/vite/pull/19719 ([9925225](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/9925225fb9b7d2e6aa9e8e6e03ea4e77371690fe))
* add `sourcemapBaseUrl` support, https://github.com/vitejs/vite/pull/19281 ([7757047](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/7757047e62381af6d757499da3ea633fd1cf3d36))
* esm only ([c170b61](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/c170b61312d79c6881fbdf5c49457dc99273c130))

### Bug Fixes

* build respect `hashCharacters` config, https://github.com/vitejs/vite/pull/19262 ([40eaf95](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/40eaf95953bc6d2e228970617022220199990643))
* don't lower CSS if legacy chunks are not generated, https://github.com/vitejs/vite/pull/20392 ([5c1401f](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/5c1401fbb97ce4d0a9fa9b1a517413d8efb24d1f))
* fix assumptions usage ([d919b92](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/d919b92f143c5e1caa09291b6aa700bca68e8444))
* import swc once, https://github.com/vitejs/vite/pull/19152 ([01d5f5a](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/01d5f5a0f97df7c841f4f215343627e04bd86c47))
* remove `location.protocol!="file:"` condition for modern android webview, https://github.com/vitejs/vite/pull/20179 ([2b9a7d9](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/2b9a7d98ccd100cad3d37b2ff9eccd8bccdc85e9))
* warn if plugin-legacy is passed to `worker.plugins`, https://github.com/vitejs/vite/pull/19079 ([2797160](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/27971607115e385ee65c3dc4510d460059575e0d))

## [1.2.3](https://github.com/CyanSalt/vite-plugin-legacy-swc/compare/v1.2.2...v1.2.3) (2024-12-20)

### Bug Fixes

* tranpile when modern polyfills is auto detected ([15c330a](https://github.com/CyanSalt/vite-plugin-legacy-swc/commit/15c330aaae3c48d3b5a146808e58d1c3355c82f9))

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
