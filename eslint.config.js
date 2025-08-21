import globals from 'globals';
import eslint from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import { flatConfigs as importConfigs } from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  eslint.configs.recommended,
  importConfigs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false
      }
    }
  },
  eslintPluginPrettier
];
