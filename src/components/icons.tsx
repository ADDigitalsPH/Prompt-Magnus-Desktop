import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Megaphone,
  Package,
  PenLine,
  Search,
  Settings,
  Star,
  Tag,
  UserRound
} from "lucide-react";

export const categoryIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  coding: Code2,
  code: Code2,
  writing: PenLine,
  pen: PenLine,
  marketing: Megaphone,
  megaphone: Megaphone,
  business: BriefcaseBusiness,
  briefcase: BriefcaseBusiness,
  personal: UserRound,
  user: UserRound,
  tag: Tag
};

export const utilityIcons = {
  all: BookOpen,
  favorites: Star,
  packs: Package,
  search: Search,
  settings: Settings
};
