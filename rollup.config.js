import json from '@rollup/plugin-json';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import multiInput from 'rollup-plugin-multi-input';
// eslint-disable-next-line import/no-unresolved
import nodeExternals from 'rollup-plugin-node-externals';

export default {
  input: './src/**/*.js',
  output: {
    dir: './lib',
    format: 'esm'
  },
  plugins: [
    nodeExternals(),
    babel({ babelHelpers: 'bundled' }),
    multiInput.default(),
    json(),
    terser()
  ]
};
