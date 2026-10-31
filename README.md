# NRL People

A working prototype of an HRMS for Numaligarh Refinery Limited. It runs entirely in the browser on demo data, so it can be shown without a server.

## Run it

```bash
npm install
npm run dev -- -p 3100
```

Open http://localhost:3100. Every demo account uses the password `Nrl@2026`. HR, payroll, finance, the auditor and the MD also need the authenticator code `246810`. The account switcher in the top bar moves between roles; **Reset demo** in the top bar puts all data back.

| Role | Sign in as (the part of the email before @) | Lands on |
| --- | --- | --- |
| Employee | pallabi.gogoi | Home |
| Line manager (CDU shift-in-charge) | hiren.kalita | Home, Shift desk |
| HR administrator | bhaskar.baruah | Home |
| Payroll officer | pranjal.sharma | Payroll |
| Finance approver | rajib.dutta | Pay cost |
| Contract Labour Cell | meenakshi.devi | Contract labour, Muster |
| Safety officer | ritu.das | Safety, Permits |
| Gate security | manoj.basumatary | Pass check, Visitors |
| Recruiter | kaushik.hazarika | Recruitment, Interviews |
| Auditor | arup.bora | Audit trail |
| Contractor supervisor | vikram.rao (email at lntecc.com) | Home, Muster |
| Managing Director (read only) | md.office | Overview |

The walkthrough is in [docs/demo-script.md](docs/demo-script.md). How each role uses the system day to day is in [docs/user-workflows.md](docs/user-workflows.md). The design system (palette, type, radius, motion) is in [DESIGN.md](DESIGN.md).

## What the prototype does

- Payroll from attendance lock to bank file, with reconciliation against SAP S/4HANA 2020 and statutory files (salary bank file, EPFO ECR, NPS, 24Q, PT).
- Rules engine with versioned, maker-checker policy values.
- Gate pass checks that block on police, medical, induction, licence or certificate; visitor and vehicle passes on three gates.
- Shift desk for changeover exceptions, bulk approval, delegation, overtime and certificate-lapse impact on next week's roster.
- Contract labour muster checked against gate entries, worker addition requests, EPF and ESI challan checks.
- Work permits tied to certificate validity, incidents and near misses, an OISD-style export.
- Interview scheduling, panel score sheets, document verification and offer letters.
- Helpdesk, grievance, discipline, transfer and medical cases.
- Audit export with PII masked by default and a SHA-256 hash chain.
- Charts on every operational page, and a read-only MD overview.
- English, Hindi and Assamese across the app (switch in the top bar, login and kiosk).
- A kiosk at `/kiosk` for staff without a phone or desk: employee number and birth year, large touch tiles, assisted mode, sign-out after a minute idle.
- Installable on phones, and opens offline in plant areas with no signal; changes are kept on the device.

## Demo data

The on-roll headcount of 1,588 is a generated sample. NRL publishes 1,120 on roll; screens that show the sample say so. Minimum crew manning (3), overtime rates and contractor scale are demo values to confirm with NRL.

## Not in this build (Phase 0 and production work)

- Backend, database and shared multi-user state. Data lives in each browser.
- NRL Active Directory SSO and real MFA; server-side permissions.
- Tamper-proof, India-hosted, encrypted audit storage; backup; VAPT.
- Live connections to SAP S/4HANA 2020, SAP BTP, AAROHAN (IBM BAW), the Employee Portal, m.Barta and Saral Pravesh, and EPFO ECR and TRACES submission. Files download; nothing is submitted. Eureka and m.Barta stay unchanged.
- Facts not in NRL's public documents, to confirm in Phase 0: the payroll product, the payroll bank (the demo uses SBI's CMP file format), the gate hardware vendor, the Employee Portal's technology, and whether HRMS replaces or feeds the Employee Portal. Source: [docs/nrl-current-systems.pdf](docs/nrl-current-systems.pdf).
- A parallel payroll run against the current system, and month-on-month variance (only October 2026 exists).
- Hindi and Assamese wording is machine-drafted in `src/lib/i18n` and needs a native reviewer. Labels, sentences with numbers, dates and day names are translated; records stay as entered (people, companies, places, job titles, trades, policy and order names, IDs and file names).
- Offline changes stay on the device; with no backend there is nothing to sync them to yet.
- Confirmed shift pattern, overtime rates and NREP surge contractor split from NRL.
