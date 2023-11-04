import * as esbuild from 'esbuild'
import { denoPlugins } from 'esbuild-deno-loader'
import { solidPlugin } from 'npm:esbuild-plugin-solid'
import { resolve } from 'std/path/mod.ts'

const solid = { solid: { moduleName: 'npm:solid-js/web' } }

export default async function build(shouldWrite) {
  const [denoResolver, denoLoader] = [...denoPlugins({
    nodeModulesDir: true,
    configPath: resolve('./deno.client.json'),
  })]

  const result = await esbuild.build({
    plugins: [denoResolver, solidPlugin(solid), denoLoader],
    entryPoints: ['./www/index.tsx'],
    outfile: './www/index.js',
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: ['chrome99', 'safari15'],
    treeShaking: true,
    write: shouldWrite,
  })
  await esbuild.stop()
  return result.outputFiles?.[0]?.text
}
