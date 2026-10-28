import { COMMON } from "./common";
import { PAGES } from "./pages";

export type Locale = "en" | "hi" | "as";

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "as", label: "Assamese", native: "অসমীয়া" },
];

const DICT: Record<string, [string, string]> = { ...COMMON, ...PAGES };
const col = (l: Locale) => (l === "hi" ? 0 : 1);

// Text that carries a name or a number: translate the fixed part, keep the rest.
const PATTERNS: { re: RegExp; to: (m: RegExpMatchArray, l: Locale) => string }[] = [
  { re: /^(Good morning|Good afternoon|Good evening), (.+)$/, to: (m, l) => `${DICT[m[1]][col(l)]}, ${m[2]}` },
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
    if (m) return p.to(m, l);
  }
  return null;
}

/* For components that render text directly, such as the kiosk. */
export function t(text: string, l: Locale) {
  return translate(text, l) ?? text;
}
