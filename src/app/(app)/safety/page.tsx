"use client";

import { TrainingCalendar } from "@/components/safety/training-calendar";
import { SafetyCharts } from "@/components/charts/page-charts";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { DEMO_TODAY } from "@/lib/demo";
import { downloadText, prettySize } from "@/lib/files";
import { useCurrentUser, useHrms } from "@/lib/store";
import { toast } from "sonner";

export default function SafetyPage() {
  const certs = useHrms((s) => s.certificates);
  const courses = useHrms((s) => s.courses);
  const employees = useHrms((s) => s.employees);
  const workers = useHrms((s) => s.workers);
  const sessions = useHrms((s) => s.sessions);
  const inductions = useHrms((s) => s.inductions);
  const enrollTraining = useHrms((s) => s.enrollTraining);
  const sitInduction = useHrms((s) => s.sitInduction);
  const issueCertificate = useHrms((s) => s.issueCertificate);
  const me = useCurrentUser();
  const today = DEMO_TODAY;
  const due = certs.filter((c) => c.expires <= "2026-12-15");
  const dueCsv = ["person,course,expires", ...due.map((c) => `${c.personId},${c.courseId},${c.expires}`)].join("\n");

  return (
    <div>
      <PageHeader title="Safety training"
        subtitle="OISD-STD-154 fire, H2S, height and confined space certificates for NRL and contract crews." />
      <SafetyCharts />
      <div className="mb-5">
        <TrainingCalendar />
      </div>
      <Card className="mb-5 px-5 py-2">
        <FileDownloadList>
          <FileDownload
            kind="xls"
            name="Certificates due"
            size={prettySize(dueCsv)}
            onClick={() => downloadText("safety-due.csv", dueCsv, "text/csv")}
          />
        </FileDownloadList>
      </Card>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {sessions.map((t) => {
          const course = courses.find((c) => c.id === t.courseId);
          return (
            <Card key={t.id} className="p-4">
              <p className="font-semibold">{course?.name}</p>
              <p className="text-sm text-muted">{t.date}, {t.enrolled.length}/{t.seats} seats</p>
              {me && (
                <button
                  className="mt-2 text-xs font-semibold text-brand"
                  onClick={() => {
                    enrollTraining(t.id, me.id);
                    toast.success("Enrolled");
                  }}
                >
                  Enrol
                </button>
              )}
            </Card>
          );
        })}
      </div>
      <Card className="mb-5 p-4">
        <p className="mb-2 font-semibold">Induction test (pass ≥ 70)</p>
        <div className="flex flex-wrap gap-2">
          {workers.slice(0, 8).map((w) => (
            <Button
              key={w.id}
              variant="secondary"
              onClick={() => {
                const score = w.inductionPassed ? 88 : 72;
                sitInduction(w.id, score);
                issueCertificate(w.id, "contract", "ind");
                toast.success(`${w.name} scored ${score}`);
              }}
            >
              {w.name.split(" ")[0]}
            </Button>
          ))}
        </div>
        {inductions.slice(0, 4).map((i) => (
          <p key={i.id} className="mt-2 text-xs text-muted">
            {workers.find((w) => w.id === i.workerId)?.name}, {i.score}, {i.passed ? "pass" : "fail"}
          </p>
        ))}
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-subtle text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-3">Person</th>
              <th>Course</th>
              <th>Expires</th>
              <th className="px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((c) => {
              const who =
                c.personKind === "employee"
                  ? employees.find((e) => e.id === c.personId)?.name
                  : workers.find((w) => w.id === c.personId)?.name;
              const expired = c.expires < today;
              const soon = !expired && c.expires < "2026-12-15";
              return (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-4 py-2.5">{who}</td>
                  <td>{courses.find((x) => x.id === c.courseId)?.name}</td>
                  <td>{c.expires}</td>
                  <td className="px-4">
                    <Badge tone={expired ? "danger" : soon ? "warn" : "ok"}>
                      {expired ? "expired" : soon ? "due 45 days" : "valid"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
