declare module 'rollup-plugin-polyfill-node' {
  import type { Plugin } from 'rollup';
  
  interface Options {
    include?: string | string[];
    exclude?: string | string[];
    sourceMap?: boolean;
  }
  
  function polyfillNode(options?: Options): Plugin;
  export default polyfillNode;
} 