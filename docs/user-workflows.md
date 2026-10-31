# NRL People: how each role uses the system

Every role starts the same way. Sign in at the login page with the part of your NRL email before the @ and your password. HR, payroll, finance, the auditor and the MD also enter a 6-digit authenticator code. Each person lands on the page that matches their job: gate guards on Pass check, the MD on Overview, everyone else on Home.

Anywhere in the app, Cmd+K (Ctrl+K on Windows) opens search. The language switch (English, Hindi, Assamese) sits in the top bar and on the login page.

Demo accounts use the password `Nrl@2026`; the authenticator code is `246810`.

## 1. Employee (for example pallabi.gogoi)

Lands on Home.

1. **Today list:** next shift, gate check-in status, open cases.
2. **Attendance:** own days in and out. A missed check-in gets **Correct a missed check-in**, which goes to the manager.
3. **Leave:** pick dates on the calendar (holidays and own leave show as dots), see the balance and limit, submit, and track the status. A request can be withdrawn, with Undo.
4. **Me:** payslips, tax declaration, claims and advances, appraisal, township housing, and help cases.
5. **Roster:** own shifts; request a shift swap.

## 2. Line manager / shift-in-charge (for example hiren.kalita)

Lands on Home, where Today puts short crews first.

1. **Before each changeover (6:00, 14:00, 22:00):** the Shift desk shows who is in, late or not in for each shift.
2. **Inbox:** approve leave, swaps, attendance corrections and claims. Leave rows show the balance left and who else is off.
3. **Shift desk, during the shift:** approve overtime, write the shift handover, see who is off this week, and delegate approvals while away.
4. **Roster:** a day view of the crew with check-in times. Tap a grid cell for that day's details.
5. **Permits:** issue work permits for the crew.

## 3. HR admin (for example bhaskar.baruah)

Lands on Home with the plant attendance chart.

1. **Inbox:** record changes (bank, phone) and items escalated by other desks.
2. **People:** employee records. **Cases:** helpdesk, grievance, transfer, show cause.
3. **Attendance and Payroll:** oversight. **Hiring:** pipeline and interviews.
4. **Contract and safety:** contractor register, muster, certificates.
5. **Separation:** retirements and clearances. **Reports:** government returns.
6. **Admin:** organisation, rules engine, interfaces, audit trail. Also township allotments.

## 4. Payroll officer (for example pranjal.sharma)

Lands on Home, where Today shows the run stage and cut-off.

1. **Month end on Payroll:** Lock attendance, then Compute, Validate, Finance approval, Bank file and Publish. The step line under the progress bar says what to do next.
2. **Pay cost:** exceptions and deductions.
3. **Separation:** final settlements.
4. **Rules engine:** propose DA, HRA and PF changes. A second person must approve each one.

## 5. Finance approver (for example rajib.dutta)

Lands on Home with net pay by pay part.

1. **Inbox:** claims of ₹25,000 and over (press and hold to approve), and bank account changes.
2. **Payroll:** approve the run at the finance step.
3. **Bank and files:** salary bank file and the bank acknowledgement.

## 6. Contract Labour Cell (for example meenakshi.devi)

Lands on Home with gate traffic by hour.

1. **Contract labour:** licences against worker counts, and certificates running out.
2. **Muster and challans:** check musters against gate entries, approve worker additions, check EPF and ESI challans, run the minimum-wage check, renew passes.
3. **Gate and Safety:** blocked passes and training batches.

## 7. Contractor supervisor (for example vikram.rao, L&T)

Lands on Home.

1. **Muster, daily:** tick the crew who worked. Each name shows its pass number and gate entry time, and "Tick the N seen at gate" ticks them all at once. Then submit.
2. **Worker additions:** request new workers. The Contract Labour Cell registers them.
3. **Gate passes:** own crew inside now, and blocked workers with the reason.

## 8. Safety officer (for example ritu.das)

Lands on Home.

1. **Certificates:** what has expired or is expiring by course, and training batches with seats.
2. **Permits and incidents:** issue permits, log near misses.
3. **Inbox:** approvals. Also **Gate** and **Contract labour** for blocked workers.

## 9. Gate guard (for example manoj.basumatary)

Lands on Pass check.

1. **Pass check:** scan or search a pass, read the green or red verdict, press In or Out. The headcount shows how many people are inside.
2. **Visitors and vehicles:** visitor passes, tankers and material.
3. **Handover:** note blocked passes and faults for the next shift.
4. **Work offline:** keeps working without signal and syncs when the network returns.

## 10. Recruiter (for example kaushik.hazarika)

Lands on Home with posts filled and open.

1. **Hiring:** move candidates from Applied to Shortlisted, Interview, Medical, Offer and Joined.
2. **Interviews:** panel score sheets, document checks, merit order, call letters, offer letters.
3. **Reports:** reservation roster.

## 11. Auditor (for example arup.bora)

Lands on Overview. Everything is read-only.

1. Read access to people, payroll, contract labour, hiring and pay cost.
2. **Audit trail:** export a log of every action. Personal details are hidden by default, and a SHA-256 hash chain shows the log has not been altered.

## 12. MD (md.office)

Lands on Overview. Everything is read-only.

1. One page: headcount, people inside the plant, attendance, crew manning, overtime cost, net pay, certificates.
2. **Organisation, Pay cost, Reports:** board and government returns.
3. **Me:** own payslip, leave and tax.

## Kiosk, for staff without a phone or desk

Open `/kiosk` and enter the 3-digit employee number and birth year (demo: `077` and `1983`). Big tiles show My attendance, My leave (one-tap casual leave), My payslip (print) and Ask HR for help. "Someone is helping me" marks the session as assisted. It signs out after a minute with no touch.
