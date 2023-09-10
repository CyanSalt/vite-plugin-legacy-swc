export interface Options {
  /**
   * default: 'defaults'
   */
  targets?: string | string[] | Record<string, string>,
  /**
   * default: false
   */
  ignoreBrowserslistConfig?: boolean,
  /**
   * default: true
   */
  polyfills?: boolean | string[],
  additionalLegacyPolyfills?: string[],
  /**
   * default: false
   */
  modernPolyfills?: boolean | string[],
  /**
   * default: true
   */
  renderLegacyChunks?: boolean,
  /**
   * default: false
   */
  externalSystemJS?: boolean,
  /**
   * default: true
   */
  renderModernChunks?: boolean
}
