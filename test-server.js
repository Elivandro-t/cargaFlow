import { spawn } from "child_process";
import fs from "fs/promises";
import http from "http";

async function testServer() {
  const server = spawn("npm", ["run", "start"], {
    env: { ...process.env, NODE_ENV: "production", PORT: "3000" },
    stdio: "inherit"
  });

  await new Promise(r => setTimeout(r, 6000));
  
  try {
    const res = await fetch("http://127.0.0.1:3000/");
    console.log("Status:", res.status);
    console.log("Response text:", await res.text());
  } catch(e) {
    console.log("Fetch failed", e);
  }

  server.kill();
  process.exit();
}

testServer();
