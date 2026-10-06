// 公開用の画像を作る：Xのカード画像 ogp.png（1200×630）とアイコン icon.png（192×192）
// 使い方: node tools/make_images.js [--font-css /path/to/@fontsource/dotgothic16/400.css]
//   ネットから DotGothic16 が読めない環境では、npm の @fontsource/dotgothic16 の CSS を指定するとドット文字で描けます
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const ROOT = path.resolve(__dirname, '..');
const fi = process.argv.indexOf('--font-css'), FONT_CSS = fi > 0 ? process.argv[fi + 1] : null;

(async () => {
  const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto('file://' + path.join(ROOT, 'index.html')); await p.waitForTimeout(300);
  if (FONT_CSS) await p.addStyleTag({ url: 'file://' + path.resolve(FONT_CSS) });
  const out = await p.evaluate(async () => {
    const TXT = 'サラダパズルお題のカロリーと栄養素にぴったり合わせて盛りつけよう朝・昼・夜に新しいお題あそぶ▶';
    try { await document.fonts.load('60px "DotGothic16"', TXT); await document.fonts.ready; } catch (_) {}
    const F = s => `${s}px "DotGothic16", monospace`;
    const logo = makeChallenge('logo', null, 1, 'color', 'M', 20261005);
    // OGP
    const c = mkCanvas(1200, 630), x = c.getContext('2d');
    x.fillStyle = '#f4ecd6'; x.fillRect(0, 0, 1200, 630);
    x.fillStyle = '#e6dcc2'; for (let y = 0; y < 630; y += 24) for (let X = (y / 24 % 2) * 12; X < 1200; X += 24) x.fillRect(X, y, 4, 4);
    x.fillStyle = '#3b2f2a'; x.fillRect(20, 20, 1160, 10); x.fillRect(20, 600, 1160, 10); x.fillRect(20, 20, 10, 590); x.fillRect(1170, 20, 10, 590);
    const bowl = mkCanvas(480, 480); renderBowl(bowl.getContext('2d'), { style: 0, pieces: logo.layout, sig: logo.sig, dressing: 'sesame', strokes: autoStrokes(5), sel: -1, zoom: 3 });
    x.fillStyle = '#3b2f2a'; x.fillRect(66, 69, 492, 492); x.imageSmoothingEnabled = false; x.drawImage(bowl, 72, 75);
    x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    x.fillStyle = '#2f6b2a'; let fs = 96; x.font = F(fs); while (x.measureText('サラダパズル').width > 540) x.font = F(fs -= 4); x.fillText('サラダパズル', 600, 210);
    x.fillStyle = '#3b2f2a'; x.font = F(36); x.fillText('お題のカロリーと栄養素に', 604, 300); x.fillText('ぴったり合わせて盛りつけよう', 604, 350);
    x.fillStyle = '#8a7a6a'; x.font = F(30); x.fillText('朝・昼・夜に新しいお題', 604, 430);
    x.fillStyle = '#5aa043'; x.fillRect(604, 470, 300, 64); x.fillStyle = '#3b2f2a'; x.fillRect(604, 534, 300, 6);
    x.fillStyle = '#fff'; x.font = F(32); x.textAlign = 'center'; x.fillText('あそぶ ▶', 754, 514);
    // アイコン（ボウルの部分を切り出し）
    const big = mkCanvas(320, 320); renderBowl(big.getContext('2d'), { style: 0, pieces: logo.layout, sig: logo.sig, dressing: 'none', strokes: [], sel: -1, zoom: 2 });
    const ic = mkCanvas(192, 192), y = ic.getContext('2d'); y.fillStyle = '#f4ecd6'; y.fillRect(0, 0, 192, 192); y.imageSmoothingEnabled = false; y.drawImage(big, 16, 16, 288, 288, 0, 0, 192, 192);
    return [c.toDataURL('image/png'), ic.toDataURL('image/png'), document.fonts.check('40px "DotGothic16"', 'サ')];
  });
  const fs = require('fs');
  fs.writeFileSync(path.join(ROOT, 'ogp.png'), Buffer.from(out[0].split(',')[1], 'base64'));
  fs.writeFileSync(path.join(ROOT, 'icon.png'), Buffer.from(out[1].split(',')[1], 'base64'));
  console.log('ogp.png / icon.png を作成しました' + (out[2] ? '' : '（DotGothic16 が読めず、代わりの書体で描いています）'));
  await b.close();
})();
