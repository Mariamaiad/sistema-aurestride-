import seed from "../../supabase/seed/content.json";

/** Estrutura das configurações gerais (site_settings.data). */
export type SiteSettings = typeof seed.settings;

export type ServiceCategory = "marketing" | "web" | "sistemas";
export type ProjectCategory = "marketing" | "site" | "sistema";
export type PriceType = "fixed" | "range" | "from" | "on_request";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string | null;
  skills: string[];
  responsibilities: string[];
  visible: boolean;
  sort_order: number;
}

export interface Service {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string;
  deliverables: string[];
  icon: string | null;
  image_url: string | null;
  price_label: string | null;
  notes: string | null;
  active: boolean;
  sort_order: number;
}

export interface MarketingPlan {
  id: string;
  name: string;
  price: number | null;
  price_suffix: string;
  description: string;
  contents_count: number | null;
  videos_count: number | null;
  notes: string | null;
  highlighted: boolean;
  show_price: boolean;
  active: boolean;
  sort_order: number;
  items: string[];
}

export interface WebPrice {
  id: string;
  name: string;
  description: string;
  price_type: PriceType;
  price_min: number | null;
  price_max: number | null;
  price_suffix: string;
  notes: string | null;
  show_price: boolean;
  active: boolean;
  sort_order: number;
}

export interface ProjectImage {
  id: string;
  url: string;
  alt: string;
  sort_order: number;
}

export interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  client: string;
  category: ProjectCategory;
  cover_url: string | null;
  summary: string;
  challenge: string;
  solution: string;
  deliverables: string[];
  results: string | null;
  external_url: string | null;
  status: "draft" | "published";
  sort_order: number;
  images: ProjectImage[];
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  active: boolean;
  sort_order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  active: boolean;
  sort_order: number;
}

export interface SiteContent {
  settings: SiteSettings;
  team: TeamMember[];
  services: Service[];
  plans: MarketingPlan[];
  webPricing: WebPrice[];
  projects: PortfolioProject[];
  steps: ProcessStep[];
  faqs: Faq[];
  /** true quando o Supabase não está configurado e os dados vêm do seed local. */
  demo: boolean;
}
