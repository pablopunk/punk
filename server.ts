#!/usr/bin/env bun

import { serve } from "bun";
import { renderToReadableStream } from "react-dom/server.browser";
import React from "react";
import path from "node:path";

const PORT = process.env.PORT || 3000;
const pagesPath = path.resolve(process.cwd(), "./pages");

serve({
	fetch: async (req) => {
		const url = new URL(req.url);
		let filePath = path.join(pagesPath, url.pathname);

		console.log(`[${req.method}] ${url.pathname}`);

		// Handle root path and trailing slashes
		if (url.pathname === "/") {
			filePath = path.join(pagesPath, "index");
		} else if (url.pathname.endsWith("/")) {
			filePath = filePath.slice(0, -1);
		}

		// Try .tsx files first
		try {
			const module = await import(`${filePath}.tsx`);
			const Component = module.default;
			const stream = await renderToReadableStream(
				React.createElement(Component, {}),
			);
			return new Response(stream, {
				headers: { "Content-Type": "text/html" },
			});
		} catch (errTsx) {
			// If .tsx not found, try .ts
			console.error(errTsx);
			try {
				const module = await import(`${filePath}.ts`);
				const handler = module.default;
				const response = await handler(req);
				return response;
			} catch (errTs) {
				// File not found or other errors
				return new Response("Not Found", { status: 404 });
			}
		}
	},
	port: PORT,
});

console.log(`punk server is running at http://localhost:${PORT}`);
