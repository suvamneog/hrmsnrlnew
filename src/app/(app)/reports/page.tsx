"use client";

import { HeadcountCharts, ReservationCharts } from "@/components/charts/page-charts";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { liveCensus } from "@/lib/census";
import { downloadText, prettySize } from "@/lib/files";
import { useHrms } from "@/lib/store";
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
  const t = COPY[locale];
  const census = liveCensus(employees);
  const onRoll = employees.filter((e) => e.cadre !== "contract" && e.status !== "separated");
  const cadreCsv = [
    "empNo,name,cadre,grade,unit",
    ...onRoll.map((e) => `${e.empNo},${e.name},${e.cadre},${e.grade},${e.unitId}`),
  ].join("\n");
  const reservationCsv = [
    "empNo,name,category,cadre,grade",
    ...onRoll.map((e) => `${e.empNo},${e.name},${e.category},${e.cadre},${e.grade}`),
  ].join("\n");

  function dump(metric: string, content: string, file: string) {
    exportReport(metric, content);
    downloadText(file, content, "text/csv");
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
      <div className="mt-5 grid gap-5 *:min-w-0 xl:grid-cols-2">
        <HeadcountCharts />
        <ReservationCharts />
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
      <Card className="mt-5 px-5 py-2">
        <FileDownloadList>
          <FileDownload
            kind="xls"
            name="Cadre strength"
            size={prettySize(cadreCsv)}
            onClick={() => dump("cadre", cadreCsv, "nrl-cadre.csv")}
          />
          <FileDownload
            kind="xls"
            name="Reservation roster"
            size={prettySize(reservationCsv)}
            onClick={() => dump("reservation", reservationCsv, "nrl-reservation.csv")}
          />
        </FileDownloadList>
      </Card>
    </div>
  );
}
