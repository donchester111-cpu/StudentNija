// build.js
const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');
const { minify } = require('html-minifier');
const CleanCSS = require('clean-css');

const OUT_DIR = 'dist';

fs.emptyDirSync(OUT_DIR);

async function bundleJS() {
  await esbuild.build({
    entryPoints: ['app.js'],
    bundle: true,
    outfile: `${OUT_DIR}/app.js`,
    minify: true,
    sourcemap: false,
    format: 'esm',
    external: ['https://cdn.socket.io/*'],
  });
  console.log('✅ app.js bundled & minified');
}

const htmlFiles = [
  'index.html',
  'ai.html',
  'studygroups.html',
  'exams.html',
  'offline.html',
  '404.html',
  '505.html',
  'errors.html',
  'credit_page',
  'studentnija_sync.html',
];

function minifyHTML(file) {
  let html = fs.readFileSync(file, 'utf8');
  if (file === 'index.html') {
    html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
  }
  const result = minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
  });
  fs.writeFileSync(path.join(OUT_DIR, file), result);
  console.log(`✅ ${file} minified`);
}

function minifyCSS() {
  const files = ['style.css'];
  files.forEach(file => {
    const input = fs.readFileSync(file, 'utf8');
    const output = new CleanCSS({ level: 2 }).minify(input).styles;
    fs.writeFileSync(path.join(OUT_DIR, file), output);
    console.log(`✅ ${file} minified`);
  });
}

function copyAssets() {
  const assets = ['manifest.json', 'sw.js', 'notifications.js', 'icons/'];
  assets.forEach(item => {
    if (fs.existsSync(item)) {
      fs.copySync(item, path.join(OUT_DIR, item));
      console.log(`✅ Copied ${item}`);
    }
  });
}

(async () => {
  await bundleJS();
  htmlFiles.forEach(f => minifyHTML(f));
  minifyCSS();
  copyAssets();
  console.log('🎉 Build complete! Output in /dist');
})();
