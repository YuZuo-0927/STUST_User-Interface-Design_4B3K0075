/* =========================================================
   ArtScope — 依 artworks/ 資料夾自動產生作品資料
   ---------------------------------------------------------
   用法（在專案根目錄執行）：
     node tools/generate-artworks.mjs

   規則：
   - artworks/ 下的每個子資料夾 = 一種作品類型（含 2D → 2d，含 3D → 3d）
   - 資料夾內的圖片 = 一件作品；檔名相同、只差結尾數字的圖片會被
     归成同一件作品的多張圖片（例如 「虎-1.jpg」~「虎-3.jpg」）
   - 住在「優質」子資料夾內的作品 = 精選作品，會排在最上面
   - 其餘作品由網頁端隨機排序（每次造訪順序不同）
   - 標題 = 檔名去掉副檔名、結尾數字與 -2D / -3D 標記

   產生結果寫入 assets/js/artworks.js
   ========================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artworksRoot = path.join(projectRoot, "artworks");
const outFile = path.join(projectRoot, "assets", "js", "artworks.js");

if (!fs.existsSync(artworksRoot)) {
  console.error("找不到 artworks 資料夾：", artworksRoot);
  process.exit(1);
}

const FEATURED_DIR = "優質";

/** 檔名 → 作品標題 */
function titleFromFilename(name) {
  const base = name.replace(/\.[^.]+$/, "");
  return base
    .replace(/-\d+$/, "")      // 結尾數字：虎-1 → 虎
    .replace(/-2D.*$/, "")     // 結尾 2D 標記：白無常-2D → 白無常
    .replace(/-3D.*$/, "")
    .replace(/[.\s]+$/, "")    // 結尾多餘的點或空白
    .trim();
}

/** 檔名結尾的編號（用來排序同一系列的圖片） */
function trailingNumber(name) {
  const m = name.replace(/\.[^.]+$/, "").match(/-(\d+)$/);
  return m ? Number(m[1]) : 0;
}

/** 由標題推導系列標籤（例如「紫微斗數系列-巨門星」→「紫微斗數系列」） */
function seriesTag(title) {
  const idx = title.indexOf("-");
  if (idx <= 0) return null;
  const prefix = title.slice(0, idx).trim();
  return prefix && prefix !== title ? prefix : null;
}

function slugify(type, title, used) {
  let slug = `${type}-${title}`;
  let n = 2;
  while (used.has(slug)) slug = `${type}-${title}-${n++}`;
  used.add(slug);
  return slug;
}

function typeOfDir(name) {
  if (/2D/i.test(name)) return "2d";
  if (/3D/i.test(name)) return "3d";
  return "other";
}

function typeLabel(type) {
  return type === "2d" ? "2D 插畫" : type === "3d" ? "3D 美術" : "其他創作";
}

/* ---------- 掃描 ---------- */
const groups = new Map(); // key: type|title
const warnings = [];

for (const entry of fs.readdirSync(artworksRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dirPath = path.join(artworksRoot, entry.name);
  const type = typeOfDir(entry.name);

  for (const sub of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const subPath = path.join(dirPath, sub.name);
    if (sub.isDirectory()) {
      if (sub.name !== FEATURED_DIR) {
        warnings.push(`未處理的子資料夾：${entry.name}/${sub.name}`);
        continue;
      }
      for (const img of fs.readdirSync(subPath)) {
        if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(img)) continue;
        addItem(type, true, path.posix.join(entry.name, sub.name, img));
      }
      continue;
    }
    if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(sub.name)) continue;
    addItem(type, false, path.posix.join(entry.name, sub.name));
  }
}

function addItem(type, featured, relPath) {
  const fileName = relPath.split("/").pop();
  const title = titleFromFilename(fileName);
  if (!title) {
    warnings.push("無法產生標題的檔案：" + relPath);
    return;
  }
  // 路徑以專案根目錄為基準（包含 artworks/ 前綴）
  const urlPath = "artworks/" + relPath;
  const key = `${type}|${title}`;
  if (!groups.has(key)) groups.set(key, { type, title, featured, images: [] });
  const group = groups.get(key);
  group.featured = group.featured || featured;
  group.images.push({ path: urlPath, n: trailingNumber(fileName) });
}

/* ---------- 組成作品 ---------- */
const usedSlugs = new Set();
const works = [];

for (const group of groups.values()) {
  group.images.sort((a, b) => a.n - b.n);
  const slug = slugify(group.type, group.title, usedSlugs);
  const tag = seriesTag(group.title);
  const cover = group.images[0];
  const rest = group.images.slice(1);

  works.push({
    id: slug,
    slug,
    title: group.title,
    type: group.type,
    coverImage: cover.path,
    description: "",
    tags: tag ? [tag] : [],
    featured: group.featured,
    sortOrder: group.featured ? 0 : 1000, // 精選由小到大排前面，其餘交給網頁端隨機
    demo: false,
    story: {},
    gallery: rest.map((img, i) => ({
      src: img.path,
      alt: `${group.title}（${typeLabel(group.type)}）作品圖片 ${i + 2}`,
      caption: "",
    })),
    process: [],
  });
}

// 精選作品依照標題排定固定順序
const featured = works.filter((w) => w.featured).sort((a, b) => a.title.localeCompare(b.title, "zh-Hant"));
featured.forEach((w, i) => (w.sortOrder = i + 1));

works.sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  if (a.featured && b.featured) return a.sortOrder - b.sortOrder;
  return a.title.localeCompare(b.title, "zh-Hant");
});

/* ---------- 輸出 ---------- */
const banner = `/* =========================================================
   ArtScope — 作品資料（自動產生，請勿手工修改）
   來源：artworks/ 資料夾
   產生方式：node tools/generate-artworks.mjs
   新增／移除作品圖片後請重新執行一次。
   ========================================================= */
window.ARTSCOPE_ARTWORKS = `;

fs.writeFileSync(outFile, banner + JSON.stringify(works, null, 2) + "\n", "utf8");

const featuredCount = works.filter((w) => w.featured).length;
const imageCount = works.reduce((sum, w) => sum + 1 + w.gallery.length, 0);
console.log(`已產生 ${outFile}`);
console.log(`作品 ${works.length} 件（精選 ${featuredCount} 件），圖片共 ${imageCount} 張`);
if (warnings.length) console.log("警告：\n" + warnings.join("\n"));
