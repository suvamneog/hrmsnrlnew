"use client";

import { type Locale, translate } from "@/lib/i18n";
import { useEffect } from "react";

const ATTRS = ["placeholder", "aria-label", "title"] as const;
const SKIP = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA", "NOSCRIPT"]);

// Original English per text node, and the text we last wrote, so React updates are re-read.
const original = new WeakMap<Text, string>();
const written = new WeakMap<Text, string>();

function swapText(node: Text, l: Locale) {
  const current = node.nodeValue ?? "";
  if (written.get(node) !== current) original.set(node, current);
  const en = original.get(node) ?? current;
  const trimmed = en.trim();
  if (!trimmed || !/[A-Za-z]/.test(trimmed)) return;
  const out = translate(trimmed, l);
  const next = out ? en.replace(trimmed, out) : en;
  if (next !== current) {
    node.nodeValue = next;
    written.set(node, next);
  }
}

function swapAttrs(el: Element, l: Locale) {
  for (const a of ATTRS) {
    const key = `data-en-${a}`;
    const current = el.getAttribute(a);
    if (current == null) continue;
    const stored = el.getAttribute(key);
    const lastOut = el.getAttribute(`${key}-out`);
    const en = stored != null && current === lastOut ? stored : current;
    if (en !== stored) el.setAttribute(key, en);
    const next = translate(en, l) ?? en;
    if (next !== current) el.setAttribute(a, next);
    el.setAttribute(`${key}-out`, next);
  }
}

function walk(root: Node, l: Locale) {
  if (root.nodeType === Node.TEXT_NODE) return swapText(root as Text, l);
  if (!(root instanceof Element) || SKIP.has(root.tagName) || root.closest("[data-no-translate]")) return;
  swapAttrs(root, l);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) =>
      n instanceof Element && (SKIP.has(n.tagName) || n.hasAttribute("data-no-translate")) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) swapText(n as Text, l);
    else swapAttrs(n as Element, l);
  }
}

/* Translates the whole rendered UI in place, including text React adds later.
   Pages stay written in English; the dictionary in lib/i18n carries Hindi and Assamese. */
export function AutoTranslate({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale === "as" ? "as" : locale;
    walk(document.body, locale);
    let queued = new Set<Node>();
    let frame = 0;
    const flush = () => {
      frame = 0;
      const nodes = queued;
      queued = new Set();
      for (const n of nodes) if (n.isConnected) walk(n, locale);
    };
    const obs = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") queued.add(m.target);
        else if (m.type === "attributes") queued.add(m.target);
        else m.addedNodes.forEach((n) => queued.add(n));
      }
      if (!frame) frame = requestAnimationFrame(flush);
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [locale]);
  return null;
}
