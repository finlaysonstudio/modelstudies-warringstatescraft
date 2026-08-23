# Period search terms 🈶

Classical Chinese starter terms for `--use prompt --collection period`. Counts measured
2026-08-23 against the 52-document period collection: documents matched, then the three
top-ranked documents with their occurrence counts. Use these as seeds and read the hit to find
better neighboring vocabulary.

| Term | Gloss | Docs | Top hits |
|---|---|---:|---|
| 質子 | hostage prince | 9 | zhanguoce 15, shiji 12, guoyu 2 |
| 人質 | hostage | 6 | lunheng 3, zizhitongjian 1, zhanguoce 2 |
| 會盟 | sworn meeting | 7 | shiji 11, gongyang 4, zizhitongjian 2 |
| 盟誓 | covenant oath | 6 | zuozhuan 14, hanshiwaizhuan 1, xunzi 1 |
| 合從 | vertical alliance | 8 | zhanguoce 60, shiji 30, zizhitongjian 12 |
| 連橫 | horizontal alliance | 5 | zhanguoce 20, yantielun 2, qianfulun 1 |
| 使者 | envoy | 34 | hanshu 447, shiji 230, zizhitongjian 53 |
| 行人 | envoy (office) | 27 | zuozhuan 84, gongyang 20, zhouli 11 |
| 反間 | counter-intelligence | 6 | zhanguoce 10, sunzi 5, zizhitongjian 5 |
| 間諜 | spy | 6 | wuzi 2, weiliaozi 1, liutao 1 |
| 假道 | borrowed road, right of passage | 20 | zuozhuan 23, lvshichunqiu 8, wuyuechunqiu 4 |
| 攻城 | siege | 17 | liutao 9, mozi 8, sunzi 3 |
| 圍城 | invested city | 6 | mozi 4, wuzi 1, shangjunshu 1 |
| 糴 | buying grain | 22 | guoyu 15, yuejueshu 11, wuyuechunqiu 10 |
| 糶 | selling grain | 8 | guanzi 12, shangjunshu 2, wuyuechunqiu 2 |
| 饑 | famine | 36 | yantielun 60, mengzi 44, yanzichunqiu 20 |
| 荒 | dearth, waste | 34 | yizhoushu 42, zhouli 21, shangjunshu 14 |
| 鹽鐵 | salt and iron | 7 | hanshu 79, yantielun 51, qianfulun 4 |
| 刺客 | assassin | 6 | zhanguoce 10, shiji 7, zizhitongjian 2 |
| 戍 | garrison duty | 24 | zuozhuan 94, gongyang 30, yantielun 24 |
| 徵兵 | levy troops | 3 | shiji 7, hanshu 6, zhanguoce 2 |
| 隄 | dike | 13 | hanshu 111, lvshichunqiu 5, guanzi 5 |
| 決水 | breaching water | 7 | lunheng 3, guiguzi 2, huainanzi 2 |
| 水利 | waterworks | 4 | zhanguoce 2, shiji 2, lvshichunqiu 1 |
| 鑄錢 | minting coin | 5 | hanshu 80, shiji 21, yantielun 4 |
| 刀布 | knife and cloth money | 5 | guanzi 6, xunzi 4, yantielun 2 |
| 戶籍 | household register | 3 | guanzi 4, hanshu 2, shiji 1 |
| 版圖 | registers and maps | 4 | zhouli 3, xunzi 1, shiji 1 |
| 變法 | reform of the laws | 12 | xinxu 8, shangjunshu 5, yantielun 4 |
| 遷都 | move the capital | 2 | zizhitongjian 3, hanshu 1 |
| 弒 | regicide | 32 | gongyang 248, guliang 97, zuozhuan 166 |
| 叛 | revolt | 30 | zuozhuan 288, guoyu 54, guliang 21 |

## Terms that return nothing

`兵役` and `叛亂` match zero documents. Both are modern compounds. When a term returns zero,
the vocabulary is wrong before the corpus is thin: try the classical compound (`戍`, `叛`) or
a single character.

## Reading the results

High document counts (`使者` at 34) mean the term is ambient and the ranking is doing little.
Pair an ambient term with a specific one so coverage scaling favors the passage that carries
both. Low counts on a specific compound (`刺客` at 6) are the useful case: those six documents
are the episode reservoir.
