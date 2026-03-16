import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/main.ts"],
	format: ["cjs"],
	target: "es2022",
	clean: false, // Obsidian needs clean: false if we want hot-reload to not delete other plugin files (e.g. styles) but here we only build main.js
	outDir: ".",
	outExtension() {
		return {
			js: `.js`,
		};
	},
	noExternal: [
		"@agentclientprotocol/sdk",
		"@codemirror/state",
		"@codemirror/view",
		"diff",
		"react",
		"react-dom",
		"semver",
	],
	external: ["obsidian", "electron"],
	env: {
		NODE_ENV: process.env.NODE_ENV || "production",
	},
	sourcemap: process.env.NODE_ENV === "production" ? false : "inline",
	minify: process.env.NODE_ENV === "production",
	treeshake: true,
});
