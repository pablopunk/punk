#!/usr/bin/env node

const { spawn } = require("node:child_process");
const path = require("node:path");

// Path to the server script
const serverScript = path.resolve(__dirname, "../src/server.ts");

// Start the Bun server
const bunProcess = spawn("bun", ["--hot", serverScript], { stdio: "inherit" });

// Handle process termination
bunProcess.on("close", (code) => {
  process.exit(code);
});

bunProcess.on("error", (err) => {
  console.error("Failed to start punk server:", err);
  process.exit(1);
});
