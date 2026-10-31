import { COMMON } from "./common";
import { PAGES } from "./pages";
import { COUNTED, RECENT } from "./recent";
import { SWEEP } from "./sweep";

export type Locale = "en" | "hi" | "as";

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "as", label: "Assamese", native: "অসমীয়া" },
];

const DICT: Record<string, [string, string]> = { ...COMMON, ...PAGES, ...RECENT, ...SWEEP };
const col = (l: Locale) => (l === "hi" ? 0 : 1);
// Translate a known phrase inside a pattern, or keep it; and translate the date words in a fragment.
const tr = (text: string, l: Locale) => DICT[text]?.[col(l)] ?? text;
const dw = (text: string, l: Locale) => dateWords(text, l) ?? text;

// Text that carries a name or a number: translate the fixed part, keep the rest.
const PATTERNS: { re: RegExp; to: (m: RegExpMatchArray, l: Locale) => string }[] = [
  { re: /^(Good morning|Good afternoon|Good evening), (.+)$/, to: (m, l) => `${DICT[m[1]][col(l)]}, ${m[2]}` },
  { re: /^(\d+) approvals? waiting$/, to: (m, l) => (l === "hi" ? `${m[1]} स्वीकृतियाँ लंबित` : `${m[1]}টা অনুমোদন বাকী`) },
  { re: /^Next shift (.+)$/, to: (m, l) => (l === "hi" ? `अगली शिफ्ट ${dw(m[1], l)}` : `পৰৱৰ্তী শ্বিফ্ট ${dw(m[1], l)}`) },
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
  // Sweep: sentences and labels built from numbers, dates or names.
  { re: /^(\d+) waiting on you, (\d+) of yours open, (\d+) from other desks\.$/, to: (m, l) => (l === "hi" ? `${m[1]} आपकी प्रतीक्षा में, आपके ${m[2]} खुले, ${m[3]} अन्य डेस्क से।` : `${m[1]}টা আপোনাৰ অপেক্ষাত, আপোনাৰ ${m[2]}টা খোলা, ${m[3]}টা আন ডেস্কৰ পৰা।`) },
  { re: /^(To do|Mine|Other desks) (\d+)$/, to: (m, l) => `${({ "To do": ["करना है", "কৰিবলগীয়া"], Mine: ["मेरे", "মোৰ"], "Other desks": ["अन्य डेस्क", "আন ডেস্ক"] } as Record<string, [string, string]>)[m[1]][col(l)]} ${m[2]}` },
  { re: /^(\d+) (\w+) left after$/, to: (m, l) => (l === "hi" ? `स्वीकृति के बाद ${m[2]} ${m[1]} बचेंगे` : `অনুমোদনৰ পিছত ${m[2]} ${m[1]} থাকিব`) },
  { re: /^(\d+) others? in the team off then$/, to: (m, l) => (l === "hi" ? `तब टीम के ${m[1]} और लोग छुट्टी पर` : `তেতিয়া দলৰ আৰু ${m[1]} জন ছুটিত`) },
  { re: /^(Applied|Shortlisted|Interview|Medical|Offer|Joined), (step (\d) of 6|current|done|upcoming)$/, to: (m, l) => `${tr(m[1], l)}, ${m[3] ? (l === "hi" ? `चरण ${m[3]}/6` : `পদক্ষেপ ${m[3]}/6`) : tr(m[2], l)}` },
  { re: /^(.+), stage (\d) of 6$/, to: (m, l) => `${m[1]}, ${l === "hi" ? `चरण ${m[2]}/6` : `পদক্ষেপ ${m[2]}/6`}` },
  { re: /^, step (\d) of (\d), current step\.$/, to: (m, l) => (l === "hi" ? `, चरण ${m[1]}/${m[2]}, वर्तमान चरण।` : `, পদক্ষেপ ${m[1]}/${m[2]}, বৰ্তমানৰ পদক্ষেপ।`) },
  { re: /^Step (\d) of (\d): (.+)\.$/, to: (m, l) => (l === "hi" ? `चरण ${m[2]} में से ${m[1]}: ${tr(m[3], l)}।` : `${m[2]}টা পদক্ষেপৰ ${m[1]}: ${tr(m[3], l)}।`) },
  { re: /^(\d+) seats free$/, to: (m, l) => (l === "hi" ? `${m[1]} सीटें खाली` : `${m[1]}টা আসন খালী`) },
  { re: /^(\d+) days left$/, to: (m, l) => (l === "hi" ? `${m[1]} दिन बाकी` : `${m[1]} দিন বাকী`) },
  { re: /^(\d+) passes blocked$/, to: (m, l) => (l === "hi" ? `${m[1]} पास रोके गए` : `${m[1]}খন পাছ ৰখোৱা হৈছে`) },
  { re: /^(\d+) already expired$/, to: (m, l) => (l === "hi" ? `${m[1]} पहले ही समाप्त` : `${m[1]}খনৰ ম্যাদ ইতিমধ্যে উকলিছে`) },
  { re: /^(\d+) crew below minimum$/, to: (m, l) => (l === "hi" ? `${m[1]} दल न्यूनतम से कम` : `${m[1]}টা দল নূন্যতমতকৈ কম`) },
  { re: /^(\d+) shifts with short rest$/, to: (m, l) => (l === "hi" ? `${m[1]} शिफ्टों में कम आराम` : `${m[1]}টা শ্বিফ্টত কম জিৰণি`) },
  { re: /^([\d,]+) entries$/, to: (m, l) => (l === "hi" ? `${m[1]} प्रवेश` : `${m[1]}টা প্ৰৱেশ`) },
  { re: /^(\d+) of (\d+) quarters occupied$/, to: (m, l) => (l === "hi" ? `${m[2]} में से ${m[1]} क्वार्टर आवंटित` : `${m[2]}টাৰ ভিতৰত ${m[1]}টা কোৱাৰ্টাৰত বসবাস`) },
  { re: /^(\d+) present today$/, to: (m, l) => (l === "hi" ? `आज ${m[1]} उपस्थित` : `আজি ${m[1]} জন উপস্থিত`) },
  { re: /^(\d+) in today$/, to: (m, l) => (l === "hi" ? `आज ${m[1]} अंदर` : `আজি ${m[1]} জন ভিতৰত`) },
  { re: /^(\d+) of (\d+) working days present$/, to: (m, l) => (l === "hi" ? `${m[2]} में से ${m[1]} कार्य दिवस उपस्थित` : `${m[2]}টা কৰ্মদিৱসৰ ${m[1]}টাত উপস্থিত`) },
  { re: /^(\d+) posts open$/, to: (m, l) => (l === "hi" ? `${m[1]} पद खाली` : `${m[1]}টা পদ খালী`) },
  { re: /^(₹[\d,]+) claimed so far$/, to: (m, l) => (l === "hi" ? `अब तक ${m[1]} का दावा` : `এতিয়ালৈকে ${m[1]} দাবী`) },
  { re: /^(\d+) vacant$/, to: (m, l) => (l === "hi" ? `${m[1]} खाली` : `${m[1]}টা খালী`) },
  { re: /^Peak (\d+)$/, to: (m, l) => (l === "hi" ? `अधिकतम ${m[1]}` : `সৰ্বাধিক ${m[1]}`) },
  { re: /^(\d+) in your reporting line$/, to: (m, l) => (l === "hi" ? `आपकी रिपोर्टिंग में ${m[1]}` : `আপোনাৰ অধীনত ${m[1]} জন`) },
  { re: /^(\d+)% completed$/, to: (m, l) => (l === "hi" ? `${m[1]}% पूरा` : `${m[1]}% সম্পূৰ্ণ`) },
  { re: /^([\d,]+) on roll$/, to: (m, l) => (l === "hi" ? `${m[1]} कार्यरत` : `${m[1]} জন কৰ্মৰত`) },
  { re: /^Ends (.+), in (\d+) days\.$/, to: (m, l) => (l === "hi" ? `${dw(m[1], l)} को समाप्त, ${m[2]} दिन में।` : `${dw(m[1], l)}ত শেষ, ${m[2]} দিনত।`) },
  { re: /^In (\d\d:\d\d)$/, to: (m, l) => (l === "hi" ? `${m[1]} पर अंदर` : `${m[1]}ত ভিতৰলৈ`) },
  { re: /^(.+), (\d+)d$/, to: (m, l) => (DICT[m[1]] ? `${tr(m[1], l)}, ${m[2]} ${l === "hi" ? "दिन" : "দিন"}` : (null as unknown as string)) },
  { re: /^Select (.+)$/, to: (m, l) => `${l === "hi" ? "चुनें" : "বাছক"}: ${translate(m[1], l) ?? m[1]}` },
  { re: /^Today you are on (\w+)$/, to: (m, l) => (l === "hi" ? `आज आप ${tr(m[1].replace(/^\w/, (c) => c.toUpperCase()), l)} शिफ्ट में हैं` : `আজি আপুনি ${tr(m[1].replace(/^\w/, (c) => c.toUpperCase()), l)} শ্বিফ্টত`) },
  { re: /^Lock attendance, then compute by (.+)$/, to: (m, l) => (l === "hi" ? `उपस्थिति लॉक करें, फिर ${dw(m[1], l)} तक गणना करें` : `উপস্থিতি লক কৰক, তাৰ পিছত ${dw(m[1], l)}ৰ ভিতৰত গণনা কৰক`) },
  { re: /^Most on (.+), ([\d.]+) h\. Approve requests below before payroll locks; executives earn no overtime\.$/, to: (m, l) => (l === "hi" ? `सबसे अधिक ${dw(m[1], l)} को, ${m[2]} घंटे। पेरोल लॉक होने से पहले नीचे के अनुरोध स्वीकृत करें; अधिकारियों को ओवरटाइम नहीं मिलता।` : `আটাইতকৈ বেছি ${dw(m[1], l)}ত, ${m[2]} ঘণ্টা। পে-ৰ'ল লক হোৱাৰ আগতে তলৰ অনুৰোধ অনুমোদন কৰক; বিষয়াসকলে অভাৰটাইম নাপায়।`) },
  { re: /^Highest on (.+) at (.+)\. Priced at the workmen overtime rate in the rules engine\.$/, to: (m, l) => (l === "hi" ? `सबसे अधिक ${dw(m[1], l)} को ${m[2]}। नियम इंजन में कामगार ओवरटाइम दर पर।` : `আটাইতকৈ বেছি ${dw(m[1], l)}ত ${m[2]}। নিয়ম ইঞ্জিনত কৰ্মীৰ অভাৰটাইম হাৰত।`) },
  { re: /^Busiest at (\d\d:\d\d), when (\d+) came in\. Keep all turnstiles open then\.$/, to: (m, l) => (l === "hi" ? `सबसे व्यस्त ${m[1]} बजे, जब ${m[2]} लोग आए। तब सभी टर्नस्टाइल खुले रखें।` : `আটাইতকৈ ব্যস্ত ${m[1]} বজাত, যেতিয়া ${m[2]} জন আহিছিল। তেতিয়া সকলো টাৰ্নষ্টাইল খোলা ৰাখক।`) },
  { re: /^Most are blocked for (\w+) \((\d+)\)\. Clearing that brings the most workers back\.$/, to: (m, l) => (l === "hi" ? `ज़्यादातर ${tr(m[1].replace(/^\w/, (c) => c.toUpperCase()), l)} के कारण रुके हैं (${m[2]})। इसे सुलझाने से सबसे ज़्यादा कामगार लौटेंगे।` : `বেছিভাগ ${tr(m[1].replace(/^\w/, (c) => c.toUpperCase()), l)}ৰ কাৰণে ৰখোৱা হৈছে (${m[2]})। সেয়া সমাধান কৰিলে আটাইতকৈ বেছি শ্ৰমিক উভতি আহিব।`) },
  { re: /^Peak (\d+) inside\. Muster points and canteen should plan for that many\.$/, to: (m, l) => (l === "hi" ? `अधिकतम ${m[1]} अंदर। मस्टर पॉइंट और कैंटीन इतने लोगों की योजना बनाएँ।` : `সৰ্বাধিক ${m[1]} জন ভিতৰত। মাষ্টাৰ পইণ্ট আৰু কেণ্টিনে সিমান লোকৰ বাবে পৰিকল্পনা কৰক।`) },
  { re: /^Peak (\d+) of your crew inside at once\.$/, to: (m, l) => (l === "hi" ? `एक साथ आपके दल के अधिकतम ${m[1]} अंदर।` : `একেলগে আপোনাৰ দলৰ সৰ্বাধিক ${m[1]} জন ভিতৰত।`) },
  { re: /^Lowest turnout was (.+), with (\d+) present\. Check who did not come in that day\.$/, to: (m, l) => (l === "hi" ? `सबसे कम उपस्थिति ${dw(m[1], l)} को, ${m[2]} उपस्थित। देखें उस दिन कौन नहीं आया।` : `আটাইতকৈ কম উপস্থিতি ${dw(m[1], l)}ত, ${m[2]} জন উপস্থিত। সেইদিনা কোন অহা নাছিল চাওক।`) },
  { re: /^(\d+) lapse within a week\. Renew them or the gate blocks the holders\.$/, to: (m, l) => (l === "hi" ? `${m[1]} एक सप्ताह में समाप्त होंगे। नवीनीकरण करें वरना गेट धारकों को रोक देगा।` : `${m[1]}খনৰ এসপ্তাহত ম্যাদ উকলিব। নবীকৰণ কৰক নহ'লে গেটে ধাৰকসকলক ৰাখিব।`) },
  { re: /^(.+) below the minimum of (\d+) \(demo value, to confirm with NRL\)\. Call in relief\.$/, to: (m, l) => (l === "hi" ? `${m[1].replace(/Crew /g, "दल ")} ${m[2]} के न्यूनतम से कम (डेमो मान, NRL से पुष्टि बाकी)। राहत दल बुलाएँ।` : `${m[1].replace(/Crew /g, "দল ")} নূন্যতম ${m[2]}তকৈ কম (ডেমো মান, NRLৰ সৈতে নিশ্চিত কৰিব লাগে)। সহায়ক দল মাতক।`) },
  { re: /^(\d+) vacant quarters can go to the next people on the waiting list\.$/, to: (m, l) => (l === "hi" ? `${m[1]} खाली क्वार्टर प्रतीक्षा सूची के अगले लोगों को दिए जा सकते हैं।` : `${m[1]}টা খালী কোৱাৰ্টাৰ অপেক্ষা তালিকাৰ পৰৱৰ্তী লোকক দিব পাৰি।`) },
  { re: /^Women are ([\d.]+)% of the roll and PwBD ([\d.]+)%, against the 4% PwBD reservation\.$/, to: (m, l) => (l === "hi" ? `महिलाएँ ${m[1]}% और दिव्यांग ${m[2]}% हैं, 4% दिव्यांग आरक्षण के सामने।` : `মহিলা ${m[1]}% আৰু দিব্যাংগ ${m[2]}%, 4% দিব্যাংগ সংৰক্ষণৰ বিপৰীতে।`) },
  { re: /^Net pay across ([\d,]+) employees\.$/, to: (m, l) => (l === "hi" ? `${m[1]} कर्मचारियों का शुद्ध वेतन।` : `${m[1]} জন কৰ্মচাৰীৰ নিকা দৰমহা।`) },
  { re: /^([\d,]+) salaries sent in the bank file\.$/, to: (m, l) => (l === "hi" ? `बैंक फ़ाइल में ${m[1]} वेतन भेजे गए।` : `বেংক ফাইলত ${m[1]} জনৰ দৰমহা পঠোৱা হ'ল।`) },
  { re: /^Most days are (\w+)\. (\d+) days still waiting for approval\.$/, to: (m, l) => (l === "hi" ? `ज़्यादातर दिन ${tr(m[1], l)} हैं। ${m[2]} दिन अभी स्वीकृति की प्रतीक्षा में।` : `বেছিভাগ দিন ${tr(m[1], l)}। ${m[2]} দিন এতিয়াও অনুমোদনৰ অপেক্ষাত।`) },
  { re: /^Pays (₹\d+) a day, at or above (₹\d+)\.$/, to: (m, l) => (l === "hi" ? `प्रतिदिन ${m[1]} देता है, ${m[2]} के बराबर या अधिक।` : `দিনে ${m[1]} দিয়ে, ${m[2]}ৰ সমান বা বেছি।`) },
  { re: /^Pays (₹\d+) a day against (₹\d+)\. (\d+) workers short (₹[\d,]+) a month\.$/, to: (m, l) => (l === "hi" ? `${m[2]} के सामने प्रतिदिन ${m[1]} देता है। ${m[3]} कामगारों को माह में ${m[4]} कम।` : `${m[2]}ৰ বিপৰীতে দিনে ${m[1]} দিয়ে। ${m[3]} জন শ্ৰমিকক মাহে ${m[4]} কম।`) },
  { re: /^(.+) costs (₹.+) a month\. Budget lines are not loaded, so there is no variance yet\.$/, to: (m, l) => (l === "hi" ? `${m[1]} पर माह में ${m[2]} खर्च। बजट पंक्तियाँ नहीं डाली गईं, इसलिए अभी अंतर नहीं।` : `${m[1]}ত মাহে ${m[2]} খৰচ। বাজেটৰ শাৰী দিয়া হোৱা নাই, গতিকে এতিয়া পাৰ্থক্য নাই।`) },
  { re: /^(.+)\. (\d+) of (\d+) seats taken, (\d+) more due\.$/, to: (m, l) => (l === "hi" ? `${m[1]}। ${m[3]} में से ${m[2]} सीटें भरीं, ${m[4]} और देय।` : `${m[1]}। ${m[3]}টাৰ ${m[2]}টা আসন পূৰণ, আৰু ${m[4]} জন বাকী।`) },
  { re: /^Scheduled (.+)\.$/, to: (m, l) => (l === "hi" ? `निर्धारित ${dw(m[1], l)}।` : `নিৰ্ধাৰিত ${dw(m[1], l)}।`) },
  { re: /^Merit score ([\d.]+), (\w+) category\.$/, to: (m, l) => (l === "hi" ? `मेरिट अंक ${m[1]}, ${m[2]} श्रेणी।` : `মেধা নম্বৰ ${m[1]}, ${m[2]} শ্ৰেণী।`) },
  { re: /^, up to (\d+) days at a time$/, to: (m, l) => (l === "hi" ? `, एक बार में अधिकतम ${m[1]} दिन` : `, এবাৰত সৰ্বাধিক ${m[1]} দিন`) },
  { re: /^Off today (\d+), swaps waiting (\d+)$/, to: (m, l) => (l === "hi" ? `आज छुट्टी ${m[1]}, लंबित अदला-बदली ${m[2]}` : `আজি বন্ধ ${m[1]}, বাকী সলনি ${m[2]}`) },
  { re: /^([\d.]+) yrs$/, to: (m, l) => (l === "hi" ? `${m[1]} वर्ष` : `${m[1]} বছৰ`) },
  { re: /^([\d,]+) of (\d+) documents$/, to: (m, l) => (l === "hi" ? `${m[2]} में से ${m[1]} दस्तावेज़` : `${m[2]}টাৰ ${m[1]}টা নথি`) },
  { re: /^([,.]) (.+)$/, to: (m, l) => { const t = translate(m[2], l); return (t ? `${m[1] === "." ? (l === "hi" ? "।" : "।") : ","} ${t}` : null) as string; } },
  { re: /^Not seen: (.+)$/, to: (m, l) => (l === "hi" ? `नहीं देखे गए: ${m[1]}` : `দেখা নাই: ${m[1]}`) },
  { re: /^approved (.+)$/, to: (m, l) => (l === "hi" ? `${m[1]} ने स्वीकृत किया` : `${m[1]}এ অনুমোদন কৰিলে`) },
  { re: /^short by (₹[\d,]+)$/, to: (m, l) => (l === "hi" ? `${m[1]} कम` : `${m[1]} কম`) },
  { re: /^(\d+) cleared$/, to: (m, l) => (l === "hi" ? `${m[1]} मंज़ूर` : `${m[1]}টা অনুমোদিত`) },
  { re: /^(.+) largest$/, to: (m, l) => (l === "hi" ? `${m[1]} सबसे बड़ा` : `${m[1]} আটাইতকৈ ডাঙৰ`) },
  { re: /^([\d.]+)h OT$/, to: (m, l) => (l === "hi" ? `${m[1]} घंटे ओवरटाइम` : `${m[1]} ঘণ্টা অভাৰটাইম`) },
  { re: /^Net (₹[\d,]+)$/, to: (m, l) => (l === "hi" ? `शुद्ध ${m[1]}` : `নিকা ${m[1]}`) },
  { re: /^(₹[\d,]+) of (₹[\d,]+)$/, to: (m, l) => (l === "hi" ? `${m[2]} में से ${m[1]}` : `${m[2]}ৰ ${m[1]}`) },
  { re: /^(₹[\d,]+) \/ month$/, to: (m, l) => (l === "hi" ? `${m[1]} / माह` : `${m[1]} / মাহ`) },
  { re: /^(₹[\d,]+) a month$/, to: (m, l) => (l === "hi" ? `${m[1]} प्रति माह` : `মাহে ${m[1]}`) },
  { re: /^(\d+) hrs$/, to: (m, l) => (l === "hi" ? `${m[1]} घंटे` : `${m[1]} ঘণ্টা`) },
  { re: /^In grade (\w+)$/, to: (m, l) => (l === "hi" ? `ग्रेड ${m[1]} में` : `গ্ৰেড ${m[1]}ত`) },
  { re: /^#(\d+) of (\d+) for Type (\w+)$/, to: (m, l) => (l === "hi" ? `टाइप ${m[3]} के लिए ${m[2]} में ${m[1]}वाँ` : `টাইপ ${m[3]}ৰ বাবে ${m[2]}ৰ ভিতৰত ${m[1]} নম্বৰ`) },
  { re: /^([\d,]+) on roll \(demo sample; NRL publishes 1,120\)$/, to: (m, l) => (l === "hi" ? `${m[1]} कार्यरत (डेमो नमूना; NRL 1,120 प्रकाशित करता है)` : `${m[1]} জন কৰ্মৰত (ডেমো নমুনা; NRLএ 1,120 প্ৰকাশ কৰে)`) },
  { re: /^Hold to join (.+)$/, to: (m, l) => (l === "hi" ? `${m[1]} को जोड़ने के लिए दबाए रखें` : `${m[1]}ক যোগ দিবলৈ টিপি ধৰি ৰাখক`) },
  { re: /^due (\d+) days$/, to: (m, l) => (l === "hi" ? `${m[1]} दिन में देय` : `${m[1]} দিনত দেয়`) },
  { re: /^of (\d+), GATE$/, to: (m, l) => (l === "hi" ? `${m[1]} में से, GATE` : `${m[1]}ৰ ভিতৰত, GATE`) },
  { re: /^Gate (\d) synced, (\d+) queued$/, to: (m, l) => (l === "hi" ? `गेट ${m[1]} मिलान हुआ, ${m[2]} कतार में` : `গেট ${m[1]} মিলোৱা হ'ল, ${m[2]}টা শাৰীত`) },
  { re: /^Delivered (\d+) of (\d+) today$/, to: (m, l) => (l === "hi" ? `आज ${m[2]} में से ${m[1]} पहुँचे` : `আজি ${m[2]}টাৰ ${m[1]}টা পোৱা গ'ল`) },
  { re: /^(\d+) digits$/, to: (m, l) => (l === "hi" ? `${m[1]} अंक` : `${m[1]}টা অংক`) },
  { re: /^([\d-]+) run, ([\d,]+) employees\.$/, to: (m, l) => (l === "hi" ? `${m[1]} रन, ${m[2]} कर्मचारी।` : `${m[1]} ৰান, ${m[2]} জন কৰ্মচাৰী।`) },
  { re: /^([+−])(\d+) on the day before$/, to: (m, l) => (l === "hi" ? `पिछले दिन से ${m[1]}${m[2]}` : `আগৰ দিনতকৈ ${m[1]}${m[2]}`) },
  { re: /^(\d+) min$/, to: (m, l) => (l === "hi" ? `${m[1]} मिनट` : `${m[1]} মিনিট`) },
  { re: /^Late (\d+) min$/, to: (m, l) => (l === "hi" ? `${m[1]} मिनट देर` : `${m[1]} মিনিট পলম`) },
  { re: /^Starts (.+)$/, to: (m, l) => (l === "hi" ? `${dw(m[1], l)} शुरू` : `${dw(m[1], l)}ত আৰম্ভ`) },
  { re: /^Crew (\w), (.+) · (.+)$/, to: (m, l) => (l === "hi" ? `दल ${m[1]}, ${m[2].replace(" and ", " और ")} · ${dw(m[3], l)}` : `দল ${m[1]}, ${m[2].replace(" and ", " আৰু ")} · ${dw(m[3], l)}`) },
  { re: /^(Morning|Afternoon|Night|General) shift, (.+)$/, to: (m, l) => `${tr(m[1], l)} ${l === "hi" ? "शिफ्ट" : "শ্বিফ্ট"}, ${tr(m[2], l)}` },
  { re: /^(.+), (\d+) min late$/, to: (m, l) => `${dw(m[1], l)}, ${l === "hi" ? `${m[2]} मिनट देर` : `${m[2]} মিনিট পলম`}` },
  { re: /^([\d.]+) h, under (\d+) h$/, to: (m, l) => (l === "hi" ? `${m[1]} घंटे, ${m[2]} घंटे से कम` : `${m[1]} ঘণ্টা, ${m[2]} ঘণ্টাতকৈ কম`) },
  { re: /^(.+), (Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d+ \w+)$/, to: (m, l) => `${m[1]}, ${dw(`${m[2]} ${m[3]}`, l)}` },
  { re: /^Note for (.+)$/, to: (m, l) => (l === "hi" ? `${m[1]} के लिए नोट` : `${m[1]}ৰ বাবে টোকা`) },
  { re: /^Tick all (\d+)$/, to: (m, l) => (l === "hi" ? `सभी ${m[1]} चुनें` : `সকলো ${m[1]} বাছক`) },
];

// Month and day names, translated wherever they appear (dates, calendars, subtitles).
const MONTHS: [string, string, string][] = [
  ["January", "जनवरी", "জানুৱাৰী"], ["February", "फ़रवरी", "ফেব্ৰুৱাৰী"], ["March", "मार्च", "মাৰ্চ"], ["April", "अप्रैल", "এপ্ৰিল"],
  ["May", "मई", "মে'"], ["June", "जून", "জুন"], ["July", "जुलाई", "জুলাই"], ["August", "अगस्त", "আগষ্ট"],
  ["September", "सितंबर", "ছেপ্টেম্বৰ"], ["October", "अक्टूबर", "অক্টোবৰ"], ["November", "नवंबर", "নৱেম্বৰ"], ["December", "दिसंबर", "ডিচেম্বৰ"],
];
const DAYS: [string, string, string, string, string][] = [
  ["Monday", "सोमवार", "সোমবাৰ", "सोम", "সোম"], ["Tuesday", "मंगलवार", "মঙলবাৰ", "मंगल", "মঙল"], ["Wednesday", "बुधवार", "বুধবাৰ", "बुध", "বুধ"],
  ["Thursday", "गुरुवार", "বৃহস্পতিবাৰ", "गुरु", "বৃহ"], ["Friday", "शुक्रवार", "শুকুৰবাৰ", "शुक्र", "শুক্ৰ"], ["Saturday", "शनिवार", "শনিবাৰ", "शनि", "শনি"],
  ["Sunday", "रविवार", "দেওবাৰ", "रवि", "দেও"],
];
const DATE_WORDS: [RegExp, [string, string]][] = [
  ...MONTHS.flatMap(([en, hi, as]): [RegExp, [string, string]][] => [
    [new RegExp(`\\b${en}\\b`, "g"), [hi, as]],
    // Short month only beside a number, so words like "May" in a sentence are left alone.
    [new RegExp(`(?<=\\d )${en.slice(0, 3)}\\b|\\b${en.slice(0, 3)}(?= \\d)`, "g"), [hi, as]],
  ]),
  ...DAYS.flatMap(([en, hi, as, hs, ass]): [RegExp, [string, string]][] => [
    [new RegExp(`\\b${en}\\b`, "g"), [hi, as]],
    [new RegExp(`^${en.slice(0, 3)}(?= \\d|$)|(?<=, )${en.slice(0, 3)}(?= \\d)`, "g"), [hs, ass]],
    [new RegExp(`^${en.slice(0, 2)}$`, "g"), [hs, ass]],
  ]),
  [/(\d)(st|nd|rd|th)\b/g, ["$1", "$1"]],
  [/\b(\d{1,2}:\d\d) AM\b/g, ["सुबह $1", "পুৱা $1"]],
  [/\b(\d{1,2}:\d\d) PM\b/g, ["शाम $1", "আবেলি $1"]],
  [/, selected$/g, [", चुना गया", ", বাছনি কৰা"]],
  // Pay labels inside per-person deduction lists.
  [/\bProvident fund\b/g, ["भविष्य निधि", "ভৱিষ্যনিধি"]],
  [/\bNPS \(employee\)/g, ["NPS (कर्मचारी)", "NPS (কৰ্মচাৰী)"]],
  [/\bProfessional tax\b/g, ["व्यावसायिक कर", "বৃত্তি কৰ"]],
  [/\bIncome tax \(TDS\)/g, ["आयकर (TDS)", "আয়কৰ (TDS)"]],
  [/\bQuarter licence fee\b/g, ["क्वार्टर लाइसेंस शुल्क", "কোৱাৰ্টাৰ অনুজ্ঞা মাচুল"]],
  [/^Today, /g, ["आज, ", "আজি, "]],
];
function dateWords(text: string, l: Locale) {
  let out = text;
  for (const [re, pair] of DATE_WORDS) out = out.replace(re, pair[col(l)]);
  return out === text ? null : out;
}

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
  return dateWords(text, l);
}

/* For components that render text directly, such as the kiosk. */
export function t(text: string, l: Locale) {
  return translate(text, l) ?? text;
}
