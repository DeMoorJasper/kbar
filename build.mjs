import esbuild from "esbuild";
import inlineWorkerPlugin from "esbuild-plugin-inline-worker";

async function run() {
  const result = await esbuild.build({
    entryPoints: ["src/index.tsx"],
    bundle: true,
    minify: false,
    sourcemap: true,
    target: "es2017",
    outdir: "lib",
    format: "esm",
    plugins: [inlineWorkerPlugin()],
    external: [
      "react",
      "react-dom",
      "@radix-ui/react-portal",
      "fast-equals",
      "react-virtual",
    ],
  });

  result.errors.forEach((error) => {
    console.error(error);
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
