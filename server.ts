#!/usr/bin/env bun

import { serve, Transpiler } from "bun";
import fs from "node:fs";
import path from "node:path";

function resolveModule(moduleName: string) {
	const otherProjectPath = path.resolve(process.cwd());
	return require(`${otherProjectPath}/node_modules/${moduleName}`);
}

// Import React and other dependencies from the other project
const React = resolveModule("react");
const ReactDOMServer = resolveModule("react-dom/server");

const PORT = process.env.PORT || 3000;
const pagesPath = path.resolve(process.cwd(), "./pages");

serve({
	fetch: async (req) => {
		const url = new URL(req.url);

		console.log(`[${req.method}] ${url.pathname}`);

		if (path.extname(url.pathname)) {
			const filePath = path.join(process.cwd(), url.pathname);
			if (fs.existsSync(filePath)) {
				const fileContent = fs.readFileSync(filePath, "utf-8");
				let responseText = fileContent;
				if (path.extname(filePath) === ".tsx") {
					const transpiler = new Transpiler({ loader: "tsx" });
					responseText = (await transpiler.transform(fileContent)).replace(
						/import React from ['"]react['"]/g,
						"import * as React from '/node_modules/react/umd/react.development.js'",
					);
				}
				return new Response(responseText, {
					headers: { "Content-Type": "application/javascript" },
				});
			}
			return new Response("Not Found", { status: 404 });
		}

		let filePath = path.join(pagesPath, url.pathname);

		// Handle root path and trailing slashes
		if (url.pathname === "/") {
			filePath = path.join(pagesPath, "index");
		} else if (url.pathname.endsWith("/")) {
			filePath = filePath.slice(0, -1);
		}

		// determine which file to run based on it existing
		const tsxFileExists = fs.existsSync(`${filePath}.tsx`);
		const tsFileExists = fs.existsSync(`${filePath}.ts`);

		if (tsxFileExists) {
			filePath += ".tsx";
		} else if (tsFileExists) {
			filePath += ".ts";
		} else {
			return new Response("Not Found", { status: 404 });
		}

		const relativeFilePath = path.relative(process.cwd(), filePath);

		if (tsxFileExists) {
			const module = await import(filePath);
			const Component = module.default;
			const serverHtml = ReactDOMServer.renderToString(
				React.createElement(Component),
			);
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>My App</title>
				</head>
				<body>
					<div id="root">${serverHtml}</div>
					<script type="module" async>
            import * as React from '/node_modules/react/umd/react.development.js';
            import * as ReactDOM from '/node_modules/react-dom/umd/react-dom.development.js';
            import * as Component from '/${relativeFilePath}';
						ReactDOM.hydrateRoot(document.getElementById('root'), React.createElement(Component));
					</script>
				</body>
				</html>
			`;
			return new Response(html, {
				headers: { "Content-Type": "text/html" },
			});
		}

		if (tsFileExists) {
			const module = await import(`${filePath}.ts`);
			const handler = module.default;
			const response = await handler(req);
			return response;
		}

		return new Response("Not Found", { status: 404 });
	},
	port: PORT,
});

console.log(`punk server is running at http://localhost:${PORT}`);
