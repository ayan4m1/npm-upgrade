import terser from '@rollup/plugin-terser';
import multiInput from '@ayan4m1/rollup-plugin-multi-input';
// eslint-disable-next-line import/no-unresolved
import nodeExternals from 'rollup-plugin-node-externals';

export default {
  input: './src/**/*.js',
  output: {
    dir: './lib',
    format: 'esm',
    preserveModules: true
  },
  plugins: [nodeExternals(), multiInput(), terser()]
};
