import { addDays, format, startOfMonth } from "date-fns";
import { expandCerts, expandGateEvents, expandPasses, mergeCrew } from "./crew";
import type {
  Advance,
  Appraisal,
  AttendanceDay,
  AuditEvent,
  BreachIncident,
  Candidate,
  Certificate,
  ChangeRequest,
  Claim,
  Consent,
  ContractWorker,
  Contractor,
  Course,
  Employee,
  GateEvent,
  GatePass,
  Goal,
  Holiday,
  InductionResult,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  MaintenanceRequest,
  NotificationItem,
  Opening,
  PayrollRun,
  PolicySetting,
  PolicyVersion,
  Punch,
  Quarter,
  Regularisation,
  ReservationPoint,
  RosterEntry,
  SapHrRow,
  Separation,
  ShiftPattern,
  SwapRequest,
  TaxDeclaration,
  TrainingSession,
  WaitingListEntry,
  WageProof,
  RetentionHold,
} from "./types";

const TODAY = "2026-10-27";

function emp(partial: Employee): Employee {
  return partial;
}

export const EMPLOYEES: Employee[] = [
  emp({
    id: "e-bhaskar",
    empNo: "NRL/E/1998/014",
    name: "Bhaskar Baruah",
    preferredName: "Bhaskar",
    gender: "M",
    dob: "1968-03-12",
    doj: "1998-07-01",
    confirmationDate: "1999-07-01",
    email: "bhaskar.baruah@nrl.co.in",
    phone: "+91 94350 11204",
    category: "UR",
    pwbd: false,
    cadre: "executive",
    grade: "E7",
    basic: 148200,
    cafeteriaPct: 32,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "hr",
    positionId: "p-gm-hr",
    status: "active",
    bankAccount: "3045127781",
    ifsc: "SBIN0003180",
    pan: "AOPPB4412K",
    aadhaar: "712398441205",
    uan: "100334221098",
    npsPran: "110112345678",
    quarterId: "q-v-12",
    assignmentHistory: [
      {
        positionId: "p-gm-hr",
        unitId: "hr",
        locationId: "numaligarh",
        grade: "E7",
        cadre: "executive",
        validFrom: "2022-04-01",
      },
    ],
    family: [
      { id: "f1", name: "Nandini Baruah", relation: "Spouse", dob: "1971-08-09", dependent: true },
      { id: "f2", name: "Aditya Baruah", relation: "Son", dob: "2003-01-22", dependent: false },
    ],
    nominations: [{ id: "n1", type: "PF", nominee: "Nandini Baruah", share: 100 }],
    roles: ["hr_admin", "employee"],
  }),
  emp({
    id: "e-ananya",
    empNo: "NRL/E/2009/086",
    name: "Ananya Saikia",
    preferredName: "Ananya",
    gender: "F",
    dob: "1984-11-02",
    doj: "2009-08-18",
    confirmationDate: "2010-08-18",
    email: "ananya.saikia@nrl.co.in",
    phone: "+91 99542 66710",
    category: "OBC",
    pwbd: false,
    cadre: "executive",
    grade: "E5",
    basic: 112400,
    cafeteriaPct: 35,
    hardshipAllowance: 4500,
    locationId: "numaligarh",
    unitId: "ops",
    positionId: "p-dgm-ops",
    status: "active",
    bankAccount: "2011983345",
    ifsc: "SBIN0003180",
    pan: "BQNPS8821D",
    aadhaar: "889120334561",
    uan: "100887612334",
    npsPran: "110198761234",
    assignmentHistory: [
      {
        positionId: "p-dgm-ops",
        unitId: "ops",
        locationId: "numaligarh",
        grade: "E5",
        cadre: "executive",
        validFrom: "2024-01-01",
      },
    ],
    family: [{ id: "f3", name: "Rituraj Saikia", relation: "Spouse", dob: "1982-05-14", dependent: false }],
    nominations: [{ id: "n2", type: "gratuity", nominee: "Rituraj Saikia", share: 100 }],
    roles: ["line_manager", "employee"],
  }),
  emp({
    id: "e-pranjal",
    empNo: "NRL/E/2014/142",
    name: "Pranjal Sharma",
    preferredName: "Pranjal",
    gender: "M",
    dob: "1988-06-19",
    doj: "2014-06-02",
    confirmationDate: "2015-06-02",
    email: "pranjal.sharma@nrl.co.in",
    phone: "+91 88765 44120",
    category: "UR",
    pwbd: false,
    cadre: "executive",
    grade: "E4",
    basic: 96400,
    cafeteriaPct: 28,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "fin",
    positionId: "p-mgr-fin",
    managerId: "e-bhaskar",
    status: "active",
    bankAccount: "1187633098",
    ifsc: "SBIN0003180",
    pan: "AZXPS1109M",
    aadhaar: "334120998761",
    uan: "100221098776",
    npsPran: "110176543210",
    quarterId: "q-iv-08",
    assignmentHistory: [
      {
        positionId: "p-mgr-fin",
        unitId: "fin",
        locationId: "numaligarh",
        grade: "E4",
        cadre: "executive",
        validFrom: "2023-07-01",
      },
    ],
    family: [{ id: "f4", name: "Sneha Sharma", relation: "Spouse", dob: "1990-02-11", dependent: true }],
    nominations: [{ id: "n3", type: "PF", nominee: "Sneha Sharma", share: 100 }],
    roles: ["payroll_officer", "employee"],
  }),
  emp({
    id: "e-ritu",
    empNo: "NRL/E/2017/201",
    name: "Ritu Moni Das",
    preferredName: "Ritu",
    gender: "F",
    dob: "1992-09-08",
    doj: "2017-09-01",
    confirmationDate: "2018-09-01",
    email: "ritu.das@nrl.co.in",
    phone: "+91 97064 22891",
    category: "SC",
    pwbd: false,
    cadre: "executive",
    grade: "E3",
    basic: 81200,
    cafeteriaPct: 30,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "hse",
    positionId: "p-dy-hse",
    managerId: "e-ananya",
    status: "active",
    bankAccount: "5561203344",
    ifsc: "SBIN0003180",
    pan: "CQNPD7712L",
    aadhaar: "661209334812",
    uan: "100998112334",
    npsPran: "110155667788",
    assignmentHistory: [
      {
        positionId: "p-dy-hse",
        unitId: "hse",
        locationId: "numaligarh",
        grade: "E3",
        cadre: "executive",
        validFrom: "2022-11-01",
      },
    ],
    family: [],
    nominations: [{ id: "n4", type: "PF", nominee: "Bina Das", share: 100 }],
    roles: ["safety_officer", "employee"],
  }),
  emp({
    id: "e-hiren",
    empNo: "NRL/E/2012/118",
    name: "Hiren Kalita",
    preferredName: "Hiren",
    gender: "M",
    dob: "1986-01-27",
    doj: "2012-04-16",
    confirmationDate: "2013-04-16",
    email: "hiren.kalita@nrl.co.in",
    phone: "+91 94351 77820",
    category: "UR",
    pwbd: false,
    cadre: "executive",
    grade: "E4",
    basic: 93800,
    cafeteriaPct: 26,
    hardshipAllowance: 3200,
    locationId: "numaligarh",
    unitId: "cdu",
    positionId: "p-sic-cdu",
    managerId: "e-ananya",
    crew: "A",
    status: "active",
    bankAccount: "4412987765",
    ifsc: "SBIN0003180",
    pan: "BHGPK2291C",
    aadhaar: "229811445566",
    uan: "100776655443",
    npsPran: "110122334455",
    assignmentHistory: [
      {
        positionId: "p-sic-cdu",
        unitId: "cdu",
        locationId: "numaligarh",
        grade: "E4",
        cadre: "executive",
        crew: "A",
        validFrom: "2021-06-01",
      },
    ],
    family: [{ id: "f5", name: "Pallavi Kalita", relation: "Spouse", dob: "1989-12-03", dependent: true }],
    nominations: [{ id: "n5", type: "PF", nominee: "Pallavi Kalita", share: 100 }],
    roles: ["line_manager", "employee"],
  }),
  emp({
    id: "e-pallabi",
    empNo: "NRL/E/2021/334",
    name: "Pallabi Gogoi",
    preferredName: "Pallabi",
    gender: "F",
    dob: "1996-04-21",
    doj: "2021-08-02",
    confirmationDate: "2022-08-02",
    email: "pallabi.gogoi@nrl.co.in",
    phone: "+91 86382 44109",
    category: "OBC",
    pwbd: false,
    cadre: "executive",
    grade: "E2",
    basic: 62400,
    cafeteriaPct: 24,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "util",
    positionId: "p-eng-el",
    managerId: "e-ananya",
    status: "active",
    bankAccount: "7781203349",
    ifsc: "SBIN0003180",
    pan: "DWNPG4410P",
    aadhaar: "998122334455",
    uan: "100334455667",
    npsPran: "110188776655",
    assignmentHistory: [
      {
        positionId: "p-eng-el",
        unitId: "util",
        locationId: "numaligarh",
        grade: "E2",
        cadre: "executive",
        validFrom: "2021-08-02",
      },
    ],
    family: [],
    nominations: [{ id: "n6", type: "PF", nominee: "Hemen Gogoi", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-rajib",
    empNo: "NRL/E/2016/188",
    name: "Rajib Dutta",
    preferredName: "Rajib",
    gender: "M",
    dob: "1989-12-30",
    doj: "2016-03-14",
    confirmationDate: "2017-03-14",
    email: "rajib.dutta@nrl.co.in",
    phone: "+91 98320 11458",
    category: "UR",
    pwbd: false,
    cadre: "executive",
    grade: "E3",
    basic: 78800,
    cafeteriaPct: 22,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "fin",
    positionId: "p-mgr-fin-app",
    managerId: "e-bhaskar",
    status: "active",
    bankAccount: "3321987760",
    ifsc: "SBIN0000125",
    pan: "AHQPD8812R",
    aadhaar: "112233445566",
    uan: "100112233445",
    npsPran: "110199887766",
    assignmentHistory: [
      {
        positionId: "p-mgr-fin-app",
        unitId: "fin",
        locationId: "numaligarh",
        grade: "E3",
        cadre: "executive",
        validFrom: "2024-04-01",
      },
      {
        positionId: "p-mgr-mkt",
        unitId: "mkt-slg",
        locationId: "siliguri",
        grade: "E3",
        cadre: "executive",
        validFrom: "2020-09-01",
        validTo: "2024-03-31",
      },
    ],
    family: [{ id: "f6", name: "Moumita Dutta", relation: "Spouse", dob: "1991-07-19", dependent: true }],
    nominations: [{ id: "n7", type: "PF", nominee: "Moumita Dutta", share: 100 }],
    roles: ["employee", "finance_approver"],
  }),
  emp({
    id: "e-nivedita",
    empNo: "NRL/E/2023/401",
    name: "Nivedita Sharma",
    preferredName: "Nivedita",
    gender: "F",
    dob: "1998-02-14",
    doj: "2023-07-10",
    confirmationDate: "2024-07-10",
    email: "nivedita.sharma@nrl.co.in",
    phone: "+91 99370 22814",
    category: "UR",
    pwbd: false,
    cadre: "executive",
    grade: "E2",
    basic: 58600,
    cafeteriaPct: 20,
    hardshipAllowance: 0,
    locationId: "paradip",
    unitId: "crd-prt",
    positionId: "p-eng-prt",
    managerId: "e-ananya",
    status: "active",
    bankAccount: "9981223340",
    ifsc: "SBIN0002100",
    pan: "FQNPS2291T",
    aadhaar: "556677889900",
    uan: "100556677889",
    npsPran: "110144332211",
    assignmentHistory: [
      {
        positionId: "p-eng-prt",
        unitId: "crd-prt",
        locationId: "paradip",
        grade: "E2",
        cadre: "executive",
        validFrom: "2023-07-10",
      },
    ],
    family: [],
    nominations: [{ id: "n8", type: "PF", nominee: "Alok Sharma", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-arup",
    empNo: "NRL/E/1996/008",
    name: "Arup Kumar Bora",
    preferredName: "Arup",
    gender: "M",
    dob: "1966-08-04",
    doj: "1996-11-12",
    confirmationDate: "1997-11-12",
    email: "arup.bora@nrl.co.in",
    phone: "+91 94350 00918",
    category: "UR",
    pwbd: false,
    cadre: "executive",
    grade: "E6",
    basic: 136800,
    cafeteriaPct: 34,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "tech",
    positionId: "p-cgm-tech",
    status: "active",
    bankAccount: "1002987761",
    ifsc: "SBIN0003180",
    pan: "ACXPB7712H",
    aadhaar: "102938475661",
    uan: "100102938475",
    npsPran: "110100200300",
    quarterId: "q-v-02",
    assignmentHistory: [
      {
        positionId: "p-cgm-tech",
        unitId: "tech",
        locationId: "numaligarh",
        grade: "E6",
        cadre: "executive",
        validFrom: "2019-04-01",
      },
    ],
    family: [{ id: "f7", name: "Indrani Bora", relation: "Spouse", dob: "1970-01-09", dependent: true }],
    nominations: [{ id: "n9", type: "pension", nominee: "Indrani Bora", share: 100 }],
    roles: ["employee", "auditor"],
  }),
  emp({
    id: "e-meenakshi",
    empNo: "NRL/E/2015/166",
    name: "Meenakshi Devi",
    preferredName: "Meenakshi",
    gender: "F",
    dob: "1987-05-23",
    doj: "2015-01-19",
    confirmationDate: "2016-01-19",
    email: "meenakshi.devi@nrl.co.in",
    phone: "+91 98640 33120",
    category: "ST",
    pwbd: false,
    cadre: "executive",
    grade: "E3",
    basic: 76400,
    cafeteriaPct: 25,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "hr",
    positionId: "p-dy-clm",
    managerId: "e-bhaskar",
    status: "active",
    bankAccount: "6671209981",
    ifsc: "SBIN0003180",
    pan: "BHYPD3312Q",
    aadhaar: "334455667788",
    uan: "100334455668",
    npsPran: "110166554433",
    quarterId: "q-iv-21",
    assignmentHistory: [
      {
        positionId: "p-dy-clm",
        unitId: "hr",
        locationId: "numaligarh",
        grade: "E3",
        cadre: "executive",
        validFrom: "2023-06-01",
      },
      {
        positionId: "p-mgr-twn",
        unitId: "twn",
        locationId: "numaligarh",
        grade: "E3",
        cadre: "executive",
        validFrom: "2022-02-01",
        validTo: "2023-05-31",
      },
    ],
    family: [{ id: "f8", name: "Kabir Pegu", relation: "Spouse", dob: "1985-09-30", dependent: false }],
    nominations: [{ id: "n10", type: "PF", nominee: "Kabir Pegu", share: 100 }],
    roles: ["employee", "contract_labour_cell"],
  }),
  emp({
    id: "e-bikash",
    empNo: "NRL/W/2008/077",
    name: "Bikash Teron",
    preferredName: "Bikash",
    gender: "M",
    dob: "1983-07-11",
    doj: "2008-02-04",
    confirmationDate: "2009-02-04",
    email: "bikash.teron@nrl.co.in",
    phone: "+91 94352 88120",
    category: "ST",
    pwbd: false,
    cadre: "workman",
    grade: "W5",
    basic: 42800,
    cafeteriaPct: 18,
    hardshipAllowance: 1800,
    locationId: "numaligarh",
    unitId: "cdu",
    positionId: "p-op-cdu",
    managerId: "e-hiren",
    crew: "A",
    status: "active",
    bankAccount: "2298114450",
    ifsc: "SBIN0003180",
    pan: "AJWPT4412E",
    aadhaar: "778899001122",
    uan: "100778899001",
    assignmentHistory: [
      {
        positionId: "p-op-cdu",
        unitId: "cdu",
        locationId: "numaligarh",
        grade: "W5",
        cadre: "workman",
        crew: "A",
        validFrom: "2018-04-01",
      },
      {
        positionId: "p-op-cdu",
        unitId: "fcc",
        locationId: "numaligarh",
        grade: "W4",
        cadre: "workman",
        crew: "B",
        validFrom: "2008-02-04",
        validTo: "2018-03-31",
      },
    ],
    family: [{ id: "f9", name: "Rina Teron", relation: "Spouse", dob: "1986-03-18", dependent: true }],
    nominations: [{ id: "n11", type: "PF", nominee: "Rina Teron", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-juri",
    empNo: "NRL/W/2011/104",
    name: "Juri Pegu",
    preferredName: "Juri",
    gender: "F",
    dob: "1988-10-05",
    doj: "2011-09-12",
    confirmationDate: "2012-09-12",
    email: "juri.pegu@nrl.co.in",
    phone: "+91 99543 22910",
    category: "ST",
    pwbd: false,
    cadre: "workman",
    grade: "W4",
    basic: 38600,
    cafeteriaPct: 16,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "fcc",
    positionId: "p-tech-mech",
    managerId: "e-hiren",
    crew: "B",
    status: "active",
    bankAccount: "4412098871",
    ifsc: "SBIN0003180",
    pan: "BQNPP2281F",
    aadhaar: "889900112233",
    uan: "100889900112",
    assignmentHistory: [
      {
        positionId: "p-tech-mech",
        unitId: "fcc",
        locationId: "numaligarh",
        grade: "W4",
        cadre: "workman",
        crew: "B",
        validFrom: "2019-01-01",
      },
    ],
    family: [],
    nominations: [{ id: "n12", type: "gratuity", nominee: "Tulan Pegu", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-soneswar",
    empNo: "NRL/W/2004/041",
    name: "Soneswar Nath",
    preferredName: "Soneswar",
    gender: "M",
    dob: "1978-02-28",
    doj: "2004-06-07",
    confirmationDate: "2005-06-07",
    email: "soneswar.nath@nrl.co.in",
    phone: "+91 94350 66712",
    category: "OBC",
    pwbd: false,
    cadre: "workman",
    grade: "W6",
    basic: 49200,
    cafeteriaPct: 20,
    hardshipAllowance: 2100,
    locationId: "numaligarh",
    unitId: "fcc",
    positionId: "p-op-fcc",
    managerId: "e-hiren",
    crew: "C",
    status: "active",
    bankAccount: "1003344556",
    ifsc: "SBIN0003180",
    pan: "AFHPN3312B",
    aadhaar: "223344556677",
    uan: "100223344556",
    assignmentHistory: [
      {
        positionId: "p-op-fcc",
        unitId: "fcc",
        locationId: "numaligarh",
        grade: "W6",
        cadre: "workman",
        crew: "C",
        validFrom: "2016-08-01",
      },
    ],
    family: [{ id: "f10", name: "Runumi Nath", relation: "Spouse", dob: "1981-11-02", dependent: true }],
    nominations: [{ id: "n13", type: "PF", nominee: "Runumi Nath", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-dipika",
    empNo: "NRL/W/2018/255",
    name: "Dipika Rongpi",
    preferredName: "Dipika",
    gender: "F",
    dob: "1994-08-16",
    doj: "2018-05-21",
    confirmationDate: "2019-05-21",
    email: "dipika.rongpi@nrl.co.in",
    phone: "+91 91017 44128",
    category: "ST",
    pwbd: true,
    cadre: "workman",
    grade: "W3",
    basic: 34100,
    cafeteriaPct: 14,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "tech",
    positionId: "p-lab",
    managerId: "e-ananya",
    crew: "A",
    status: "active",
    bankAccount: "5566778890",
    ifsc: "SBIN0003180",
    pan: "CQNPR4410S",
    aadhaar: "667788990011",
    uan: "100667788990",
    assignmentHistory: [
      {
        positionId: "p-lab",
        unitId: "tech",
        locationId: "numaligarh",
        grade: "W3",
        cadre: "workman",
        crew: "A",
        validFrom: "2018-05-21",
      },
    ],
    family: [],
    nominations: [{ id: "n14", type: "PF", nominee: "Sarsing Rongpi", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-manoj",
    empNo: "NRL/W/2013/129",
    name: "Manoj Basumatary",
    preferredName: "Manoj",
    gender: "M",
    dob: "1985-12-09",
    doj: "2013-11-04",
    confirmationDate: "2014-11-04",
    email: "manoj.basumatary@nrl.co.in",
    phone: "+91 99542 11087",
    category: "ST",
    pwbd: false,
    cadre: "workman",
    grade: "W4",
    basic: 37200,
    cafeteriaPct: 15,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "hse",
    positionId: "p-gate",
    managerId: "e-ritu",
    status: "active",
    bankAccount: "7788990012",
    ifsc: "SBIN0003180",
    pan: "AJHPB2291U",
    aadhaar: "445566778899",
    uan: "100445566778",
    assignmentHistory: [
      {
        positionId: "p-gate",
        unitId: "hse",
        locationId: "numaligarh",
        grade: "W4",
        cadre: "workman",
        validFrom: "2024-01-01",
      },
      {
        positionId: "p-fitter",
        unitId: "util",
        locationId: "numaligarh",
        grade: "W4",
        cadre: "workman",
        crew: "B",
        validFrom: "2017-03-01",
        validTo: "2023-12-31",
      },
    ],
    family: [{ id: "f11", name: "Anjali Basumatary", relation: "Spouse", dob: "1988-04-22", dependent: true }],
    nominations: [{ id: "n15", type: "PF", nominee: "Anjali Basumatary", share: 100 }],
    roles: ["employee", "gate_security"],
  }),
  emp({
    id: "e-anil",
    empNo: "NRL/W/2007/063",
    name: "Anil Karmakar",
    preferredName: "Anil",
    gender: "M",
    dob: "1980-03-03",
    doj: "2007-08-20",
    confirmationDate: "2008-08-20",
    email: "anil.karmakar@nrl.co.in",
    phone: "+91 94351 22980",
    category: "SC",
    pwbd: false,
    cadre: "workman",
    grade: "W5",
    basic: 41400,
    cafeteriaPct: 17,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "hse",
    positionId: "p-fire",
    managerId: "e-ritu",
    crew: "C",
    status: "active",
    bankAccount: "3344556677",
    ifsc: "SBIN0003180",
    pan: "BHGPK7712V",
    aadhaar: "990011223344",
    uan: "100990011223",
    assignmentHistory: [
      {
        positionId: "p-fire",
        unitId: "hse",
        locationId: "numaligarh",
        grade: "W5",
        cadre: "workman",
        crew: "C",
        validFrom: "2015-09-01",
      },
    ],
    family: [],
    nominations: [{ id: "n16", type: "PF", nominee: "Malati Karmakar", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-pinky",
    empNo: "NRL/W/2022/318",
    name: "Pinky Deka",
    preferredName: "Pinky",
    gender: "F",
    dob: "1999-06-27",
    doj: "2022-01-17",
    confirmationDate: "2023-01-17",
    email: "pinky.deka@nrl.co.in",
    phone: "+91 60012 44891",
    category: "OBC",
    pwbd: false,
    cadre: "workman",
    grade: "W2",
    basic: 28600,
    cafeteriaPct: 12,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "cdu",
    positionId: "p-helper",
    managerId: "e-hiren",
    crew: "A",
    status: "active",
    bankAccount: "1122334455",
    ifsc: "SBIN0003180",
    pan: "DWNPD8812W",
    aadhaar: "112244556677",
    uan: "100112244556",
    assignmentHistory: [
      {
        positionId: "p-helper",
        unitId: "cdu",
        locationId: "numaligarh",
        grade: "W2",
        cadre: "workman",
        crew: "A",
        validFrom: "2022-01-17",
      },
    ],
    family: [],
    nominations: [{ id: "n17", type: "PF", nominee: "Bhaben Deka", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-ranjit",
    empNo: "NRL/W/2010/092",
    name: "Ranjit Chetia",
    preferredName: "Ranjit",
    gender: "M",
    dob: "1984-09-01",
    doj: "2010-12-06",
    confirmationDate: "2011-12-06",
    email: "ranjit.chetia@nrl.co.in",
    phone: "+91 94350 44176",
    category: "OBC",
    pwbd: false,
    cadre: "workman",
    grade: "W4",
    basic: 36800,
    cafeteriaPct: 15,
    hardshipAllowance: 900,
    locationId: "numaligarh",
    unitId: "cdu",
    positionId: "p-inst",
    managerId: "e-hiren",
    crew: "D",
    status: "active",
    bankAccount: "6677889900",
    ifsc: "SBIN0003180",
    pan: "AHQPC2291X",
    aadhaar: "334466778899",
    uan: "100334466778",
    assignmentHistory: [
      {
        positionId: "p-inst",
        unitId: "cdu",
        locationId: "numaligarh",
        grade: "W4",
        cadre: "workman",
        crew: "D",
        validFrom: "2014-05-01",
      },
    ],
    family: [{ id: "f12", name: "Barnali Chetia", relation: "Spouse", dob: "1987-01-15", dependent: true }],
    nominations: [{ id: "n18", type: "PF", nominee: "Barnali Chetia", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-kaushik",
    empNo: "NRL/T/2025/012",
    name: "Kaushik Hazarika",
    preferredName: "Kaushik",
    gender: "M",
    dob: "2001-11-19",
    doj: "2025-08-01",
    email: "kaushik.hazarika@nrl.co.in",
    phone: "+91 70027 11984",
    category: "UR",
    pwbd: false,
    cadre: "trainee",
    grade: "ET",
    basic: 50000,
    cafeteriaPct: 10,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "hr",
    positionId: "p-et-rec",
    managerId: "e-bhaskar",
    status: "probation",
    bankAccount: "8899001122",
    ifsc: "SBIN0003180",
    pan: "FQNPH4410Y",
    aadhaar: "556688990011",
    uan: "100556688990",
    npsPran: "110177889900",
    assignmentHistory: [
      {
        positionId: "p-et-rec",
        unitId: "hr",
        locationId: "numaligarh",
        grade: "ET",
        cadre: "trainee",
        validFrom: "2025-08-01",
      },
    ],
    family: [],
    nominations: [{ id: "n19", type: "PF", nominee: "Pranab Hazarika", share: 100 }],
    roles: ["employee", "recruiter"],
  }),
  emp({
    id: "e-shreya",
    empNo: "NRL/T/2025/018",
    name: "Shreya Barman",
    preferredName: "Shreya",
    gender: "F",
    dob: "2002-03-08",
    doj: "2025-08-01",
    email: "shreya.barman@nrl.co.in",
    phone: "+91 86388 22910",
    category: "SC",
    pwbd: false,
    cadre: "trainee",
    grade: "ET",
    basic: 50000,
    cafeteriaPct: 10,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "ops",
    positionId: "p-et-chem",
    managerId: "e-ananya",
    status: "probation",
    bankAccount: "2233445566",
    ifsc: "SBIN0003180",
    pan: "CQNPB2291Z",
    aadhaar: "778800112233",
    uan: "100778800112",
    npsPran: "110188990011",
    assignmentHistory: [
      {
        positionId: "p-et-chem",
        unitId: "ops",
        locationId: "numaligarh",
        grade: "ET",
        cadre: "trainee",
        validFrom: "2025-08-01",
      },
    ],
    family: [],
    nominations: [{ id: "n20", type: "PF", nominee: "Anita Barman", share: 100 }],
    roles: ["employee"],
  }),
  emp({
    id: "e-vikram",
    empNo: "NRL/C/LT/001",
    name: "Vikram Rao",
    preferredName: "Vikram",
    gender: "M",
    dob: "1982-04-09",
    doj: "2025-04-01",
    email: "vikram.rao@lntecc.com",
    phone: "+91 98840 22110",
    category: "UR",
    pwbd: false,
    cadre: "contract",
    grade: "CS",
    basic: 0,
    cafeteriaPct: 0,
    hardshipAllowance: 0,
    locationId: "numaligarh",
    unitId: "cdu",
    positionId: "p-sup-lt",
    status: "active",
    bankAccount: "4455120099",
    ifsc: "SBIN0003180",
    pan: "AOPPR2291L",
    aadhaar: "667700112233",
    contractorId: "c-lt",
    assignmentHistory: [
      {
        positionId: "p-sup-lt",
        unitId: "cdu",
        locationId: "numaligarh",
        grade: "CS",
        cadre: "contract",
        validFrom: "2025-04-01",
      },
    ],
    family: [],
    nominations: [],
    roles: ["contractor_supervisor"],
  }),
];

export const DEMOS: { employeeId: string; role: Employee["roles"][number]; blurb: string }[] = [
  { employeeId: "e-pallabi", role: "employee", blurb: "Payslips, leave, swaps, tax declarations." },
  { employeeId: "e-hiren", role: "line_manager", blurb: "CDU crew roster, overtime, shift swaps." },
  { employeeId: "e-bhaskar", role: "hr_admin", blurb: "Records, policy, onboarding. Maker, not checker." },
  { employeeId: "e-pranjal", role: "payroll_officer", blurb: "Monthly run, arrears, statutory files." },
  { employeeId: "e-rajib", role: "finance_approver", blurb: "Releases the bank file. Cannot edit own pay." },
  { employeeId: "e-meenakshi", role: "contract_labour_cell", blurb: "Licences, worker register, wage proofs." },
  { employeeId: "e-ritu", role: "safety_officer", blurb: "OISD certificates and induction." },
  { employeeId: "e-manoj", role: "gate_security", blurb: "Pass check only. Nothing else." },
  { employeeId: "e-kaushik", role: "recruiter", blurb: "GATE pipeline and reservation roster." },
  { employeeId: "e-arup", role: "auditor", blurb: "Read-only records and the audit trail." },
  { employeeId: "e-vikram", role: "contractor_supervisor", blurb: "Own crew only. Wage proofs and passes." },
];

export const SETTINGS: PolicySetting[] = [
  { id: "s1", key: "da.ida", label: "IDA dearness allowance", cadre: "executive", value: 48.7, unit: "%", validFrom: "2026-10-01", approvedBy: "e-bhaskar", source: "DPE order, Q3 2026" },
  { id: "s2", key: "da.ida", label: "Workmen DA (settlement)", cadre: "workman", value: 41.2, unit: "%", validFrom: "2025-01-01", approvedBy: "e-bhaskar", source: "NRL wage settlement 2024" },
  { id: "s3", key: "da.ida", label: "Trainee DA", cadre: "trainee", value: 48.7, unit: "%", validFrom: "2026-10-01", approvedBy: "e-bhaskar", source: "DPE order, Q3 2026" },
  { id: "s4", key: "perks.cap", label: "Cafeteria perks cap", cadre: "executive", value: 35, unit: "% of basic", validFrom: "2017-01-01", approvedBy: "e-bhaskar", source: "DPE 2017" },
  { id: "s5", key: "perks.cap", label: "Workmen allowance basket", cadre: "workman", value: 25, unit: "% of basic", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Wage settlement" },
  { id: "s6", key: "perks.cap", label: "Trainee perks cap", cadre: "trainee", value: 20, unit: "% of basic", validFrom: "2025-08-01", approvedBy: "e-bhaskar", source: "Board" },
  { id: "s7", key: "super.cap", label: "Superannuation cap", cadre: "executive", value: 30, unit: "% of basic+DA", validFrom: "2017-01-01", approvedBy: "e-bhaskar", source: "DPE 2017" },
  { id: "s8", key: "hra.x", label: "HRA X cities", value: 30, unit: "%", validFrom: "2022-07-01", approvedBy: "e-bhaskar", source: "DPE allowance order" },
  { id: "s9", key: "hra.y", label: "HRA Y cities", value: 20, unit: "%", validFrom: "2022-07-01", approvedBy: "e-bhaskar", source: "DPE allowance order" },
  { id: "s10", key: "hra.z", label: "HRA Z cities", value: 10, unit: "%", validFrom: "2022-07-01", approvedBy: "e-bhaskar", source: "DPE allowance order" },
  { id: "s11", key: "pf.rate", label: "PF contribution", value: 12, unit: "%", validFrom: "2014-09-01", approvedBy: "e-bhaskar", source: "EPF Act / NRL PF trust" },
  { id: "s12", key: "nps.rate", label: "NPS employee & employer", value: 10, unit: "%", validFrom: "2019-04-01", approvedBy: "e-bhaskar", source: "NRL NPS policy" },
  { id: "s13", key: "shift.allowance", label: "Shift allowance per duty", cadre: "workman", value: 220, unit: "INR", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Wage settlement" },
  { id: "s14", key: "shift.allowance", label: "Shift allowance per duty", cadre: "executive", value: 180, unit: "INR", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Board" },
  { id: "s15", key: "ot.hourly", label: "Overtime hourly (workmen)", cadre: "workman", value: 280, unit: "INR", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Wage settlement" },
  { id: "s16", key: "ot.hourly", label: "Overtime hourly (exec)", cadre: "executive", value: 0, unit: "INR", validFrom: "2017-01-01", approvedBy: "e-bhaskar", source: "DPE, no OT for executives" },
  { id: "s17", key: "min.rest", label: "Minimum rest between shifts", value: 11, unit: "hours", validFrom: "2025-11-21", approvedBy: "e-bhaskar", source: "OSH Code (to confirm with NRL)" },
  { id: "s18", key: "licence.q-v-12", label: "Licence fee Type V/12", value: 4200, unit: "INR", validFrom: "2024-04-01", approvedBy: "e-bhaskar", source: "Township policy" },
  { id: "s19", key: "licence.q-v-02", label: "Licence fee Type V/02", value: 4200, unit: "INR", validFrom: "2024-04-01", approvedBy: "e-bhaskar", source: "Township policy" },
  { id: "s20", key: "licence.q-iv-08", label: "Licence fee Type IV/08", value: 2800, unit: "INR", validFrom: "2024-04-01", approvedBy: "e-bhaskar", source: "Township policy" },
  { id: "s21", key: "licence.q-iv-21", label: "Licence fee Type IV/21", value: 2800, unit: "INR", validFrom: "2024-04-01", approvedBy: "e-bhaskar", source: "Township policy" },
  { id: "s22", key: "da.ida.sap", label: "SAP HR IDA (Q2, not yet patched)", cadre: "executive", value: 46.2, unit: "%", validFrom: "2026-07-01", approvedBy: "e-bhaskar", source: "SAP HR still on previous quarter" },
  { id: "s23", key: "da.ida.sap", label: "SAP workmen DA", cadre: "workman", value: 41.2, unit: "%", validFrom: "2025-01-01", approvedBy: "e-bhaskar", source: "SAP HR" },
  { id: "s24", key: "wage.W2", label: "Workmen basic W2", cadre: "workman", value: 28600, unit: "INR", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Wage settlement 2024" },
  { id: "s25", key: "wage.W3", label: "Workmen basic W3", cadre: "workman", value: 34100, unit: "INR", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Wage settlement 2024" },
  { id: "s26", key: "wage.W4", label: "Workmen basic W4", cadre: "workman", value: 37200, unit: "INR", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Wage settlement 2024" },
  { id: "s27", key: "wage.W5", label: "Workmen basic W5", cadre: "workman", value: 42800, unit: "INR", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Wage settlement 2024" },
  { id: "s28", key: "wage.W6", label: "Workmen basic W6", cadre: "workman", value: 49200, unit: "INR", validFrom: "2024-01-01", approvedBy: "e-bhaskar", source: "Wage settlement 2024" },
  { id: "s29", key: "prp.mou", label: "MoU composite score", value: 91, unit: "%", validFrom: "2026-04-01", approvedBy: "e-bhaskar", source: "DPE MoU 2026-27" },
];

const POLICY_HISTORY: Record<string, PolicyVersion[]> = {
  s1: [
    { value: 46.2, validFrom: "2026-07-01", validTo: "2026-09-30", proposedBy: "e-pranjal", approvedBy: "e-rajib", source: "DPE IDA, Q2 2026" },
    { value: 43.8, validFrom: "2026-04-01", validTo: "2026-06-30", proposedBy: "e-pranjal", approvedBy: "e-rajib", source: "DPE IDA, Q1 2026" },
    { value: 42.0, validFrom: "2026-01-01", validTo: "2026-03-31", proposedBy: "e-pranjal", approvedBy: "e-bhaskar", source: "DPE IDA, Q4 2025" },
  ],
  s2: [
    { value: 38.4, validFrom: "2022-01-01", validTo: "2023-12-31", proposedBy: "e-pranjal", approvedBy: "e-bhaskar", source: "Previous wage settlement" },
  ],
  s3: [
    { value: 46.2, validFrom: "2026-07-01", validTo: "2026-09-30", proposedBy: "e-pranjal", approvedBy: "e-rajib", source: "DPE IDA, Q2 2026" },
  ],
  s4: [
    { value: 50, validFrom: "2007-01-01", validTo: "2016-12-31", approvedBy: "e-bhaskar", source: "DPE 2007 cafeteria" },
  ],
  s7: [
    { value: 26, validFrom: "2007-01-01", validTo: "2016-12-31", approvedBy: "e-bhaskar", source: "DPE 2007 superannuation" },
  ],
  s10: [
    { value: 10, validFrom: "2015-07-01", validTo: "2022-06-30", approvedBy: "e-bhaskar", source: "7th CPC / DPE, Z-class (Numaligarh)" },
  ],
  s11: [
    { value: 12, validFrom: "1995-11-16", validTo: "2014-08-31", approvedBy: "e-bhaskar", source: "EPF Act, NRL PF Trust" },
  ],
  s12: [
    { value: 10, validFrom: "2004-01-01", validTo: "2019-03-31", approvedBy: "e-bhaskar", source: "NRL NPS for new joiners" },
  ],
  s13: [
    { value: 180, validFrom: "2018-01-01", validTo: "2023-12-31", proposedBy: "e-hiren", approvedBy: "e-bhaskar", source: "Earlier settlement" },
  ],
  s15: [
    { value: 240, validFrom: "2018-01-01", validTo: "2023-12-31", proposedBy: "e-hiren", approvedBy: "e-bhaskar", source: "Earlier settlement" },
  ],
  s17: [
    { value: 8, validFrom: "2019-01-01", validTo: "2025-11-20", approvedBy: "e-bhaskar", source: "Standing order, pending OSH confirmation" },
  ],
  s22: [
    { value: 43.8, validFrom: "2026-04-01", validTo: "2026-06-30", approvedBy: "e-bhaskar", source: "SAP HR, Q1 2026 still on box" },
  ],
  s29: [
    { value: 88, validFrom: "2025-04-01", validTo: "2026-03-31", approvedBy: "e-bhaskar", source: "DPE MoU 2025-26" },
  ],
};

for (const row of SETTINGS) {
  row.versions = POLICY_HISTORY[row.id];
}

export const SHIFTS: ShiftPattern[] = [
  { id: "M", code: "M", label: "Morning", start: "06:00", end: "14:00" },
  { id: "A", code: "A", label: "Afternoon", start: "14:00", end: "22:00" },
  { id: "N", code: "N", label: "Night", start: "22:00", end: "06:00" },
  { id: "G", code: "G", label: "General", start: "09:00", end: "17:30" },
  { id: "OFF", code: "OFF", label: "Weekly off", start: "", end: "" },
];

export const HOLIDAYS: Holiday[] = [
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-10-20", name: "Durga Puja (Maha Saptami)", locationId: "numaligarh" },
  { date: "2026-10-21", name: "Durga Puja (Maha Ashtami)", locationId: "numaligarh" },
  { date: "2026-11-08", name: "Kali Puja / Diwali" },
  { date: "2027-01-14", name: "Magh Bihu", locationId: "numaligarh" },
  { date: "2027-01-26", name: "Republic Day" },
];

export const LEAVE_TYPES: LeaveType[] = [
  { id: "el", name: "Earned leave", code: "EL", accrual: 30, carryForward: 300, encashable: true, halfDay: true },
  { id: "cl", name: "Casual leave", code: "CL", accrual: 12, carryForward: 0, encashable: false, halfDay: true },
  { id: "hpl", name: "Half-pay leave", code: "HPL", accrual: 20, carryForward: 360, encashable: true, halfDay: true },
  { id: "rh", name: "Restricted holiday", code: "RH", accrual: 2, carryForward: 0, encashable: false, halfDay: false },
  { id: "ml", name: "Maternity leave", code: "ML", accrual: 180, carryForward: 0, encashable: false, halfDay: false },
  { id: "pl", name: "Paternity leave", code: "PL", accrual: 15, carryForward: 0, encashable: false, halfDay: false },
  { id: "sl", name: "Special leave (shutdown)", code: "SL", accrual: 0, carryForward: 0, encashable: false, halfDay: true },
];

export const LEAVE_BALANCES: LeaveBalance[] = EMPLOYEES.flatMap((e) => [
  { employeeId: e.id, typeId: "el", balance: e.cadre === "trainee" ? 8 : 18 + (e.name.length % 12) },
  { employeeId: e.id, typeId: "cl", balance: e.cadre === "trainee" ? 6 : 7 + (e.name.length % 4) },
  { employeeId: e.id, typeId: "hpl", balance: e.cadre === "trainee" ? 0 : 42 + (e.name.length % 20) },
  { employeeId: e.id, typeId: "rh", balance: 1 },
]);

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "lv-1", employeeId: "e-pallabi", typeId: "cl", from: "2026-10-29", to: "2026-10-29", days: 1, reason: "Family function at Jorhat", status: "pending", approverId: "e-ananya" },
  { id: "lv-2", employeeId: "e-juri", typeId: "el", from: "2026-11-03", to: "2026-11-07", days: 5, reason: "Sister's wedding, Diphu", status: "pending", approverId: "e-hiren" },
  { id: "lv-3", employeeId: "e-bikash", typeId: "cl", from: "2026-10-16", to: "2026-10-16", days: 1, reason: "Medical follow-up", status: "approved", approverId: "e-hiren", decidedAt: "2026-10-14T09:10:00+05:30" },
  { id: "lv-4", employeeId: "e-shreya", typeId: "cl", from: "2026-11-12", to: "2026-11-13", days: 2, reason: "GATE counselling documents", status: "pending", approverId: "e-ananya" },
  { id: "lv-5", employeeId: "e-rajib", typeId: "el", from: "2026-11-18", to: "2026-11-20", days: 3, reason: "Travel to Numaligarh for review", status: "approved", approverId: "e-bhaskar", decidedAt: "2026-10-22T16:40:00+05:30" },
];

export const SWAPS: SwapRequest[] = [
  { id: "sw-1", fromId: "e-bikash", toId: "e-pinky", date: "2026-11-02", status: "pending", approverId: "e-hiren" },
];

export const REGS: Regularisation[] = [
  { id: "rg-1", employeeId: "e-ranjit", date: "2026-10-24", reason: "Biometric reader offline at CDU west gate", inTime: "06:08", outTime: "14:12", status: "pending" },
];

function rosterForMonth(): RosterEntry[] {
  const crewShift: Record<string, string[]> = {
    A: ["M", "M", "A", "A", "N", "N", "OFF"],
    B: ["A", "A", "N", "N", "OFF", "M", "M"],
    C: ["N", "N", "OFF", "M", "M", "A", "A"],
    D: ["OFF", "M", "M", "A", "A", "N", "N"],
  };
  const start = startOfMonth(new Date("2026-10-01"));
  const rows: RosterEntry[] = [];
  let i = 0;
  for (const e of EMPLOYEES.filter((x) => x.crew)) {
    for (let d = 0; d < 31; d++) {
      const date = format(addDays(start, d), "yyyy-MM-dd");
      const cycle = crewShift[e.crew!][d % 7];
      rows.push({ id: `ro-${i++}`, employeeId: e.id, date, shiftId: cycle });
    }
  }
  for (const e of EMPLOYEES.filter((x) => !x.crew && x.cadre !== "contract")) {
    for (let d = 0; d < 31; d++) {
      const dt = addDays(start, d);
      const date = format(dt, "yyyy-MM-dd");
      const dow = dt.getDay();
      rows.push({ id: `ro-${i++}`, employeeId: e.id, date, shiftId: dow === 0 ? "OFF" : "G" });
    }
  }
  return rows;
}

export const ROSTER: RosterEntry[] = rosterForMonth();

function readerFor(e: Employee) {
  if (e.locationId === "siliguri") return "BIO-SLG-01";
  if (e.locationId === "paradip") return "BIO-PRT-01";
  if (e.locationId === "guwahati") return "BIO-GHY-01";
  if (e.unitId === "cdu") return "BIO-CDU-WEST";
  if (e.unitId === "fcc") return "BIO-FCC-01";
  if (e.unitId === "util") return "BIO-UTIL-01";
  if (e.unitId === "hse") return "BIO-HSE-01";
  if (e.unitId === "hr") return "BIO-HR-01";
  if (e.unitId === "twn") return "BIO-TWN-01";
  if (e.unitId === "fin") return "BIO-ADMIN-01";
  return "BIO-ADMIN-01";
}

function clock(hhmm: string, extra: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const t = (((h * 60 + m + extra) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function punches(): Punch[] {
  const rows: Punch[] = [];
  let i = 0;
  for (const e of EMPLOYEES.filter((x) => x.cadre !== "contract")) {
    for (let d = 1; d <= 27; d++) {
      const date = `2026-10-${String(d).padStart(2, "0")}`;
      const ro = ROSTER.find((r) => r.employeeId === e.id && r.date === date);
      if (!ro || ro.shiftId === "OFF") continue;
      if (HOLIDAYS.some((h) => h.date === date && (!h.locationId || h.locationId === e.locationId))) continue;
      if (date === "2026-10-24" && e.id === "e-ranjit") continue;
      if (LEAVE_REQUESTS.some((l) => l.employeeId === e.id && l.status === "approved" && l.from <= date && l.to >= date)) {
        continue;
      }
      const shift = SHIFTS.find((s) => s.id === ro.shiftId);
      if (!shift?.start || !shift.end) continue;
      const jitter = (e.name.length * 3 + d) % 11;
      const inJitter = e.cadre === "executive" ? jitter - 8 : jitter - 4;
      const outJitter = 4 + (e.empNo.length % 9);
      const reader = readerFor(e);
      const overnight = shift.end < shift.start;
      const outDate = overnight ? format(addDays(new Date(`${date}T12:00:00+05:30`), 1), "yyyy-MM-dd") : date;
      rows.push({
        id: `p-${i++}`,
        employeeId: e.id,
        readerId: reader,
        time: `${date}T${clock(shift.start, inJitter)}:${String(12 + (d % 40)).padStart(2, "0")}+05:30`,
        kind: "in",
      });
      if (!(overnight && date === TODAY)) {
        rows.push({
          id: `p-${i++}`,
          employeeId: e.id,
          readerId: reader,
          time: `${outDate}T${clock(shift.end, outJitter)}:${String(8 + (d % 50)).padStart(2, "0")}+05:30`,
          kind: "out",
        });
      }
    }
  }
  return rows;
}

export const PUNCHES: Punch[] = punches();

export const ATTENDANCE: AttendanceDay[] = ROSTER.filter((r) => r.date <= TODAY).map((r) => {
  const holiday = HOLIDAYS.some((h) => h.date === r.date);
  if (r.shiftId === "OFF") {
    return { employeeId: r.employeeId, date: r.date, status: "weekly_off", hours: 0, overtime: 0, shiftId: "OFF" };
  }
  if (holiday) {
    return { employeeId: r.employeeId, date: r.date, status: "holiday", hours: 0, overtime: 0, shiftId: r.shiftId };
  }
  if (r.employeeId === "e-ranjit" && r.date === "2026-10-24") {
    return { employeeId: r.employeeId, date: r.date, status: "missing_punch", hours: 0, overtime: 0, shiftId: r.shiftId };
  }
  if (r.employeeId === "e-bikash" && r.date === "2026-10-16") {
    return { employeeId: r.employeeId, date: r.date, status: "leave", hours: 0, overtime: 0, shiftId: r.shiftId };
  }
  const ot = r.shiftId === "N" && r.employeeId === "e-soneswar" && r.date.endsWith("12") ? 2.5 : 0;
  return { employeeId: r.employeeId, date: r.date, status: "present", hours: 8 + ot, overtime: ot, shiftId: r.shiftId };
});

export const CLAIMS: Claim[] = [
  { id: "cl-1", employeeId: "e-pallabi", type: "medical", amount: 4820, description: "OPD, KMCH Golaghat", status: "pending", bills: 2, submittedAt: "2026-10-21T11:20:00+05:30" },
  { id: "cl-2", employeeId: "e-hiren", type: "tour", amount: 12640, description: "Guwahati coordination, 18-19 Oct", status: "approved", bills: 4, submittedAt: "2026-10-20T18:02:00+05:30" },
  { id: "cl-3", employeeId: "e-rajib", type: "ltc", amount: 28400, description: "LTC block 2022-25, Siliguri to Puri", status: "pending", bills: 6, submittedAt: "2026-10-18T09:44:00+05:30" },
  { id: "cl-4", employeeId: "e-ananya", type: "ltc", amount: 42000, description: "LTC block 2022-25, Numaligarh to Kolkata", status: "pending", bills: 5, submittedAt: "2026-10-22T10:12:00+05:30" },
];

export const ADVANCES: Advance[] = [
  { id: "ad-1", employeeId: "e-manoj", type: "festival", principal: 25000, outstanding: 15000, monthlyRecovery: 2500 },
  { id: "ad-2", employeeId: "e-bikash", type: "vehicle", principal: 180000, outstanding: 72000, monthlyRecovery: 6000 },
];

export const CONTRACTORS: Contractor[] = [
  { id: "c-lt", name: "Larsen & Toubro Ltd", workOrder: "NRL/WO/9MMT/2025/118", workOrderEnd: "2027-03-31", licenceNo: "AS/CL/2024/4412", licenceExpiry: "2027-02-18", pfCode: "AS/GHY/0054123", esiCode: "40001234560000999", area: "CDU revamp", supervisorName: "Vikram Rao", supervisorId: "e-vikram" },
  { id: "c-br", name: "Bridge & Roof Co. (India) Ltd", workOrder: "NRL/WO/9MMT/2025/204", workOrderEnd: "2027-06-30", licenceNo: "AS/CL/2025/1180", licenceExpiry: "2026-11-12", pfCode: "AS/GHY/0021188", esiCode: "40009876120000111", area: "Crude tank farm", supervisorName: "Farhana Ahmed" },
  { id: "c-sis", name: "SIS (India) Ltd", workOrder: "NRL/WO/SEC/2024/019", workOrderEnd: "2027-03-31", licenceNo: "AS/CL/2024/0901", licenceExpiry: "2029-01-31", pfCode: "AS/GHY/0008812", esiCode: "40005544330000222", area: "Gates 1-4", supervisorName: "Tej Bahadur Chetri" },
];

const NAMED_WORKERS: ContractWorker[] = [
  { id: "w-1", contractorId: "c-lt", name: "Sanjay Yadav", skill: "Rigger", aadhaar: "445512339876", uan: "101445512339", esic: "2211456789", policeVerification: true, medicalFitnessExpiry: "2027-01-12", photoSeed: "SanjayYadav", blacklisted: false, inductionPassed: true },
  { id: "w-2", contractorId: "c-lt", name: "Nurul Islam", skill: "Welder-6G", aadhaar: "998877221100", uan: "101998877221", esic: "2211988772", policeVerification: true, medicalFitnessExpiry: "2026-12-02", photoSeed: "NurulIslam", blacklisted: false, inductionPassed: true },
  { id: "w-3", contractorId: "c-lt", name: "Lakshmi Kisku", skill: "Scaffolder", aadhaar: "667788990123", uan: "101667788990", esic: "2211677889", policeVerification: true, medicalFitnessExpiry: "2027-04-08", photoSeed: "LakshmiKisku", blacklisted: false, inductionPassed: true },
  { id: "w-4", contractorId: "c-br", name: "Prakash Oraon", skill: "Fitter", aadhaar: "112200334455", uan: "101112200334", esic: "2211112200", policeVerification: true, medicalFitnessExpiry: "2026-10-30", photoSeed: "PrakashOraon", blacklisted: false, inductionPassed: true },
  { id: "w-5", contractorId: "c-br", name: "Anita Minj", skill: "Helper", aadhaar: "334455221100", uan: "101334455221", esic: "2211334455", policeVerification: false, medicalFitnessExpiry: "2027-02-14", photoSeed: "AnitaMinj", blacklisted: false, inductionPassed: false },
  { id: "w-6", contractorId: "c-sis", name: "Dhan Bahadur Rai", skill: "Security guard", aadhaar: "778811223344", uan: "101778811223", esic: "2211778811", policeVerification: true, medicalFitnessExpiry: "2027-06-01", photoSeed: "DhanBahadur", blacklisted: false, inductionPassed: true },
  { id: "w-7", contractorId: "c-lt", name: "Ramesh Paswan", skill: "Grinder", aadhaar: "556677889944", uan: "101556677889", esic: "2211556677", policeVerification: true, medicalFitnessExpiry: "2025-09-12", photoSeed: "RameshPaswan", blacklisted: false, inductionPassed: true },
];

export const WORKERS: ContractWorker[] = mergeCrew(NAMED_WORKERS);

export const COURSES: Course[] = [
  { id: "ind", name: "Plant safety induction", validityMonths: 12, mandatoryFor: ["contract", "employee"] },
  { id: "fire", name: "Fire fighting (OISD-STD-154)", validityMonths: 12, mandatoryFor: ["contract", "employee"] },
  { id: "h2s", name: "H2S / toxic gas", validityMonths: 12, mandatoryFor: ["ops", "cdu", "fcc"] },
  { id: "height", name: "Work at height", validityMonths: 12, mandatoryFor: ["contract"] },
  { id: "confine", name: "Confined space", validityMonths: 12, mandatoryFor: ["contract"] },
  { id: "first", name: "First aid", validityMonths: 24, mandatoryFor: ["hse", "fire"] },
];

const NAMED_CERTS: Certificate[] = [
  { id: "ct-1", personId: "w-1", personKind: "contract", courseId: "ind", issued: "2026-02-11", expires: "2027-02-11" },
  { id: "ct-2", personId: "w-1", personKind: "contract", courseId: "height", issued: "2026-02-12", expires: "2027-02-12" },
  { id: "ct-3", personId: "w-2", personKind: "contract", courseId: "ind", issued: "2026-01-08", expires: "2027-01-08" },
  { id: "ct-4", personId: "w-2", personKind: "contract", courseId: "confine", issued: "2026-01-09", expires: "2027-01-09" },
  { id: "ct-5", personId: "w-3", personKind: "contract", courseId: "ind", issued: "2026-03-02", expires: "2027-03-02" },
  { id: "ct-6", personId: "w-3", personKind: "contract", courseId: "height", issued: "2026-03-03", expires: "2027-03-03" },
  { id: "ct-7", personId: "w-4", personKind: "contract", courseId: "ind", issued: "2025-11-01", expires: "2026-11-01" },
  { id: "ct-8", personId: "w-6", personKind: "contract", courseId: "ind", issued: "2026-04-18", expires: "2027-04-18" },
  { id: "ct-9", personId: "w-7", personKind: "contract", courseId: "ind", issued: "2024-09-12", expires: "2025-09-12" },
  { id: "ct-10", personId: "e-hiren", personKind: "employee", courseId: "h2s", issued: "2026-01-20", expires: "2027-01-20" },
  { id: "ct-11", personId: "e-anil", personKind: "employee", courseId: "fire", issued: "2026-05-02", expires: "2027-05-02" },
  { id: "ct-12", personId: "e-bikash", personKind: "employee", courseId: "h2s", issued: "2025-12-01", expires: "2026-12-01" },
];

export const CERTS: Certificate[] = expandCerts(WORKERS, NAMED_CERTS);
export const PASSES: GatePass[] = expandPasses(WORKERS, CONTRACTORS, CERTS);
export const GATE_EVENTS: GateEvent[] = expandGateEvents(PASSES, [
  { id: "ge-1", passId: "gp-1", gate: "Gate 2", direction: "in", time: "2026-10-27T06:42:00+05:30" },
  { id: "ge-2", passId: "gp-2", gate: "Gate 2", direction: "in", time: "2026-10-27T06:48:00+05:30" },
  { id: "ge-3", passId: "gp-3", gate: "Gate 3", direction: "in", time: "2026-10-27T07:05:00+05:30" },
  { id: "ge-4", passId: "gp-6", gate: "Gate 1", direction: "in", time: "2026-10-27T05:50:00+05:30" },
  { id: "ge-5", passId: "gp-1", gate: "Gate 2", direction: "out", time: "2026-10-26T18:12:00+05:30" },
]);

export const OPENINGS: Opening[] = [
  { id: "op-1", post: "Engineer trainee (Mechanical)", grade: "ET", cadre: "trainee", vacancies: 12, split: { UR: 5, OBC: 3, SC: 2, ST: 1, EWS: 1, PwBD: 1 }, status: "shortlist" },
  { id: "op-2", post: "Operator (workmen)", grade: "W2", cadre: "workman", vacancies: 40, split: { UR: 16, OBC: 11, SC: 6, ST: 4, EWS: 3, PwBD: 2 }, status: "open" },
  { id: "op-3", post: "Dy Manager (Projects)", grade: "E3", cadre: "executive", vacancies: 3, split: { UR: 2, OBC: 1, SC: 0, ST: 0, EWS: 0, PwBD: 0 }, status: "offer" },
];

const ONBOARD = [
  { item: "Medical", done: false },
  { item: "Police verification", done: false },
  { item: "PF / NPS", done: false },
  { item: "Induction", done: false },
  { item: "ID card", done: false },
];

export const CANDIDATES: Candidate[] = [
  { id: "cd-1", openingId: "op-1", name: "Abhinav Kashyap", category: "UR", pwbd: false, score: 78.4, stage: "interview", gateScore: 812, checklist: ONBOARD.map((x) => ({ ...x })) },
  { id: "cd-2", openingId: "op-1", name: "Nisha Kumari", category: "OBC", pwbd: false, score: 81.2, stage: "medical", gateScore: 798, checklist: ONBOARD.map((x) => ({ ...x, done: x.item === "Medical" })) },
  { id: "cd-3", openingId: "op-1", name: "David Rongmei", category: "ST", pwbd: false, score: 74.1, stage: "shortlist", gateScore: 744, checklist: ONBOARD.map((x) => ({ ...x })) },
  { id: "cd-4", openingId: "op-3", name: "Smita Chakraborty", category: "UR", pwbd: false, score: 88.0, stage: "offer", checklist: ONBOARD.map((x) => ({ ...x, done: true })) },
  { id: "cd-5", openingId: "op-2", name: "Bishal Das", category: "SC", pwbd: false, score: 62.5, stage: "applied", checklist: ONBOARD.map((x) => ({ ...x })) },
];

export const GOALS: Goal[] = [
  { id: "g1", employeeId: "e-ananya", title: "CDU availability through expansion tie-ins", weight: 40, target: ">= 96%", achievement: 71 },
  { id: "g2", employeeId: "e-ananya", title: "Zero LTI in operations", weight: 30, target: "0 LTI", achievement: 100 },
  { id: "g3", employeeId: "e-ananya", title: "Energy intensity vs 2025 baseline", weight: 30, target: "-2.5%", achievement: 54 },
  { id: "g4", employeeId: "e-pallabi", title: "Substation reliability", weight: 50, target: "< 2 trips / quarter", achievement: 80 },
  { id: "g5", employeeId: "e-pallabi", title: "Training hours completed", weight: 50, target: "40 hrs", achievement: 60 },
  { id: "g6", employeeId: "e-pranjal", title: "October payroll lock on T+2", weight: 60, target: "Lock by 3 Nov", achievement: 55 },
  { id: "g7", employeeId: "e-pranjal", title: "Statutory files without rejection", weight: 40, target: "ECR and 24Q accepted", achievement: 40 },
  { id: "g8", employeeId: "e-bhaskar", title: "Establishment strength vs sanctioned posts", weight: 50, target: "Variance under 2%", achievement: 62 },
  { id: "g9", employeeId: "e-bhaskar", title: "APAR cycle closed on time", weight: 50, target: "31 Mar 2027", achievement: 20 },
  { id: "g10", employeeId: "e-hiren", title: "CDU crew rest-hour compliance", weight: 60, target: "No 11h rest breach", achievement: 88 },
  { id: "g11", employeeId: "e-hiren", title: "Overtime within monthly cap", weight: 40, target: "<= 50 h / person", achievement: 70 },
  { id: "g12", employeeId: "e-bikash", title: "Panel alarms acknowledged under 3 min", weight: 100, target: "95% of alarms", achievement: 76 },
];

export const APPRAISALS: Appraisal[] = EMPLOYEES.filter((e) => e.cadre !== "contract").map((e) => ({
  employeeId: e.id,
  cycle: "2026-27",
  stage: e.id === "e-pallabi" ? "self" : e.id === "e-bikash" ? "reporting" : e.id === "e-ananya" ? "mid_year" : "goal_setting",
  selfRating: e.id === "e-bikash" ? 4 : undefined,
}));

export const QUARTERS: Quarter[] = [
  { id: "q-v-12", type: "V", number: "V-12", status: "occupied", employeeId: "e-bhaskar", licenceFee: 4200 },
  { id: "q-v-02", type: "V", number: "V-02", status: "occupied", employeeId: "e-arup", licenceFee: 4200 },
  { id: "q-iv-08", type: "IV", number: "IV-08", status: "occupied", employeeId: "e-pranjal", licenceFee: 2800 },
  { id: "q-iv-21", type: "IV", number: "IV-21", status: "occupied", employeeId: "e-meenakshi", licenceFee: 2800 },
  { id: "q-iii-14", type: "III", number: "III-14", status: "vacant", licenceFee: 1600 },
  { id: "q-iii-19", type: "III", number: "III-19", status: "maintenance", licenceFee: 1600 },
  { id: "q-ii-04", type: "II", number: "II-04", status: "vacant", licenceFee: 900 },
];

export const MAINT: MaintenanceRequest[] = [
  { id: "mn-1", quarterId: "q-iv-08", title: "Kitchen geyser not heating", status: "in_progress", raisedAt: "2026-10-19T08:12:00+05:30" },
  { id: "mn-2", quarterId: "q-iii-19", title: "Roof leak, bedroom", status: "open", raisedAt: "2026-10-25T17:40:00+05:30" },
];

export const SEPARATIONS: Separation[] = [
  { id: "sp-1", employeeId: "e-arup", kind: "superannuation", lastDay: "2026-08-31", status: "initiated", clearances: [
    { dept: "Township", done: false },
    { dept: "Finance (advances)", done: true },
    { dept: "IT assets", done: false },
    { dept: "Library", done: true },
    { dept: "HSE", done: true },
  ]},
];

export const CONSENTS: Consent[] = EMPLOYEES.flatMap((e) => [
  { id: `co-${e.id}-hr`, employeeId: e.id, purpose: "Employment and payroll administration", given: true, at: e.doj },
  { id: `co-${e.id}-bio`, employeeId: e.id, purpose: "Biometric attendance", given: true, at: e.doj },
]);

export const AUDIT: AuditEvent[] = [
  { id: "au-1", actorId: "e-bhaskar", action: "approve_policy", object: "da.ida", after: "48.7", at: "2026-09-28T11:02:00+05:30", source: "policy" },
  { id: "au-2", actorId: "e-hiren", action: "approve_leave", object: "lv-3", after: "approved", at: "2026-10-14T09:10:00+05:30", source: "leave" },
  { id: "au-3", actorId: "e-pranjal", action: "open_payroll_run", object: "pay-2026-10", at: "2026-10-26T10:15:00+05:30", source: "payroll" },
  { id: "au-4", actorId: "e-meenakshi", action: "block_gate_pass", object: "gp-7", after: "Mandatory certificate expired", at: "2026-09-13T16:22:00+05:30", source: "gate" },
];

export const NOTES: NotificationItem[] = [
  { id: "nt-1", userId: "e-ananya", title: "Leave pending", body: "Pallabi Gogoi, casual leave 29 Oct", href: "/approvals", at: "2026-10-26T18:10:00+05:30", read: false },
  { id: "nt-2", userId: "e-pallabi", title: "Payslip Sep 2026", body: "Your payslip is ready to download", href: "/payslips", at: "2026-10-01T09:00:00+05:30", read: true },
  { id: "nt-3", userId: "e-pranjal", title: "Attendance lock due", body: "October lock is still open. Shift changeover is at 14:00.", href: "/payroll", at: "2026-10-27T08:00:00+05:30", read: false },
  { id: "nt-4", userId: "e-ritu", title: "Certificate expiring", body: "Bikash Teron, H2S, expires 1 Dec", href: "/safety", at: "2026-10-25T07:30:00+05:30", read: false },
];

export const INITIAL_RUN: PayrollRun = {
  id: "pay-2026-10",
  month: "2026-10",
  stage: "inputs",
  startedAt: "2026-10-26T10:15:00+05:30",
  lockedAttendance: false,
  results: [],
  notes: "Parallel run against SAP HR is on. Differences will show after compute.",
};

export const TAX: TaxDeclaration[] = [
  { id: "tx-1", employeeId: "e-pallabi", fy: "2026-27", regime: "new", section80C: 0, rent: 0, proofs: 0, status: "draft" },
];

export const CHANGES: ChangeRequest[] = [
  { id: "ch-1", employeeId: "e-pallabi", field: "phone", from: "+91 86382 44109", to: "+91 86382 44110", status: "pending" },
];

export const SESSIONS: TrainingSession[] = [
  { id: "tr-1", courseId: "ind", date: "2026-11-04", seats: 40, enrolled: [] },
  { id: "tr-2", courseId: "h2s", date: "2026-11-12", seats: 24, enrolled: ["e-hiren"] },
  { id: "tr-3", courseId: "fire", date: "2026-11-18", seats: 30, enrolled: ["e-anil"] },
];

export const INDUCTIONS: InductionResult[] = [
  { id: "in-1", workerId: "w-1", score: 86, passed: true, at: "2026-02-11T10:00:00+05:30" },
  { id: "in-2", workerId: "w-5", score: 41, passed: false, at: "2026-10-08T11:20:00+05:30" },
];

export const BREACHES: BreachIncident[] = [];

export const WAGE_PROOFS: WageProof[] = [
  { id: "wp-1", contractorId: "c-sis", month: "2026-09", fileName: "SIS_wage_Sep2026.pdf", at: "2026-10-04T09:10:00+05:30" },
];

export const WAITING: WaitingListEntry[] = [
  { id: "wl-1", employeeId: "e-pallabi", type: "III", applied: "2026-06-12" },
  { id: "wl-2", employeeId: "e-hiren", type: "IV", applied: "2025-11-03" },
];

export const ROSTER_POINTS: ReservationPoint[] = [
  { openingId: "op-1", category: "UR", cycle: 1, nextPoint: 6 },
  { openingId: "op-1", category: "OBC", cycle: 1, nextPoint: 4 },
  { openingId: "op-1", category: "SC", cycle: 1, nextPoint: 3 },
  { openingId: "op-1", category: "ST", cycle: 1, nextPoint: 2 },
  { openingId: "op-2", category: "UR", cycle: 2, nextPoint: 17 },
];

export const SAP_HR: SapHrRow[] = [
  { empNo: "NRL/E/1998/014", name: "Bhaskar Baruah", grade: "E7", basic: 148200, unitId: "hr" },
  { empNo: "NRL/E/2021/334", name: "Pallabi Gogoi", grade: "E1", basic: 62400, unitId: "util" },
  { empNo: "NRL/E/2012/118", name: "Hiren Kalita", grade: "E4", basic: 93800, unitId: "cdu" },
];

export const RETENTION: RetentionHold[] = [
  { id: "rt-1", object: "payroll runs 2019-26", reason: "IT scrutiny / Form 16", until: "2032-03-31" },
];

export const SAP_NET: Record<string, number> = {
  "e-bhaskar": 198440,
  "e-ananya": 154210,
  "e-pranjal": 121880,
  "e-ritu": 104220,
  "e-hiren": 128640,
  "e-pallabi": 81220,
  "e-rajib": 101140,
  "e-nivedita": 76410,
  "e-arup": 184900,
  "e-meenakshi": 99210,
  "e-bikash": 52110,
  "e-juri": 44880,
  "e-soneswar": 61240,
  "e-dipika": 40110,
  "e-manoj": 38940,
  "e-anil": 49880,
  "e-pinky": 32140,
  "e-ranjit": 44120,
  "e-kaushik": 58200,
  "e-shreya": 57980,
};
