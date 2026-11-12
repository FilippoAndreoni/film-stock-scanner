// Parser per le etichette delle lattine Kodak (GS1-128).
// Accetta SOLO il codice con lunghezza + lotto, es:
//   (3220)000400(10)5219713011010612   -> 400 ft, lotto 5219 713 011.01 6.12
//   (3110)000122(10)5274304022011306   -> 122 m,  lotto 5274 304 022.01 13.06
// Il codice (01)GTIN(30)01 viene ignorato: identifica il prodotto, non il rullo.

const FILM_STOCKS = {
  // Vision3
  "203": { line: "Vision3", speed: "50D" },
  "207": { line: "Vision3", speed: "250D" },
  "213": { line: "Vision3", speed: "200T" },
  "219": { line: "Vision3", speed: "500T" },
  // Vision2 (fuori produzione)
  "201": { line: "Vision2", speed: "50D" },
  "205": { line: "Vision2", speed: "250D" },
  "212": { line: "Vision2", speed: "100T" },
  "217": { line: "Vision2", speed: "200T" },
  "218": { line: "Vision2", speed: "500T" },
  "229": { line: "Vision2 Expression", speed: "500T" },
  "260": { line: "Vision2", speed: "500T" },
  // Vision (fuori produzione)
  "246": { line: "Vision", speed: "250D" },
  "274": { line: "Vision", speed: "200T" },
  "277": { line: "Vision", speed: "320T" },
  "279": { line: "Vision", speed: "500T" },
  "289": { line: "Vision", speed: "800T" },
  // Bianco e nero / invertibili
  "222": { line: "Double-X B&W", speed: "250D/200T" },
  "294": { line: "Ektachrome", speed: "100D" },
  "285": { line: "Ektachrome", speed: "100D" },
  "266": { line: "Tri-X Reversal", speed: "200D/160T" },
};

// AI GS1 per la lunghezza: 311n metri, 321n pollici, 322n piedi, 323n iarde
const LENGTH_AI = { "311": 1 / 0.3048, "321": 1 / 12, "322": 1, "323": 3 };

function splitGS1(text) {
  if (!text) return null;
  let t = String(text).trim().replace(/^\]C1/, "");
  const ais = {};
  if (t.includes("(")) {
    // Formato leggibile: (AI)valore(AI)valore
    const re = /\((\d{2,4})\)([^(]*)/g;
    let m, any = false;
    while ((m = re.exec(t))) { ais[m[1]] = m[2].replace(/\x1d/g, ""); any = true; }
    return any ? ais : null;
  }
  // Formato grezzo con separatori GS (\x1d): AI a lunghezza fissa noti
  const fixed = { "01": 14, "30": null, "10": null };
  let i = 0;
  while (i < t.length) {
    if (t[i] === "\x1d") { i++; continue; }
    let ai = t.substr(i, 4);
    if (/^3[123][0-9]\d$/.test(ai)) { ais[ai] = t.substr(i + 4, 6); i += 10; continue; }
    ai = t.substr(i, 2);
    if (ai === "01") { ais["01"] = t.substr(i + 2, 14); i += 16; continue; }
    if (ai === "30" || ai === "10") {
      let end = t.indexOf("\x1d", i + 2); if (end < 0) end = t.length;
      ais[ai] = t.substring(i + 2, end); i = end; continue;
    }
    return null; // AI non previsto: non è il nostro codice
  }
  return Object.keys(ais).length ? ais : null;
}

function parseKodakCan(text) {
  const ais = splitGS1(text);
  if (!ais) return null;
  const lot = ais["10"];
  // Lotto Kodak: 4 cifre pellicola + 3 emulsione + 3 + 2 + 2 + 2 = 16 cifre
  const m = lot && lot.match(/^([57]2(\d{2}))(\d{3})(\d{3})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return null;
  const lenKey = Object.keys(ais).find(k => /^3(11|21|22|23)\d$/.test(k));
  if (!lenKey || !/^\d{6}$/.test(ais[lenKey])) return null;

  const decimals = Number(lenKey[3]);
  const rawLen = Number(ais[lenKey]) / Math.pow(10, decimals);
  const feet = Math.round(rawLen * LENGTH_AI[lenKey.slice(0, 3)]);
  if (!feet) return null;

  const filmCode = m[1];
  const stock = FILM_STOCKS[filmCode.slice(1)];
  let gauge = filmCode[0] === "5" ? "35mm" : "16mm";
  if (gauge === "16mm" && feet <= 50) gauge = "Super 8";

  const name = stock
    ? `Kodak ${stock.line} ${stock.speed} ${filmCode}`
    : `Kodak ${filmCode}`;
  const rollA = String(Number(m[6])), rollB = String(Number(m[7]));
  return {
    lot,
    filmCode,
    name,
    line: stock ? stock.line : "Sconosciuta",
    speed: stock ? stock.speed : filmCode,
    gauge,
    feet,
    meters: Math.round(feet * 0.3048),
    emulsion: `${filmCode} ${m[3]} ${m[4]}.${m[5]} ${rollA}.${rollB}`,
  };
}

if (typeof module !== "undefined") module.exports = { parseKodakCan, splitGS1, FILM_STOCKS };
