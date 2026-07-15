// build.js – Full project build (HTML + CSS + JS minification, asset copy)
const fs = require('fs-extra');
const path = require('path');
const { minify: minifyHTML } = require('html-minifier');
const CleanCSS = require('clean-css');
const { minify: minifyJS } = require('terser');

const OUT_DIR = 'dist';

// Clean output
fs.emptyDirSync(OUT_DIR);

// ──────────────────────────────────────────────
// 1. Minify HTML files (list all HTML pages you actually have)
// ──────────────────────────────────────────────
const htmlFiles = [
  'index.html',
  'ai.html',
  'studygroups.html',
  'exams.html',
  'credit_page.html',
  'offline.html',
  '404.html',
  '505.html',
  'errors.html',
  'studentnija_sync.html',
];

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  ${file} not found, skipping.`);
    return;
  }
  let html = fs.readFileSync(file, 'utf8');
  // Remove importmap from index.html (not needed)
  if (file === 'index.html') {
    html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/gi, '');
  }
  const result = minifyHTML(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: false,           // we'll minify JS separately
  });
  fs.writeFileSync(path.join(OUT_DIR, file), result);
  console.log(`✅ ${file} minified`);
});

// ──────────────────────────────────────────────
// 2. Minify CSS files (add any other stylesheets)
// ──────────────────────────────────────────────
const cssFiles = ['style.css'];
cssFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  ${file} not found, skipping.`);
    return;
  }
  const input = fs.readFileSync(file, 'utf8');
  const output = new CleanCSS({ level: 2 }).minify(input).styles;
  fs.writeFileSync(path.join(OUT_DIR, file), output);
  console.log(`✅ ${file} minified`);
});

// ──────────────────────────────────────────────
// 3. Minify all JavaScript files (including pages/ and tools/)
//    Uses Terser to avoid import errors; keeps directory structure.
// ──────────────────────────────────────────────
(async () => {
  // Get all .js files recursively, excluding build script and non‑source folders
  const allJsFiles = fs.readdirSync('.', { recursive: true, withFileTypes: true })
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.js'))
    .map(dirent => path.join(dirent.path, dirent.name).replace(/^\.\//, '')) // make relative
    .filter(file => {
      // exclude build script, node_modules, dist, backend, any hidden
      return !file.startsWith('build.') &&
             !file.startsWith('node_modules') &&
             !file.startsWith('dist') &&
             !file.startsWith('backend');
    });

  for (const file of allJsFiles) {
    try {
      const input = fs.readFileSync(file, 'utf8');
      const result = await minifyJS(input, {
        compress: true,
        mangle: true,
        output: { comments: false },
        module: false,    // treat as regular script – won't check imports
      });
      if (result.code) {
        const outPath = path.join(OUT_DIR, file);
        fs.ensureDirSync(path.dirname(outPath));
        fs.writeFileSync(outPath, result.code);
        console.log(`✅ ${file} minified`);
      } else {
        console.warn(`⚠️  ${file} produced no output`);
      }
    } catch (err) {
      console.error(`❌ Failed to minify ${file}:`, err.message);
    }
  }

  // ──────────────────────────────────────────────
  // 4. Copy static assets
  // ──────────────────────────────────────────────
  const staticAssets = ['manifest.json', 'icons/', 'sw.js', 'notifications.js'];
  staticAssets.forEach(item => {
    if (fs.existsSync(item)) {
      fs.copySync(item, path.join(OUT_DIR, item));
      console.log(`✅ Copied ${item}`);
    } else {
      console.warn(`⚠️  ${item} not found, skipping.`);
    }
  });

  console.log('🎉 Build complete! Output in /dist');
})();
