import type { ElectrobunConfig } from "electrobun";

const webBuildDir = "../web/dist";

export default {
	app: {
		identifier: "dev.bettertstack.dingdongdash.desktop",
		name: "dingdongdash",
		version: "0.0.1",
	},
	build: {
		copy: {
			[webBuildDir]: "views/mainview",
		},
		cottontail: {
			entrypoint: "src/bun/index.ts",
		},
		linux: {
			bundleCEF: true,
			defaultRenderer: "cef",
		},
		mac: {
			bundleCEF: true,
			defaultRenderer: "cef",
		},
		mainProcess: "cottontail",
		watchIgnore: [`${webBuildDir}/**`],
		win: {
			bundleCEF: true,
			defaultRenderer: "cef",
		},
	},
	runtime: {
		exitOnLastWindowClosed: true,
	},
} satisfies ElectrobunConfig;
