import { serve } from "bun";
import { renderToReadableStream } from "react-dom/server.browser";
import React from "react";
import path from "node:path";

const PORT = process.env.PORT || 3000;
const PAGES_PATH = path.resolve(process.cwd(), "./pages");

async function handleTsxRequest(filePath: string, req: Request) {
	const module = await import(`${filePath}.tsx`);
	const Component = module.default;
	const stream = await renderToReadableStream(
		React.createElement(Component, {}),
	);
	return new Response(stream, { headers: { "Content-Type": "text/html" } });
}

async function handleTsRequest(filePath: string, req: Request) {
	const module = await import(`${filePath}.ts`);
	const handler = module.default;
	return await handler(req);
}

async function handleRequest(req: Request) {
	const url = new URL(req.url);
	let filePath = path.join(PAGES_PATH, url.pathname);

	console.log(`[${req.method}] ${url.pathname}`);

	if (url.pathname === "/") {
		filePath = path.join(PAGES_PATH, "index");
	} else if (url.pathname.endsWith("/")) {
		filePath = filePath.slice(0, -1);
	}

	if (await Bun.file(`${filePath}.tsx`).exists()) {
		return await handleTsxRequest(filePath, req);
	}

	if (await Bun.file(`${filePath}.ts`).exists()) {
		return await handleTsRequest(filePath, req);
	}

	return new Response("Not Found", { status: 404 });
}

serve({
	fetch: handleRequest,
	port: PORT,
});

console.log(`punk server is running at http://localhost:${PORT}`);
