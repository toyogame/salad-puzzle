#!/usr/bin/env python3
"""言語別の入口ページ（en/ zh-hans/ zh-hant/ ko/）を作る。Xなどに貼ったときのカードをその言語にするため。

使い方（リポジトリのルートで）:
    python3 tools/lang_pages.py

各ページは、その言語の og:title / og:description / og:image（ogp-xx.png）だけを持ち、開くとすぐゲーム本体（../）へ移る。
ゲームの言語は本体で端末の言語から決まる（お題のリンクの #q=… はそのまま引きつぐ）。
カード画像は tools/make_images.js で作る。
"""
import json, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = 'https://toyogame.github.io/salad-puzzle/'
LANGS = [  # (言語, フォルダ, og:locale)
    ('en', 'en', 'en_US'), ('zh-Hans', 'zh-hans', 'zh_CN'), ('zh-Hant', 'zh-hant', 'zh_TW'), ('ko', 'ko', 'ko_KR'),
]
DESC = '具材を盛りつけて、お題のカロリーと栄養素にぴったり合わせるドット絵のパズル。朝・昼・夜に新しいお題。'

PAGE = '''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{title}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{site}{dir}/">
<meta property="og:image" content="{site}ogp-{dir}.png">
<meta property="og:locale" content="{locale}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../icon.png">
<!-- このページはカード用の入口。開いたらゲーム本体へ（#q=… のお題リンクも引きつぐ） -->
<script>location.replace('../'+location.hash);</script>
<meta http-equiv="refresh" content="0; url=../">
</head>
<body style="background:#f4ecd6;font-family:sans-serif;text-align:center;padding:40px 16px"><a href="../">{title}</a></body>
</html>
'''


def main():
    tr = json.loads((ROOT / 'i18n.json').read_text(encoding='utf-8'))
    for lang, d, loc in LANGS:
        t = lambda k: tr[k][lang]
        out = PAGE.format(lang=lang, title=html.escape(t('サラダパズル')), desc=html.escape(t(DESC)), site=SITE, dir=d, locale=loc)
        (ROOT / d).mkdir(exist_ok=True)
        (ROOT / d / 'index.html').write_text(out, encoding='utf-8')
        print(f'{d}/index.html')


if __name__ == '__main__':
    main()
