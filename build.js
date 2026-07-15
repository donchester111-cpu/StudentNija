// build.js – Minify assets (HTML + CSS + JS) using Terser (no esbuild)
const fs = require('fs-extra');
const path = require('path');
const { minify: minifyHTML } = require('html-minifier');
const CleanCSS = require('clean-css');
const { minify: minifyJS } = require('terser');   // <-- only Terser

const OUT_DIR = 'dist';

fs.emptyDirSync(OUT_DIR);

// 1. Minify HTML files (update names if needed)
const htmlFiles = [
  'index.html',
  'ai.html',
  'studygroups.html',
  'exams.html',
  'offline.html',
  '404.html',
  '505.html',
  'errors.html',
  'credit_page.html',
  'studentnija_sync.html',
];

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  ${file} not found, skipping.`);
    return;
  }
  let html = fs.readFileSync(file, 'utf8');
  if (file === 'index.html') {
    html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
  }
  const result = minifyHTML(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: false,
  });
  fs.writeFileSync(path.join(OUT_DIR, file), result);
  console.log(`✅ ${file} minified`);
});

// 2. Minify CSS
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

// 3. Minify JavaScript files with Terser (ignores import rules)
const jsFiles = fs.readdirSync('.')
  .filter(f => f.endsWith('.js') && f !== 'build.js');

(async () => {
  for (const file of jsFiles) {
    const input = fs.readFileSync(file, 'utf8');
    try {
      const result = await minifyJS(input, {
        compress: true,
        mangle: true,
        output: { comments: false },
        module: false,
      });
      if (result.code) {
        fs.writeFileSync(path.join(OUT_DIR, file), result.code);
        console.log(`✅ ${file} minified`);
      } else {
        console.warn(`⚠️  ${file} produced no output`);
      }
    } catch (err) {
      console.error(`❌ Failed to minify ${file}:`, err.message);
    }
  }
  console.log('🎉 Build complete! Output in /dist');
})();

// 4. Copy static assets
const assets = ['manifest.json', 'sw.js', 'notifications.js', 'icons/'];
assets.forEach(item => {
  if (fs.existsSync(item)) {
    fs.copySync(item, path.join(OUT_DIR, item));
    console.log(`✅ Copied ${item}`);
  } else {
    console.warn(`⚠️  ${item} not found, skipping.`);
  }
});
