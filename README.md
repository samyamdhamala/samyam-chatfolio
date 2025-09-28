# 🌟 Samyam Chat-First Portfolio (RAG)

A **LinkedIn-style portfolio** where the **chatbot is the hero**.  
Visitors interact with *Samyam* directly — asking about her **background, skills, and projects**.  

All answers are powered by **Retrieval-Augmented Generation (RAG)** over curated resume and project files.  
If confidence is low, the bot politely says *“I’m not sure”* and offers a **direct DM handoff**.

---

## ✨ Features

- **💬 Chat-first UX**
  - Inline chat panel with suggested prompts
  - Rephrase options: *Persuasive / Executive / Friendly*
  - Related links + confidence meter
  - Contact/DM modal for handoff

- **🧠 RAG pipeline**
  - `scripts/index.ts` → embeds content → builds `data/kb.json`
  - `/api/answer` → retrieves Top-K chunks + generates grounded reply
  - Low-confidence gating → DM fallback

- **🎭 Role-aware tone**
  - Tailored for *Data Analyst*, *Business Analyst*, or *QA* roles

- **🖥️ Clean UI**
  - Sections: About • About the Chatbot • Ask • Projects • Resume
  - Project deep links (GitHub/Tableau/etc.)
  - “Ask about this project” pre-filled prompts

---

## 🛠️ Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- [Google Generative AI (Gemini)](https://aistudio.google.com/)
  - Models: `gemini-2.5-flash-001`, `gemini-2.5-flash-8b`
  - Embeddings: `text-embedding-004`
- Local cosine similarity search (`/lib/search.ts`)
- [Resend](https://resend.com/) for optional email handoff

---

## 📂 Project Structure

```
.
├─ public/
│  ├─ samyam.jpg
│  ├─ Samyam_Dhamala_Resume.pdf
│  └─ Samyam_Dhamala_Resume.docx
├─ content/
│  ├─ bio.json           # optional short bio
│  └─ projects/          # JSON per project (see schema)
├─ data/
│  └─ kb.json            # GENERATED via scripts/index.ts
├─ scripts/
│  └─ index.ts           # builds kb.json from content/*
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ answer/route.ts    # RAG answer endpoint
│  │  │  ├─ reword/route.ts    # rephrase endpoint
│  │  │  ├─ projects/route.ts  # return project JSON
│  │  │  └─ contact/route.ts   # optional email handoff
│  │  └─ page.tsx              # LinkedIn-style layout
│  ├─ components/
│  │  ├─ ProfileHeader.tsx
│  │  ├─ ChatAbout.tsx
│  │  ├─ ProjectsGrid.tsx / ProjectRail.tsx
│  │  └─ AskPanel.tsx          # chat UI (self-scrolling)
│  └─ lib/
│     └─ search.ts             # cosine similarity / Top-K
└─ .env.local                  # secrets (ignored by git)
```

---

## 📝 Project Content Schema

Each project lives in `content/projects/*.json`:

```json
{
  "type": "project",
  "title": "Airbnb Data Analysis",
  "role": "Analyst/Developer",
  "dates": "2024",
  "summary": "Explored pricing, locations, and room distribution; built filterable views for stakeholders.",
  "process": ["Data Wrangling", "Visualization", "Insights"],
  "impact": ["Supported neighborhood demand & revenue assessment"],
  "tools": ["Tableau"],
  "topics": ["Market Analysis", "Visualization"],
  "links": ["https://public.tableau.com/..."]
}
```

---

## 🚀 Quick Start

### 1. Prereqs
- Node.js **20+**
- [Google AI Studio API key](https://aistudio.google.com/app/apikey)  
- *(Optional)* [Resend API key](https://resend.com/) for email handoff

---

### 2. Install & Environment

```bash
npm install
```

Create `.env.local`:

```ini
# Required
GOOGLE_API_KEY=your_google_ai_studio_key

# Optional (override models if version 404s)
GEMINI_MODEL=gemini-2.5-flash-001
GEMINI_EMBED_MODEL=text-embedding-004

# Contact (optional)
RESEND_API_KEY=
OWNER_EMAIL=you@domain.com
NEXT_PUBLIC_OWNER_EMAIL=you@domain.com
```

---

### 3. Add Assets & Content

- `public/samyam.jpg`
- `public/Samyam_Dhamala_Resume.pdf`
- `public/Samyam_Dhamala_Resume.docx`
- Add JSON files under `content/projects/`

---

### 4. Build Knowledge Base

```bash
npx tsx scripts/index.ts
```

---

### 5. Run

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 🔍 How It Works (RAG)

1. **Ingest** → `scripts/index.ts` reads `content/`, chunks + embeds with `text-embedding-004`, writes `data/kb.json`.
2. **Retrieve** → `/api/answer` embeds the query, finds Top-K chunks via cosine similarity (`/lib/search.ts`), computes confidence.
3. **Generate** → If confidence ≥ threshold → reply in first-person (*she/her*) using context.  
   Else → reply *“I’m not sure”* → DM handoff.
4. **UI** → Chat panel shows: grounded answer • links • confidence meter • rephrase options.

---

## 📜 License

[MIT](LICENSE)
