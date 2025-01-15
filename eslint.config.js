import globals from 'globals';
import eslint from '@eslint/js';
import babelParser from '@babel/eslint-parser';
import eslintPluginImportX from 'eslint-plugin-import-x';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  eslint.configs.recommended,
  eslintPluginImportX.flatConfigs.recommended,
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
