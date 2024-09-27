import { serve } from "bun";
import { renderToReadableStream } from "react-dom/server.browser";
import React from "react";
import path from "node:path";

const PORT = process.env.PORT || 3000;
const PAGES_PATH = path.resolve(process.cwd(), "./pages");
const STATIC_PATH = process.cwd();

async function renderTsxComponent(filePath: string): Promise<Response> {
	const module = await import(`${filePath}.tsx`);
	const Component = module.default;
	const stream = await renderToReadableStream(
		React.createElement(Component, {}),
	);
	return new Response(stream, { headers: { "Content-Type": "text/html" } });
}

async function executeTsHandler(
	filePath: string,
	req: Request,
): Promise<Response> {
	const module = await import(`${filePath}.ts`);
	const handler = module.default;
	return await handler(req);
}

function normalizeFilePath(url: URL): string {
	const filePath = path.join(PAGES_PATH, url.pathname);

	if (url.pathname === "/") {
		return path.join(PAGES_PATH, "index");
	}

	return url.pathname.endsWith("/") ? filePath.slice(0, -1) : filePath;
}

async function fileExists(
	filePath: string,
	extension: string,
): Promise<boolean> {
	return await Bun.file(`${filePath}${extension}`).exists();
}

async function serveStaticFile(filePath: string): Promise<Response> {
	const file = Bun.file(filePath);
	if (await file.exists()) {
		return new Response(file);
	}
	return new Response("Not Found", { status: 404 });
}

async function handleRequest(req: Request): Promise<Response> {
	const url = new URL(req.url);
	const filePath = normalizeFilePath(url);

	console.log(`[${req.method}] ${url.pathname}`);

	// Check for static files first
	const staticFilePath = path.join(STATIC_PATH, url.pathname);
	if (await Bun.file(staticFilePath).exists()) {
		return await serveStaticFile(staticFilePath);
	}

	if (await fileExists(filePath, ".tsx")) {
		return await renderTsxComponent(filePath);
	}

	if (await fileExists(filePath, ".ts")) {
		return await executeTsHandler(filePath, req);
	}

	return new Response("Not Found", { status: 404 });
}

serve({
	fetch: handleRequest,
	port: PORT,
});

console.log(`punk server is running at http://localhost:${PORT}`);
