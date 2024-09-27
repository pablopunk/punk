import { serve } from "bun";
import path from "node:path";

const PORT = process.env.PORT || 3000;
const PAGES_PATH = path.resolve(process.cwd(), "./pages");
const PUBLIC_PATH = path.resolve(__dirname, "..", "public");

// Dynamically import React and ReactDOMServer from the project's node_modules
const projectReact = await import(
	path.join(process.cwd(), "node_modules/react")
);
const projectReactDOMServer = await import(
	path.join(process.cwd(), "node_modules/react-dom/server.browser")
);

async function handleTsxRequest(filePath: string, req: Request) {
	const module = await import(`${filePath}.tsx`);
	const Component = module.default;
	const stream = await projectReactDOMServer.renderToReadableStream(
		projectReact.createElement(Component, {}),
		{
			bootstrapScripts: ["/client.js"],
			bootstrapScriptContent: "window.CLIENT_SCRIPT_LOADED = true;",
		},
	);

	// Create a new ReadableStream that injects the import map
	const transformedStream = new ReadableStream({
		async start(controller) {
			// Inject the import map at the beginning of the stream
			controller.enqueue(
				new TextEncoder().encode(`
					<script type="importmap">
						{
							"imports": {
								"react": "/node_modules/react/umd/react.development.js",
								"react-dom": "/node_modules/react-dom/umd/react-dom.development.js"
							}
						}
					</script>
				`),
			);
			const reader = stream.getReader();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				controller.enqueue(value);
			}
			controller.close();
		},
	});

	return new Response(transformedStream, {
		headers: { "Content-Type": "text/html" },
	});
}

async function handleTsRequest(filePath: string, req: Request) {
	const module = await import(`${filePath}.ts`);
	const handler = module.default;
	return await handler(req);
}

async function handleStaticRequest(filePath: string, req: Request) {
	const fileContent = await Bun.file(filePath).text();
	const extension = path.extname(filePath);
	if ([".ts", ".tsx"].includes(extension)) {
		// Transpile TypeScript/JSX to JavaScript, keeping ES module format
		const transpiler = new Bun.Transpiler({
			loader: extension === ".tsx" ? "tsx" : "ts",
			target: "browser", // Ensure modern syntax is preserved
		});
		const transpiled = await transpiler.transform(fileContent);
		return new Response(transpiled, {
			headers: {
				"Content-Type": "application/javascript",
			},
		});
	}
	return new Response(fileContent, {
		headers: {
			"Content-Type":
				extension === ".js" ? "application/javascript" : "text/javascript",
		},
	});
}

async function handleRequest(req: Request) {
	const url = new URL(req.url);
	let filePath = path.join(PAGES_PATH, url.pathname);

	console.log(`[${req.method}] ${url.pathname}`);

	// Serve files from public directory
	const publicFilePath = path.join(PUBLIC_PATH, url.pathname);
	if (await Bun.file(publicFilePath).exists()) {
		return await handleStaticRequest(publicFilePath, req);
	}

	const cwdFilePath = path.join(process.cwd(), url.pathname);
	if (await Bun.file(cwdFilePath).exists()) {
		return await handleStaticRequest(cwdFilePath, req);
	}

	// Serve files from node_modules
	if (url.pathname.startsWith("/node_modules/")) {
		const nodeModulesPath = path.join(process.cwd(), url.pathname);
		if (await Bun.file(nodeModulesPath).exists()) {
			return await handleStaticRequest(nodeModulesPath, req);
		}
	}

	if (url.pathname === "/") {
		filePath = path.join(PAGES_PATH, "index");
	} else if (url.pathname.endsWith("/")) {
		filePath = filePath.slice(0, -1);
	}

	if (await Bun.file(`${filePath}`).exists()) {
		return await handleStaticRequest(filePath, req);
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
