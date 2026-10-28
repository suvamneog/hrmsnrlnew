import { COMMON } from "./common";
import { PAGES } from "./pages";
import { COUNTED, RECENT } from "./recent";

export type Locale = "en" | "hi" | "as";

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "as", label: "Assamese", native: "অসমীয়া" },
];

const DICT: Record<string, [string, string]> = { ...COMMON, ...PAGES, ...RECENT };
const col = (l: Locale) => (l === "hi" ? 0 : 1);

// Text that carries a name or a number: translate the fixed part, keep the rest.
const PATTERNS: { re: RegExp; to: (m: RegExpMatchArray, l: Locale) => string }[] = [
  { re: /^(Good morning|Good afternoon|Good evening), (.+)$/, to: (m, l) => `${DICT[m[1]][col(l)]}, ${m[2]}` },
  { re: /^(\d+) approvals? waiting$/, to: (m, l) => (l === "hi" ? `${m[1]} स्वीकृतियाँ लंबित` : `${m[1]}টা অনুমোদন বাকী`) },
  { re: /^Next shift (.+)$/, to: (m, l) => (l === "hi" ? `अगली शिफ्ट ${m[1]}` : `পৰৱৰ্তী শ্বিফ্ট ${m[1]}`) },
  { re: /^In since (\d\d:\d\d)$/, to: (m, l) => (l === "hi" ? `${m[1]} से अंदर` : `${m[1]}ৰ পৰা ভিতৰত`) },
  { re: /^(\d+) of (\d+)$/, to: (m, l) => (l === "hi" ? `${m[2]} में से ${m[1]}` : `${m[2]}ৰ ভিতৰত ${m[1]}`) },
  { re: /^(\d+) candidates, (\d+) still to join\.$/, to: (m, l) => (l === "hi" ? `${m[1]} उम्मीदवार, ${m[2]} का कार्यभार ग्रहण बाकी।` : `${m[1]} জন প্ৰাৰ্থী, ${m[2]} জনৰ যোগদান বাকী।`) },
  { re: /^(\d[\d,]*) (.+)$/, to: (m, l) => (COUNTED[m[2]] ? `${m[1]} ${COUNTED[m[2]][col(l)]}` : null) as string },
  { re: /^1 of your cases is open$/, to: (_m, l) => (l === "hi" ? "आपका 1 मामला खुला है" : "আপোনাৰ ১টা গোচৰ খোলা") },
  { re: /^(\d+) of your cases are open$/, to: (m, l) => (l === "hi" ? `आपके ${m[1]} मामले खुले हैं` : `আপোনাৰ ${m[1]}টা গোচৰ খোলা`) },
  { re: /^(Morning|Afternoon|Night) shift (\d+) of (\d+) manned$/, to: (m, l) => `${DICT[m[1]][col(l)]} ${l === "hi" ? `शिफ्ट: ${m[3]} में से ${m[2]} उपस्थित` : `শ্বিফ্ট: ${m[3]}ৰ ভিতৰত ${m[2]} উপস্থিত`}` },
  { re: /^Day closed, in (\d\d:\d\d) out (\d\d:\d\d)$/, to: (m, l) => (l === "hi" ? `दिन समाप्त, अंदर ${m[1]} बाहर ${m[2]}` : `দিন শেষ, ভিতৰত ${m[1]} বাহিৰত ${m[2]}`) },
  { re: /^Namaskar, (.+)$/, to: (m, l) => (l === "hi" ? `नमस्कार, ${m[1]}` : `নমস্কাৰ, ${m[1]}`) },
  { re: /^Signs out in (\d+) s if nobody touches the screen\.$/, to: (m, l) => (l === "hi" ? `कोई न छुए तो ${m[1]} सेकंड में साइन आउट।` : `কোনেও নুচুলে ${m[1]} ছেকেণ্ডত ছাইন আউট হ'ব।`) },
  { re: /^(\d+) waiting for approval$/, to: (m, l) => (l === "hi" ? `${m[1]} स्वीकृति की प्रतीक्षा में` : `${m[1]}টা অনুমোদনৰ অপেক্ষাত`) },
  { re: /^(.+)\. Goes to your manager\.$/, to: (m, l) => (l === "hi" ? `${m[1]}। आपके प्रबंधक को जाता है।` : `${m[1]}। আপোনাৰ পৰিচালকলৈ যায়।`) },
  { re: /^(\d[\d,]*) in inbox$/, to: (m, l) => (l === "hi" ? `इनबॉक्स में ${m[1]}` : `ইনবক্সত ${m[1]}`) },
  { re: /^(\d+) of (\d+) documents$/, to: (m, l) => (l === "hi" ? `${m[2]} में से ${m[1]} दस्तावेज़` : `${m[2]}টাৰ ভিতৰত ${m[1]}টা নথি`) },
  { re: /^(\d+) on leave$/, to: (m, l) => (l === "hi" ? `${m[1]} छुट्टी पर` : `${m[1]} জন ছুটিত`) },
  { re: /^Approve (\d+)$/, to: (m, l) => `${DICT.Approve[col(l)]} (${m[1]})` },
  { re: /^Submit (\d+)$/, to: (m, l) => `${DICT.Submit[col(l)]} (${m[1]})` },
  { re: /^Tick all (\d+)$/, to: (m, l) => (l === "hi" ? `सभी ${m[1]} चुनें` : `সকলো ${m[1]} বাছক`) },
];

/* Exact lookup first, then patterns. Unknown text stays in English rather than guessing. */
export function translate(text: string, l: Locale): string | null {
  if (l === "en") return null;
  const hit = DICT[text];
  if (hit) return hit[col(l)];
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    const out = m ? p.to(m, l) : null;
    if (out) return out;
  }
  return null;
}

/* For components that render text directly, such as the kiosk. */
export function t(text: string, l: Locale) {
  return translate(text, l) ?? text;
}
