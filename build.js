// build.js – Minify all assets without bundling (no import errors)
const fs = require('fs-extra');
const path = require('path');
const { minify: minifyHTML } = require('html-minifier');
const CleanCSS = require('clean-css');
const esbuild = require('esbuild');

const OUT_DIR = 'dist';

// Clean output directory
fs.emptyDirSync(OUT_DIR);

// 1. Minify HTML files (updated list – make sure these names match your repo exactly)
const htmlFiles = [
  'index.html',
  'ai.html',
  'studygroups.html',
  'exams.html',
  'offline.html',
  '404.html',
  '505.html',
  'errors.html',
  'credit_page.html',      // ensure this is the exact filename
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
    html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
  }
  const result = minifyHTML(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: false,         // we handle JS separately
  });
  fs.writeFileSync(path.join(OUT_DIR, file), result);
  console.log(`✅ ${file} minified`);
});

// 2. Minify CSS files
const cssFiles = ['style.css'];   // add others if you have them
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

// 3. Minify all JavaScript files individually (no bundling, no import errors)
const jsFiles = fs.readdirSync('.')
  .filter(f => f.endsWith('.js') && f !== 'build.js');   // exclude build script itself

(async () => {
  for (const file of jsFiles) {
    const input = fs.readFileSync(file, 'utf8');
    try {
      const result = await esbuild.transform(input, {
        loader: 'js',
        minify: true,
        format: 'esm',      // keep ES module syntax
        target: 'es2020',
      });
      fs.writeFileSync(path.join(OUT_DIR, file), result.code);
      console.log(`✅ ${file} minified`);
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
