#!/usr/bin/env python3
"""index.html から claude.ai アーティファクト用の HTML を作る。

使い方（リポジトリのルートで）:
    python3 tools/build_artifact.py [--out dist/salad-artifact.html] [--url <投稿文に入れるURL（ふつうは不要）>]

アーティファクト版でのちがい:
  - <!doctype>/<html>/<head>/<body> は付けない（公開時に自動で付く）。<title> を先頭に置く
  - 画像保存は downloads 機能（window.claude.use('downloads')）を使う
  - 共有シート（navigator.share）は使えないので外す
  - 投稿文に入れるゲームのURLは本体と同じ（GitHub Pages）。--url で変えられる
  - ?unlock=1 は使えないので無効
  - アクセス解析（GoatCounter）は外す
"""
import argparse, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_URL = None   # 投稿文のURLは index.html の GAME_URL（GitHub Pages）をそのまま使う


def build(src: str, url: str) -> str:
    s = src

    def rep(a, b):
        nonlocal s
        if a not in s:
            sys.exit(f'build_artifact: 置きかえ元が見つかりません: {a[:70]!r}')
        s = s.replace(a, b, 1)

    s = re.sub(r'<!doctype html>\s*<html lang="ja">\s*<head>\s*', '', s)
    s = re.sub(r'<meta[^>]*>\s*', '', s)
    s = re.sub(r'<link rel="(icon|apple-touch-icon)"[^>]*>\s*', '', s)
    s = re.sub(r'<!-- (Xなどに貼ったとき|ANALYTICS)[^>]*-->\s*', '', s)
    rep('</head>\n<body>\n', '')
    rep('</body>\n</html>\n', '')
    m = re.search(r'<title>[^<]*</title>\n', s)
    title = m.group(0)
    s = title + s.replace(title, '', 1)
    rep(':root{\n', '/* Layout: one-screen pixel game; a single committed light look (cream table-cloth), not theme-switched */\n:root{\n  color-scheme:light;\n')
    rep('.row>.btn{flex:1}', '.row>.btn{flex:1}\na.btn{display:flex;align-items:center;justify-content:center;text-decoration:none;color:inherit}\n'
        '.btn:focus-visible,.it:focus-visible,.tab:focus-visible,.card:focus-visible{outline:3px solid var(--orange);outline-offset:2px}\n'
        '@media (prefers-reduced-motion:reduce){.rankline b,.scorebox.bump{animation:none}}')
    if url:
        s = re.sub(r"const GAME_URL='[^']*';", lambda m: f"const GAME_URL='{url}';", s, count=1)
    rep('function download(blob,name)', """let DL=null;
if(window.claude&&window.claude.use)window.claude.use('downloads').then(d=>{DL=d;if(!d)document.querySelectorAll('#btnSave,[data-save],#lbSave,#shSave').forEach(b=>b.hidden=true);}).catch(()=>{});
function download(blob,name)""")
    a, b = s.index('// SAVE-IMPL-START'), s.index('// SAVE-IMPL-END')
    s = s[:a] + """// SAVE-IMPL-START
async function saveImages(list){
  if(!DL){toast(T('この画面では画像を保存できません。拡大してスクリーンショットを使ってね'));return;}
  const bl=await R_last.blobs;let n=0;
  for(const i of list){if(!bl[i])continue;
    try{await DL.save({filename:FILES[i],data:bl[i]});n++;}
    catch(e){const c=e&&e.code;if(c==='declined')break;toast(c==='rate_limited'?T('少し待ってからもう一度押してね'):T('画像を保存できませんでした'));return;}}
  if(n)toast(T('画像を{0}枚保存しました',n));
}
async function saveBlob(blob,name){if(!DL)return;try{await DL.save({filename:name,data:blob});}catch(_){}}
""" + s[b:]
    a, b = s.index('// NATIVE-SHARE-START'), s.index('// NATIVE-SHARE-END')
    s = s[:a] + 'function canNative(){return false;}   // アーティファクトでは共有シートが使えない\nfunction canShareFile(){return false;}\nasync function shareFile(){return false;}\n' + s[b:]
    rep('const UNLOCK = /[?&]unlock=1/.test(location.search);', 'const UNLOCK = false;')
    # アクセス解析は GitHub Pages 版だけ（アーティファクトでは外部のスクリプトを読めない）
    s = re.sub(r'<script data-goatcounter=[^>]*></script>\s*', '', s)
    s = s.replace('const ANALYTICS={enabled:true};', 'const ANALYTICS={enabled:false};', 1)
    assert 'navigator.share' not in s
    return s


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', default=str(ROOT / 'index.html'))
    ap.add_argument('--out', default=str(ROOT / 'dist' / 'salad-artifact.html'))
    ap.add_argument('--url', default=DEFAULT_URL, help='投稿文に入れるゲームのURL')
    a = ap.parse_args()
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    html = build(pathlib.Path(a.src).read_text(encoding='utf-8'), a.url)
    out.write_text(html, encoding='utf-8')
    print(f'{out} ({len(html)} chars)')


if __name__ == '__main__':
    main()
