import chalk from 'chalk';

// destructuring required here because packages are commonjs
const { white, green, yellow, red } = chalk;

export const colors = {
  red,
  green,
  yellow,
  strong: white.bold,
  success: green.bold,
  attention: yellow.bold
};
