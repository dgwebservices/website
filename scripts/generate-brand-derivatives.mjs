import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const lightIcon = path.join(root, "public/brand/DG-Webservices-Icon-Light-Mode-8192.svg");
const darkIcon = path.join(root, "public/brand/DG-Webservices-Icon-Dark-Mode-8192.svg");
const darkCombined = path.join(root, "public/brand/DG-Webservices-Combined-Dark-Mode-8192.svg");
const iconsDirectory = path.join(root, "public/icons");
const socialDirectory = path.join(root, "public/social");
await mkdir(iconsDirectory, { recursive: true });
await mkdir(socialDirectory, { recursive: true });

async function containSvg(source, size, output, background) {
  const inset = Math.round(size * (background ? .2 : .1));
  const logo = await sharp(source).resize(size - (2 * inset), size - (2 * inset), { fit: "contain" }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, left: inset, top: inset }])
    .png()
    .toFile(output);
}

await containSvg(lightIcon, 192, path.join(iconsDirectory, "icon-192.png"));
await containSvg(lightIcon, 512, path.join(iconsDirectory, "icon-512.png"));
await containSvg(darkIcon, 192, path.join(iconsDirectory, "maskable-192.png"), "#071426");
await containSvg(darkIcon, 512, path.join(iconsDirectory, "maskable-512.png"), "#071426");
await containSvg(lightIcon, 180, path.join(iconsDirectory, "apple-touch-icon.png"), "#F5F8FC");

const faviconPng = await sharp(lightIcon).resize(32, 32, { fit: "contain" }).png().toBuffer();
const icoHeader = Buffer.from([0, 0, 1, 0, 1, 0]);
const icoEntry = Buffer.alloc(16);
icoEntry.writeUInt8(32, 0);
icoEntry.writeUInt8(32, 1);
icoEntry.writeUInt8(0, 2);
icoEntry.writeUInt8(0, 3);
icoEntry.writeUInt16LE(1, 4);
icoEntry.writeUInt16LE(32, 6);
icoEntry.writeUInt32LE(faviconPng.length, 8);
icoEntry.writeUInt32LE(22, 12);
await writeFile(path.join(root, "public/favicon.ico"), Buffer.concat([icoHeader, icoEntry, faviconPng]));

const socialBackground = Buffer.from(`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#071426"/>
  <circle cx="1030" cy="90" r="330" fill="#102F5A"/>
  <path d="M0 520H1200" stroke="#2563EB" stroke-width="4"/>
  <text x="80" y="360" fill="#FFFFFF" font-family="Space Grotesk, Arial, sans-serif" font-size="68" font-weight="700" letter-spacing="-2">Digitaal gemaakt.</text>
  <text x="80" y="440" fill="#4A8BFF" font-family="Space Grotesk, Arial, sans-serif" font-size="68" font-weight="700" letter-spacing="-2">Helder geregeld.</text>
  <text x="80" y="565" fill="#CAD4E1" font-family="Manrope, Arial, sans-serif" font-size="24">Websites · webapplicaties · digitale processen</text>
</svg>`);
const combined = await sharp(darkCombined).resize({ width: 320 }).png().toBuffer();
await sharp(socialBackground).composite([{ input: combined, left: 80, top: 72 }]).png().toFile(path.join(socialDirectory, "dg-webservices.png"));

const outputs = [
  "public/favicon.ico",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/icons/maskable-192.png",
  "public/icons/maskable-512.png",
  "public/icons/apple-touch-icon.png",
  "public/social/dg-webservices.png",
];
const manifest = [];
for (const relative of outputs) {
  const bytes = await readFile(path.join(root, relative));
  const metadata = relative.endsWith(".png") ? await sharp(bytes).metadata() : {};
  manifest.push({ path: relative, source: relative.includes("maskable") ? "DG-Webservices-Icon-Dark-Mode-8192.svg" : relative.includes("social") ? "DG-Webservices-Combined-Dark-Mode-8192.svg" : "DG-Webservices-Icon-Light-Mode-8192.svg", width: metadata.width, height: metadata.height, sha256: createHash("sha256").update(bytes).digest("hex") });
}
await writeFile(path.join(root, "docs/brand-derivatives.json"), `${JSON.stringify(manifest, null, 2)}\n`);
