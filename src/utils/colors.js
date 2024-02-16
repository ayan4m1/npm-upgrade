import chalk from 'chalk';

// destructuring required here because inquirer is commonjs
const { white, green, yellow } = chalk;

export const strong = white.bold;
export const success = green.bold;
export const attention = yellow.bold;
