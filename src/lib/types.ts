export type Role =
  | "employee"
  | "line_manager"
  | "hr_admin"
  | "payroll_officer"
  | "finance_approver"
  | "contract_labour_cell"
  | "safety_officer"
  | "gate_security"
  | "contractor_supervisor"
  | "recruiter"
  | "auditor";

export type Cadre =
  | "executive"
  | "workman"
  | "trainee"
  | "apprentice"
  | "deputed"
  | "contract";

export type LocationId = "numaligarh" | "siliguri" | "paradip" | "guwahati";

export type Category = "UR" | "OBC" | "SC" | "ST" | "EWS";

export type EmploymentStatus =
  | "active"
  | "probation"
  | "notice"
  | "separated"
  | "retired";

export type RequestStatus = "draft" | "pending" | "approved" | "rejected" | "withdrawn";

export type PayrollStage =
  | "attendance_lock"
  | "inputs"
  | "compute"
  | "validate"
  | "finance_approval"
  | "bank_file"
  | "publish";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "leave"
  | "weekly_off"
  | "holiday"
  | "od"
  | "missing_punch";

export interface Assignment {
  positionId: string;
  unitId: string;
  locationId: LocationId;
  grade: string;
  cadre: Cadre;
  crew?: "A" | "B" | "C" | "D";
  basic?: number;
  validFrom: string;
  validTo?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  dob: string;
  dependent: boolean;
}

export interface Nomination {
  id: string;
  type: "PF" | "gratuity" | "pension" | "GIS";
  nominee: string;
  share: number;
}

export interface Employee {
  id: string;
  empNo: string;
  name: string;
  preferredName: string;
  gender: "F" | "M" | "O";
  dob: string;
  doj: string;
  confirmationDate?: string;
  email: string;
  phone: string;
  category: Category;
  pwbd: boolean;
  cadre: Cadre;
  grade: string;
  basic: number;
  cafeteriaPct: number;
  hardshipAllowance: number;
  locationId: LocationId;
  unitId: string;
  positionId: string;
  managerId?: string;
  crew?: "A" | "B" | "C" | "D";
  status: EmploymentStatus;
  bankAccount: string;
  ifsc: string;
  pan: string;
  aadhaar: string;
  uan?: string;
  npsPran?: string;
  quarterId?: string;
  contractorId?: string;
  address?: string;
  assignmentHistory: Assignment[];
  family: FamilyMember[];
  nominations: Nomination[];
  roles: Role[];
}

export interface OrgUnit {
  id: string;
  name: string;
  parentId?: string;
  locationId: LocationId;
  kind: "company" | "location" | "department" | "unit";
}

export interface Position {
  id: string;
  title: string;
  unitId: string;
  grade: string;
  cadre: Cadre;
  vacant: boolean;
}

export interface PolicyVersion {
  value: number | string;
  validFrom: string;
  validTo?: string;
  proposedBy?: string;
  approvedBy?: string;
  source: string;
}

export interface PolicySetting {
  id: string;
  key: string;
  label: string;
  cadre?: Cadre | "all";
  value: number | string;
  unit?: string;
  validFrom: string;
  validTo?: string;
  approvedBy?: string;
  pendingValue?: number | string;
  pendingBy?: string;
  pendingValidFrom?: string;
  previousValue?: number | string;
  source: string;
  versions?: PolicyVersion[];
}

export type NrlInterfaceId = "sap_hr" | "aarohan" | "eureka" | "saral" | "sbi" | "epfo" | "traces" | "ad" | "smtp" | "sms";

export type NrlInterfaceGroup = "record" | "field" | "statutory" | "identity";

export type NrlInterfaceStatus = "acked" | "file_ready" | "awaiting_ack" | "idle" | "online" | "queued" | "phase0";

export interface NrlInterface {
  id: NrlInterfaceId;
  name: string;
  system: string;
  purpose: string;
  channel: string;
  lastFile?: string;
  lastAck?: string;
  lastRun?: string;
  status: NrlInterfaceStatus;
  note: string;
  group: NrlInterfaceGroup;
}

export interface PayLine {
  code: string;
  label: string;
  type: "earning" | "deduction" | "employer";
  amount: number;
}

export interface PayResult {
  employeeId: string;
  month: string;
  lines: PayLine[];
  gross: number;
  deductions: number;
  net: number;
  wageShare: number;
  perkPct: number;
  superPct: number;
  flags: PayFlag[];
  sapNet?: number;
  sapLines?: PayLine[];
  arrears?: number;
}

export interface PayFlag {
  code:
    | "perks_over_35"
    | "super_over_30"
    | "wage_share_under_50"
    | "negative_net"
    | "missing_bank";
  severity: "block" | "warn";
  message: string;
}

export interface PayrollRun {
  id: string;
  month: string;
  stage: PayrollStage;
  startedAt: string;
  lockedAttendance?: boolean;
  computedAt?: string;
  financeApproverId?: string;
  publishedAt?: string;
  results: PayResult[];
  notes?: string;
  files?: StatutoryFile[];
  totals?: {
    employees: number;
    net: number;
    gross: number;
    sapDiffs: number;
    blockers: number;
    ms: number;
  };
}

export interface StatutoryFile {
  kind: "bank" | "ecr" | "nps" | "tds24q" | "pt" | "claims" | "sapfi";
  name: string;
  content: string;
  at: string;
}

export interface ShiftPattern {
  id: string;
  code: "M" | "A" | "N" | "G" | "OFF";
  label: string;
  start: string;
  end: string;
}

export interface RosterEntry {
  id: string;
  employeeId: string;
  date: string;
  shiftId: string;
}

export interface Punch {
  id: string;
  employeeId: string;
  readerId: string;
  time: string;
  kind: "in" | "out";
}

export interface AttendanceDay {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  hours: number;
  overtime: number;
  shiftId?: string;
  lateMinutes?: number;
  earlyMinutes?: number;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  accrual: number;
  carryForward: number;
  encashable: boolean;
  halfDay: boolean;
  maxPerSpell?: number;
  gender?: "M" | "F";
}

export interface LeaveBalance {
  employeeId: string;
  typeId: string;
  balance: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  typeId: string;
  from: string;
  to: string;
  days: number;
  halfDay?: "am" | "pm";
  reason: string;
  status: RequestStatus;
  approverId?: string;
  decidedAt?: string;
}

export interface SwapRequest {
  id: string;
  fromId: string;
  toId: string;
  date: string;
  status: RequestStatus;
  approverId?: string;
}

export interface Regularisation {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  inTime?: string;
  outTime?: string;
  status: RequestStatus;
}

export type ClaimType = "medical" | "ltc" | "cea" | "tour" | "cafeteria";

export interface Claim {
  id: string;
  employeeId: string;
  type: ClaimType;
  amount: number;
  description: string;
  status: RequestStatus;
  bills: number;
  submittedAt: string;
}

export interface Advance {
  id: string;
  employeeId: string;
  type: "festival" | "hba" | "vehicle";
  principal: number;
  outstanding: number;
  monthlyRecovery: number;
  status?: RequestStatus;
  instalments?: number;
  appliedAt?: string;
}

export interface Contractor {
  id: string;
  name: string;
  workOrder: string;
  workOrderEnd: string;
  licenceNo: string;
  licenceExpiry: string;
  // Most workers the labour licence allows on site at once.
  capacity?: number;
  pfCode: string;
  esiCode: string;
  area: string;
  supervisorName: string;
  supervisorId?: string;
}

export interface ContractWorker {
  id: string;
  contractorId: string;
  name: string;
  skill: string;
  aadhaar: string;
  uan: string;
  esic: string;
  policeVerification: boolean;
  medicalFitnessExpiry: string;
  photoSeed: string;
  blacklisted: boolean;
  inductionPassed: boolean;
}

export interface GatePass {
  id: string;
  workerId: string;
  validFrom: string;
  validTo: string;
  blocked: boolean;
  blockReason?: string;
}

export interface GateEvent {
  id: string;
  passId: string;
  gate: string;
  direction: "in" | "out";
  time: string;
}

export interface Course {
  id: string;
  name: string;
  validityMonths: number;
  mandatoryFor: string[];
}

export interface Certificate {
  id: string;
  personId: string;
  personKind: "employee" | "contract";
  courseId: string;
  issued: string;
  expires: string;
}

export interface Opening {
  id: string;
  post: string;
  grade: string;
  cadre: Cadre;
  vacancies: number;
  split: Record<Category | "PwBD", number>;
  status: "open" | "shortlist" | "offer" | "closed";
}

export type CandidateStage = "applied" | "shortlist" | "interview" | "medical" | "offer" | "joined";

export interface Candidate {
  id: string;
  openingId: string;
  name: string;
  category: Category;
  pwbd: boolean;
  score: number;
  stage: CandidateStage;
  gateScore?: number;
  checklist: { item: string; done: boolean }[];
  employeeId?: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  weight: number;
  target: string;
  achievement: number;
}

export interface Appraisal {
  employeeId: string;
  cycle: string;
  stage:
    | "goal_setting"
    | "mid_year"
    | "self"
    | "reporting"
    | "reviewing"
    | "normalisation"
    | "closed";
  selfRating?: number;
  reportingRating?: number;
  reviewingRating?: number;
  finalRating?: number;
  prpAmount?: number;
}

export interface Quarter {
  id: string;
  type: "II" | "III" | "IV" | "V";
  number: string;
  status: "occupied" | "vacant" | "maintenance";
  employeeId?: string;
  licenceFee: number;
}

export interface MaintenanceRequest {
  id: string;
  quarterId: string;
  title: string;
  status: "open" | "in_progress" | "closed";
  raisedAt: string;
}

export interface Separation {
  id: string;
  employeeId: string;
  kind: "resignation" | "superannuation" | "vrs" | "death";
  lastDay: string;
  status: "initiated" | "clearance" | "settled";
  clearances: { dept: string; done: boolean; byId?: string; at?: string }[];
  gratuity?: number;
  leaveEncashment?: number;
  recoveries?: number;
  netFf?: number;
}

export interface Consent {
  id: string;
  employeeId: string;
  purpose: string;
  given: boolean;
  at: string;
  withdrawnAt?: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  object: string;
  before?: string;
  after?: string;
  at: string;
  source: string;
}

export interface Holiday {
  date: string;
  name: string;
  locationId?: LocationId;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  at: string;
  read: boolean;
}

export interface TaxDeclaration {
  id: string;
  employeeId: string;
  fy: string;
  regime: "new" | "old";
  section80C: number;
  rent: number;
  proofs: number;
  status: RequestStatus;
}

export interface ChangeRequest {
  id: string;
  employeeId: string;
  field: "phone" | "email" | "bank" | "address" | "promotion";
  from: string;
  to: string;
  status: RequestStatus;
  makerId?: string;
  promotion?: { grade: string; positionId: string; basic: number; validFrom: string };
}

export interface TrainingSession {
  id: string;
  courseId: string;
  date: string;
  seats: number;
  enrolled: string[];
}

export interface InductionResult {
  id: string;
  workerId: string;
  score: number;
  passed: boolean;
  at: string;
}

export interface BreachIncident {
  id: string;
  title: string;
  at: string;
  notified: boolean;
}

export interface WageProof {
  id: string;
  contractorId: string;
  month: string;
  fileName: string;
  at: string;
}

export interface WaitingListEntry {
  id: string;
  employeeId: string;
  type: Quarter["type"];
  applied: string;
}

export interface ReservationPoint {
  openingId: string;
  category: Category | "PwBD";
  cycle: number;
  nextPoint: number;
}

export interface SapHrRow {
  empNo: string;
  name: string;
  grade: string;
  basic: number;
  unitId: string;
}

export interface RetentionHold {
  id: string;
  object: string;
  reason: string;
  until: string;
}
