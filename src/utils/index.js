import chalk from 'chalk';

// destructuring required here because packages are commonjs
const { white, green, yellow } = chalk;

export const colors = {
  strong: white.bold,
  success: green.bold,
  attention: yellow.bold
};
