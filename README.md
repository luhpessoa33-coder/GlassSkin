# ✦ Glass Skin Protocol

> **365 dias de ritual de skincare com IA Gemini — instalável como app no iPhone**

![Glass Skin Protocol](https://img.shields.io/badge/Glass%20Skin-Protocol-C9A88A?style=for-the-badge&labelColor=090D1A)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white&labelColor=090D1A)
![Gemini AI](https://img.shields.io/badge/Gemini-2.0%20Flash-4285F4?style=flat-square&logo=google&logoColor=white&labelColor=090D1A)
![PWA](https://img.shields.io/badge/PWA-Instalável-5A0FC8?style=flat-square&logo=pwa&logoColor=white&labelColor=090D1A)

---

## 📱 O que é

Aplicativo completo de skincare personalizado para **365 dias de protocolo anti-acne, glass skin e anti-aging**, com:

- 🤖 **IA Gemini** integrada para análise de pele (foto e texto)
- 💆 **51 procedimentos estéticos faciais** catalogados com preços e indicações
- 💪 **Procedimentos corporais** (ceratose pilar, celulite, estrias, flacidez)
- 🧴 **Controle de estoque** de produtos com sugestão de substitutos via IA
- 📅 **365 dias** organizados em 4 fases de tratamento
- 💕 **Rotina simplificada para 60+** (3 passos AM + 3 passos PM)
- 💾 **Salva dados localmente** — funciona offline

---

## ✨ Funcionalidades

### ✦ Aba Hoje
- Progresso diário com anel animado
- Toggle manhã / noite com todos os passos visíveis
- Cada passo com instrução + base científica + o que fazer se o produto acabar
- Marcação de passos concluídos (salva automaticamente)

### 📅 Rotina
- Calendário de 365 dias em 4 fases
- Clique em qualquer dia para ver a rotina completa AM/PM
- Ícones por tipo de dia (🌙 Retinóide · 🎭 Argila · 🍎 Enzimático · 💎 Reedle · ✨ Sheet Mask)

### 🧴 Estoque
- Todos os produtos listados com controle de nível: ✅ OK / ⚠️ Baixo / 💀 Acabou
- Alertas automáticos quando produto acaba
- Botão direto para pedir substituto à IA

### 🤖 IA Pele — 6 modos
| Sub-aba | O que faz |
|---|---|
| 📸 Rosto | Foto do rosto → Gemini analisa acne, manchas, poros, oleosidade, firmeza |
| 🫁 Corpo | Foto do corpo → identifica KP, celulite, estrias, manchas, flacidez |
| 💆 Proc. Faciais | 51 procedimentos catalogados + plano personalizado por IA |
| 💪 Proc. Corporais | Procedimentos corporais + rotina em casa |
| 💬 Rotina | Análise textual da rotina com sugestões personalizadas |
| 🔄 Substitutos | Produto acabou → IA sugere alternativas no Brasil com preços |

### 💕 Mamãe 60+
- Rotina enxuta: 3 passos AM + 3 passos PM (~5 min no total)
- Explicação científica de cada passo
- Bônus semanal: sheet mask de HA

---

## 🔬 Protocolo de 365 Dias — 4 Fases

| Fase | Dias | Nome | Foco |
|---|---|---|---|
| 🌱 | 1–30 | Despertar | Barreira + Vitamina C + Retinol 1×/sem |
| ⚡ | 31–90 | Ativar | Retinal (Celimax) + Reedle Shot + PDRN |
| ✨ | 91–180 | Transformar | Retinal 4×/sem + Exossomos completos |
| 💎 | 181–365 | Manutenção | Retinal 5×/sem + Glass skin sustentado |

---

## 💆 Procedimentos Faciais — 51 catalogados

Organizados em 11 categorias com filtro:

**Toxinas** · Botox · Dysport · Baby Botox  
**Preench.** · Filler HA (Juvederm, Restylane, Belotero) · Lipofilling  
**Bioestim.** · **Profhilo** · Skinboosters · **Sculptra** · **Radiesse** · **Ellansé** · NCTF/Fillmed  
**Fios** · PDO Lisos · PDO com Cog · PLLA · **PCL (Silhouette Soft)**  
**Peelings** · AHA/Glicólico/Mandélico · TCA · Yellow Peel · Jessner  
**Laser** · IPL · **Nd:YAG** · CO2 Fracionado · Érbio · LED · Plasma Pen  
**RF & HIFU** · Thermage · **Morpheus8** · **Ultherapy/Ultraformer** · Criolipólise  
**Agulhas** · Dermapen · Morpheus8 RF · **PRP** · **PRF** · Eletroporação  
**Regeneração** · **PDRN/Rejuran Healer** · **Exossomos** · Células-Tronco · Nucleofill  
**Limpeza** · **HydraFacial** · Dermaplaning · Microdermoabrasão

Cada procedimento: marcas, frequência, preço no Brasil, downtime, resultado e nota para o perfil específico (Fitzpatrick III-IV, paralisia facial, acne+PIH).

---

## 🚀 Instalação no iPhone — sem Mac, sem computador

### Opção mais fácil (2 min pelo celular):

1. Baixe o arquivo `GlassSkin_Deploy.zip`
2. No Safari → **netlify.com** → criar conta grátis
3. **Add new site** → **Deploy manually** → selecione o ZIP (sem extrair)
4. Aguarde 10 segundos → receba o link
5. Abra o link no **Safari** → **⬆️ Compartilhar** → **"Adicionar à Tela de Início"**

✅ **Ícone na tela inicial do iPhone — funciona como app nativo**

### Opção via GitHub + Vercel:

1. Crie conta no **github.com** → novo repositório `glass-skin-app`
2. Faça upload dos arquivos do `GlassSkin_FINAL.zip` (código fonte)
3. Acesse **vercel.com** → importe o repositório → clique Deploy
4. Link gerado → Safari → Adicionar à Tela de Início

---

## 📁 Estrutura do Projeto

```
glass-skin-pwa/
├── src/
│   ├── App.js          ← app completo (1.444 linhas)
│   └── index.js        ← entrada React + service worker
├── public/
│   ├── index.html      ← HTML com meta PWA para iPhone
│   ├── manifest.json   ← configuração do app (ícone, cores)
│   ├── sw.js           ← service worker (offline)
│   ├── icon-192.png    ← ícone para iPhone
│   └── icon-512.png    ← ícone para splash screen
├── package.json        ← dependências React 18
├── vercel.json         ← deploy zero-config Vercel
├── .env                ← desativa ESLint no build
└── .gitignore
```

---

## 🛠️ Tecnologias

| Tech | Uso |
|---|---|
| **React 18** | Interface e componentes |
| **Gemini 2.0 Flash** | Análise de fotos e texto com IA |
| **localStorage** | Persistência de dados offline |
| **Service Worker** | Funcionamento offline (PWA) |
| **Web Manifest** | Instalação como app no iPhone |

---

## 🔐 IA Gemini

O app usa a API **Google Gemini 2.0 Flash** para:
- Analisar fotos do rosto (acne, manchas, poros, oleosidade)
- Analisar fotos do corpo (KP, celulite, estrias, flacidez)
- Gerar plano personalizado de procedimentos faciais e corporais
- Sugerir substitutos quando produtos acabam
- Analisar a rotina de skincare e sugerir ajustes

A chave de API está no arquivo `src/App.js` na constante `GEMINI_KEY`.

> **Nota de segurança:** para uso pessoal e app não publicado, a chave no código é suficiente. Para publicar na App Store/Play Store, use um backend proxy que injeta a chave sem expô-la.

---

## 💊 Produtos da Rotina

| Categoria | Produtos |
|---|---|
| Limpeza | Micelar Principia · Mousse Chá Verde AP · Cleansing Balm Aprilskin · Démaquillant AP · Eucerin Anti-Pigment AHA |
| Ativos AM | Sérum 10 SkinC (Vit C) · Pegolift C AP · Anua Nia+TXA · Lineskin Nano PDRN |
| Hidratação | Adcos Hyalu6 · Sephora Gelée HA+PGA · Hydratant Mixte AP · Dynasty Cream BoJ |
| PDRN | Rejuran Dual Effect · Pharmapele PDRN+Exo · Simple Organic Exo+PDRN · Lineskin Nano |
| Exossomos | Akinésine Exo AP · AP Exossomos (tubo prateado) |
| Retinóides 🌙 | Pegoretinol AP · Celimax Retinal Shot 0,1% |
| Reedle | 100 PDRN Reedle Shot CICA |
| FPS | UV Oil Defense FPS80 SkinCeuticals |
| Especiais | Clay Mask Aprilskin · Enzimático Sallve · Laneige Lip Mask · Fresh Eye Stick AP |

---

## 🌿 Foco Especial

Rotina desenvolvida para:
- **Acne grau II** com hiperpigmentação pós-inflamatória (PIH)
- **Paralisia facial** parcial (procedimentos ajustados)
- **Ceratose pilar** (protocolo nutricional + tópico corporal)
- **Fitzpatrick III-IV** (lasers seguros para pele escura indicados)
- **Pele mista-oleosa** com foco em glass skin
- **Anti-aging preventivo** com PDRN, exossomos e retinóides

---

## 📖 Ciência na Rotina

Cada passo da rotina explica:
- **Por que esta ordem** — escada de pH (do mais ácido ao neutro)
- **Por que esta combinação** — compatibilidade de ativos verificada
- **Mecanismo de ação** — como cada ativo funciona na pele
- **O que fazer se acabar** — substitutos e como adaptar

---

## 📄 Licença

Uso pessoal. Desenvolvido com Claude (Anthropic) + Gemini (Google).

---

*Glass Skin Protocol · 365 dias · IA Gemini · PWA para iPhone*  
*Desenvolvido em Maio de 2026*
