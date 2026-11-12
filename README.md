# Film Stock Scanner

Scanner web per le lattine di pellicola Kodak: inquadra i codici a barre GS1-128 dell'etichetta con la fotocamera dell'iPhone e i rulli vengono aggiunti all'inventario, divisi per formato (35mm/16mm), emulsione (500T, 200T, 250D, 50D…) e lunghezza.

**App:** https://filippoandreoni.github.io/film-stock-scanner/

## Come legge i codici
Ogni lattina ha due codici:
- `(01)GTIN(30)01` – identifica il prodotto → ignorato
- `(3220)000400(10)5219713011010612` – lunghezza (piedi; `3110` = metri) + lotto → **aggiunge il rullo**

Lotto: `5219` pellicola · `713` emulsione · `011.01` · `6.12` rullo. Prima cifra 5 = 35mm, 7 = 16mm. Lotti già presenti vengono ignorati.

## Sviluppo
`index.html` è autonomo (decoder zxing-wasm incluso). Per rigenerarlo:
```
cd src && npm i zxing-wasm && node build.js   # legge template.html + parser.js
node test.js                                   # test del parser
```
L'inventario è salvato nel browser (localStorage); esporta il CSV per conservarlo.
