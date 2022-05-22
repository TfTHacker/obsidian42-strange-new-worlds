import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { ESLint } from "eslint";
import fs from "fs";


const prod = process.argv[2] === "production";

const watchOptions = {
  onRebuild: (error, result) => {
    if (error) {
      console.error('Build failed:', error)
    } else {
      fs.copyFile("manifest.json", "dist/manifest.json", (err) => {if(err) console.log(err)} );
      fs.copyFile("src/styles.css", "dist/styles.css", (err) => {if(err) console.log(err)} );
      // eslint won't slow down the build process, just runs after the build finishes
      (async function eslintTest() {
        const eslint = new ESLint();
        const results = await eslint.lintFiles(["src/**/*.ts"]);
        const formatter = await eslint.loadFormatter("stylish");
        const resultText = formatter.format(results);
        console.log(resultText);
      })().catch((error) => {
        process.exitCode = 1;
        console.error(error);
      });
    }
  }
}

esbuild
  .build({
    entryPoints: ["src/main.ts", "src/styles.css"],
    format: "cjs",
    bundle: true,
    minify: true,
    watch: !prod && watchOptions,
    target: "es2016",
    logLevel: "info",
    sourcemap: false,
    treeShaking: true,
    outdir: "dist",
    external: [
      "obsidian",
      "electron",
      "codemirror",
      "@codemirror/autocomplete",
      "@codemirror/closebrackets",
      "@codemirror/collab",
      "@codemirror/commands",
      "@codemirror/comment",
      "@codemirror/fold",
      "@codemirror/gutter",
      "@codemirror/highlight",
      "@codemirror/history",
      "@codemirror/language",
      "@codemirror/lint",
      "@codemirror/matchbrackets",
      "@codemirror/panel",
      "@codemirror/rangeset",
      "@codemirror/rectangular-selection",
      "@codemirror/search",
      "@codemirror/state",
      "@codemirror/stream-parser",
      "@codemirror/text",
      "@codemirror/tooltip",
      "@codemirror/view",
      "@lezer/common",
      "@lezer/lr",
      ...builtins,
    ],
  }).catch(() => process.exit(1));

