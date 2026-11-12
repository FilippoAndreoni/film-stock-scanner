const fs=require('fs');
let html=fs.readFileSync('template.html','utf8');
const lib=fs.readFileSync('node_modules/zxing-wasm/dist/iife/reader/index.js','utf8').replace(/<\/script/gi,'<\\/script');
const parser=fs.readFileSync('parser.js','utf8');
const wasm=fs.readFileSync('node_modules/zxing-wasm/dist/reader/zxing_reader.wasm').toString('base64');
html=html.replace('/*__ZXING__*/',()=>lib).replace('/*__PARSER__*/',()=>parser).replace('__WASM_B64__',()=>wasm);
fs.writeFileSync('../index.html',html);
console.log('index.html', (html.length/1024/1024).toFixed(2),'MB');
