import { access, chmod, mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

function linuxAsset(arch) {
  if (arch === "x64") return "yt-dlp_linux";
  if (arch === "arm64") return "yt-dlp_linux_aarch64";
  throw new Error(`Unsupported Linux architecture for yt-dlp: ${arch}`);
}

if (process.platform === "linux") {
  const filename = linuxAsset(process.arch);
  const directory = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin");
  const destination = path.join(directory, filename);
  const temporary = `${destination}.download`;

  try {
    await access(destination);
    await chmod(destination, 0o755);
    console.log(`Using existing standalone yt-dlp binary: ${filename}`);
  } catch {
    const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${filename}`;
    console.log(`Downloading standalone yt-dlp binary: ${filename}`);
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "ReelSave build" },
    });
    if (!response.ok) {
      throw new Error(`Unable to download ${filename}: HTTP ${response.status}`);
    }
    await mkdir(directory, { recursive: true });
    await writeFile(temporary, Buffer.from(await response.arrayBuffer()));
    await chmod(temporary, 0o755);
    await rename(temporary, destination);
    console.log(`Installed standalone yt-dlp binary: ${filename}`);
  }

  await unlink(temporary).catch(() => {});
}
