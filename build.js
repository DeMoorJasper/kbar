const esbuild = require("esbuild");

async function run() {
  const result = await esbuild.build({
    entryPoints: ["src/index.tsx"],
    bundle: true,
    minify: false,
    sourcemap: true,
    target: "es2017",
    outdir: "lib",
    format: "esm",
  });

  result.errors.forEach((error) => {
    console.error(error);
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
