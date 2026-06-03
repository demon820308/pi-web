import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { existsSync, readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

async function run() {
  try {
    const sessionsDir = join(getAgentDir(), "sessions");
    console.log("Sessions directory:", sessionsDir);
    if (!existsSync(sessionsDir)) {
      console.log("No sessions directory found!");
      return;
    }

    // Find all .jsonl files recursively
    const files = [];
    function walk(dir) {
      for (const file of readdirSync(dir)) {
        const fullPath = join(dir, file);
        if (statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith(".jsonl")) {
          files.push({ path: fullPath, mtime: statSync(fullPath).mtime });
        }
      }
    }
    walk(sessionsDir);

    if (files.length === 0) {
      console.log("No .jsonl session files found!");
      return;
    }

    // Sort by modification time descending
    files.sort((a, b) => b.mtime - a.mtime);
    const latest = files[0].path;
    console.log("Latest session file:", latest);
    console.log("Modified time:", files[0].mtime);
    console.log("--- Content (last 15 lines) ---");
    const content = readFileSync(latest, "utf8");
    const lines = content.split("\n").filter(Boolean);
    const lastLines = lines.slice(-15);
    for (const line of lastLines) {
      try {
        const obj = JSON.parse(line);
        // Print clean summary without huge base64 blocks
        if (obj.message && typeof obj.message === 'object') {
          const msg = obj.message;
          console.log(`JSONL Entry: type=message, role=${msg.role}, timestamp=${obj.timestamp || msg.timestamp}`);
          if (Array.isArray(msg.content)) {
            console.log("  - content blocks:", msg.content.map(b => b.type));
          } else {
            console.log("  - content length:", msg.content ? msg.content.length : 0);
          }
          if (msg.audio) {
            console.log("  - msg.audio found! Keys:", Object.keys(msg.audio));
          }
        } else {
          console.log(`JSONL Entry: type=${obj.type}, id=${obj.id}, parentId=${obj.parentId}`);
        }
      } catch {
        console.log("Raw Line:", line);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
