import inquirer from 'inquirer';
import chalk from 'chalk';

// destructuring required here because packages are commonjs
const { prompt } = inquirer;
const { white, green, yellow } = chalk;

export const askUser = async (question) =>
  (await prompt([{ ...question, name: 'answer' }])).answer;

export const colors = {
  strong: white.bold,
  success: green.bold,
  attention: yellow.bold
};
