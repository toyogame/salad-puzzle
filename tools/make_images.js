// 公開用の画像を作る：Xのカード画像 ogp.png（1200×630、言語別に ogp-en.png など）とアイコン icon.png（192×192）
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
  const fs = require('fs');
  // 言語ごとのカード画像：日本語は ogp.png、ほかは ogp-en.png など（i18n.json の訳を使う）
  const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n.json'), 'utf8'));
  const LANGS = [['ja', 'ogp.png'], ['en', 'ogp-en.png'], ['zh-Hans', 'ogp-zh-hans.png'], ['zh-Hant', 'ogp-zh-hant.png'], ['ko', 'ogp-ko.png']];
  // ドット書体は 16px 刻み（32px＝2倍）だと点がくっきり出る
  // 先に全言語の文字をフォントに読みこませておく（分割されたフォントの読みこみ待ち）
  const ALL = LANGS.map(([lang]) => ['サラダパズル', 'お題のカロリーと栄養素に', 'ぴったり合わせて盛りつけよう', '朝・昼・夜に新しいお題', 'あそぶ ▶'].map(k => lang === 'ja' ? k : ((tr[k] || {})[lang] || k)).join('')).join('');
  await p.evaluate(async (t) => { for (const sz of [30, 32, 36, 60, 96]) { try { await document.fonts.load(`${sz}px "DotGothic16"`, t); } catch (_) {} } await document.fonts.ready; }, ALL);
  await p.waitForTimeout(500);
  for (const [lang, file] of LANGS) {
    const t = k => lang === 'ja' ? k : ((tr[k] || {})[lang] || k);
    const L = { title: t('サラダパズル'), l1: t('お題のカロリーと栄養素に'), l2: t('ぴったり合わせて盛りつけよう'), l3: t('朝・昼・夜に新しいお題'), btn: t('あそぶ ▶') };
    const out = await p.evaluate(async (L) => {
      const TXT = Object.values(L).join('');
      try { await document.fonts.load('60px "DotGothic16"', TXT); await document.fonts.ready; } catch (_) {}
      const F = s => `${s}px "DotGothic16", monospace`;
      const fit = (x, txt, max, size) => { let s = size; x.font = F(s); while (s > 16 && x.measureText(txt).width > max) x.font = F(s -= 2); };
      const logo = makeChallenge('logo', null, 1, 'color', 'M', 20261005);
      const c = mkCanvas(1200, 630), x = c.getContext('2d');
      x.fillStyle = '#f4ecd6'; x.fillRect(0, 0, 1200, 630);
      x.fillStyle = '#e6dcc2'; for (let y = 0; y < 630; y += 24) for (let X = (y / 24 % 2) * 12; X < 1200; X += 24) x.fillRect(X, y, 4, 4);
      x.fillStyle = '#3b2f2a'; x.fillRect(20, 20, 1160, 10); x.fillRect(20, 600, 1160, 10); x.fillRect(20, 20, 10, 590); x.fillRect(1170, 20, 10, 590);
      const bowl = mkCanvas(480, 480); renderBowl(bowl.getContext('2d'), { style: 0, pieces: logo.layout, sig: logo.sig, bs: logo.bs, dressing: 'sesame', strokes: autoStrokes(5, logo.bs), sel: -1, zoom: 3 });
      x.fillStyle = '#3b2f2a'; x.fillRect(66, 69, 492, 492); x.imageSmoothingEnabled = false; x.drawImage(bowl, 72, 75);
      x.textBaseline = 'alphabetic'; x.textAlign = 'left';
      x.fillStyle = '#2f6b2a'; fit(x, L.title, 540, 96); x.fillText(L.title, 600, 210);
      x.fillStyle = '#3b2f2a'; fit(x, L.l1, 540, 32); x.fillText(L.l1, 604, 300); fit(x, L.l2, 540, 32); x.fillText(L.l2, 604, 348);
      x.fillStyle = '#8a7a6a'; fit(x, L.l3, 540, 32); x.fillText(L.l3, 604, 430);
      x.fillStyle = '#5aa043'; x.fillRect(604, 470, 300, 64); x.fillStyle = '#3b2f2a'; x.fillRect(604, 534, 300, 6);
      x.fillStyle = '#fff'; x.textAlign = 'center'; fit(x, L.btn, 270, 32); x.fillText(L.btn, 754, 514);
      return c.toDataURL('image/png');
    }, L);
    fs.writeFileSync(path.join(ROOT, file), Buffer.from(out.split(',')[1], 'base64'));
  }
  // アイコン（ボウルの部分を切り出し）
  const icon = await p.evaluate(() => {
    const logo = makeChallenge('logo', null, 1, 'color', 'M', 20261005);
    const big = mkCanvas(320, 320); renderBowl(big.getContext('2d'), { style: 0, pieces: logo.layout, sig: logo.sig, bs: logo.bs, dressing: 'none', strokes: [], sel: -1, zoom: 2 });
    const ic = mkCanvas(192, 192), y = ic.getContext('2d'); y.fillStyle = '#f4ecd6'; y.fillRect(0, 0, 192, 192); y.imageSmoothingEnabled = false; y.drawImage(big, 16, 16, 288, 288, 0, 0, 192, 192);
    return [ic.toDataURL('image/png'), document.fonts.check('40px "DotGothic16"', 'サ')];
  });
  fs.writeFileSync(path.join(ROOT, 'icon.png'), Buffer.from(icon[0].split(',')[1], 'base64'));
  console.log('ogp.png（＋各言語）/ icon.png を作成しました' + (icon[1] ? '' : '（DotGothic16 が読めず、代わりの書体で描いています）'));
  await b.close();
})();
