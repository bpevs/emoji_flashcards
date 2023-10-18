import { resolve } from 'https://deno.land/std@0.200.0/path/mod.ts'
import * as esbuild from 'https://deno.land/x/esbuild@v0.14.51/mod.js'
import { denoPlugins } from 'https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts'
import { solidPlugin } from 'npm:esbuild-plugin-solid'

const STATIC_DIR_PATH = '/'
const STATIC_DIR = './public'
const DATA_DIR_PATH = '/data'
const DATA_DIR = './data'

const [denoResolver, denoLoader] = [...denoPlugins({
  importMapURL: new URL('file://' + resolve('./www_import_map.json')),
  nodeModulesDir: true,
})]

await esbuild.build({
  plugins: [
    denoResolver,
    solidPlugin({ solid: { moduleName: 'npm:solid-js/web' } }),
    denoLoader,
  ],
  entryPoints: ['./public/index.tsx'],
  outfile: './public/index.js',
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['chrome99', 'safari15'],
  treeShaking: true,
})
esbuild.stop()
