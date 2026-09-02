import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, "..");
const outDir = resolve(projectDir, "public/brand");
mkdirSync(outDir, { recursive: true });

const NAVY = "#071426";
const BLUE = "#2563EB";
const BLUE_LIGHT = "#4A8BFF";
const ICE = "#F5F8FC";

const navyTop = "M0 2h48c15.5 0 28.4 5.3 36 14.2L65 30c-4.7-8-10.8-13-19.7-13H0V2Z";
const navyBottom = "M0 27h18v37h29c9.4 0 15.4-4.3 19.2-10.8L82 69c-8.5 9.2-19.6 13-34 13H0V27Z";
const blueRing = "M134 2h-34C80.8 2 67 19.6 67 42s17 40 38 40c24.7 0 43-16.4 43-40h-18c0 15.3-9.8 25-25 25-11.6 0-20-10.8-20-25s8.5-25 20-25h21L134 2Z";
const blueBar = "M106 34h42v14h-48l6-14Z";

const wordmarkPaths = [
  "M6.76 64H18.8c7.84 0 12.53-.77 16.73-2.87C43.51 57.21 48.2 48.67 48.2 38.24c0-9.87-4.06-17.92-11.27-22.26-4.06-2.45-10.22-3.71-18.34-3.71H6.76Zm9.59-9.17V21.44h1.89c6.16 0 9.38.56 12.39 2.1 4.9 2.52 7.91 8.05 7.91 14.7 0 6.23-2.87 11.76-7.49 14.28-2.87 1.54-6.86 2.31-12.6 2.31Z",
  "M73.300052 46.57h21.42c-2.73 5.74-8.33 9.1-15.19 9.1-10.15 0-17.92-7.56-17.92-17.5 0-4.48 1.89-9.38 4.83-12.53 3.01-3.22 7.56-5.04 12.53-5.04 6.02 0 11.06 2.45 14.21 6.86h11.269998c-3.36-9.31-13.999998-16.1-25.269998-16.1-15.19 0-27.23 11.76-27.23 26.67 0 15.19 12.25 26.88 28.14 26.88 7.84 0 14.49-2.73 19.6-7.98 4.759998-4.97 7.419998-11.41 7.419998-18.06V37.61H73.300052Z",
  "M141.63011 64h7.56l8.54-34.23L166.06 64h7.63l15.12-51.73h-9.8l-9.17 36.12-8.68-36.12h-7l-8.82 36.12-9.1-36.12h-9.8Z",
  "M227.84008 48.74c.28-1.4.35-2.24.35-3.64 0-11.97-8.47-20.79-20.02-20.79-11.41 0-20.44 9.03-20.44 20.44 0 11.34 9.17 20.16 21 20.16 6.37 0 11.34-2.31 15.4-7 1.47-1.82 2.45-3.43 3.08-5.39h-10.15c-2.38 2.8-4.69 3.85-8.54 3.85-5.53 0-9.59-2.94-10.71-7.63Zm-30.31-8.19c1.47-5.04 5.25-7.7 10.78-7.7 5.74 0 9.52 2.73 10.71 7.7Z",
  "M233.12999 64h8.54v-4.97c3.99 4.27 7.7 5.88 13.44 5.88 6.02 0 10.78-2.24 14.35-6.79 2.94-3.78 4.55-8.61 4.55-13.79 0-11.76-8.33-20.51-19.53-20.51-5.11 0-8.4 1.4-12.04 4.97V12.27h-9.31Zm20.02-31.64c6.65 0 11.48 5.04 11.48 12.04 0 7.14-4.62 11.97-11.27 11.97-6.79 0-11.48-4.97-11.48-12.04 0-7 4.69-11.97 11.27-11.97Z",
  "M276.00996 51.68c.42 3.78 1.05 5.81 2.59 7.84 2.52 3.36 6.93 5.39 11.62 5.39 7.77 0 13.86-5.81 13.86-13.23 0-5.88-2.94-8.96-10.78-11.34-3.85-1.19-3.85-1.19-4.76-1.61-1.12-.56-1.82-1.47-1.82-2.66 0-1.82 1.54-3.22 3.57-3.22 1.96 0 3.22 1.05 3.64 3.08h9.1c-.14-3.29-.91-5.25-2.8-7.35-2.45-2.73-6.09-4.27-9.94-4.27-7.28 0-12.88 5.18-12.88 11.83 0 5.67 3.01 8.89 10.78 11.48 3.5 1.19 3.85 1.33 4.83 1.96 1.12.7 1.75 1.75 1.75 3.01 0 2.17-1.75 3.78-4.2 3.78-2.73 0-4.27-1.4-5.18-4.69Z",
  "M346.53999 48.74c.28-1.4.35-2.24.35-3.64 0-11.97-8.47-20.79-20.02-20.79-11.41 0-20.44 9.03-20.44 20.44 0 11.34 9.17 20.16 21 20.16 6.37 0 11.34-2.31 15.4-7 1.47-1.82 2.45-3.43 3.08-5.39h-10.15c-2.38 2.8-4.69 3.85-8.54 3.85-5.53 0-9.59-2.94-10.71-7.63Zm-30.31-8.19c1.47-5.04 5.25-7.7 10.78-7.7 5.74 0 9.52 2.73 10.71 7.7Z",
  "M351.75995 64h9.31V42.44c-.21-5.74 2.73-8.96 8.33-9.17v-8.96h-.7c-3.99 0-5.95 1.12-8.4 4.69v-3.78h-8.54Z",
  "M386.02998 64h7.42l15.61-38.78h-10.5l-8.82 25.69-8.96-25.69h-10.36Z",
  "M411.83002 64h9.31V25.22h-9.31Zm0-42.98h9.31v-8.75h-9.31Z",
  "M455.26998 51.26c-2.31 3.57-4.97 5.11-8.82 5.11-6.44 0-11.27-5.04-11.27-11.83 0-6.86 4.55-11.69 11.06-11.69 4.2 0 7.14 1.75 9.03 5.32h10.5c-1.33-3.92-2.59-5.95-5.25-8.4-3.78-3.5-8.89-5.46-14.28-5.46-11.48 0-20.44 8.89-20.44 20.3 0 11.27 9.24 20.3 20.72 20.3 9.1 0 16.03-4.97 19.25-13.65Z",
  "M508.43989 48.74c.28-1.4.35-2.24.35-3.64 0-11.97-8.47-20.79-20.02-20.79-11.41 0-20.44 9.03-20.44 20.44 0 11.34 9.17 20.16 21 20.16 6.37 0 11.34-2.31 15.4-7 1.47-1.82 2.45-3.43 3.08-5.39h-10.15c-2.38 2.8-4.69 3.85-8.54 3.85-5.53 0-9.59-2.94-10.71-7.63Zm-30.31-8.19c1.47-5.04 5.25-7.7 10.78-7.7 5.74 0 9.52 2.73 10.71 7.7Z",
  "M511.06981 51.68c.42 3.78 1.05 5.81 2.59 7.84 2.52 3.36 6.93 5.39 11.62 5.39 7.77 0 13.86-5.81 13.86-13.23 0-5.88-2.94-8.96-10.78-11.34-3.85-1.19-3.85-1.19-4.76-1.61-1.12-.56-1.82-1.47-1.82-2.66 0-1.82 1.54-3.22 3.57-3.22 1.96 0 3.22 1.05 3.64 3.08h9.1c-.14-3.29-.91-5.25-2.8-7.35-2.45-2.73-6.09-4.27-9.94-4.27-7.28 0-12.88 5.18-12.88 11.83 0 5.67 3.01 8.89 10.78 11.48 3.5 1.19 3.85 1.33 4.83 1.96 1.12.7 1.75 1.75 1.75 3.01 0 2.17-1.75 3.78-4.2 3.78-2.73 0-4.27-1.4-5.18-4.69Z",
];

const svg = (viewBox, title, content) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">Officieel vectorlogo van DG Webservices, opgebouwd uit schaalbare paden.</desc>
  ${content}
</svg>\n`;

const primaryDefs = `<defs>
    <linearGradient id="dg-navy" x1="0" y1="0" x2="92" y2="84" gradientUnits="userSpaceOnUse"><stop stop-color="#071329"/><stop offset="1" stop-color="#09142B"/></linearGradient>
    <linearGradient id="dg-blue" x1="108" y1="2" x2="105" y2="83" gradientUnits="userSpaceOnUse"><stop stop-color="#2868EC"/><stop offset=".48" stop-color="#1D5ED9"/><stop offset="1" stop-color="#0F52C3"/></linearGradient>
  </defs>`;

const reversedDefs = `<defs>
    <linearGradient id="dg-light" x1="0" y1="0" x2="88" y2="84" gradientUnits="userSpaceOnUse"><stop stop-color="#FFFFFF"/><stop offset="1" stop-color="#DFE9F7"/></linearGradient>
    <linearGradient id="dg-blue" x1="108" y1="2" x2="105" y2="83" gradientUnits="userSpaceOnUse"><stop stop-color="#5B97FF"/><stop offset=".5" stop-color="#3477F2"/><stop offset="1" stop-color="#1E5ED4"/></linearGradient>
  </defs>`;

const mark = (dFill, gFill, transform = "") => `<g${transform ? ` transform="${transform}"` : ""}>
    <path fill="${dFill}" d="${navyTop}"/>
    <path fill="${dFill}" d="${navyBottom}"/>
    <path fill="${gFill}" d="${blueRing}"/>
    <path fill="${gFill}" d="${blueBar}"/>
  </g>`;

const wordmark = (firstFill, restFill, transform = "") => `<g${transform ? ` transform="${transform}"` : ""}>
${wordmarkPaths.map((path, index) => `    <path fill="${index < 2 ? firstFill : restFill}" d="${path}"/>`).join("\n")}
  </g>`;

const write = (name, content) => writeFileSync(resolve(outDir, name), content, "utf8");

write("dg-mark.svg", svg("0 0 148 84", "DG Webservices beeldmerk", `${primaryDefs}\n  ${mark("url(#dg-navy)", "url(#dg-blue)")}`));
write("dg-mark-flat.svg", svg("0 0 148 84", "DG Webservices vlak beeldmerk", mark(NAVY, BLUE)));
write("dg-mark-reversed.svg", svg("0 0 148 84", "DG Webservices beeldmerk voor donkere achtergronden", `${reversedDefs}\n  ${mark("url(#dg-light)", "url(#dg-blue)")}`));
write("dg-mark-mono.svg", svg("0 0 148 84", "DG Webservices monochroom beeldmerk", mark("currentColor", "currentColor")));
write("dg-mark-white.svg", svg("0 0 148 84", "DG Webservices wit beeldmerk", mark("#FFFFFF", "#FFFFFF")));

write("dg-wordmark.svg", svg("0 6 544 64", "DG Webservices woordmerk", wordmark(NAVY, BLUE)));
write("dg-wordmark-reversed.svg", svg("0 6 544 64", "DG Webservices woordmerk voor donkere achtergronden", wordmark(ICE, BLUE_LIGHT)));
write("dg-wordmark-mono.svg", svg("0 6 544 64", "DG Webservices monochroom woordmerk", wordmark("currentColor", "currentColor")));

const lockupPrimary = `${primaryDefs}\n  ${mark("url(#dg-navy)", "url(#dg-blue)", "translate(6 20)")}\n  <path fill="#CED9E6" d="M182 22h2v80h-2z"/>\n  ${wordmark(NAVY, BLUE, "translate(210 29) scale(.84)")}`;
const lockupReversed = `${reversedDefs}\n  ${mark("url(#dg-light)", "url(#dg-blue)", "translate(6 20)")}\n  <path fill="#344966" d="M182 22h2v80h-2z"/>\n  ${wordmark(ICE, BLUE_LIGHT, "translate(210 29) scale(.84)")}`;
const lockupMono = `${mark("currentColor", "currentColor", "translate(6 20)")}\n  <path fill="currentColor" fill-opacity=".25" d="M182 22h2v80h-2z"/>\n  ${wordmark("currentColor", "currentColor", "translate(210 29) scale(.84)")}`;

write("dg-lockup.svg", svg("0 0 720 124", "DG Webservices horizontaal logo", lockupPrimary));
write("dg-lockup-reversed.svg", svg("0 0 720 124", "DG Webservices horizontaal logo voor donkere achtergronden", lockupReversed));
write("dg-lockup-mono.svg", svg("0 0 720 124", "DG Webservices monochroom horizontaal logo", lockupMono));

const stackedPrimary = `${primaryDefs}\n  ${mark("url(#dg-navy)", "url(#dg-blue)", "translate(110 14) scale(1.35)")}\n  ${wordmark(NAVY, BLUE, "translate(48 142) scale(.6)")}`;
const stackedReversed = `${reversedDefs}\n  ${mark("url(#dg-light)", "url(#dg-blue)", "translate(110 14) scale(1.35)")}\n  ${wordmark(ICE, BLUE_LIGHT, "translate(48 142) scale(.6)")}`;
write("dg-lockup-stacked.svg", svg("0 0 420 204", "DG Webservices gestapeld logo", stackedPrimary));
write("dg-lockup-stacked-reversed.svg", svg("0 0 420 204", "DG Webservices gestapeld logo voor donkere achtergronden", stackedReversed));

const icon = (background, dFill, gFill, border = "", defs = "") => `${defs}\n  <rect x="4" y="4" width="120" height="120" rx="27" fill="${background}"${border}/>
  ${mark(dFill, gFill, "translate(14 35.5) scale(.676)")}`;
write("dg-icon-navy.svg", svg("0 0 128 128", "DG Webservices donker app-icoon", icon(NAVY, "#FFFFFF", "url(#dg-blue)", "", reversedDefs)));
write("dg-icon-blue.svg", svg("0 0 128 128", "DG Webservices blauw app-icoon", icon(BLUE, "#FFFFFF", "#FFFFFF")));
write("dg-icon-light.svg", svg("0 0 128 128", "DG Webservices licht app-icoon", icon("#FFFFFF", NAVY, BLUE, " stroke=\"#DCE5EF\" stroke-width=\"2\"")));

write("../favicon.svg", svg("0 0 128 128", "DG Webservices", icon(NAVY, "#FFFFFF", "url(#dg-blue)", "", reversedDefs)));

console.log(`Generated ${17} standalone vector assets in ${outDir}`);
