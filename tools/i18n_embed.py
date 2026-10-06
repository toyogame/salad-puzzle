#!/usr/bin/env python3
"""i18n.json（翻訳表）を index.html に埋めこむ。

使い方（リポジトリのルートで）:
    python3 tools/i18n_embed.py

i18n.json の形: { "日本語の文（キー）": { "en": "...", "zh-Hans": "...", "zh-Hant": "...", "ko": "..." }, ... }
index.html の <!-- I18N-START --> 〜 <!-- I18N-END --> を、言語ごとの表 window.I18N に置きかえる。
文を足したり変えたりしたら、i18n.json を直してからこれを実行する（足りない訳は smoke_test が教えてくれる）。
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
LANGS = ['en', 'zh-Hans', 'zh-Hant', 'ko']


def main():
    tr = json.loads((ROOT / 'i18n.json').read_text(encoding='utf-8'))
    table = {l: {} for l in LANGS}
    for k, v in tr.items():
        for l in LANGS:
            if v.get(l) is not None:
                table[l][k] = v[l]
    js = json.dumps(table, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    block = '<!-- I18N-START -->\n<script>window.I18N=' + js + ';</script>\n<!-- I18N-END -->'
    p = ROOT / 'index.html'
    s = p.read_text(encoding='utf-8')
    if '<!-- I18N-START -->' in s:
        s = re.sub(r'<!-- I18N-START -->[\s\S]*?<!-- I18N-END -->', lambda m: block, s)
    else:
        anchor = "<script>\n'use strict';"
        if anchor not in s:
            sys.exit('i18n_embed: 埋めこみ位置が見つかりません')
        s = s.replace(anchor, block + '\n' + anchor, 1)
    p.write_text(s, encoding='utf-8')
    print(f'{p}: {len(tr)} 件 × {len(LANGS)} 言語を埋めこみました')


if __name__ == '__main__':
    main()
