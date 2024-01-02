import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';
import fs from 'fs';
import console from 'console';

const prod = process.argv[2] === 'production';

const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins,
  ],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  loader: { '.ts': 'ts', '.tsx': 'tsx' },
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'build/main.js',
});

if (prod) {
  await context.rebuild();
  fs.copyFile('manifest.json', 'build/manifest.json', (err) => {
    if (err) console.log(err);
  });
  fs.copyFile('styles.css', 'build/styles.css', (err) => {
    if (err) console.log(err);
  });
  process.exit(0);
} else {
  await context.watch();
}
