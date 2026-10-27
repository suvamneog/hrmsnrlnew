"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { liveCensus } from "@/lib/census";
import { downloadText } from "@/lib/files";
import { useHrms } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

const COPY = {
  en: {
    title: "Government reports",
    exec: "Executives",
    work: "Workmen",
    train: "Trainees",
    res: "Reservation status",
    women: "Women employees",
  },
  hi: {
    title: "सरकारी विवरण",
    exec: "कार्यपालक",
    work: "कर्मकार",
    train: "प्रशिक्षु",
    res: "आरक्षण स्थिति",
    women: "महिला कर्मचारी",
  },
  as: {
    title: "চৰকাৰী প্ৰতিবেদন",
    exec: "কাৰ্যবাহী",
    work: "শ্ৰমিক",
    train: "প্ৰশিক্ষাৰ্থী",
    res: "সংৰক্ষণ স্থিতি",
    women: "মহিলা কৰ্মচাৰী",
  },
};

export default function ReportsPage() {
  const locale = useHrms((s) => s.locale);
  const setLocale = useHrms((s) => s.setLocale);
  const exportReport = useHrms((s) => s.exportReport);
  const employees = useHrms((s) => s.employees);
  const [metric, setMetric] = useState("cadre");
  const t = COPY[locale];
  const census = liveCensus(employees);

  function dump() {
    const content =
      metric === "cadre"
        ? `executives,${census.executives}\nworkmen,${census.workmen}\ntrainees,${census.trainees}`
        : Object.entries(census.category)
            .map(([k, v]) => `${k},${v}`)
            .join("\n");
    exportReport(metric, content);
    downloadText(`nrl-${metric}.csv`, content, "text/csv");
    toast.success("Exported and logged");
  }

  return (
    <div>
      <PageHeader
        title={t.title}
        actions={
          <div className="flex gap-2">
            {(["en", "hi", "as"] as const).map((l) => (
              <Button key={l} variant={locale === l ? "primary" : "secondary"} onClick={() => setLocale(l)}>
                {l === "en" ? "English" : l === "hi" ? "हिन्दी" : "অসমীয়া"}
              </Button>
            ))}
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted">{t.exec}</p>
          <p className="text-3xl font-semibold">{census.executives}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t.work}</p>
          <p className="text-3xl font-semibold">{census.workmen}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">{t.train}</p>
          <p className="text-3xl font-semibold">{census.trainees}</p>
        </Card>
      </div>
      <Card className="mt-5 p-5">
        <h2 className="mb-3 font-semibold">{t.res}</h2>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(census.category).map(([c, n]) => (
            <div key={c} className="rounded-2xl bg-[#f6f8fd] p-3 text-center">
              <p className="text-xs text-muted">{c}</p>
              <p className="text-2xl font-semibold">{n}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          {t.women} {census.women} · PwBD {census.pwbd} · on roll {census.onRoll.toLocaleString("en-IN")}
        </p>
      </Card>
      <Card className="mt-5 grid gap-3 p-5 sm:grid-cols-[1fr_auto]">
        <Field label="Ad hoc report">
          <Select value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="cadre">Cadre strength (DPE / Board)</option>
            <option value="reservation">Reservation roster</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button onClick={dump}>Export (logged)</Button>
        </div>
      </Card>
    </div>
  );
}
