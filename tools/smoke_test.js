// サラダパズルの動作チェック（Playwright）
// 使い方: node tools/smoke_test.js [--artifact]
//   PLAYWRIGHT_CHROMIUM=/path/to/chromium で実行ブラウザを指定できます
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (_) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const ROOT = path.resolve(__dirname, '..');
const ART = process.argv.includes('--artifact');
const fs = require('fs');

function pageUrl() {
  if (!ART) return 'file://' + path.join(ROOT, 'index.html');
  // アーティファクト版は公開時に付く骨組みを足して開く
  const body = fs.readFileSync(path.join(ROOT, 'dist', 'salad-artifact.html'), 'utf8');
  const tmp = path.join(ROOT, 'dist', '_wrapped.html');
  fs.writeFileSync(tmp, '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + body + '</body></html>');
  return 'file://' + tmp;
}

const checks = [];
const ok = (name, cond, info = '') => { checks.push([name, !!cond, info]); };

(async () => {
  const b = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {});
  const errs = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo', locale: 'ja-JP' });
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(pageUrl()); await p.waitForTimeout(400);

  // 1) どのお題もお手本どおりに盛ればPERFECTになる
  const solv = await p.evaluate(() => { let bad = 0, n = 0; for (let d = 1; d <= 60; d++) for (let s = 0; s < 3; s++) { const ch = getChallenge('2030-01-' + d, s), t = totals(ch.layout, ch.ref.dr); useBowl(ch.bs); t.fill = coverageOf(ch.layout, ch.sig); useBowl(1); n++; if (!scoreOf(ch, t).all) bad++; } return { n, bad }; });
  ok('お題はすべて解ける', solv.bad === 0, JSON.stringify(solv));
  const hl = await p.evaluate(() => { let bad = 0; for (let d = 1; d <= 60; d++) for (let s = 0; s < 3; s++) { const ch = getChallenge('2030-02-' + (d % 28 + 1), s); if (healthMiss(ch.refT, ch.kind) > 0) bad++; } return bad; });
  ok('お題のお手本は健康的な範囲', hl === 0, 'NG ' + hl);
  const cu = await p.evaluate(() => new Promise(res => {
    const def = { n: 'テスト<b>', d: '', s: 'M', g: 2.1, m: [['kcal', 200, 350], ['p', 10, null], ['salt', null, 2], ['fill', 50, null], ['dg', null, 0]] };
    const code = encodeDef(def), back = decodeDef(code), ch = customChallenge(code);
    findRef(ch, null, r => res({ round: back && back.n === 'テストb' && back.m.length === 5, bad: decodeDef('xx!!') === null, found: !!r, ok: !!r && refOk(ch, r) }));
  }));
  ok('オリジナルのお題（コード・お手本さがし）', cu.round && cu.bad && cu.found && cu.ok, JSON.stringify(cu));

  // 2) 実際に遊んで完成まで（通常採点）
  await p.click('#featured .card'); await p.waitForTimeout(200);
  const it = await p.locator('#items .it').first().boundingBox(), bw = await p.locator('#bowl').boundingBox();
  await p.mouse.move(it.x + 20, it.y + 20); await p.mouse.down(); await p.mouse.move(bw.x + bw.width / 2, bw.y + bw.height / 2, { steps: 8 }); await p.mouse.up();
  ok('ドラッグで盛りつけ', await p.evaluate(() => G.pieces.length === 1));
  await p.evaluate(() => { G.pieces = G.ch.layout.map(q => ({ ...q })); G.dressing = G.ch.ref.dr; G.strokes = []; if (G.ch.ref.dr && DMAP[G.ch.ref.dr].col) { let left = 240, y = 66; const h = BOWL.ri - 6; while (left > 0) { const L = Math.min(left, 2 * h); G.strokes.push({ w: 1, pts: [80 - L / 2, y, 80 + L / 2, y] }); left -= L; y += 6; } } /* お手本と同じ15g */ render(); });
  await p.click('#btnDone'); await p.waitForTimeout(600);
  ok('お手本でPERFECT', (await p.locator('#rRank').innerText()).includes('PERFECT'));
  await p.click('#card'); await p.waitForTimeout(300); ok('画像タップで拡大', await p.evaluate(() => $('#lb').classList.contains('on'))); await p.evaluate(() => closeLb());
  ok('画像は2枚とも1080x1350', await p.evaluate(() => [$('#card').width, $('#card').height, $('#card2').width, $('#card2').height].join() === '1080,1350,1080,1350'));
  await p.click('#btnShare');
  ok('投稿文の1行目', (await p.locator('#shPrev').innerText()).startsWith('🥗サラダパズル'));
  ok('投稿文のリンクは GitHub Pages', (await p.locator('#shPrev').innerText()).includes('https://toyogame.github.io/salad-puzzle/'));
  await p.click('#shClose'); await p.click('#btnHome');

  // 3) 精密採点
  await p.click('[data-mode="precise"]'); await p.click('#featured .card'); await p.waitForTimeout(200);
  const pr = await p.evaluate(() => { G.pieces = G.ch.layout.map(q => ({ ...q })); render(); return $('#gScore').textContent; });
  ok('精密採点は小数2桁', /^\d+\.\d\d$/.test(pr), pr);
  await p.click('#btnBack'); await p.click('[data-mode="normal"]');

  // 4) 食材ページ
  await p.click('#btnIng'); await p.click('.itog[data-id="kaiware"]'); await p.click('#ingBack');
  await p.click('#featured .card'); await p.waitForTimeout(200);
  ok('追加食材が出る', await p.evaluate(() => !!document.querySelector('#items .it[data-id="kaiware"]')));
  await p.click('#btnBack'); await p.click('#btnIng'); await p.click('#ingReset'); await p.click('#ingBack');

  // 5) チュートリアル
  await p.evaluate(() => store.set('dsb_tut', false)); await p.reload(); await p.waitForTimeout(300);
  await p.click('#tutGo'); await p.waitForTimeout(200);
  ok('チュートリアルが始まる', await p.isVisible('#coach'));

  ok('ページエラーなし', errs.length === 0, errs.join(' / '));

  // 多言語：コード中の T('…') がすべて訳されていて、各言語のトップ・ゲーム画面に日本語が残っていない
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n.json'), 'utf8'));
  const LL = ['en', 'zh-Hans', 'zh-Hant', 'ko'], lits = new Set(); let m; const reT = /\bT\('((?:[^'\\]|\\.)*)'/g;
  while ((m = reT.exec(src))) lits.add(m[1].replace(/\\'/g, "'"));
  const miss = [...lits].filter(k => !tr[k] || LL.some(l => tr[k][l] == null));
  ok('翻訳もれなし（コード）', miss.length === 0, miss.slice(0, 5).join(' / '));
  for (const lang of LL) {
    const q = await b.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Tokyo' }), qe = [];
    q.on('pageerror', e => qe.push(e.message));
    await q.goto(pageUrl() + '?lang=' + lang); await q.waitForTimeout(300);
    const left = async () => q.evaluate(re => { const R = new RegExp(re), out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) { const el = n.parentElement; if (!el || el.closest('script,style,#langSel,#toast') || (el.closest('.screen') && !el.closest('.screen.on')) || (el.closest('.modal') && !el.closest('.modal.on'))) continue; if (R.test(n.nodeValue)) out.push(n.nodeValue.trim()); }
      return out; }, lang.startsWith('zh') ? '[\\u3040-\\u30ff]' : '[\\u3040-\\u30ff\\u4e00-\\u9fff]');
    const l1 = await left(); await q.evaluate(() => startGame(practiceChallenge(7))); await q.waitForTimeout(200); const l2 = await left();
    ok(`多言語 ${lang}`, !qe.length && !l1.length && !l2.length, [...qe, ...l1, ...l2].slice(0, 3).join(' / '));
    const dir = { en: 'en', 'zh-Hans': 'zh-hans', 'zh-Hant': 'zh-hant', ko: 'ko' }[lang];
    const page = fs.existsSync(path.join(ROOT, dir, 'index.html')) ? fs.readFileSync(path.join(ROOT, dir, 'index.html'), 'utf8') : '';
    ok(`言語別のカード ${lang}`, await q.evaluate(d => langURL().endsWith('/' + d + '/'), dir) && page.includes(`ogp-${dir}.png`) && fs.existsSync(path.join(ROOT, `ogp-${dir}.png`)));
    await q.close();
  }
  await b.close();
  let fail = 0;
  for (const [n, c, i] of checks) { console.log(`${c ? 'OK  ' : 'NG  '}${n}${i ? '  ' + i : ''}`); if (!c) fail++; }
  process.exit(fail ? 1 : 0);
})();
