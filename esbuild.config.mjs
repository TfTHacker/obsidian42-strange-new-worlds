import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import builtins from "builtin-modules";
import { ESLint } from "eslint";

const prod = (process.argv[2] === "production");

esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    format: "cjs",
    watch: !prod,
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    treeShaking: true,
    minify: true,
    outdir: "build",
    external: [
      "obsidian",
      "electron",
      "codemirror",
      "@codemirror/commands",
      "@codemirror/language",
      "@codemirror/search",
      "@codemirror/state",
      "@codemirror/view",
      ...builtins,
    ],
}).catch(() => process.exit(1));

fs.copyFile("manifest.json", "build/manifest.json", (err) => {if(err) console.log(err)} );
fs.copyFile("src/styles.css", "build/styles.css", (err) => {if(err) console.log(err)} );

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
