# Demo script

About 20 minutes. Press **Reset demo** in the top bar before you start. Password for everyone is `Nrl@2026`; the code `246810` is asked of HR, payroll, finance, the auditor and the MD.

## 1. The MD's view (2 min)

Sign in as `md.office`. The Overview shows headcount (labelled as a demo sample against NRL's published 1,120), people inside the plant, attendance, crew manning against the minimum, overtime cost, net pay and certificate expiry. Point out the "Read only" tag: there is nothing to approve here.

## 2. A shift changeover (4 min)

Switch to Hiren (line manager). Open **Shift desk**.

1. Flip between 06:00, 14:00 and 22:00. Late, not-in and on-leave people sort to the top; a short shift shows "Below minimum".
2. In **Approve in bulk**, select all and approve.
3. **Certificate lapses next week** shows which shifts lose minimum manning if a certificate runs out.
4. Delegate approvals to a colleague until a date.

## 3. The gate (3 min)

Switch to Manoj (gate security). On **Pass check**, scan a blocked pass to show the reason. Move to **Visitors and vehicles**: let the OISD auditor in, log a tanker, then write a handover note for the next shift.

## 4. Contract labour (3 min)

Switch to Vikram (contractor supervisor). Open **Muster**, tick the crew and submit, then request a new rigger. Switch to Meenakshi (Contract Labour Cell): the muster shows who was not seen at the gate, so it can be disputed rather than paid. Register the rigger and check the ESI challan, which is short paid.

## 5. Safety (2 min)

Switch to Ritu. On **Permits and incidents**, the FCC confined-space permit shows workers blocked at the gate. Try to issue a permit to someone with a lapsed certificate: it is refused. Close the open near miss with an action and export the OISD summary.

## 6. Payroll and Finance (3 min)

Switch to Pranjal and run payroll as usual. Switch to Rajib: **Pay cost** shows cost by unit, each exception to clear with a reason, and whether maker and checker were different people.

## 7. Hiring (2 min)

Switch to Kaushik. On **Interviews**, open Abhinav's sheet, score him, tick the documents and generate the offer letter. The merit order updates.

## 8. Cases and audit (1 min)

As Pallabi (pallabi.gogoi), raise a helpdesk case under **Cases**. As Bhaskar, pick it up and resolve it. As Arup, export the audit trail: PII is masked and the file ends with a SHA-256 hash.

## What to say is not built

Read the "Not in this build" list in the README: no backend, no AD SSO, no live SAP, Saral Pravesh, SBI, EPFO or TRACES.
