"use client";

import {
  Buildings,
  CalendarBlank,
  ChartBar,
  CheckCircle,
  Clock,
  FileText,
  DoorOpen,
  HardHat,
  House,
  ListBullets,
  Receipt,
  ShieldCheck,
  SignOut,
  Sliders,
  Star,
  Swap,
  TreeStructure,
  User,
  Users,
  Wallet,
  Briefcase,
  Plugs,
} from "@phosphor-icons/react";
import type { NavItem } from "@/lib/nav";

const map = {
  house: House,
  users: Users,
  tree: TreeStructure,
  clock: Clock,
  calendar: CalendarBlank,
  swap: Swap,
  wallet: Wallet,
  file: FileText,
  check: CheckCircle,
  receipt: Receipt,
  hardhat: HardHat,
  gate: DoorOpen,
  shield: ShieldCheck,
  briefcase: Briefcase,
  star: Star,
  buildings: Buildings,
  signout: SignOut,
  chart: ChartBar,
  sliders: Sliders,
  list: ListBullets,
  user: User,
  plugs: Plugs,
};

export function NavIcon({ name, size = 20 }: { name: NavItem["icon"]; size?: number }) {
  const Icon = map[name];
  return <Icon size={size} weight="duotone" />;
}
