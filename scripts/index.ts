// scripts/index.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

function chunk(text: string, max = 1200, overlap = 200) {
    const words = text.split(/\s+/);
    const parts: string[] = [];
    for (let i = 0; i < words.length; i += (max - overlap)) {
        const piece = words.slice(i, i + max).join(" ");
        if (piece.trim()) parts.push(piece);
    }
    return parts;
}
function titleize(s: string) {
    return s.replace(/\.[^.]+$/, "").replace(/^projects[\\/]/, "").replace(/[-_]/g, " ")
        .trim().replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1));
}
type Flat = { text: string; label: string };

function flattenDoc(file: string, doc: any): Flat[] {
    if (file.endsWith("contact.json") || doc.type === "contact_private" || doc.type === "roles") return [];
    const out: Flat[] = [];

    if (doc.type === "bio") {
        if (doc.about) out.push({ text: `Name: ${doc.name}. Headline: ${doc.headline}. Pronouns: ${doc.pronouns || ""}. About: ${doc.about}`, label: "Bio • About" });
        if (doc.interests?.length) out.push({ text: `Interests: ${doc.interests.join(", ")}.`, label: "Bio • Interests" });
        return out;
    }
    if (doc.type === "resume") {
        if (doc.summary) out.push({ text: `Summary: ${doc.summary}`, label: "Resume • Summary" });
        if (Array.isArray(doc.education)) for (const e of doc.education)
            out.push({ text: `Education: ${e.degree} at ${e.school} ${e.location ? `(${e.location})` : ""} ${e.dates ? `— ${e.dates}` : ""}${e.gpa ? `, GPA ${e.gpa}` : ""}.`, label: "Resume • Education" });
        if (Array.isArray(doc.experience)) for (const ex of doc.experience) {
            const bullets = Array.isArray(ex.bullets) ? ` ${ex.bullets.map((b: string) => `• ${b}`).join(" ")}` : "";
            out.push({ text: `Experience: ${ex.role} at ${ex.org} ${ex.location ? `(${ex.location})` : ""} — ${ex.dates || ""}.${bullets}`, label: `Resume • Experience • ${ex.org}` });
        }
        if (doc.skills) {
            const flatSkills = Object.entries(doc.skills).map(([k, v]: any) => `${k.replace(/_/g, " ")}: ${(Array.isArray(v) ? v : Object.values(v || {})).join(", ")}`).join(" | ");
            out.push({ text: `Skills: ${flatSkills}.`, label: "Resume • Skills" });
        }
        if (doc.languages?.length) out.push({ text: `Languages: ${doc.languages.join(", ")}.`, label: "Resume • Languages" });
        if (Array.isArray(doc.certifications)) for (const c of doc.certifications)
            out.push({ text: `Certification: ${c.name} — ${c.issuer || ""} ${c.date ? `(${c.date})` : ""}.`, label: "Resume • Certifications" });
        if (doc.work_authorization) out.push({ text: `Work authorization: ${doc.work_authorization}.`, label: "Resume • Work authorization" });
        return out;
    }
    if (doc.type === "project") {
        const title = doc.title || titleize(file);
        const bits: string[] = [];
        bits.push(`Project: ${title}. Role: ${doc.role || ""}. Dates: ${doc.dates || ""}.`);
        if (doc.summary) bits.push(`Summary: ${doc.summary}`);
        if (doc.process?.length) bits.push(`Process: ${doc.process.join(" → ")}.`);
        if (doc.impact?.length) bits.push(`Impact: ${doc.impact.join("; ")}.`);
        if (doc.tools?.length) bits.push(`Tools: ${doc.tools.join(", ")}.`);
        if (doc.topics?.length) bits.push(`Topics: ${doc.topics.join(", ")}.`);
        out.push({ text: bits.join(" "), label: `Project • ${title}` });
        return out;
    }
    if (doc.type === "faq") {
        for (const item of doc.items || []) {
            out.push({ text: `${item.q}: ${item.a}`, label: `Recruiter • ${item.q}` });
        }
        return out;
    }
    return [{ text: JSON.stringify(doc), label: titleize(file) }];
}

function collectDocs() {
    const base = path.join(process.cwd(), "content");
    const files: string[] = [];
    (function walk(dir: string) {
        for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) walk(p);
            else if (p.endsWith(".json")) files.push(p);
        }
    })(base);
    return files.map(f => ({ file: path.relative(base, f), doc: JSON.parse(fs.readFileSync(f, "utf8")) }));
}

(async () => {
    const docs = collectDocs();
    const rows: any[] = [];
    for (const { file, doc } of docs) {
        const flats = flattenDoc(file, doc);
        for (const { text, label } of flats) {
            const chunks = chunk(text, 800, 150);
            for (let i = 0; i < chunks.length; i++) {
                const r = await embedModel.embedContent(chunks[i]);
                rows.push({
                    id: `${file}#${label}#${i}`,
                    text: chunks[i],
                    embedding: r.embedding.values,
                    metadata: { source: file, label, links: Array.isArray(doc.links) ? doc.links : [] }
                });
            }
        }
    }
    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/kb.json", JSON.stringify(rows));
    console.log(`Wrote data/kb.json with ${rows.length} chunks`);
})();
