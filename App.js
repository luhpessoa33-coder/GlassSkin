import { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const GEMINI_KEY = "AIzaSyBWvHNS-sMTlw45tu-x69HHoaqln3u6rGs";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`;

/* localStorage wrapper — funciona igual ao window.storage do Claude */
const _store = {
  get: async (key) => {
    try { const v=localStorage.getItem(key); return v?{key,value:v}:null; }
    catch(e){ return null; }
  },
  set: async (key,value) => {
    try { localStorage.setItem(key,value); return {key,value}; }
    catch(e){ return null; }
  },
};

const TODAY_DATE = new Date(2026, 4, 13); // 13 Mai 2026 = Dia 1
const TODAY_DAY  = 1;
const TODAY_DOW  = 2; // Quarta = 2 (0=Seg)
const START      = new Date(2026, 4, 13);

const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const getDow  = n => (addDays(START, n - 1).getDay() + 6) % 7;
const getDate = n => addDays(START, n - 1);
const DOW_PT  = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const TOTAL_DAYS = 365;

const MOTIV = [
  "Glass skin é construída pH a pH, rotina a rotina, dia após dia.",
  "O que você aplica hoje, a pele mostra em 28 dias.",
  "PDRN: o mesmo princípio do rejuvenescimento injetável — em casa.",
  "Retinóide é o único ativo com 50 anos de estudos clínicos. Use-o.",
  "Vitamina C às 7h, retinal às 22h — os dois time zones da pele.",
  "FPS é o anti-aging #1. Supera qualquer sérum da história.",
  "Consistência bateu intensidade. Sempre. Em qualquer rotina.",
  "Exossomos carregam microRNA que regula genes de colágeno. Isso é real.",
  "365 dias de ritual. A pele que você merece.",
  "Dormir bem é o retinol gratuito. GH peak às 23h–3h.",
];

/* ─────────────────────────────────────────────
   4 FASES — 365 DIAS
───────────────────────────────────────────── */
const PHASES = [
  { n:1, name:"Despertar",    days:"1–30",    col1:"#F6D365", col2:"#FDA085", icon:"🌱",
    desc:"Construção de barreira. Vitamina C diária. Retinol 1×/semana → 2×/semana. Anua entra Dia 7." },
  { n:2, name:"Ativar",       days:"31–90",   col1:"#667EEA", col2:"#764BA2", icon:"⚡",
    desc:"Celimax Retinal assume (Dia 14+). Reedle Shot Seg/Qua/Sex. PDRN em rotação completa." },
  { n:3, name:"Transformar",  days:"91–180",  col1:"#43E97B", col2:"#38F9D7", icon:"✨",
    desc:"Retinal 4×/semana. Exossomos em rotação plena. Luminosidade e firmeza máximas." },
  { n:4, name:"Manutenção",   days:"181–365", col1:"#F093FB", col2:"#F5576C", icon:"💎",
    desc:"Protocolo completo sustentado. Retinal 5×/semana. Pele em patamar de glass skin contínuo." },
];

function getPhase(d) {
  if (d <= 30)  return PHASES[0];
  if (d <= 90)  return PHASES[1];
  if (d <= 180) return PHASES[2];
  return PHASES[3];
}

/* ─────────────────────────────────────────────
   PRODUCTS CATALOG  (name + display)
───────────────────────────────────────────── */
const P = {
  micelar:     { n:"Água Micelar Principia AM-01",       s:"Micelar Principia",      em:"💧", tag:"LIMPEZA",    bg:"#BCCFF0",tx:"#08205A",ph:"4.0–5.0" },
  mousse:      { n:"Mousse Chá Verde AP",                s:"Mousse Chá Verde",       em:"🍵", tag:"LIMPEZA",    bg:"#A8E0B8",tx:"#083818",ph:"5.0–5.5" },
  balm:        { n:"Aprilskin Carrotene Balm",           s:"Cleansing Balm",         em:"🫧", tag:"1ª LIMP.",   bg:"#FFD0A0",tx:"#5A2000",ph:"—" },
  demaq:       { n:"Démaquillant 4-em-1 AP",             s:"Démaquillant AP",        em:"🫧", tag:"1ª LIMP.",   bg:"#B8E0B0",tx:"#0A3010",ph:"—" },
  blemishgel:  { n:"Blemish+Age Cleansing Gel SkinC",    s:"Blemish+Age Gel",        em:"🫧", tag:"2ª LIMP.",   bg:"#98B8E8",tx:"#081848",ph:"4.0–4.5" },
  eucerinap:   { n:"Eucerin Anti-Pigment AHA",           s:"Eucerin Anti-Pigment",   em:"🌸", tag:"2ª LIMP.",   bg:"#F0B8D0",tx:"#501828",ph:"4.5–5.0" },
  reedle:      { n:"100 PDRN Reedle Shot CICA",          s:"Reedle Shot CICA",       em:"💎", tag:"REEDLE",     bg:"#60E8D8",tx:"#003030",ph:"6.0–7.0" },
  serum10:     { n:"Sérum 10 · Vit C 10% (SkinC)",      s:"Sérum 10 · Vit C",       em:"🍊", tag:"VIT C",      bg:"#FFE090",tx:"#5A2800",ph:"2.5–3.0" },
  pegoliftc:   { n:"Pegolift C Youth Fluid AP",          s:"Pegolift C AP",          em:"🍊", tag:"VIT C",      bg:"#FFCF88",tx:"#4A1800",ph:"3.0–3.5" },
  hyalu6:      { n:"Adcos Hyalu6 · 6 pesos de HA",      s:"Hyalu6 HA",              em:"💧", tag:"HA",         bg:"#D8B8F8",tx:"#280850",ph:"5.5–6.5" },
  sephora:     { n:"Sephora Gelée HA + PGA",             s:"Gelée HA+PGA",           em:"💧", tag:"HA+PGA",     bg:"#88EEE8",tx:"#004040",ph:"5.5–6.5" },
  lineskin:    { n:"Lineskin Nano PDRN Sérum",           s:"Nano PDRN Lineskin",     em:"🧬", tag:"PDRN NANO",  bg:"#F8B8D0",tx:"#480828",ph:"6.0–6.5" },
  anua:        { n:"Anua Nia 10% + TXA 4%",             s:"Anua Nia+TXA",           em:"✨", tag:"NIA+TXA",    bg:"#B8C8F8",tx:"#0A1060",ph:"5.5–6.5" },
  blemishdef:  { n:"Blemish+Age Defense SkinC",          s:"Blemish+Age Defense",    em:"🔬", tag:"BHA+AHA",    bg:"#98B0E8",tx:"#081850",ph:"3.5–4.0" },
  phytocorr:   { n:"Phyto Corrective SkinCeuticals",    s:"Phyto Corrective",       em:"🌿", tag:"CALMA",      bg:"#A8E8A8",tx:"#083010",ph:"5.0–5.5" },
  rejuran:     { n:"Rejuran Dual Effect c-PDRN 0,5%",   s:"Rejuran c-PDRN",         em:"🧬", tag:"PDRN",       bg:"#78E8C8",tx:"#003830",ph:"6.0–7.0" },
  pharmapele:  { n:"Pharmapele PDRN + Exossomos",       s:"Pharmapele PDRN+Exo",    em:"⚡", tag:"PDRN+EXO",   bg:"#F898B8",tx:"#480820",ph:"6.5–7.0" },
  simpleorg:   { n:"Simple Organic Exo + PDRN",         s:"Simple Organic Exo",     em:"⚡", tag:"EXO+PDRN",   bg:"#C0A8F8",tx:"#180840",ph:"6.5–7.0" },
  akinexo:     { n:"Sérum Akinésine Exo AP",            s:"Akinésine Exo AP",       em:"⚡", tag:"EXOSSOMO",   bg:"#E0A0F8",tx:"#280850",ph:"6.5–7.2" },
  apexo:       { n:"AP Exossomos (tubo prateado)",      s:"AP Exossomos",           em:"⚡", tag:"EXOSSOMO",   bg:"#D0D0F8",tx:"#181840",ph:"6.5–7.0" },
  cellrejuvin: { n:"Cell Rejuvin Ampoule Coreano",      s:"Cell Rejuvin",           em:"✨", tag:"AMPOULE",    bg:"#F0F098",tx:"#404000",ph:"6.0–6.5" },
  peptide:     { n:"Peptide Boto Sérum SkinC",          s:"Peptide Boto",           em:"🔬", tag:"PEPTÍDEO",   bg:"#D0A8F8",tx:"#1A0840",ph:"5.5–6.5" },
  rozino:      { n:"Rozino 377 + VC + Nia Cream",       s:"Rozino 377",             em:"✨", tag:"CLAREADOR",  bg:"#E8E8E8",tx:"#282828",ph:"5.0–6.0" },
  telo:        { n:"Telo Structure Age Reverse AP",     s:"Telo Structure AP",      em:"🌟", tag:"ANTI-AGING", bg:"#F8E888",tx:"#484000",ph:"5.5–6.5" },
  hydratm:     { n:"Hydratant Mixte AP",                s:"Hydratant Mixte",        em:"💆", tag:"HIDRATANTE", bg:"#A0C8F8",tx:"#082060",ph:"5.5–6.0" },
  joseon:      { n:"Dynasty Cream · Beauty of Joseon",  s:"Dynasty Cream",          em:"🌸", tag:"HIDRATANTE", bg:"#E0C0F8",tx:"#280858",ph:"5.5–6.5" },
  pegoretinol: { n:"Pegoretinol Precious Night AP",     s:"Pegoretinol AP 🌙",      em:"🌙", tag:"RETINOL 🌙", bg:"#9080F0",tx:"#E8E0FF",ph:"5.0–6.0" },
  celimax:     { n:"Celimax Retinal Shot 0,1%",         s:"Retinal Shot Celimax 🌙",em:"🌙", tag:"RETINAL 🌙", bg:"#4848D0",tx:"#E0E0FF",ph:"5.0–5.5" },
  eyestick:    { n:"Fresh Eye Stick AP",                s:"Eye Stick AP",           em:"👁️", tag:"OLHOS",      bg:"#FFF898",tx:"#484000",ph:"—" },
  fps80:       { n:"UV Oil Defense FPS80 SkinC",        s:"FPS 80 SkinC",           em:"☀️", tag:"FPS 80",     bg:"#FFE898",tx:"#5A2800",ph:"—" },
  claymask:    { n:"Aprilskin Carrotene Clay Mask",     s:"Argila Carrotene",       em:"🎭", tag:"ARGILA",     bg:"#F07830",tx:"white",  ph:"5.0–6.0" },
  enzyme:      { n:"Sallve Esfoliante Enzimático",      s:"Enzimático Sallve",      em:"🍎", tag:"ENZIMÁTICO", bg:"#9828C0",tx:"white",  ph:"4.0–4.5" },
  sheetmask:   { n:"Sheet Mask (sua escolha)",          s:"Sheet Mask",             em:"🌊", tag:"SHEET MASK", bg:"#E860A0",tx:"white",  ph:"—" },
  liplaneige:  { n:"Laneige Lip Sleeping Mask Berry",   s:"Lip Mask Laneige",       em:"💋", tag:"LÁBIOS",     bg:"#F040A0",tx:"white",  ph:"—" },
};

const WAIT_MSGS = { 120:"⏱ 2 min", 180:"⏱ 3 min", 300:"⏱ 5 min", 600:"⏱ 10 min" };

/* ─────────────────────────────────────────────
   ROUTINE LOGIC
───────────────────────────────────────────── */
function getInfo(d) {
  const phase=d<=30?1:d<=90?2:d<=180?3:4;
  const week=Math.ceil(d/7);
  const dow=getDow(d);
  // Retinol phase 1: week1-2=Fri, week3-4=Tue+Fri
  // Retinal phase 2: first 2 weeks=Fri, then Tue+Fri
  // Retinal phase 3: Mon/Wed/Fri/Sun
  // Retinal phase 4: Mon/Tue/Thu/Fri/Sat (5x/week)
  let retRol=false, retNal=false;
  if(phase===1){ retRol = week<=2 ? dow===4 : (dow===1||dow===4); }
  else if(phase===2){ const pw=week-4; retNal = pw<=2 ? dow===4 : (dow===1||dow===4); }
  else if(phase===3){ retNal = [0,2,4,6].includes(dow); }
  else { retNal = [0,1,3,4,5].includes(dow); }

  const isRet    = retRol||retNal;
  const hasReedle= phase>=2 && [0,2,4].includes(dow);
  const hasClay  = [1,5].includes(dow) && !isRet;
  const hasEnzyme= dow===3 && !isRet;
  const hasSheet = dow===6 && !isRet;
  const anuaOK   = d>=7;
  const celimaxOK= d>=14;
  return {phase,week,dow,retRol,retNal,isRet,hasReedle,hasClay,hasEnzyme,hasSheet,anuaOK,celimaxOK,d};
}

function makeAM(info) {
  const {dow,anuaOK}=info;
  const vitC=[0,2,4,6].includes(dow)?"serum10":"pegoliftc";
  const hid =[0,2,4].includes(dow)?"hydratm":"joseon";
  const s=[
    {id:"a1",pid:"micelar", wait:0,   note:"Algodão suave por todo o rosto. Sem pressão.", sci:"pH 4,0–5,0 idêntico à barreira ácida. Remove sebum sem alterar microbioma."},
    {id:"a2",pid:"mousse",  wait:0,   note:"Espuma nas palmas → 60 seg circular → água fria.", sci:"EGCG: inibe 5α-redutase (produção de sebo). Água fria: vasoconstricção reduz eritema."},
    {id:"a3",pid:"hyalu6",  wait:120, note:"3–4 gotas. Pressionar com palmas (patting). Pele úmida.", sci:"HA cria microambiente hidratado. Suaviza transição de pH antes do Vit C."},
    {id:"a4",pid:vitC,      wait:300, note:"Pele SECA. 3–4 gotas. Centro→fora. Pescoço incluso. Aguardar 5 min.", sci:`pH ${vitC==="serum10"?"2,5–3,0":"3,0–3,5"}: L-ascórbico só penetra abaixo de pH 3,5. Aguardar 5 min para normalização.`},
    {id:"a5",pid:"lineskin",wait:120, note:"2–3 gotas após os 5 min. Espalhar suavemente.", sci:"Nano PDRN 100nm penetra por difusão passiva. Niacinamida nano dose baixa: sem conflito com Vit C."},
  ];
  if(anuaOK&&[1,3].includes(dow)) s.push({id:"a6",pid:"anua",wait:120,note:"Ter/Qui: 2–3 gotas. Focar em manchas.",sci:"TXA bloqueia transferência de melanossomas. Rota diferente do Vit C — complemento."});
  s.push({id:"a7",pid:hid,     wait:0, note:"Pressionar suavemente. 2 min antes do FPS.", sci:"Base uniforme essencial para o FPS."});
  s.push({id:"a8",pid:"eyestick",wait:0, note:"Dedo anelar. Bater levemente. Nunca pressionar.", sci:"Cafeína: vasoconstritor reduz acúmulo venoso."});
  s.push({id:"a9",pid:"fps80",  wait:0, note:"1/4 colher de chá. ÚLTIMO PASSO ABSOLUTO. Reaplicar ao meio-dia.", sci:"Sem FPS: Vit C oxidada pelo UV. Eficácia de todos serums reduzida até 70%."});
  return s;
}

function makePM(info) {
  const {dow,phase,isRet,retNal,celimaxOK,hasClay,hasEnzyme,hasSheet,hasReedle}=info;
  const s=[];
  if(hasClay)  s.push({id:"p0c",pid:"claymask", wait:0, note:"PELE SECA. Camada fina. 10–12 min. Enxaguar.", sci:"Caulim: carga negativa atrai sebum positivo."});
  if(hasEnzyme)s.push({id:"p0e",pid:"enzyme",   wait:0, note:"No lugar da 2ª limpeza. Pele úmida. 30 seg.", sci:"Proteases de romã: clivam desmossomas."});
  s.push({id:"p1",pid:[0,2,4].includes(dow)?"balm":"demaq",wait:0,note:"Pele SECA. 60 seg massagem. Emulsionar. Enxaguar.",sci:"Like dissolves like: remove FPS, make e sebum."});
  if(!hasEnzyme){
    const l2=dow%2===0?"blemishgel":"eucerinap";
    s.push({id:"p2",pid:l2,wait:0,note:"Pele úmida. 45 seg. Água fria.",sci:l2==="blemishgel"?"BHA+AHA pH 4,0: dissolve sebum.":"Eucerin 2% AHA: brightening durante a limpeza."});
  }
  if(hasReedle) s.push({id:"pRd",pid:"reedle",wait:300,note:"PRIMEIRO PM. Pressionar 30 seg. Não enxaguar. 5 min.",sci:"Microcanais 2–5μm: +3–5× biodisponibilidade dos próximos serums."});
  if(isRet){
    s.push({id:"pr1",pid:"hyalu6",   wait:600, note:"Buffer pré-retinóide. Aguardar 10 min.", sci:"Sandwich technique: HA dilui retinóide → menos eritema, mesma eficácia."});
    s.push({id:"pr2",pid:"cellrejuvin",wait:120,note:"4–5 gotas.",sci:"Veículo emoliente para distribuição uniforme do retinóide."});
    s.push({id:"pr3",pid:"akinexo",  wait:120, note:"2–3 gotas.", sci:"Peak de renovação 23h–3h. Exossomos antes do pico = timing ideal."});
    const rid=retNal&&celimaxOK?"celimax":"pegoretinol";
    s.push({id:"pr4",pid:rid,wait:0,note:rid==="celimax"?"Tamanho ervilha. Pele SECA. Evitar olhos.":"Camada fina. Pele completamente seca.",sci:rid==="celimax"?"Retinaldeído: 1 passo de conversão → 11× mais potente que retinol.":"Retinol: 1x/sem → 2x/sem a partir semana 3."});
    s.push({id:"pr5",pid:"joseon",   wait:0,   note:"SELAR: camada generosa.", sci:"Sandwich parte 2: oclusão mantém contato do retinóide + nutre barreira."});
  } else {
    s.push({id:"ps1",pid:"sephora",  wait:120, note:"Base PM antes dos serums.", sci:"PGA forma filme que retém HA nas camadas profundas."});
    if(hasSheet) s.push({id:"psm",pid:"sheetmask",wait:0,note:"15–20 min. Massagear excesso. NÃO enxaguar.",sci:"Oclusão: TEWL zero → 100% dos ativos absorvidos."});
    const byDow={
      0:[{id:"d0a",pid:"blemishdef",wait:300,note:"2–3 gotas. Pele seca. 5 min.",sci:"BHA/LHA/AHA pós-fim de semana: poros e sebum."},{id:"d0b",pid:"rejuran",wait:120,note:"PDRN após normalizar pH.",sci:"PDRN pós-BHA: barreira aberta = penetração aumentada."},{id:"d0c",pid:"peptide",wait:120,note:"Peptídeos.",sci:"Dois estímulos independentes de fibroblastos."},{id:"d0d",pid:"rozino",wait:0,note:"Clareador noturno.",sci:"Triple brightening."},{id:"d0e",pid:"joseon",wait:0,note:"Selante.",sci:"Sela os ativos noturno."}],
      1:[{id:"d1a",pid:"phytocorr",wait:120,note:"Recovery pós-segunda.",sci:"Ác. alfa-lipóico: antioxidante pós-esfoliação."},{id:"d1b",pid:"simpleorg",wait:120,note:"Exo+PDRN.",sci:"Exossomos vegetais: espectro diferente de microRNA."},{id:"d1c",pid:"anua",wait:120,note:"Anua PM terça.",sci:"Nia 10% PM: sem conflito com Vit C AM."},{id:"d1d",pid:"joseon",wait:0,note:"Selante.",sci:"Antimicrobiano + anti-aging."}],
      2:[{id:"d2a",pid:"pharmapele",wait:180,note:"PDRN+Exo premium.",sci:"EGF estimula proliferação de keratinocitos."},{id:"d2b",pid:"apexo",wait:120,note:"AP Exossomos.",sci:"Payload diferente de microRNA."},{id:"d2c",pid:"cellrejuvin",wait:120,note:"Ampoule iluminadora.",sci:"Dual brightening + anti-rugas."},{id:"d2d",pid:"telo",wait:0,note:"Anti-aging quarta.",sci:"Barreira intacta absorve creme mais rico."}],
      3:[{id:"d3a",pid:"phytocorr",wait:120,note:"Pós-enzimático.",sci:"Reconstitui lipídeos após esfoliação."},{id:"d3b",pid:"lineskin",wait:120,note:"PDRN extra.",sci:"Barreira aberta pós-enzimático: +40% profundidade."},{id:"d3c",pid:"rozino",wait:0,note:"Clareamento.",sci:"TXA AM + 377 PM = cobertura 24h."},{id:"d3d",pid:"joseon",wait:0,note:"Selante.",sci:"Hidratação e selagem."}],
      5:[{id:"d5a",pid:"phytocorr",wait:120,note:"Pós-argila.",sci:"Argila retira lipídeos: Phyto reconstitui."},{id:"d5b",pid:"simpleorg",wait:120,note:"Exo+PDRN.",sci:"Sábado: PDRN age sem foto-oxidação no domingo."},{id:"d5c",pid:"rozino",wait:0,note:"Clareador.",sci:"Sábado sem retinol: Rozino assume."},{id:"d5d",pid:phase>=3?"telo":"joseon",wait:0,note:"Creme rico.",sci:"8h+ de sono: máxima janela para creme nutritivo."}],
      6:[{id:"d6a",pid:"pharmapele",wait:180,note:"PDRN premium domingo.",sci:"PDRN age 2–3 dias → pico seg-ter."},{id:"d6b",pid:"akinexo",wait:120,note:"Exossomo AP.",sci:"Domingo: reservado para os melhores ativos."},{id:"d6c",pid:"peptide",wait:120,note:"Peptídeos.",sci:"Semana começa com estímulo de colágeno."},{id:"d6d",pid:phase>=3?"telo":"joseon",wait:0,note:"Creme mais rico.",sci:"Pele maximamente nutrida para a semana."}],
    };
    (byDow[dow]||[]).forEach(x=>s.push(x));
  }
  s.push({id:"px1",pid:"eyestick",wait:0,note:"Dedo anelar. Bater levemente.",sci:"Último: evita deslocar ativos."});
  s.push({id:"px2",pid:"liplaneige",wait:0,note:"Generosamente. A noite toda.",sci:"SLEEPSCENT: reduz cortisol. Lábios sem glândulas sebáceas ressecam rápido."});
  return s;
}

function dayIcon(i){
  if(i.isRet) return "🌙";
  if(i.hasSheet) return "✨";
  if(i.hasClay) return "🎭";
  if(i.hasEnzyme) return "🍎";
  if(i.hasReedle) return "💎";
  return "💧";
}

/* ─────────────────────────────────────────────
   GEMINI API HELPERS
───────────────────────────────────────────── */
async function callGemini(parts) {
  const res = await fetch(GEMINI_URL, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ contents:[{ parts }] }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível obter resposta.";
}

async function analyzePhoto(base64, mime="image/jpeg") {
  return callGemini([
    { text:"Você é dermatologista especializada em estética e cosmecêutica. Analise esta foto de pele em português brasileiro. Identifique e pontue (0–10):\n1. Acne ativa e comedões\n2. Manchas e hiperpigmentação (PIH)\n3. Hidratação / oleosidade\n4. Poros\n5. Rugas e firmeza\n6. Uniformidade do tom\n\nDepois sugira:\n— Ajustes na rotina (quais ativos priorizar)\n— Próxima compra mais urgente\n— Prazo estimado para melhora com a rotina atual\n\nSeja direta, técnica e motivadora. Use emojis." },
    { inlineData:{ mimeType:mime, data:base64 } },
  ]);
}

async function suggestAlternative(productName, reason) {
  return callGemini([{
    text:`Produto acabou: "${productName}". Motivo: ${reason}.\n\nSugira em português:\n1. Substitutos disponíveis no Brasil (3 opções, com preço estimado)\n2. Se vale recomprar ou trocar permanentemente\n3. Como adaptar a rotina enquanto não repõe\n4. Qual produto da coleção pode substituir temporariamente\n\nSeja direta e prática.`
  }]);
}

async function analyzeSkin(notes) {
  return callGemini([{
    text:`Contexto da paciente:\n${notes}\n\nComo dermatologista, em português:\n1. Avalie a rotina e sugira ajustes para maximizar resultados\n2. Identifique possíveis conflitos ou sobreposições\n3. Sugira a próxima compra mais impactante\n4. Estime o que esperar nos próximos 30 dias\n5. Dê 3 dicas rápidas para potencializar hoje\n\nSeja específica, técnica e motivadora.`
  }]);
}

async function analyzeBody(base64, concerns, mime="image/jpeg") {
  return callGemini([
    { text:`Você é dermatologista e especialista em estética corporal. Analise esta foto em português brasileiro.\n\nPreocupações informadas: ${concerns||"não informado"}\n\nAvalie e pontue (0–10):\n1. Ceratose pilar (bolinhas nos braços/coxas)\n2. Celulite (grau e distribuição)\n3. Estrias (tipo, coloração, localização)\n4. Manchas e hiperpigmentação corporal\n5. Flacidez e firmeza da pele\n6. Ressecamento e textura geral\n\nSugira:\n— Tratamentos tópicos (cremes, ácidos) com marcas disponíveis no Brasil\n— Procedimentos estéticos indicados (do mais urgente ao complementar)\n— Rotina corporal simples para o dia a dia\n— Prazo realista para melhoras visíveis\n\nSeja específica, motivadora e técnica. Use emojis.` },
    { inlineData:{ mimeType:mime, data:base64 } },
  ]);
}

async function suggestFaceProcedures(profile) {
  return callGemini([{
    text:`Paciente:\n${profile}\n\nComo médica especialista em medicina estética, recomende procedimentos faciais em português, ordenados por prioridade:\n\nPara cada procedimento indicado:\n✦ Nome e técnica\n✦ O que trata especificamente nesta paciente\n✦ Número de sessões recomendadas e frequência\n✦ Preço médio no Brasil (por sessão e curso completo)\n✦ Tempo de downtime (recuperação)\n✦ Quando esperar resultados\n✦ Pode combinar com a rotina de skincare em casa? Como?\n\nIncluir também:\n— O que NÃO fazer (contraindicações para o perfil)\n— Ordem ideal dos procedimentos (qual fazer primeiro)\n— Manutenção após os resultados\n\nSeja específica e técnica.`
  }]);
}

async function suggestBodyProcedures(profile) {
  return callGemini([{
    text:`Paciente:\n${profile}\n\nComo especialista em estética corporal, recomende procedimentos para o corpo em português, ordenados por prioridade:\n\nPara cada procedimento:\n✦ Nome e técnica\n✦ O que trata especificamente\n✦ Sessões e frequência\n✦ Preço médio no Brasil\n✦ Downtime\n✦ Resultados esperados\n✦ Fazer em clínica ou em casa?\n\nFoco especial em:\n— Ceratose pilar (braços/coxas)\n— Celulite e gordura localizada\n— Estrias\n— Flacidez corporal\n\nIncluir rotina corporal em casa (tópicos + técnicas manuais).\n\nSeja direta e técnica.`
  }]);
}


/* ─────────────────────────────────────────────
   FACE PROCEDURES — CATÁLOGO COMPLETO
───────────────────────────────────────────── */
const FACE_PROCS = [
  // ── TOXINAS ──
  {n:"Toxina Botulínica (Botox / Dysport / Xeomin)",em:"💉",cat:"Toxinas",
   when:"Rugas de expressão (glabela, testa, pés de galinha), masseter (bruxismo/face slim), hiperidrose, pescoco (Nefertiti lift)",
   freq:"A cada 3–6 meses",price:"R$800–3.000 (por área)",down:"Nenhum",
   brands:"Botox (Allergan) · Dysport (Galderma) · Xeomin (Merz) · Nabota (Daewoong)",
   result:"Resultado em 5–14 dias. Dura 3–5 meses. Efeito preventivo com uso regular.",
   note:"⚠️ PARALISIA FACIAL: aplicar APENAS com avaliação neurológica prévia. Toxina em músculo parético pode piorar a assimetria.
Baby Botox (dose reduzida): mantém expressão natural, ideal para preventivo.",
   flag:"⚠️ Avaliar neurologista"},
  {n:"Toxina — Baby Botox (Preventivo)",em:"💉",cat:"Toxinas",
   when:"Prevenção de rugas de expressão em jovens (25–35 anos), manutenção de resultados",
   freq:"A cada 4–6 meses",price:"R$600–1.800",down:"Nenhum",
   brands:"Mesmos produtos, dose 20–40% menor",
   result:"Rugas não se formam onde o músculo não contrai. Resultado cumulativo a longo prazo.",
   note:"Dose menor = expressão natural preservada. Excelente para linhas finas iniciais."},

  // ── PREENCHIMENTO ──
  {n:"Preenchimento com Ácido Hialurônico (Filler)",em:"💎",cat:"Preench.",
   when:"Sulcos nasolabiais, bigode chinês, maçãs do rosto, contorno facial, lábios, olheiras, têmporas",
   freq:"A cada 12–18 meses (varia por área)",price:"R$1.200–4.500/seringa",down:"1–5 dias (inchaço, hematoma)",
   brands:"Juvederm (Allergan) · Restylane (Galderma) · Belotero (Merz) · Teosyal (Teoxane) · Princess (Croma)",
   result:"Imediato. Volume, hidratação e contorno restaurados.",
   note:"Compatível com skincare 48h depois. Evitar calor intenso e exercício no dia. Aguardar 2 semanas antes de peeling.
Hialase (hialuronidase) dissolve o filler se necessário — reversível."},
  {n:"Preenchimento com Gordura Autóloga (Lipofilling)",em:"💛",cat:"Preench.",
   when:"Volume facial, olheiras profundas, contorno, área temporal, lábios",
   freq:"1 sessão (resultado duradouro 60–80% de sobrevivência em 12 meses)",price:"R$8.000–20.000",down:"7–14 dias",
   brands:"Procedimento cirúrgico — não usa produto industrializado",
   result:"Natural, duradouro. Gordura sobrevivente é permanente.",
   note:"Cirurgião plástico. Pequena lipoaspiração + processamento + reinjeção. O mais natural dos preenchimentos."},

  // ── BIOESTIMULADORES ──
  {n:"Profhilo (IBSA)",em:"🌊",cat:"Bioestim.",
   when:"Biorevitalização intensa, flacidez leve, pele sem viço e sem brilho, hidratação profunda injetável",
   freq:"2 sessões (21 dias de intervalo) + manutenção semestral",price:"R$2.500–4.500/sessão",down:"Mínimo (pequenos nódulos 24h)",
   brands:"Profhilo (IBSA) — único produto com 64mg/2ml de HA puro concentrado",
   result:"Hydroboosting real visível em 4 semanas. Pele plump, firme, luminosa.",
   note:"O produto mais próximo do glass skin por via injetável. HA de ultra-alto peso molecular que se espalha pelos tecidos.
Não é filler — não preenche. Biorevitaliza. Sinérgico com PDRN tópico.",
   flag:"⭐ Top recomendado"},
  {n:"Skinboosters (Restylane Vital / Juvederm Volite)",em:"💧",cat:"Bioestim.",
   when:"Hidratação profunda injetável, qualidade da pele, brilho, pele fina e ressecada",
   freq:"3 sessões (4 semanas de intervalo) + manutenção anual",price:"R$1.500–3.000/sessão",down:"1–2 dias",
   brands:"Restylane Vital (Galderma) · Juvederm Volite (Allergan) · Teosyal Redensity I",
   result:"Hidratação visível em 2–4 semanas. Dura 6–12 meses.",
   note:"Microinjeções de HA em grade (nappage). Melhora elasticidade, hidratação e textura. Complementa rotina de PDRN."},
  {n:"Sculptra (Ácido Poli-L-Láctico / PLLA)",em:"🌟",cat:"Bioestim.",
   when:"Flacidez facial moderada, perda de volume, anti-aging profundo, reposição de gordura facial",
   freq:"2–3 sessões (6–8 semanas de intervalo) + manutenção anual",price:"R$3.000–7.000/sessão",down:"3–5 dias",
   brands:"Sculptra (Galderma) · Lanluma (PureSense Medical)",
   result:"Colágeno cresce progressivamente em 3–6 meses. Dura 2+ anos.",
   note:"Bioestimulador mais duradouro. Resultado gradual e natural — não imediato. Massagem facial obrigatória após (5-5-5 rule)."},
  {n:"Radiesse (Hidroxiapatita de Cálcio)",em:"🔮",cat:"Bioestim.",
   when:"Lifting de papada e mandíbula, contorno facial, mãos (rejuvenescimento)",
   freq:"1–2 sessões + manutenção 12–18 meses",price:"R$2.500–5.000/seringa",down:"3–7 dias",
   brands:"Radiesse (Merz)",
   result:"Imediato (preenchimento) + progressivo (colágeno). Dura 12–18 meses.",
   note:"Efeito duplo: preenche imediatamente e estimula colágeno. Não reversível (sem antídoto como o HA)."},
  {n:"Ellansé (PCL — Poliglecaprona)",em:"💫",cat:"Bioestim.",
   when:"Flacidez, perda de volume, anti-aging preventivo, contorno",
   freq:"1 sessão + manutenção conforme duração escolhida",price:"R$3.500–7.000",down:"3–5 dias",
   brands:"Ellansé S (1 ano) / M (2 anos) / L (3 anos) / E (4 anos)",
   result:"Imediato + estimulação progressiva de colágeno tipo I. O mais durável dos bioestimuladores.",
   note:"Durações diferentes permitem personalizar o tratamento. Bioabsorvível — o corpo absorve gradualmente enquanto o colágeno fica."},
  {n:"NCTF / Fillmed / Mesoterapia",em:"🧪",cat:"Bioestim.",
   when:"Revitalização, brilho, falta de nutrição celular, anti-aging preventivo",
   freq:"Séries de 4–6 sessões mensais + manutenção trimestral",price:"R$300–800/sessão",down:"1–2 dias",
   brands:"Fillmed NCTF 135 HA (Filorga) · Jalupro · Nucleofill",
   result:"Luminosidade e textura em 3–4 sessões.",
   note:"Cocktail de vitaminas, aminoácidos, minerais e HA injetado via microagulhamento ou nappage."},

  // ── FIOS ──
  {n:"Fios de PDO (Polidioxanona) — Lisos",em:"🕸️",cat:"Fios",
   when:"Bioestimulação de colágeno, melhora de textura e firmeza difusa, início de flacidez",
   freq:"1–2 sessões/ano",price:"R$1.500–4.000",down:"3–7 dias",
   brands:"Princípios PDO — múltiplas marcas (Mint, Instalift, Novopelle, Biorevita)",
   result:"Firmeza visível em 4–8 semanas. Colágeno estimulado dura 9–18 meses.",
   note:"Os fios se reabsorvem em 4–6 meses deixando o colágeno. Fios lisos: estimulação difusa sem lifting mecânico."},
  {n:"Fios de PDO com Cog (Grapple) — Lifting",em:"🔗",cat:"Fios",
   when:"Lifting de sobrancelha, bochechas, jowls, pescoço, papada — flacidez moderada",
   freq:"1 sessão/ano",price:"R$3.000–8.000",down:"5–10 dias",
   brands:"Mint Lift (Healeon) · NovaThreads · Instalift (Sinclair)",
   result:"Lifting imediato + colágeno progressivo. Dura 12–18 meses.",
   note:"Cogs (ganchos) criam ancoragem mecânica para o lifting. Mais invasivo que fios lisos.
⚠️ Requer médico experiente — assimetrias são possíveis."},
  {n:"Fios de PLLA (Ácido Poli-L-Láctico)",em:"🌐",cat:"Fios",
   when:"Bioestimulação de longa duração, flacidez, anti-aging global",
   freq:"1 sessão + manutenção em 12–18 meses",price:"R$3.500–7.000",down:"3–7 dias",
   brands:"Sculptra Fios · Lenevi · Miracu",
   result:"Progressivo em 2–6 meses. Dura 2+ anos.",
   note:"Mesmo princípio do Sculptra em forma de fios. Bioestimulação mais intensa e duradoura que PDO."},
  {n:"Fios de PCL (Poliglecaprona / Silhouette Soft)",em:"💎",cat:"Fios",
   when:"Lifting intenso e duradouro, jowls, sobrancelhas, bochechas caídas, pescoço",
   freq:"1 sessão a cada 2–3 anos",price:"R$5.000–12.000",down:"7–14 dias",
   brands:"Silhouette Soft (Sinclair) · Novapiel PCL",
   result:"Lifting imediato + colágeno por 2–3 anos. O mais duradouro dos fios.",
   note:"PCL é mais rígido e dura mais que PDO e PLLA. Ideal para flacidez moderada a severa.
Ocasionalmente pode palpar os fios — normaliza em semanas."},
  {n:"Fios Tensor Faciais — Visão Geral",em:"📐",cat:"Fios",
   when:"Lifting não cirúrgico personalizado por área: sobrancelha, bochecha, pescoço, papada",
   freq:"Varia por tipo de fio",price:"R$1.500–12.000 (dependendo do tipo)",down:"3–14 dias",
   brands:"Tipo define a marca — ver procedimentos específicos acima",
   result:"Imediato (lifting mecânico) + progressivo (colágeno). Duração: PDO < PLLA < PCL",
   note:"ORDEM DE INVASIVIDADE (menor→maior): Fios lisos → Fios com cog → PLLA → PCL → Cirurgia.
NÃO substituem cirurgia em flacidez severa. Complementam outros tratamentos.",
   flag:"Consultar especialista"},

  // ── PEELINGS ──
  {n:"Peeling Superficial (AHA — Glicólico / Mandélico / Lático)",em:"🧪",cat:"Peelings",
   when:"Manchas iniciais, acne comedogênica, textura irregular, poros, PIH leve",
   freq:"A cada 2–4 semanas (série de 4–6)",price:"R$150–400/sessão",down:"1–3 dias (descamação leve)",
   brands:"Peelings de farmacêutico ou clínica com AHA 20–70%",
   result:"Textura melhorada em 2–3 sessões. Manchas em 4–6.",
   note:"Compatível com retinol (parar 5 dias antes). Não fazer com pele irritada.
Mandélico (pH mais alto): mais gentil para Fitzpatrick III-IV — menos risco de hiperpigmentação pós-inflamatória."},
  {n:"Peeling de TCA (Ácido Tricloroacético) — Médio",em:"🔥",cat:"Peelings",
   when:"Manchas resistentes, cicatrizes de acne superficiais, melasma, rejuvenescimento",
   freq:"2–3 sessões anuais",price:"R$400–1.200/sessão",down:"7–14 dias (esfoliação intensa)",
   brands:"TCA 15–35% (concentração define profundidade)",
   result:"Renovação epidérmica completa. Manchas e textura em 1–2 sessões.",
   note:"⚠️ Para Fitzpatrick III-IV: risco de hiperpigmentação pós-inflamatória. Preferir TCA em baixa concentração + lento.
Não fazer sob sol intenso. FPS obrigatório antes e depois.",
   flag:"⚠️ Fitzpatrick III-IV"},
  {n:"Peeling de Retinol (Yellow Peel)",em:"🟡",cat:"Peelings",
   when:"Anti-aging, manchas, textura, acne, poros — alternativa mais segura ao TCA para peles escuras",
   freq:"Mensal (série de 4–6)",price:"R$200–600/sessão",down:"3–5 dias",
   brands:"Yellow Peel (Mediderma) · Peel Mission Yellow (Skintech)",
   result:"Luminosidade, textura e manchas em 3–4 sessões.",
   note:"Mais seguro para Fitzpatrick III-IV que TCA. Potencializa o retinol tópico. Downtime tolerável."},
  {n:"Peeling de Jessner",em:"🔶",cat:"Peelings",
   when:"Acne ativa, poros, seborreia, textura irregular",
   freq:"A cada 4–6 semanas",price:"R$200–500/sessão",down:"5–7 dias",
   brands:"Fórmula clássica: ácido salicílico + lático + resorcinol",
   result:"Poros e oleosidade em 2–3 sessões.",
   note:"Excelente para acne. Salicílico penetra no poro. Não fazer no mesmo período do BHA sérum em casa."},

  // ── LASER & LUZ ──
  {n:"IPL (Luz Intensa Pulsada)",em:"✨",cat:"Laser",
   when:"Manchas solares, rosácea, vasinhos faciais, pele uniforme, fotorrejuvenescimento",
   freq:"3–5 sessões mensais",price:"R$300–800/sessão",down:"2–5 dias (eritema)",
   brands:"M22 (Lumenis) · Nordlys (Ellipse) · Stellar M22",
   result:"Uniformização em 3 sessões. Vasinhos em 2.",
   note:"⚠️ Fitzpatrick III-IV: RISCO DE QUEIMADURA. Preferir comprimentos de onda específicos ou Nd:YAG.
Evitar sol 4 semanas antes e depois."},
  {n:"Laser Nd:YAG (1064nm)",em:"⚡",cat:"Laser",
   when:"Manchas, vasinhos, ceratose seborreica, rejuvenescimento — SEGURO para peles escuras",
   freq:"4–6 sessões mensais",price:"R$400–1.200/sessão",down:"2–5 dias",
   brands:"Nd:YAG Q-Switched · PicoSure (755+1064nm) · PicoWay",
   result:"Manchas em 3–5 sessões.",
   note:"O laser mais seguro para Fitzpatrick III-IV. Comprimento de onda 1064nm: menos risco de hiperpigmentação pós-inflamatória.
✅ Primeira escolha de laser para seu biotipo."},
  {n:"Laser CO2 Fracionado",em:"🔴",cat:"Laser",
   when:"Poros dilatados, cicatrizes de acne, rugas, rejuvenescimento intenso",
   freq:"1–3 sessões anuais (alta intensidade)",price:"R$1.500–4.000/sessão",down:"7–14 dias",
   brands:"UltraPulse (Lumenis) · SmartXide (DEKA) · Fraxel CO2",
   result:"Melhora intensa em 1 sessão. Resultado final em 3–6 meses.",
   note:"⚠️ Fitzpatrick III-IV: alto risco de hiperpigmentação. Usar apenas fracionado em baixa densidade.
Não fazer com retinol ativo. Downtime significativo."},
  {n:"Laser Fraxel / Érbio Fracionado",em:"🟠",cat:"Laser",
   when:"Cicatrizes de acne, rugas superficiais, textura, poros — mais seguro que CO2",
   freq:"3–5 sessões (4–6 semanas de intervalo)",price:"R$800–2.500/sessão",down:"3–7 dias",
   brands:"Fraxel Restore (Solta) · Alma Pixel · Quantel Opus",
   result:"Textura e cicatrizes em 3 sessões.",
   note:"Érbio é mais superficial que CO2: menos downtime, menor risco para peles escuras."},
  {n:"LED Terapia (LLLT / Fototerapia)",em:"💡",cat:"Laser",
   when:"Anti-inflamatório (acne), cicatrização, anti-aging, sensibilidade",
   freq:"2–3×/semana por 4–8 semanas",price:"R$80–300/sessão",down:"Nenhum",
   brands:"Dermalux (TreatMD) · Omnilux · iGrow · Qualquer máscara LED doméstica certificada",
   result:"Acne reduzida em 4 semanas. Anti-aging visível em 8 semanas.",
   note:"🔵 Azul (415nm): bactericida — mata P.acnes.
🔴 Vermelho (630–660nm): anti-aging + colágeno.
♾️ Infravermelho próximo: penetração profunda + cicatrização.
Pode fazer em casa com máscara LED aprovada."},
  {n:"Plasma Pen (Fibroblast / Plasmage)",em:"⚡",cat:"Laser",
   when:"Pálpebras caídas, rugas finas, estrias, cicatrizes, lifting sem cirurgia",
   freq:"1–2 sessões (efeito duradouro 2–3 anos)",price:"R$800–2.500/área",down:"5–10 dias (crostas/pontinhos)",
   brands:"Plasmage (Brera) · Plasma IQ · Noxy",
   result:"Lifting imediato. Resultado final em 3 meses.",
   note:"Plasma de gás ionizado cria microcoagulações → retração tecidual imediata.
⚠️ Não fazer em pele bronzeada ou Fitzpatrick alto sem avaliação."},

  // ── RF & HIFU ──
  {n:"Radiofrequência Facial (Thermage / Morpheus8)",em:"📡",cat:"RF & HIFU",
   when:"Flacidez, poros, lifting, rugas, gordura (papada)",
   freq:"Thermage: 1×/ano | Morpheus8: 3 sessões (4 semanas)",price:"Thermage: R$4.000–8.000 | Morpheus8: R$2.000–5.000/sessão",down:"Thermage: 1–3 dias | Morpheus8: 3–5 dias",
   brands:"Thermage FLX (Solta) · Morpheus8 (InMode) · Venus Legacy · Fractora",
   result:"Firmeza progressiva 3–6 meses. Thermage: resultado em 1 sessão.",
   note:"Thermage: aquece colágeno dérmico profundo. 1 sessão ao ano.
Morpheus8: microagulhamento + RF fracionada = dupla ação colágeno + textura."},
  {n:"HIFU (Ultrafoco — Ultherapy / Ultraformer)",em:"🔊",cat:"RF & HIFU",
   when:"Lifting profundo de SMAS, papada, pescoço, sobrancelha, contorno mandibular",
   freq:"1 sessão/ano",price:"R$3.000–8.000",down:"1–3 dias",
   brands:"Ultherapy (Merz) · Ultraformer III (Classys) · Doublo (Hironic)",
   result:"Resultado cresce em 3–6 meses. Efeito máximo com 6 meses. Dura 12–18 meses.",
   note:"O lifting não cirúrgico mais profundo disponível. Atinge o SMAS (músculo superficial).
Ultraformer: mais acessível que Ultherapy, resultados similares."},
  {n:"HIFU Micro / Micro-Focused Ultrasound",em:"〰️",cat:"RF & HIFU",
   when:"Bioestimulação difusa, qualidade de pele, poros, firmeza superficial",
   freq:"2–4 sessões mensais",price:"R$500–1.500/sessão",down:"Mínimo",
   brands:"Ultracel (Classys) · BTL Exilis Ultra · Venus Viva",
   result:"Textura e poros em 2–3 sessões.",
   note:"Versão menos intensa do HIFU. Foco superficial (0,5–1mm) = sem o lifting profundo mas mais confortável e acessível."},
  {n:"Criolipólise Facial (CoolSculpting Papada)",em:"🧊",cat:"RF & HIFU",
   when:"Papada resistente, gordura submentual (duplo queixo)",
   freq:"1–2 sessões",price:"R$2.000–4.000",down:"Edema 2–4 semanas",
   brands:"CoolSculpting (Allergan) · Cristal Pro",
   result:"Redução de 20–25% da gordura em 2–3 meses.",
   note:"Congela células de gordura seletivamente. Não afeta músculos ou nervos."},

  // ── MICROAGULHAMENTO & RF ──
  {n:"Microagulhamento (Dermapen / Dermaroller)",em:"🔬",cat:"Agulhas",
   when:"Cicatrizes de acne, poros, rugas superficiais, pigmentação, stretch marks faciais",
   freq:"4–6 sessões mensais",price:"R$250–700/sessão",down:"1–3 dias (vermelhidão)",
   brands:"Dermapen 4 (Dp Dermaceuticals) · Eclipse MicroPen · SkinPen",
   result:"Cicatrizes em 4–6 sessões. Poros em 2–3.",
   note:"Usar PDRN sérum imediatamente pós-procedimento — penetração 10× maior com canais abertos.
Não fazer com retinol ativo (parar 5 dias antes)."},
  {n:"Morpheus8 (Microagulhamento + RF Fracionada)",em:"🌀",cat:"Agulhas",
   when:"Cicatrizes profundas, poros, flacidez, lifting de pele, gordura localizada",
   freq:"3 sessões (4–6 semanas de intervalo)",price:"R$2.000–5.000/sessão",down:"3–5 dias",
   brands:"Morpheus8 (InMode) · Fractora (InMode) · Genius RF (Lutronic)",
   result:"Textura e firmeza em 3 sessões. Resultado final em 3–6 meses.",
   note:"Combinação mais eficaz para cicatrizes de acne moderadas a severas. Dupla ação: microcanais + aquecimento dérmico."},
  {n:"PRP — Plasma Rico em Plaquetas (Vampire Facial)",em:"🩸",cat:"Agulhas",
   when:"Rejuvenescimento, cicatrizes, alopecia, olheiras, luminosidade",
   freq:"3–4 sessões mensais + manutenção semestral",price:"R$500–1.200/sessão",down:"1–2 dias",
   brands:"Protocolo médico — usa sangue próprio do paciente",
   result:"Brilho e textura em 2–3 sessões. Cicatrizes em 4–6.",
   note:"Sangue centrifugado libera fatores de crescimento (PDGF, VEGF, TGF-β). Sinérgico com microagulhamento.
100% autólogo = sem risco alérgico."},
  {n:"PRF — Fibrina Rica em Plaquetas (evolução do PRP)",em:"🔴",cat:"Agulhas",
   when:"Rejuvenescimento, olheiras, flacidez, acne, cicatrizes, regeneração",
   freq:"3–4 sessões mensais",price:"R$600–1.500/sessão",down:"1–3 dias",
   brands:"i-PRF (Intracel) · L-PRF · A-PRF",
   result:"Mais potente que PRP. Matriz de fibrina libera fatores de crescimento por mais tempo.",
   note:"Evolução do PRP: sem anticoagulante → fibrina forma scaffold que libera fatores de crescimento por 7–10 dias (vs PRP 24h).
Excelente para olheiras vasculares."},
  {n:"Eletroporação (Iontofornese / Electroporação)",em:"⚡",cat:"Agulhas",
   when:"Introdução de ativos tópicos sem agulha, hidratação, vitaminas, PDRN",
   freq:"Mensal ou associado a outros procedimentos",price:"R$150–400/sessão",down:"Nenhum",
   brands:"Máquinas de eletroporação (vendas Brasil) · No-needle mesotherapy",
   result:"Absorção de ativos 10–20× superior ao tópico convencional.",
   note:"Abre canais temporários na membrana celular por pulsos elétricos. Sem agulhas, sem dor.
Perfeito para intensificar o PDRN tópico em cabine."},

  // ── REGENERAÇÃO ──
  {n:"PDRN Injetável (Rejuran Healer)",em:"🧬",cat:"Regeneração",
   when:"Qualidade geral da pele, acne, PIH, luminosidade, regeneração, anti-aging",
   freq:"4 sessões quinzenais + manutenção a cada 3–6 meses",price:"R$600–1.800/sessão",down:"Mínimo — 24h",
   brands:"Rejuran Healer (PN Lab) · Rejuran I (olhos) · Rejuran S (cicatrizes) · PDRN Bioplacent",
   result:"Qualidade de pele visível em 2–3 sessões. Luminosidade imediata após cada sessão.",
   note:"O mesmo princípio dos seus serums PDRN — versão injetável. Estimula receptores A2A de adenosina.
Rejuran I: formulação específica para área dos olhos (olheiras, pálpebras).
✅ Compatível com skincare. Sinergia comprovada com PDRN tópico."},
  {n:"Exossomos Injetáveis (ExoSCRT / Cellthera)",em:"⚡",cat:"Regeneração",
   when:"Regeneração avançada, anti-aging, pós-procedimento intenso, luminosidade, queda capilar",
   freq:"2–4 sessões anuais",price:"R$1.500–5.000/sessão",down:"Mínimo",
   brands:"ExoSCRT (Korea) · Benev Exosome · Exovex",
   result:"Melhora de qualidade e textura em 2 sessões.",
   note:"Vesículas extracelulares carregam microRNA que regula expressão gênica. A fronteira da medicina estética 2025.
Amplifica resultado de qualquer procedimento anterior quando feito no mesmo dia."},
  {n:"Células-Tronco / SVF (Stromal Vascular Fraction)",em:"🌱",cat:"Regeneração",
   when:"Anti-aging profundo, regeneração, rejuvenescimento avançado",
   freq:"1–2 sessões anuais",price:"R$8.000–20.000",down:"Variável",
   brands:"Procedimento autólogo com lipoaspiração + centrifugação",
   result:"Regeneração celular progressiva em 3–6 meses.",
   note:"Procedimento médico avançado. SVF contém células-tronco do tecido adiposo + fatores de crescimento.
Diponível em centros especializados. Regulado pela ANVISA."},
  {n:"Biorevitalização com Nucleofill / Jalupro",em:"💉",cat:"Regeneração",
   when:"Qualidade de pele, anti-aging celular, regeneração matricial",
   freq:"4 sessões mensais + manutenção trimestral",price:"R$400–900/sessão",down:"1–2 dias",
   brands:"Nucleofill Soft / Strong (Promoitalia) · Jalupro Classic / HMW",
   result:"Melhora progressiva de textura e luminosidade em 4 sessões.",
   note:"Nucleofill: oligonucleotídeos polinucleotídeos (mesma família do PDRN). Synergy máxima com PDRN tópico.
Jalupro: aminoácidos dérmicos + HA → restaura matriz extracelular."},

  // ── LIMPEZA & BÁSICO ──
  {n:"Limpeza de Pele Profunda",em:"🫧",cat:"Limpeza",
   when:"Acne ativa, cravos (comedões), oleosidade excessiva, manutenção mensal",
   freq:"Mensal",price:"R$100–350/sessão",down:"1 dia (vermelhidão)",
   brands:"Clínica ou spa — procedimento com profissional habilitado",
   result:"Poros limpos imediatamente. Menos oleosidade por 2–4 semanas.",
   note:"Complementa o BHA em casa. Não fazer com retinol ativo (parar 5 dias antes).
Hydrafacial: versão modernizada + hidratação simultânea — preferível ao extração manual."},
  {n:"HydraFacial",em:"💦",cat:"Limpeza",
   when:"Limpeza + hidratação + tratamento em 1 sessão, poros, acne, manchas",
   freq:"Mensal",price:"R$400–800/sessão",down:"Nenhum",
   brands:"HydraFacial MD (BeautyHealth) · Aquapure · HydrO2 Facial",
   result:"Pele luminosa imediatamente. Resultado visível em 1 sessão.",
   note:"Esfoliação a vácuo + soro personalizado infundido. Sem downtime — pode fazer na véspera de evento.
Compatível com toda a rotina. Opção premium à limpeza convencional."},
  {n:"Dermaplaning (Dermabrasão a Lâmina)",em:"🪒",cat:"Limpeza",
   when:"Pelos finos (vellus), células mortas, textura, maquiagem que desliza melhor",
   freq:"Mensal",price:"R$150–350/sessão",down:"Nenhum",
   brands:"Procedimento com bisturi cirúrgico estéril (escalpelo 10R)",
   result:"Imediato — pele lisinha, luminosa, make perfecto.",
   note:"Remove pelos vellus + células mortas mecanicamente. Não altera espessura de pelos permanentemente.
Skincare penetra melhor depois. Não fazer com acne ativa."},
  {n:"Microdermoabrasão",em:"💨",cat:"Limpeza",
   when:"Textura irregular, manchas iniciais, cicatrizes superficiais, poros",
   freq:"A cada 2–4 semanas (série de 6)",price:"R$150–350/sessão",down:"1–2 dias",
   brands:"Máquinas de cristal ou diamante — múltiplas marcas",
   result:"Textura melhorada em 3–4 sessões.",
   note:"Esfoliação mecânica por vácuo + cristais/ponta de diamante. Mais superficial que peeling químico.
Compatível com rotina. Não fazer com retinol ativo."},
];

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function GlassSkinApp() {
  const [tab,         setTab]         = useState("hoje");
  const [amPm,        setAmPm]        = useState("am");
  const [done,        setDone]        = useState({});
  const [inventory,   setInventory]   = useState({}); // pid → {status:'ok'|'baixa'|'acabou', alt:''}
  const [month,       setMonth]       = useState(0);  // 0=fase1 … 3=fase4
  const [selDay,      setSelDay]      = useState(null);
  const [selAmPm,     setSelAmPm]     = useState("am");
  const [expanded,    setExpanded]    = useState(null);
  const [loaded,      setLoaded]      = useState(false);
  const [motivIdx,    setMotivIdx]    = useState(0);
  const [saveOk,      setSaveOk]      = useState(false);
  const [lastSaved,   setLastSaved]   = useState("");
  const [imgErr,      setImgErr]      = useState({});

  // AI states
  const [aiTab,         setAiTab]         = useState("foto");
  const [photoB64,      setPhotoB64]      = useState(null);
  const [photoRes,      setPhotoRes]      = useState("");
  const [photoLoad,     setPhotoLoad]     = useState(false);
  const [skinNotes,     setSkinNotes]     = useState("");
  const [skinRes,       setSkinRes]       = useState("");
  const [skinLoad,      setSkinLoad]      = useState(false);
  const [altPid,        setAltPid]        = useState("");
  const [altReason,     setAltReason]     = useState("");
  const [altRes,        setAltRes]        = useState("");
  const [altLoad,       setAltLoad]       = useState(false);
  // Body + Procedures states
  const [bodyB64,       setBodyB64]       = useState(null);
  const [bodyConcerns,  setBodyConcerns]  = useState("");
  const [bodyRes,       setBodyRes]       = useState("");
  const [bodyLoad,      setBodyLoad]      = useState(false);
  const [faceProfile,   setFaceProfile]   = useState("Pele mista-oleosa, acne grau II com PIH, Fitzpatrick III-IV, paralisia facial parcial, 30-40 anos, Recife-PE (alto UV)");
  const [faceRes,       setFaceRes]       = useState("");
  const [faceLoad,      setFaceLoad]      = useState(false);
  const [bodyProfile,   setBodyProfile]   = useState("Ceratose pilar nos braços e coxas, pele com tendência à acne no corpo, manchas, Fitzpatrick III-IV");
  const [bodyProcRes,   setBodyProcRes]   = useState("");
  const [bodyProcLoad,  setBodyProcLoad]  = useState(false);
  const bodyRef = useRef();
  const [procFaceCat, setProcFaceCat] = useState('todos');

  const mRef = useRef();

  // ── Load ──
  useEffect(() => {
    (async () => {
      try {
        const r = await _store.get("gs_v9");
        if (r?.value) {
          const d = JSON.parse(r.value);
          if (d?.version === "9") {
            if (d.done)      setDone(d.done);
            if (d.inventory) setInventory(d.inventory);
            if (d.prefs) {
              const p = d.prefs;
              if (p.tab)   setTab(p.tab);
              if (p.amPm)  setAmPm(p.amPm);
              if (typeof p.month === "number") setMonth(p.month);
              if (p.procFaceCat) setProcFaceCat(p.procFaceCat);
            }
            if (d.savedAt) setLastSaved(new Date(d.savedAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}));
          }
        }
      } catch(e) { console.warn(e); }
      setLoaded(true);
    })();
    mRef.current = setInterval(() => setMotivIdx(x => (x+1)%MOTIV.length), 9000);
    return () => clearInterval(mRef.current);
  }, []);

  // ── Auto-save ──
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      try {
        const now = new Date().toISOString();
        await _store.set("gs_v9", JSON.stringify({
          version:"9", done, inventory,
          prefs:{ tab, amPm, month, procFaceCat },
          savedAt: now,
        }));
        setLastSaved(new Date(now).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}));
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 2000);
      } catch(e) { console.warn(e); }
    }, 400);
    return () => clearTimeout(t);
  }, [done, inventory, tab, amPm, month, loaded]);

  const toggle = useCallback(k => setDone(p => ({ ...p, [k]: !p[k] })), []);
  const setInv = useCallback((pid, status) => setInventory(p => ({ ...p, [pid]: { ...p[pid], status } })), []);

  // ── Computed today ──
  const todayInfo = getInfo(TODAY_DAY);
  const todayAM   = makeAM(todayInfo);
  const todayPM   = makePM(todayInfo);
  const todayPct  = (() => {
    const amD = todayAM.filter((_,i) => done[`${TODAY_DAY}_am_${i}`]).length;
    const pmD = todayPM.filter((_,i) => done[`${TODAY_DAY}_pm_${i}`]).length;
    return Math.round((amD+pmD)/(todayAM.length+todayPM.length)*100)||0;
  })();
  const todayPhase = getPhase(TODAY_DAY);

  // ── Photo upload ──
  const fileRef = useRef();
  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoB64(ev.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }
  async function doAnalyzePhoto() {
    if (!photoB64) return;
    setPhotoLoad(true); setPhotoRes("");
    try { setPhotoRes(await analyzePhoto(photoB64)); }
    catch { setPhotoRes("Erro ao analisar. Tente novamente."); }
    setPhotoLoad(false);
  }
  async function doSkinAnalysis() {
    if (!skinNotes.trim()) return;
    setSkinLoad(true); setSkinRes("");
    try { setSkinRes(await analyzeSkin(skinNotes)); }
    catch { setSkinRes("Erro. Tente novamente."); }
    setSkinLoad(false);
  }
  async function doAltSuggest() {
    if (!altPid) return;
    setAltLoad(true); setAltRes("");
    const prod = P[altPid];
    try { setAltRes(await suggestAlternative(prod?.n||altPid, altReason||"produto acabou")); }
    catch { setAltRes("Erro. Tente novamente."); }
    setAltLoad(false);
  }

  // ── Body photo handler ──
  function handleBodyPhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBodyB64(ev.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  }
  async function doAnalyzeBody() {
    if (!bodyB64) return;
    setBodyLoad(true); setBodyRes("");
    try { setBodyRes(await analyzeBody(bodyB64, bodyConcerns)); }
    catch { setBodyRes("Erro ao analisar. Tente novamente."); }
    setBodyLoad(false);
  }
  async function doFaceProcedures() {
    setFaceLoad(true); setFaceRes("");
    try { setFaceRes(await suggestFaceProcedures(faceProfile)); }
    catch { setFaceRes("Erro. Tente novamente."); }
    setFaceLoad(false);
  }
  async function doBodyProcedures() {
    setBodyProcLoad(true); setBodyProcRes("");
    try { setBodyProcRes(await suggestBodyProcedures(bodyProfile)); }
    catch { setBodyProcRes("Erro. Tente novamente."); }
    setBodyProcLoad(false);
  }

  // ── Inventory status color ──
  const invColor = s => s==="acabou"?"#F06060":s==="baixa"?"#F0A030":"#40C080";
  const invLabel = s => s==="acabou"?"💀 Acabou":s==="baixa"?"⚠️ Baixo":"✅ OK";

  // ── Styles ──
  const C = { bg:"#090D1A", card:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.08)" };

  const TABS = [
    {id:"hoje",    icon:"✦",  l:"Hoje"},
    {id:"rotina",  icon:"📅", l:"Rotina"},
    {id:"produtos",icon:"🧴", l:"Estoque"},
    {id:"ia",      icon:"🤖", l:"IA Pele"},
    {id:"mae60",   icon:"💕", l:"Mamãe"},
  ];

  // ── StepCard ──
  const StepCard = ({ step, dayNum, idx, ampm }) => {
    const k    = `${dayNum}_${ampm}_${idx}`;
    const prod = P[step.pid]; if (!prod) return null;
    const isDone  = !!done[k];
    const isOpen  = expanded === k;
    const invSt   = inventory[step.pid]?.status;
    const isOut   = invSt === "acabou";
    return (
      <div style={{ borderRadius:16, overflow:"hidden", border:`2px solid ${isDone?prod.bg+"80":isOut?"rgba(240,100,100,0.3)":"rgba(255,255,255,0.08)"}`, marginBottom:9, transition:"all 0.2s", background:isDone?`${prod.bg}12`:isOut?"rgba(200,40,40,0.04)":"rgba(255,255,255,0.025)" }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", padding:"11px 13px" }}>
          {/* Check */}
          <div onClick={() => toggle(k)} style={{ width:34,height:34,borderRadius:"50%",flexShrink:0,background:isDone?prod.bg:"rgba(255,255,255,0.06)",border:`2px solid ${isDone?prod.bg+"EE":"rgba(255,255,255,0.14)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone?15:12,fontWeight:800,color:isDone?prod.tx:"#4A5080",cursor:"pointer",transition:"all 0.22s",boxShadow:isDone?`0 0 12px ${prod.bg}50`:"none" }}>
            {isDone?"✓":idx+1}
          </div>
          {/* Emoji */}
          <div style={{ width:38,height:38,borderRadius:8,background:prod.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,position:"relative" }}>
            {prod.em}
            {isOut && <div style={{ position:"absolute",top:-3,right:-3,fontSize:10 }}>💀</div>}
          </div>
          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex",gap:5,flexWrap:"wrap",marginBottom:3 }}>
              <span style={{ background:prod.bg,color:prod.tx,borderRadius:12,padding:"1px 7px",fontSize:9,fontWeight:800,textTransform:"uppercase" }}>{prod.tag}</span>
              {step.wait>0 && <span style={{ background:"rgba(80,140,255,0.15)",color:"#90B8FF",borderRadius:8,padding:"1px 6px",fontSize:9,fontWeight:700 }}>{WAIT_MSGS[step.wait]}</span>}
              {isOut && <span style={{ background:"rgba(240,100,100,0.2)",color:"#F06060",borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:700 }}>ACABOU</span>}
            </div>
            <div style={{ fontSize:14,fontWeight:700,color:isDone?"#F0E8FF":isOut?"#A07070":"#C0C8E0",lineHeight:1.2,marginBottom:3 }}>{prod.s}</div>
            <div style={{ fontSize:11.5,color:"#6070A0",lineHeight:1.4 }}>{step.note}</div>
          </div>
          {/* Expand */}
          <div onClick={() => setExpanded(isOpen?null:k)} style={{ width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }}>
            <span style={{ fontSize:10,color:"#4A5068",display:"block",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s" }}>▾</span>
          </div>
        </div>
        {isOpen && (
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)",padding:"11px 13px 13px",background:"rgba(0,0,0,0.15)" }}>
            {step.sci && (
              <div style={{ background:"rgba(160,100,240,0.08)",borderRadius:10,padding:"9px 12px",marginBottom:8,border:"1px solid rgba(160,100,240,0.15)" }}>
                <div style={{ fontSize:9,letterSpacing:1.5,color:"#C098F8",fontWeight:700,marginBottom:4 }}>🔬 BASE CIENTÍFICA</div>
                <div style={{ fontSize:12,color:"#8878C0",lineHeight:1.6 }}>{step.sci}</div>
              </div>
            )}
            {/* Inventory control */}
            <div style={{ marginTop:4 }}>
              <div style={{ fontSize:9,letterSpacing:1.2,color:"#5A6080",fontWeight:700,marginBottom:6 }}>ESTOQUE DO PRODUTO</div>
              <div style={{ display:"flex",gap:6 }}>
                {["ok","baixa","acabou"].map(st => (
                  <button key={st} onClick={() => setInv(step.pid, st)} style={{ flex:1,padding:"6px 4px",fontSize:10,fontWeight:700,background:invSt===st?`${invColor(st)}20`:"rgba(255,255,255,0.04)",border:`1px solid ${invSt===st?invColor(st)+"50":"rgba(255,255,255,0.08)"}`,borderRadius:8,color:invSt===st?invColor(st):"#4A5080",cursor:"pointer" }}>
                    {invLabel(st)}
                  </button>
                ))}
              </div>
              {isOut && (
                <button onClick={() => { setAltPid(step.pid); setTab("ia"); setAiTab("alternativa"); }} style={{ width:"100%",marginTop:6,padding:"8px",background:"linear-gradient(135deg,#667EEA,#764BA2)",border:"none",borderRadius:10,color:"white",fontSize:11,fontWeight:700,cursor:"pointer" }}>
                  🤖 Pedir substituto à IA
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!loaded) return (
    <div style={{ background:C.bg,height:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ color:"#C9A88A",fontFamily:"serif",fontSize:18,letterSpacing:2 }}>✨ Carregando...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:C.bg,color:"#E0D8F0",fontFamily:"'DM Sans','Outfit',system-ui,sans-serif",overflowX:"hidden" }}>
      {/* Ambient glows */}
      <div style={{ position:"fixed",top:"-10%",right:"-20%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(#C9A88A10,transparent 70%)",pointerEvents:"none" }}/>
      <div style={{ position:"fixed",bottom:"-20%",left:"-20%",width:600,height:600,borderRadius:"50%",background:"radial-gradient(#667EEA0A,transparent 70%)",pointerEvents:"none" }}/>

      {/* ── HEADER ── */}
      <div style={{ background:"rgba(9,13,26,0.94)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"12px 16px 9px",position:"sticky",top:0,zIndex:50 }}>
        <div style={{ maxWidth:520,margin:"0 auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7 }}>
            <div>
              <div style={{ fontSize:9,letterSpacing:3.5,color:"#C9A88A",textTransform:"uppercase",fontWeight:700 }}>Glass Skin Protocol</div>
              <div style={{ fontSize:18,fontFamily:"Georgia,serif",background:"linear-gradient(130deg,#F8E8D0,#C9A88A,#E0C8F8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>365 Dias de Ritual</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10,color:"#4A5280" }}>Qua, 13 Mai 2026</div>
              <div style={{ fontSize:10,color:todayPhase.col1,fontWeight:700 }}>Dia 1 · {todayPhase.icon} {todayPhase.name}</div>
              {lastSaved && <div style={{ fontSize:9,color:"#3A4060" }}>💾 {lastSaved} {saveOk&&<span style={{color:"#40C070"}}>✓</span>}</div>}
            </div>
          </div>
          <div style={{ background:"rgba(201,168,138,0.07)",borderRadius:10,padding:"7px 12px",border:"1px solid rgba(201,168,138,0.12)" }}>
            <div style={{ fontSize:11,color:"#A89878",fontStyle:"italic",lineHeight:1.4,textAlign:"center" }}>"{MOTIV[motivIdx]}"</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:520,margin:"0 auto",padding:"14px 12px 86px" }}>

        {/* ══════════ HOJE ══════════ */}
        {tab==="hoje" && (
          <div>
            {/* Progress */}
            <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:16,marginBottom:14,display:"flex",gap:14,alignItems:"center" }}>
              <div style={{ position:"relative",width:64,height:64,flexShrink:0 }}>
                <svg width="64" height="64" style={{ transform:"rotate(-90deg)" }}>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
                  <circle cx="32" cy="32" r="26" fill="none" stroke="url(#gT)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${163.4*todayPct/100} 163.4`}/>
                  <defs><linearGradient id="gT" x1="0" y1="0" x2="1" y2="0"><stop stopColor={todayPhase.col1}/><stop offset="1" stopColor={todayPhase.col2}/></linearGradient></defs>
                </svg>
                <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#C9A88A" }}>{todayPct}%</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15,fontWeight:800,color:"#F0E8FF",marginBottom:1 }}>Quarta-feira · Dia 1 ✦</div>
                <div style={{ fontSize:11,color:"#5A6080",marginBottom:5 }}>{todayPhase.icon} Fase 1 — {todayPhase.name} · Início do protocolo</div>
                <div style={{ fontSize:11,color:"#7080A0",lineHeight:1.4 }}>{todayPhase.desc}</div>
              </div>
            </div>

            {/* AM/PM toggle */}
            <div style={{ display:"flex",gap:8,marginBottom:12 }}>
              {[{id:"am",icon:"🌅",label:"Manhã",cnt:todayAM.length,grad:"linear-gradient(135deg,#F6D365,#FDA085)"},{id:"pm",icon:"🌙",label:"Noite",cnt:todayPM.length,grad:"linear-gradient(135deg,#667EEA,#764BA2)"}].map(t=>(
                <button key={t.id} onClick={()=>setAmPm(t.id)} style={{ flex:1,padding:"12px 8px",cursor:"pointer",background:amPm===t.id?t.grad:"rgba(255,255,255,0.04)",border:amPm===t.id?"none":`1px solid ${C.border}`,borderRadius:16,color:amPm===t.id?"white":"#4A5280",fontSize:13,fontWeight:800,display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.25s" }}>
                  <span style={{ fontSize:20 }}>{t.icon}</span>
                  <span>{t.label}</span>
                  <span style={{ fontSize:10,opacity:0.8 }}>{t.cnt} passos</span>
                </button>
              ))}
            </div>

            <div style={{ fontSize:11,color:"#3A4060",marginBottom:10,padding:"7px 12px",background:"rgba(100,160,255,0.05)",borderRadius:10,border:"1px solid rgba(100,160,255,0.1)" }}>
              💡 Toque no ✓ para marcar · Toque em ▾ para ver a ciência e controlar o estoque
            </div>

            {(amPm==="am"?todayAM:todayPM).map((s,i)=>(
              <StepCard key={`hoje_${amPm}_${i}`} step={s} dayNum={TODAY_DAY} idx={i} ampm={amPm}/>
            ))}
          </div>
        )}

        {/* ══════════ ROTINA ══════════ */}
        {tab==="rotina" && (
          <div>
            {/* Phase selector */}
            <div style={{ display:"flex",gap:5,marginBottom:12,overflowX:"auto",scrollbarWidth:"none" }}>
              {PHASES.map((ph,i)=>(
                <button key={i} onClick={()=>setMonth(i)} style={{ flexShrink:0,padding:"8px 10px",fontSize:10,fontWeight:700,background:month===i?`linear-gradient(135deg,${ph.col1},${ph.col2})`:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:10,color:month===i?"white":"#4A5280",cursor:"pointer" }}>
                  {ph.icon} {ph.name}<br/><span style={{ fontSize:8,opacity:0.8 }}>{ph.days}</span>
                </button>
              ))}
            </div>
            {/* Phase info */}
            <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"11px 14px",marginBottom:12,fontSize:11,color:"#6878A8",lineHeight:1.6 }}>
              <b style={{ color:PHASES[month].col1 }}>Fase {PHASES[month].n}: {PHASES[month].days} — {PHASES[month].name}</b><br/>
              {PHASES[month].desc}
            </div>
            {/* Calendar grid */}
            {(() => {
              const ph = PHASES[month];
              const [dayStart, dayEnd] = month===0?[1,30]:month===1?[31,90]:month===2?[91,180]:[181,365];
              const totalInPhase = dayEnd-dayStart+1;
              const firstDow = getDow(dayStart);
              const showDays = Math.min(totalInPhase, 60); // show max 60 days grid
              return (
                <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"12px 10px",marginBottom:10 }}>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6 }}>
                    {DOW_PT.map(d=><div key={d} style={{ textAlign:"center",fontSize:9,color:"#3A4060",fontWeight:700 }}>{d}</div>)}
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2 }}>
                    {Array.from({length:firstDow},(_,i)=><div key={`e${i}`}/>)}
                    {Array.from({length:showDays},(_,i)=>{
                      const d=dayStart+i; const inf=getInfo(d); const date=getDate(d);
                      const isSel=selDay===d; const isTd=d===TODAY_DAY;
                      return(
                        <button key={d} onClick={()=>{setSelDay(isSel?null:d);setSelAmPm("am");}} style={{ aspectRatio:"1",borderRadius:9,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:isSel?`linear-gradient(135deg,${ph.col1}44,${ph.col2}44)`:isTd?"rgba(201,168,138,0.2)":"rgba(255,255,255,0.03)",border:isTd?`1.5px solid ${ph.col1}`:isSel?`1.5px solid ${ph.col1}`:`1px solid ${C.border}`,padding:2 }}>
                          <div style={{ fontSize:9,fontWeight:700,color:isTd?"#C9A88A":"#8090B8",lineHeight:1 }}>{date.getDate()}</div>
                          <div style={{ fontSize:9,lineHeight:1 }}>{dayIcon(inf)}</div>
                        </button>
                      );
                    })}
                  </div>
                  {totalInPhase>60 && <div style={{ fontSize:10,color:"#3A4060",textAlign:"center",marginTop:8 }}>+{totalInPhase-60} dias na fase · Use ▸ para navegar</div>}
                </div>
              );
            })()}
            {/* Legend */}
            <div style={{ display:"flex",flexWrap:"wrap",gap:8,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 12px" }}>
              {[["🌙","Retinóide"],["🎭","Argila"],["🍎","Enzimático"],["💎","Reedle"],["✨","Sheet"],["💧","Recovery"]].map(([ic,lb])=>(
                <div key={lb} style={{ display:"flex",alignItems:"center",gap:4 }}><span style={{ fontSize:10 }}>{ic}</span><span style={{ fontSize:9,color:"#3A4060" }}>{lb}</span></div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ ESTOQUE ══════════ */}
        {tab==="produtos" && (
          <div>
            <div style={{ background:"rgba(201,168,138,0.08)",border:"1px solid rgba(201,168,138,0.2)",borderRadius:14,padding:"11px 14px",marginBottom:14 }}>
              <div style={{ fontSize:13,fontWeight:800,color:"#C9A88A",marginBottom:4 }}>🧴 Controle de Estoque</div>
              <div style={{ fontSize:12,color:"#7080A0",lineHeight:1.5 }}>Marque o nível de cada produto. Quando acabar, a IA sugere substitutos imediatamente.</div>
            </div>
            {/* Finished products alert */}
            {Object.entries(inventory).filter(([,v])=>v.status==="acabou").length>0 && (
              <div style={{ background:"rgba(240,100,100,0.1)",border:"1px solid rgba(240,100,100,0.25)",borderRadius:12,padding:"10px 13px",marginBottom:12 }}>
                <div style={{ fontSize:12,fontWeight:800,color:"#F06060",marginBottom:6 }}>💀 Acabou — pedir substituto:</div>
                {Object.entries(inventory).filter(([,v])=>v.status==="acabou").map(([pid])=>(
                  <button key={pid} onClick={()=>{setAltPid(pid);setTab("ia");setAiTab("alternativa");}} style={{ display:"block",width:"100%",textAlign:"left",padding:"7px 10px",marginBottom:5,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(240,100,100,0.2)",borderRadius:9,cursor:"pointer" }}>
                    <span style={{ fontSize:13 }}>{P[pid]?.em}</span>{" "}
                    <span style={{ fontSize:12,fontWeight:700,color:"#E0D8F0" }}>{P[pid]?.s}</span>
                    <span style={{ fontSize:10,color:"#667EEA",marginLeft:8 }}>→ Ver substituto IA</span>
                  </button>
                ))}
              </div>
            )}
            {/* All products */}
            {Object.entries(P).map(([pid,prod])=>{
              const invSt = inventory[pid]?.status || "ok";
              return(
                <div key={pid} style={{ background:C.card,border:`1px solid ${invSt==="acabou"?"rgba(240,100,100,0.25)":invSt==="baixa"?"rgba(240,160,48,0.2)":C.border}`,borderRadius:14,padding:"11px 13px",marginBottom:8 }}>
                  <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:8 }}>
                    <div style={{ width:36,height:36,borderRadius:8,background:prod.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{prod.em}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",gap:5,alignItems:"center",marginBottom:2 }}>
                        <span style={{ background:prod.bg,color:prod.tx,borderRadius:12,padding:"1px 7px",fontSize:9,fontWeight:800,textTransform:"uppercase" }}>{prod.tag}</span>
                        {prod.ph!=="—"&&<span style={{ fontSize:9,color:"#4A5280" }}>pH {prod.ph}</span>}
                      </div>
                      <div style={{ fontSize:13,fontWeight:700,color:"#E0D8F0" }}>{prod.s}</div>
                      <div style={{ fontSize:10,color:"#5A6080" }}>{prod.n}</div>
                    </div>
                    <div style={{ fontSize:11,fontWeight:700,color:invColor(invSt),background:`${invColor(invSt)}18`,borderRadius:8,padding:"3px 9px",flexShrink:0 }}>{invLabel(invSt)}</div>
                  </div>
                  <div style={{ display:"flex",gap:6 }}>
                    {["ok","baixa","acabou"].map(st=>(
                      <button key={st} onClick={()=>setInv(pid,st)} style={{ flex:1,padding:"7px 4px",fontSize:10,fontWeight:700,background:invSt===st?`${invColor(st)}20`:"rgba(255,255,255,0.04)",border:`1px solid ${invSt===st?invColor(st)+"50":C.border}`,borderRadius:9,color:invSt===st?invColor(st):"#4A5280",cursor:"pointer" }}>
                        {invLabel(st)}
                      </button>
                    ))}
                  </div>
                  {invSt==="acabou" && (
                    <button onClick={()=>{setAltPid(pid);setTab("ia");setAiTab("alternativa");}} style={{ width:"100%",marginTop:7,padding:"9px",background:"linear-gradient(135deg,#667EEA,#764BA2)",border:"none",borderRadius:11,color:"white",fontSize:12,fontWeight:700,cursor:"pointer" }}>
                      🤖 IA — Sugerir substituto
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════ IA PELE & CORPO ══════════ */}
        {tab==="ia" && (
          <div>
            {/* Header */}
            <div style={{ background:"linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.08))",border:"1px solid rgba(102,126,234,0.25)",borderRadius:14,padding:"10px 13px",marginBottom:12 }}>
              <div style={{ fontSize:13,fontWeight:800,color:"#9090FF",marginBottom:2 }}>🤖 IA Gemini — Análise Completa</div>
              <div style={{ fontSize:11,color:"#5A5880" }}>Rosto · Corpo · Procedimentos · Substitutos · Rotina</div>
            </div>
            {/* Sub-tabs — scrollable row */}
            <div style={{ display:"flex",gap:6,marginBottom:14,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2 }}>
              {[
                {id:"foto",       l:"📸 Rosto"},
                {id:"corpo",      l:"🫁 Corpo"},
                {id:"procedFace", l:"💆 Proc. Faciais"},
                {id:"procedBody", l:"💪 Proc. Corporais"},
                {id:"texto",      l:"💬 Rotina"},
                {id:"alternativa",l:"🔄 Substitutos"},
              ].map(t=>(
                <button key={t.id} onClick={()=>setAiTab(t.id)} style={{ flexShrink:0,padding:"9px 12px",fontSize:10,fontWeight:700,background:aiTab===t.id?"linear-gradient(135deg,#667EEA,#764BA2)":"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,borderRadius:11,color:aiTab===t.id?"white":"#4A5280",cursor:"pointer" }}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* Photo analysis */}
            {aiTab==="foto" && (
              <div>
                <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:"#E0D8F0",marginBottom:6 }}>📸 Análise de Foto com IA</div>
                  <div style={{ fontSize:12,color:"#5A6080",lineHeight:1.5,marginBottom:12 }}>Tire uma foto do seu rosto (boa iluminação, sem filtro) e a IA avalia: acne, manchas, hidratação, poros e sugere ajustes na rotina.</div>
                  <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handlePhoto} style={{ display:"none" }}/>
                  <button onClick={()=>fileRef.current?.click()} style={{ width:"100%",padding:"14px",background:photoB64?"rgba(0,200,100,0.1)":"rgba(255,255,255,0.06)",border:photoB64?"1px solid rgba(0,200,100,0.3)":`1px solid ${C.border}`,borderRadius:12,color:photoB64?"#40C070":"#C9A88A",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                    {photoB64?"✅ Foto carregada — trocar":"📷 Tirar ou selecionar foto"}
                  </button>
                  {photoB64 && (
                    <div style={{ marginTop:10 }}>
                      <img src={`data:image/jpeg;base64,${photoB64}`} alt="preview" style={{ width:"100%",maxHeight:220,objectFit:"cover",borderRadius:10 }}/>
                    </div>
                  )}
                </div>
                <button onClick={doAnalyzePhoto} disabled={!photoB64||photoLoad} style={{ width:"100%",padding:14,background:photoLoad||!photoB64?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#667EEA,#764BA2)",border:"none",borderRadius:14,color:"white",fontSize:14,fontWeight:800,cursor:photoLoad||!photoB64?"not-allowed":"pointer",marginBottom:14 }}>
                  {photoLoad?"🤖 Analisando sua pele...":"🤖 Analisar com Gemini AI"}
                </button>
                {photoRes && (
                  <div style={{ background:"rgba(100,80,160,0.08)",border:"1px solid rgba(100,80,160,0.2)",borderRadius:14,padding:16,fontSize:12.5,color:"#C0C8E0",lineHeight:1.75,whiteSpace:"pre-wrap" }}>
                    {photoRes}
                  </div>
                )}
              </div>
            )}

            {/* Skin analysis text */}
            {aiTab==="texto" && (
              <div>
                <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:"#E0D8F0",marginBottom:6 }}>💬 Análise da Rotina</div>
                  <div style={{ fontSize:12,color:"#5A6080",lineHeight:1.5,marginBottom:10 }}>Descreva como sua pele está respondendo, o que percebeu de mudanças, e a IA sugere ajustes personalizados.</div>
                  <textarea value={skinNotes} onChange={e=>setSkinNotes(e.target.value)} placeholder="Ex: 'Minha pele está menos oleosa que antes, mas ainda tenho manchas. Comecei o retinol na semana 3 sem irritação. Estou no Dia 21. Preocupação principal: as manchas pós-acne...'" style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:"#E0D8F0",fontSize:12,lineHeight:1.5,minHeight:100,resize:"vertical",outline:"none",fontFamily:"inherit" }}/>
                </div>
                <button onClick={doSkinAnalysis} disabled={!skinNotes.trim()||skinLoad} style={{ width:"100%",padding:14,background:skinLoad||!skinNotes.trim()?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#43E97B,#38F9D7)",border:"none",borderRadius:14,color:skinLoad?"white":"#001a10",fontSize:14,fontWeight:800,cursor:skinLoad||!skinNotes.trim()?"not-allowed":"pointer",marginBottom:14 }}>
                  {skinLoad?"🤖 Analisando...":"🤖 Analisar com Gemini AI"}
                </button>
                {skinRes && (
                  <div style={{ background:"rgba(67,233,123,0.05)",border:"1px solid rgba(67,233,123,0.2)",borderRadius:14,padding:16,fontSize:12.5,color:"#C0E0C8",lineHeight:1.75,whiteSpace:"pre-wrap" }}>
                    {skinRes}
                  </div>
                )}
              </div>
            )}

            {/* ── BODY ANALYSIS ── */}
            {aiTab==="corpo" && (
              <div>
                <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:"#E0D8F0",marginBottom:6 }}>🫁 Análise de Foto do Corpo</div>
                  <div style={{ fontSize:12,color:"#5A6080",lineHeight:1.5,marginBottom:10 }}>Fotografia do braço, coxa ou área de preocupação. A IA identifica ceratose pilar, celulite, estrias, manchas e flacidez — e sugere tratamentos.</div>
                  <div style={{ fontSize:12,fontWeight:700,color:"#C9A88A",marginBottom:6 }}>Preocupações principais (opcional):</div>
                  <textarea value={bodyConcerns} onChange={e=>setBodyConcerns(e.target.value)} placeholder="Ex: ceratose pilar forte nos braços, celulite nas coxas, estrias no abdômen..." style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:"#E0D8F0",fontSize:12,minHeight:60,resize:"vertical",outline:"none",fontFamily:"inherit",marginBottom:10 }}/>
                  <input ref={bodyRef} type="file" accept="image/*" capture="environment" onChange={handleBodyPhoto} style={{ display:"none" }}/>
                  <button onClick={()=>bodyRef.current?.click()} style={{ width:"100%",padding:"13px",background:bodyB64?"rgba(0,200,100,0.1)":"rgba(255,255,255,0.06)",border:bodyB64?"1px solid rgba(0,200,100,0.3)":`1px solid ${C.border}`,borderRadius:12,color:bodyB64?"#40C070":"#C9A88A",fontSize:13,fontWeight:700,cursor:"pointer" }}>
                    {bodyB64?"✅ Foto carregada — trocar":"📷 Fotografar área do corpo"}
                  </button>
                  {bodyB64&&<img src={`data:image/jpeg;base64,${bodyB64}`} alt="body" style={{ width:"100%",maxHeight:200,objectFit:"cover",borderRadius:10,marginTop:10 }}/>}
                </div>
                <button onClick={doAnalyzeBody} disabled={!bodyB64||bodyLoad} style={{ width:"100%",padding:14,background:bodyLoad||!bodyB64?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#43E97B,#38F9D7)",border:"none",borderRadius:14,color:bodyLoad?"white":"#001a10",fontSize:14,fontWeight:800,cursor:bodyLoad||!bodyB64?"not-allowed":"pointer",marginBottom:14 }}>
                  {bodyLoad?"🤖 Analisando corpo...":"🤖 Analisar Corpo com Gemini AI"}
                </button>
                {bodyRes&&<div style={{ background:"rgba(67,233,123,0.05)",border:"1px solid rgba(67,233,123,0.2)",borderRadius:14,padding:16,fontSize:12.5,color:"#C0E0C8",lineHeight:1.75,whiteSpace:"pre-wrap" }}>{bodyRes}</div>}
              </div>
            )}

            {/* ── PROCEDIMENTOS FACIAIS ── */}
            {aiTab==="procedFace" && (
              <div>
                <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:"#E0D8F0",marginBottom:6 }}>💆 Procedimentos Estéticos Faciais</div>
                  <div style={{ fontSize:12,color:"#5A6080",lineHeight:1.5,marginBottom:10 }}>A IA recomenda procedimentos priorizados para o seu perfil de pele, com preços, sessões, downtime e como combinar com a rotina em casa.</div>
                  <div style={{ fontSize:12,fontWeight:700,color:"#C9A88A",marginBottom:6 }}>Perfil da sua pele (editar se necessário):</div>
                  <textarea value={faceProfile} onChange={e=>setFaceProfile(e.target.value)} style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:"#E0D8F0",fontSize:12,minHeight:80,resize:"vertical",outline:"none",fontFamily:"inherit" }}/>
                  <div style={{ marginTop:12,display:"flex",flexWrap:"wrap",gap:6 }}>
                    {["Acne ativa grau II","Manchas pós-acne (PIH)","Paralisia facial parcial","Pele mista-oleosa","Fitzpatrick III-IV","Poros dilatados","Rugas iniciais","Falta de firmeza","Olheiras"].map(tag=>(
                      <button key={tag} onClick={()=>setFaceProfile(p=>p.includes(tag)?p:p+", "+tag)} style={{ padding:"4px 10px",fontSize:10,fontWeight:600,background:"rgba(102,126,234,0.1)",border:"1px solid rgba(102,126,234,0.25)",borderRadius:8,color:"#9090FF",cursor:"pointer" }}>+ {tag}</button>
                    ))}
                  </div>
                </div>
                {/* Procedure overview cards — FULL CATALOG */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12,fontWeight:800,color:"#C9A88A",marginBottom:8 }}>📋 Catálogo Completo — {["todos","Toxinas","Preench.","Bioestim.","Fios","Peelings","Laser","RF & HIFU","Agulhas","Regeneração","Limpeza"].filter(c=>c==="todos"||FACE_PROCS.some(p=>p.cat===c)).length>0?FACE_PROCS.filter(p=>procFaceCat==="todos"||p.cat===procFaceCat).length:"0"} procedimentos</div>
                  {/* Category filter */}
                  <div style={{ display:"flex",gap:5,marginBottom:10,overflowX:"auto",scrollbarWidth:"none",paddingBottom:3 }}>
                    {["todos","Toxinas","Preench.","Bioestim.","Fios","Peelings","Laser","RF & HIFU","Agulhas","Regeneração","Limpeza"].map(cat=>(
                      <button key={cat} onClick={()=>setProcFaceCat(cat)} style={{ flexShrink:0,padding:"5px 10px",fontSize:9,fontWeight:700,textTransform:"uppercase",background:procFaceCat===cat?"linear-gradient(135deg,#667EEA,#764BA2)":"rgba(255,255,255,0.05)",border:`1px solid ${C.border}`,borderRadius:8,color:procFaceCat===cat?"white":"#5A6080",cursor:"pointer" }}>{cat==="todos"?"✦ Todos":cat}</button>
                    ))}
                  </div>
                  {FACE_PROCS.filter(p=>procFaceCat==="todos"||p.cat===procFaceCat).map((proc,i)=>{
                    const key=`fproc_${proc.n}`;
                    const isOpen=expanded===key;
                    const catColors={"Toxinas":"#F06060","Preench.":"#80A8FF","Bioestim.":"#F6D365","Fios":"#F093FB","Peelings":"#FFCF88","Laser":"#60E8FF","RF & HIFU":"#60D080","Agulhas":"#F8B8D0","Regeneração":"#88EEE8","Limpeza":"#A8E8A8"};
                    const catColor=catColors[proc.cat]||"#9090FF";
                    return(
                      <div key={key} style={{ background:C.card,border:`1.5px solid ${isOpen?catColor+"50":"rgba(255,255,255,0.07)"}`,borderRadius:14,marginBottom:8,overflow:"hidden",transition:"border-color 0.2s" }}>
                        <div onClick={()=>setExpanded(isOpen?null:key)} style={{ display:"flex",gap:10,padding:"12px 13px",cursor:"pointer",alignItems:"center" }}>
                          <span style={{ fontSize:22,flexShrink:0 }}>{proc.em}</span>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap" }}>
                              <span style={{ fontSize:13,fontWeight:700,color:"#E0D8F0",lineHeight:1.2 }}>{proc.n}</span>
                              <span style={{ background:`${catColor}22`,color:catColor,borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:800,flexShrink:0 }}>{proc.cat}</span>
                              {proc.flag&&<span style={{ background:"rgba(240,100,100,0.15)",color:"#F06060",borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:700,flexShrink:0 }}>{proc.flag}</span>}
                            </div>
                            <div style={{ fontSize:11,color:"#5A6080" }}>{proc.price} · <span style={{ color:"#4A5280" }}>⏱ {proc.down}</span></div>
                          </div>
                          <span style={{ fontSize:10,color:"#3A4068",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0 }}>▾</span>
                        </div>
                        {isOpen&&<div style={{ borderTop:`1px solid ${catColor}20`,padding:"10px 14px 14px",background:"rgba(0,0,0,0.12)" }}>
                          <div style={{ marginBottom:8 }}>
                            <div style={{ fontSize:9,fontWeight:800,color:"#C9A88A",letterSpacing:1.2,marginBottom:3 }}>INDICADO PARA</div>
                            <div style={{ fontSize:12,color:"#9090B8",lineHeight:1.4 }}>{proc.when}</div>
                          </div>
                          {proc.brands&&<div style={{ marginBottom:8 }}>
                            <div style={{ fontSize:9,fontWeight:800,color:catColor,letterSpacing:1.2,marginBottom:3 }}>MARCAS / PRODUTOS</div>
                            <div style={{ fontSize:12,color:"#7080A0" }}>{proc.brands}</div>
                          </div>}
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8 }}>
                            <div style={{ background:`${catColor}12`,borderRadius:8,padding:"7px 10px",border:`1px solid ${catColor}25` }}>
                              <div style={{ fontSize:9,fontWeight:700,color:catColor,marginBottom:2 }}>FREQUÊNCIA</div>
                              <div style={{ fontSize:11,color:"#7080A0",lineHeight:1.3 }}>{proc.freq}</div>
                            </div>
                            <div style={{ background:"rgba(240,100,100,0.08)",borderRadius:8,padding:"7px 10px" }}>
                              <div style={{ fontSize:9,fontWeight:700,color:"#F06060",marginBottom:2 }}>DOWNTIME</div>
                              <div style={{ fontSize:11,color:"#A06060",lineHeight:1.3 }}>{proc.down}</div>
                            </div>
                          </div>
                          {proc.result&&<div style={{ background:"rgba(100,160,100,0.07)",borderRadius:9,padding:"8px 10px",marginBottom:7,border:"1px solid rgba(100,160,100,0.15)" }}>
                            <div style={{ fontSize:9,fontWeight:700,color:"#60C080",marginBottom:2 }}>⏳ RESULTADO</div>
                            <div style={{ fontSize:11.5,color:"#406050",lineHeight:1.5 }}>{proc.result}</div>
                          </div>}
                          <div style={{ background:"rgba(201,168,138,0.08)",borderRadius:9,padding:"8px 10px",border:"1px solid rgba(201,168,138,0.15)" }}>
                            <div style={{ fontSize:9,fontWeight:700,color:"#C9A88A",marginBottom:2 }}>📝 NOTA PARA SEU PERFIL</div>
                            <div style={{ fontSize:11.5,color:"#806040",lineHeight:1.55,whiteSpace:"pre-line" }}>{proc.note}</div>
                          </div>
                          <div style={{ marginTop:8,fontSize:12,fontWeight:800,color:"#C9A88A" }}>💰 {proc.price}</div>
                        </div>}
                      </div>
                    );
                  })}
                </div>
                <button onClick={doFaceProcedures} disabled={faceLoad} style={{ width:"100%",padding:14,background:faceLoad?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#F093FB,#F5576C)",border:"none",borderRadius:14,color:"white",fontSize:14,fontWeight:800,cursor:faceLoad?"not-allowed":"pointer",marginBottom:14 }}>
                  {faceLoad?"🤖 Gerando plano personalizado...":"🤖 IA — Plano Personalizado de Procedimentos"}
                </button>
                {faceRes&&<div style={{ background:"rgba(240,90,200,0.06)",border:"1px solid rgba(240,90,200,0.2)",borderRadius:14,padding:16,fontSize:12.5,color:"#E0C0E8",lineHeight:1.75,whiteSpace:"pre-wrap" }}>{faceRes}</div>}
              </div>
            )}

            {/* ── PROCEDIMENTOS CORPORAIS ── */}
            {aiTab==="procedBody" && (
              <div>
                <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:"#E0D8F0",marginBottom:6 }}>💪 Procedimentos Estéticos Corporais</div>
                  <div style={{ fontSize:12,color:"#5A6080",lineHeight:1.5,marginBottom:10 }}>Recomendações para ceratose pilar, celulite, estrias, flacidez e gordura localizada — clínica e em casa.</div>
                  <div style={{ fontSize:12,fontWeight:700,color:"#C9A88A",marginBottom:6 }}>Perfil corporal (editar):</div>
                  <textarea value={bodyProfile} onChange={e=>setBodyProfile(e.target.value)} style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:"#E0D8F0",fontSize:12,minHeight:80,resize:"vertical",outline:"none",fontFamily:"inherit" }}/>
                  <div style={{ marginTop:10,display:"flex",flexWrap:"wrap",gap:6 }}>
                    {["Ceratose pilar","Celulite grau I-II","Estrias brancas","Estrias vermelhas","Gordura localizada","Flacidez corporal","Manchas no corpo","Hiperidrose","Acne no corpo"].map(tag=>(
                      <button key={tag} onClick={()=>setBodyProfile(p=>p.includes(tag)?p:p+", "+tag)} style={{ padding:"4px 10px",fontSize:10,fontWeight:600,background:"rgba(67,233,123,0.1)",border:"1px solid rgba(67,233,123,0.25)",borderRadius:8,color:"#40C080",cursor:"pointer" }}>+ {tag}</button>
                    ))}
                  </div>
                </div>
                {/* Body procedure cards */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:12,fontWeight:800,color:"#C9A88A",marginBottom:8 }}>📋 Procedimentos Corporais — Visão Geral</div>
                  {[
                    {n:"Peeling Corporal (AHA/Ureia)",em:"🧪",cat:"KP & Textura",when:"Ceratose pilar, pele seca com tampões de queratina, manchas no corpo",freq:"Mensal em clínica + 3×/semana em casa",price:"R$150–400/sessão",down:"2–5 dias",note:"O tratamento mais eficaz para KP. AHA 15–20% dissolve os tampões de queratina. Ureia 20% em casa diariamente.",em2:"🔴 Alta prioridade para KP"},
                    {n:"Radiofrequência Corporal",em:"📡",cat:"Celulite & Flacidez",when:"Celulite graus I-III, flacidez pós-emagrecimento, gordura subcutânea",freq:"10–15 sessões (2×/semana)",price:"R$150–400/sessão",down:"Nenhum",note:"Aquece colágeno dérmico → contração + neoformação. Resultado visível a partir da 6ª sessão."},
                    {n:"Carboxiterapia",em:"💨",cat:"Celulite & Estrias",when:"Celulite, estrias, gordura localizada, fibroedema gelóide",freq:"10–15 sessões semanais",price:"R$100–250/sessão",down:"Mínimo",note:"CO₂ injetado melhora microcirculação e estimula colágeno. Excelente para estrias vermelhas recentes."},
                    {n:"Criolipólise",em:"🧊",cat:"Gordura",when:"Gordura localizada resistente à dieta (abdômen, flancos, coxas)",freq:"1–2 sessões por área",price:"R$600–2.000/sessão",down:"Sensibilidade por 2–4 semanas",note:"Destrói células de gordura por congelamento. Resultado em 2–4 meses."},
                    {n:"Drenagem Linfática Corporal",em:"🌊",cat:"Celulite & Inchaço",when:"Celulite, retenção hídrica, pós-procedimento, inchaço",freq:"Semanal (manutenção) ou 2×/sem (tratamento)",price:"R$80–200/sessão",down:"Nenhum",note:"Manual ou pressoterapia. Ativa circulação linfática → reduz inflamação + celulite. Fazer em jejum."},
                    {n:"Laser Corporal",em:"⚡",cat:"KP & Pelos & Manchas",when:"KP com pelos encravados, manchas no corpo, pelos",freq:"6–8 sessões mensais",price:"R$300–800/sessão por área",down:"1–3 dias",note:"Nd:YAG para Fitzpatrick III-IV. Melhora KP com componente folicular inflamatório."},
                    {n:"Microagulhamento Corporal",em:"🔬",cat:"Estrias & Cicatrizes",when:"Estrias, cicatrizes cirúrgicas, flacidez localizada",freq:"4–6 sessões mensais",price:"R$300–700/sessão",down:"2–3 dias",note:"Estimula colágeno nas estrias. Usar PDRN sérum logo após para potencializar."},
                    {n:"Massagem Modeladora",em:"💆",cat:"Celulite & Contorno",when:"Celulite, modelagem corporal, drenagem",freq:"2×/semana",price:"R$80–180/sessão",down:"Nenhum",note:"Técnica deep tissue manual. Combinar com radiofrequência para resultado superior."},
                    {n:"Rotina Corporal Em Casa (KP)",em:"🏠",cat:"KP — Em Casa",when:"Manutenção diária entre procedimentos",freq:"Diária",price:"R$30–100/mês",down:"Nenhum",note:"1) Esfoliação AHA 3×/sem
2) Ureia 20% após banho
3) Óleo de amêndoas ou karité
4) NUNCA bucha física forte
5) Omega-3 oral 2–3g/dia"},
                  ].map((proc,i)=>{
                    const isOpen=expanded===`bproc_${i}`;
                    return(
                      <div key={i} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:13,marginBottom:8,overflow:"hidden" }}>
                        <div onClick={()=>setExpanded(isOpen?null:`bproc_${i}`)} style={{ display:"flex",gap:10,padding:"11px 13px",cursor:"pointer",alignItems:"center" }}>
                          <span style={{ fontSize:22,flexShrink:0 }}>{proc.em}</span>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:2,flexWrap:"wrap" }}>
                              <span style={{ fontSize:13,fontWeight:700,color:"#E0D8F0" }}>{proc.n}</span>
                              <span style={{ background:"rgba(67,233,123,0.15)",color:"#40C080",borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:700 }}>{proc.cat}</span>
                            </div>
                            <div style={{ fontSize:11,color:"#5A6080" }}>{proc.freq} · {proc.price}</div>
                          </div>
                          <span style={{ fontSize:10,color:"#3A4068",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s" }}>▾</span>
                        </div>
                        {isOpen&&<div style={{ borderTop:`1px solid ${C.border}`,padding:"10px 13px 13px",background:"rgba(0,0,0,0.12)" }}>
                          <div style={{ marginBottom:8 }}>
                            <div style={{ fontSize:9,fontWeight:700,color:"#C9A88A",letterSpacing:1,marginBottom:3 }}>INDICADO PARA</div>
                            <div style={{ fontSize:12,color:"#9090B8" }}>{proc.when}</div>
                          </div>
                          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8 }}>
                            <div style={{ background:"rgba(100,160,100,0.08)",borderRadius:8,padding:"7px 10px" }}>
                              <div style={{ fontSize:9,fontWeight:700,color:"#60C080",marginBottom:2 }}>FREQUÊNCIA</div>
                              <div style={{ fontSize:11,color:"#508060" }}>{proc.freq}</div>
                            </div>
                            <div style={{ background:"rgba(240,100,100,0.08)",borderRadius:8,padding:"7px 10px" }}>
                              <div style={{ fontSize:9,fontWeight:700,color:"#F06060",marginBottom:2 }}>DOWNTIME</div>
                              <div style={{ fontSize:11,color:"#A06060" }}>{proc.down}</div>
                            </div>
                          </div>
                          <div style={{ background:"rgba(67,233,123,0.06)",borderRadius:9,padding:"8px 10px",border:"1px solid rgba(67,233,123,0.15)",whiteSpace:"pre-line" }}>
                            <div style={{ fontSize:9,fontWeight:700,color:"#40C080",marginBottom:3 }}>📝 COMO FUNCIONA & DICAS</div>
                            <div style={{ fontSize:11.5,color:"#306050",lineHeight:1.55 }}>{proc.note}</div>
                          </div>
                          <div style={{ marginTop:6,fontSize:11,fontWeight:700,color:"#C9A88A" }}>💰 {proc.price}</div>
                        </div>}
                      </div>
                    );
                  })}
                </div>
                <button onClick={doBodyProcedures} disabled={bodyProcLoad} style={{ width:"100%",padding:14,background:bodyProcLoad?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#43E97B,#38F9D7)",border:"none",borderRadius:14,color:bodyProcLoad?"white":"#001a10",fontSize:14,fontWeight:800,cursor:bodyProcLoad?"not-allowed":"pointer",marginBottom:14 }}>
                  {bodyProcLoad?"🤖 Gerando plano personalizado...":"🤖 IA — Plano Personalizado Corporal"}
                </button>
                {bodyProcRes&&<div style={{ background:"rgba(67,233,123,0.05)",border:"1px solid rgba(67,233,123,0.2)",borderRadius:14,padding:16,fontSize:12.5,color:"#C0E0C8",lineHeight:1.75,whiteSpace:"pre-wrap" }}>{bodyProcRes}</div>}
              </div>
            )}

            {/* ── ROTINA TEXT ── */}
            {aiTab==="texto" && (
              <div>
                <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:"#E0D8F0",marginBottom:6 }}>💬 Análise da Rotina</div>
                  <div style={{ fontSize:12,color:"#5A6080",lineHeight:1.5,marginBottom:10 }}>Descreva como sua pele está respondendo e a IA sugere ajustes personalizados.</div>
                  <textarea value={skinNotes} onChange={e=>setSkinNotes(e.target.value)} placeholder="Ex: Minha pele está menos oleosa, mas ainda tenho manchas. Comecei o retinol na semana 3 sem irritação..." style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:"#E0D8F0",fontSize:12,lineHeight:1.5,minHeight:100,resize:"vertical",outline:"none",fontFamily:"inherit" }}/>
                </div>
                <button onClick={doSkinAnalysis} disabled={!skinNotes.trim()||skinLoad} style={{ width:"100%",padding:14,background:skinLoad||!skinNotes.trim()?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#667EEA,#764BA2)",border:"none",borderRadius:14,color:"white",fontSize:14,fontWeight:800,cursor:skinLoad||!skinNotes.trim()?"not-allowed":"pointer",marginBottom:14 }}>
                  {skinLoad?"🤖 Analisando...":"🤖 Analisar com Gemini AI"}
                </button>
                {skinRes&&<div style={{ background:"rgba(67,233,123,0.05)",border:"1px solid rgba(67,233,123,0.2)",borderRadius:14,padding:16,fontSize:12.5,color:"#C0E0C8",lineHeight:1.75,whiteSpace:"pre-wrap" }}>{skinRes}</div>}
              </div>
            )}

            {/* ── ALTERNATIVA ── */}
            {aiTab==="alternativa" && (
              <div>
                <div style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:800,color:"#E0D8F0",marginBottom:6 }}>🔄 Substitutos Inteligentes</div>
                  <div style={{ fontSize:12,color:"#5A6080",lineHeight:1.5,marginBottom:12 }}>Quando um produto acabar, a IA sugere alternativas no Brasil.</div>
                  <select value={altPid} onChange={e=>setAltPid(e.target.value)} style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.08)",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:"#E0D8F0",fontSize:12,marginBottom:10,outline:"none" }}>
                    <option value="">Selecionar produto...</option>
                    {Object.entries(P).map(([pid,prod])=>(<option key={pid} value={pid} style={{ background:"#0D1124" }}>{prod.s}</option>))}
                  </select>
                  {Object.entries(inventory).filter(([,v])=>v.status==="acabou").length>0&&(
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10,color:"#4A5080",marginBottom:5 }}>Marcados como acabou:</div>
                      {Object.entries(inventory).filter(([,v])=>v.status==="acabou").map(([pid])=>(
                        <button key={pid} onClick={()=>setAltPid(pid)} style={{ marginRight:6,marginBottom:5,padding:"4px 10px",background:altPid===pid?"rgba(240,100,100,0.2)":"rgba(255,255,255,0.05)",border:"1px solid rgba(240,100,100,0.3)",borderRadius:8,color:"#F06060",fontSize:11,cursor:"pointer" }}>
                          {P[pid]?.em} {P[pid]?.s}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea value={altReason} onChange={e=>setAltReason(e.target.value)} placeholder="Contexto (opcional)..." style={{ width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.06)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:"#E0D8F0",fontSize:12,minHeight:50,resize:"vertical",outline:"none",fontFamily:"inherit" }}/>
                </div>
                <button onClick={doAltSuggest} disabled={!altPid||altLoad} style={{ width:"100%",padding:14,background:altLoad||!altPid?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#F093FB,#F5576C)",border:"none",borderRadius:14,color:"white",fontSize:14,fontWeight:800,cursor:altLoad||!altPid?"not-allowed":"pointer",marginBottom:14 }}>
                  {altLoad?"🤖 Buscando...":"🤖 Sugerir Substitutos"}
                </button>
                {altRes&&<div style={{ background:"rgba(240,90,200,0.06)",border:"1px solid rgba(240,90,200,0.2)",borderRadius:14,padding:16,fontSize:12.5,color:"#E0C0E8",lineHeight:1.75,whiteSpace:"pre-wrap" }}>{altRes}</div>}
              </div>
            )}
          </div>
        )}

        {/* ══════════ MAMÃE ══════════ */}
        {tab==="mae60" && (
          <div>
            <div style={{ background:"linear-gradient(135deg,rgba(246,211,101,0.12),rgba(253,160,133,0.08))",border:"1px solid rgba(246,211,101,0.25)",borderRadius:16,padding:14,marginBottom:14 }}>
              <div style={{ fontSize:15,fontWeight:800,color:"#F6D365",marginBottom:4 }}>💕 Rotina da Mamãe — 60+</div>
              <div style={{ fontSize:12,color:"#807050",lineHeight:1.5,marginBottom:8 }}>Pele 60+ precisa de 3 coisas: hidratação, FPS e um retinóide gentil. Esta rotina entrega tudo em 6 passos — menos de 5 min cada sessão.</div>
              <div style={{ display:"inline-block",background:"rgba(246,211,101,0.15)",borderRadius:10,padding:"5px 12px",border:"1px solid rgba(246,211,101,0.3)" }}>
                <span style={{ fontSize:11,fontWeight:800,color:"#C0A030" }}>⏱ 3 passos AM · 3 passos PM · menos de 5 min cada</span>
              </div>
            </div>

            {/* AM */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:13,fontWeight:800,color:"#F6D365",marginBottom:8 }}>🌅 Manhã <span style={{ fontSize:10,color:"#807050",fontWeight:400 }}>— ~2 min</span></div>
              {[
                {emoji:"🫧",name:"Limpeza Suave",time:"1 min",how:"Água morna. 20–30 seg. Enxaguar apertando suavemente.",why:"Cleanser pH 5,5 preserva ceramidas. Água quente as destrói.",bonus:"Logo após (pele úmida): 3 gotas de HA sérum pressionadas.",prod:"CeraVe Hydrating · Bioderma Sensibio · LRP Toleriane",price:"R$55–90"},
                {emoji:"🍊",name:"Vitamina C",time:"30 seg",how:"3–4 gotas. Centro→fora. Pescoço incluso.",why:"Clareia manchas senis + estimula colágeno + antioxidante UV.",bonus:"Um passo, três resultados. O mais importante depois do FPS.",prod:"Adcos C15 · LRP Pure Vitamin C10 · Neutrogena Bright C",price:"R$90–200"},
                {emoji:"☀️",name:"FPS 50+ UVA/UVB — NUNCA pular",time:"30 seg",how:"1/4 colher de chá. Espalhar com palma plana. Pescoço e colo sempre.",why:"O anti-aging com maior evidência científica. Sem ele, tudo o mais perde 50%.",bonus:"Reaplicar ao meio-dia: sun stick é mais prático.",prod:"LRP Anthelios UV Mune · Isdin Fusion Water · Adcos Sun",price:"R$90–180"},
              ].map((s,i)=>{
                const isOpen=expanded===`mae_am_${i}`;
                return(
                  <div key={i} style={{ background:"rgba(255,255,255,0.03)",border:"1.5px solid rgba(246,211,101,0.2)",borderRadius:14,marginBottom:8,overflow:"hidden" }}>
                    <div style={{ display:"flex",gap:10,padding:"12px 13px",alignItems:"flex-start" }}>
                      <div style={{ width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#F6D365,#FDA085)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,marginTop:2 }}>{s.emoji}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}>
                          <span style={{ fontSize:13,fontWeight:800,color:"#F0E8C0" }}>{s.name}</span>
                          <span style={{ fontSize:10,color:"#806040",background:"rgba(246,211,101,0.1)",borderRadius:6,padding:"1px 7px" }}>{s.time}</span>
                        </div>
                        <div style={{ fontSize:12,color:"#7080A0",lineHeight:1.4,marginBottom:s.bonus?6:0 }}>{s.how}</div>
                        {s.bonus && <div style={{ fontSize:11,color:"#806030",background:"rgba(246,211,101,0.07)",borderRadius:8,padding:"5px 8px",border:"1px solid rgba(246,211,101,0.15)" }}>✨ {s.bonus}</div>}
                      </div>
                    </div>
                    <div onClick={()=>setExpanded(isOpen?null:`mae_am_${i}`)} style={{ display:"flex",justifyContent:"space-between",padding:"0 13px 10px",cursor:"pointer" }}>
                      <span style={{ fontSize:10,color:"#5A5030" }}>Ver opções de produto</span>
                      <span style={{ fontSize:10,color:"#5A5030",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s" }}>▾</span>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop:"1px solid rgba(246,211,101,0.1)",padding:"10px 13px 13px",background:"rgba(0,0,0,0.1)" }}>
                        <div style={{ fontSize:12,color:"#9090B8",marginBottom:6 }}>{s.prod}</div>
                        <div style={{ background:"rgba(160,100,240,0.07)",borderRadius:9,padding:"8px 10px",border:"1px solid rgba(160,100,240,0.12)" }}>
                          <div style={{ fontSize:11.5,color:"#7060A0",lineHeight:1.6 }}>{s.why}</div>
                        </div>
                        <div style={{ fontSize:10,color:"#806040",fontWeight:700,marginTop:5 }}>💰 {s.price}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PM */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:13,fontWeight:800,color:"#9090FF",marginBottom:8 }}>🌙 Noite <span style={{ fontSize:10,color:"#5A5080",fontWeight:400 }}>— ~3 min</span></div>
              {[
                {emoji:"💧",name:"Micelar Gentil",time:"1 min",how:"Algodão suave até o algodão sair limpo. Sem esfregar.",why:"Em 60+ a pele produz menos sebum — micelar basta. Double cleanse só quando tem make pesada.",bonus:"Dias com make: micelar + gel suave como 2ª limpeza.",prod:"Bioderma Sensibio H2O · LRP Eau Micellaire · Avène",price:"R$50–80"},
                {emoji:"🌙",name:"Retinol (Ter+Sex) ou Peptídeos",time:"30 seg",how:"RETINOL (Ter+Sex): tamanho ervilha. Pele seca. Pescoço.\nSEM RETINOL: 2–3 gotas sérum de peptídeos.",why:"Retinol: o único ativo FDA-approved para anti-aging. 2×/semana em 60+. Peptídeos nos outros dias: estimulam colágeno sem irritar.",bonus:"Se irritar: aplicar HA por CIMA do retinol antes de dormir (sandwich).",prod:"LRP Redermic R 0,3% · Neutrogena RWR 0,1% · Olay Regenerist",price:"R$80–200"},
                {emoji:"🌟",name:"Creme Noturno Rico",time:"1 min",how:"Camada generosa. Movimento ascendente — do colo ao queixo. NUNCA para baixo.",why:"Pele madura produz 40% menos sebum → precisa de oclusão rica. Ceramidas reparam barreira. Movimento ascendente = lifting manual.",bonus:"Pescoço e colo envelhecem antes do rosto. 1 min faz diferença em 6 meses.",prod:"CeraVe PM · Neutrogena Hydro Boost Night · Nivea Q10",price:"R$50–120"},
              ].map((s,i)=>{
                const isOpen=expanded===`mae_pm_${i}`;
                return(
                  <div key={i} style={{ background:"rgba(255,255,255,0.03)",border:"1.5px solid rgba(100,100,234,0.2)",borderRadius:14,marginBottom:8,overflow:"hidden" }}>
                    <div style={{ display:"flex",gap:10,padding:"12px 13px",alignItems:"flex-start" }}>
                      <div style={{ width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#667EEA,#764BA2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,marginTop:2 }}>{s.emoji}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:2 }}>
                          <span style={{ fontSize:13,fontWeight:800,color:"#D0C8F0" }}>{s.name}</span>
                          <span style={{ fontSize:10,color:"#5A5080",background:"rgba(100,100,234,0.1)",borderRadius:6,padding:"1px 7px" }}>{s.time}</span>
                        </div>
                        <div style={{ fontSize:12,color:"#7080A0",lineHeight:1.4,whiteSpace:"pre-line",marginBottom:s.bonus?6:0 }}>{s.how}</div>
                        {s.bonus && <div style={{ fontSize:11,color:"#5050A0",background:"rgba(100,100,234,0.07)",borderRadius:8,padding:"5px 8px",border:"1px solid rgba(100,100,234,0.15)" }}>✨ {s.bonus}</div>}
                      </div>
                    </div>
                    <div onClick={()=>setExpanded(isOpen?null:`mae_pm_${i}`)} style={{ display:"flex",justifyContent:"space-between",padding:"0 13px 10px",cursor:"pointer" }}>
                      <span style={{ fontSize:10,color:"#4A4060" }}>Ver opções de produto</span>
                      <span style={{ fontSize:10,color:"#4A4060",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.2s" }}>▾</span>
                    </div>
                    {isOpen && (
                      <div style={{ borderTop:"1px solid rgba(100,100,234,0.12)",padding:"10px 13px 13px",background:"rgba(0,0,0,0.1)" }}>
                        <div style={{ fontSize:12,color:"#9090B8",marginBottom:6 }}>{s.prod}</div>
                        <div style={{ background:"rgba(100,100,240,0.07)",borderRadius:9,padding:"8px 10px",border:"1px solid rgba(100,100,240,0.12)" }}>
                          <div style={{ fontSize:11.5,color:"#6060A0",lineHeight:1.6 }}>{s.why}</div>
                        </div>
                        <div style={{ fontSize:10,color:"#7070C0",fontWeight:700,marginTop:5 }}>💰 {s.price}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Weekly + avoid */}
            <div style={{ background:"rgba(100,200,100,0.07)",border:"1px solid rgba(100,200,100,0.2)",borderRadius:14,padding:"12px 14px",marginBottom:10 }}>
              <div style={{ fontSize:12,fontWeight:800,color:"#60D080",marginBottom:5 }}>🌿 Bônus — Domingo (15 min)</div>
              <div style={{ fontSize:12,color:"#6080A0",lineHeight:1.4 }}>Sheet mask: tablet comprimido expandido em HA sérum + água de rosas. 15 min. Não enxaguar. Passar o excesso no pescoço.</div>
            </div>
            <div style={{ background:"rgba(200,60,60,0.06)",border:"1px solid rgba(200,60,60,0.18)",borderRadius:14,padding:"11px 14px" }}>
              <div style={{ fontSize:12,fontWeight:800,color:"#F06060",marginBottom:7 }}>🚫 Evitar Sempre</div>
              {["Água quente no rosto","Sabonete alcalino (pH>7)","Esfoliação física agressiva","Retinol todos os dias no início","Esquecer pescoço, colo e mãos"].map((a,i)=>(
                <div key={i} style={{ fontSize:12,color:"#A06060",padding:"4px 0",borderBottom:"1px solid rgba(200,60,60,0.08)" }}>• {a}</div>
              ))}
            </div>
          </div>
        )}

      </div>{/* end content */}

      {/* ── BOTTOM NAV ── */}
      <div style={{ position:"fixed",bottom:0,left:0,right:0,background:"rgba(9,13,26,0.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,zIndex:100 }}>
        <div style={{ maxWidth:520,margin:"0 auto",display:"flex" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:"9px 2px 11px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
              <span style={{ fontSize:14,opacity:tab===t.id?1:0.35,transition:"opacity 0.2s" }}>{t.icon}</span>
              <span style={{ fontSize:8.5,fontWeight:700,color:tab===t.id?"#C9A88A":"#3A4060",letterSpacing:0.3,textTransform:"uppercase" }}>{t.l}</span>
              {tab===t.id && <div style={{ width:14,height:2,borderRadius:1,background:"linear-gradient(90deg,#C9A88A,#E8C090)" }}/>}
            </button>
          ))}
        </div>
      </div>

      {/* ── DAY MODAL ── */}
      {selDay && tab==="rotina" && (()=>{
        const inf=getInfo(selDay); const sAM=makeAM(inf); const sPM=makePM(inf);
        const date=getDate(selDay); const ph=getPhase(selDay);
        return(
          <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end" }} onClick={e=>{if(e.target===e.currentTarget)setSelDay(null);}}>
            <div style={{ background:"#0D1124",borderRadius:"22px 22px 0 0",border:`1px solid ${C.border}`,maxHeight:"88vh",overflowY:"auto" }}>
              <div style={{ padding:"16px 16px 0",borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:10,color:"#C9A88A",letterSpacing:2,textTransform:"uppercase",marginBottom:2 }}>Dia {selDay} · {DOW_PT[inf.dow]} · {date.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}</div>
                    <div style={{ fontSize:18,fontFamily:"Georgia,serif",color:ph.col1 }}>{dayIcon(inf)} {ph.icon} {ph.name}</div>
                  </div>
                  <button onClick={()=>setSelDay(null)} style={{ background:"rgba(255,255,255,0.08)",border:"none",color:"#E0D8F0",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
                </div>
                <div style={{ display:"flex",gap:8,paddingBottom:14 }}>
                  {["am","pm"].map(t=>(
                    <button key={t} onClick={()=>setSelAmPm(t)} style={{ flex:1,padding:10,fontWeight:700,cursor:"pointer",background:selAmPm===t?(t==="am"?"linear-gradient(135deg,#F6D365,#FDA085)":"linear-gradient(135deg,#667EEA,#764BA2)"):"rgba(255,255,255,0.04)",border:"none",borderRadius:12,color:selAmPm===t?"white":"#4A5280",fontSize:12 }}>
                      {t==="am"?`🌅 Manhã (${sAM.length})`:`🌙 Noite (${sPM.length})`}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding:"12px 16px" }}>
                {(selAmPm==="am"?sAM:sPM).map((s,i)=>(
                  <StepCard key={`cal_${selDay}_${selAmPm}_${i}`} step={s} dayNum={selDay} idx={i} ampm={selAmPm}/>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
