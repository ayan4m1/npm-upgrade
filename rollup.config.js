import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
// import terser from '@rollup/plugin-terser';
import multiInput from 'rollup-plugin-multi-input';
import autoExternal from 'rollup-plugin-auto-external';

export default {
  input: './src/**/*.js',
  output: {
    dir: './lib',
    format: 'esm'
  },
  plugins: [
    autoExternal(),
    babel({ babelHelpers: 'runtime' }),
    multiInput.default(),
    json()
    // terser()
  ]
};
