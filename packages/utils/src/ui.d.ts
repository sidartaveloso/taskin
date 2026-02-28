import chalk from 'chalk';
export declare const colors: {
  primary: chalk.Chalk;
  secondary: chalk.Chalk;
  success: chalk.Chalk;
  warning: chalk.Chalk;
  error: chalk.Chalk;
  info: chalk.Chalk;
  highlight: chalk.Chalk;
  normal: chalk.Chalk;
};
export declare const icons: {
  rocket: string;
  success: string;
  warning: string;
  info: string;
  error: string;
  task: string;
  branch: string;
  commit: string;
  assignee: string;
  status: string;
  play: string;
  blocked: string;
  hourglass: string;
};
export declare function printHeader(title: string, icon?: string): void;
