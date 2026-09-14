import {
  ArrowLeft, ArrowRight, Award, BarChart3, BookOpen, Building2, Calculator, CheckCircle,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardCheck, Clock,
  DollarSign, Eye, FileCheck, FileSignature, FileText, GraduationCap, HandCoins, Handshake,
  Heart, HelpCircle, Home, KeyRound, Landmark, Lightbulb, Loader2, Lock, Mail, MapPin,
  Medal, Menu, MountainSnow, Pencil, Percent, Phone, Plus, RefreshCw, Search, Shield,
  ShieldCheck, Star, Target, Trash2, TrendingDown, TrendingUp, Users, Wallet, Wheat, X,
  AlertTriangle, Download, LogOut, UploadCloud,
  type LucideIcon,
} from "lucide-react";

/**
 * The single place the app names an icon library.
 *
 * Keys describe what an icon MEANS, not what it depicts, so re-skinning the
 * site is an edit to the right-hand column of this file -- no call site
 * changes. Two roles that happen to share a glyph today (`purchase` and
 * `conventional` are both `Home`) get separate keys precisely so they can
 * diverge later.
 *
 * Not covered here: src/components/ui/*, whose chevrons and checkmarks are
 * structural chrome vendored from shadcn and get overwritten by its generator.
 */

/** Icons are rendered as `<Icons.foo className="w-5 h-5" />`. */
export type IconComponent = React.ComponentType<{ className?: string }>;

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/**
 * Lucide draws at a 2px stroke by default; the site uses 1.75px so glyphs sit
 * lighter against Lora headings and inside the mint tiles. Set here once
 * rather than at sixty call sites.
 */
function thin(Icon: LucideIcon): IconComponent {
  const Thin = ({ className }: { className?: string }) => <Icon className={className} strokeWidth={1.75} />;
  Thin.displayName = Icon.displayName ?? "Icon";
  return Thin;
}

export const Icons = {
  // --- Loan programs (keys match LOAN_TYPES ids in constants.ts) ---
  conventional: thin(Building2),
  fha: thin(Shield),
  va: thin(Medal),
  usda: thin(Wheat),
  jumbo: thin(TrendingUp),
  arm: thin(BarChart3),
  fixed: thin(Lock),
  utahHousing: thin(MountainSnow),

  // --- Core services ---
  purchase: thin(Home),
  refinance: thin(RefreshCw),
  homeEquity: thin(HandCoins),

  // --- Tools and learning ---
  calculator: thin(Calculator),
  loanGuide: thin(BookOpen),
  firstTimeBuyer: thin(GraduationCap),
  rateComparison: thin(Percent),
  rates: thin(TrendingUp),
  refinanceGuide: thin(DollarSign),
  equityGuide: thin(FileText),
  firstHomeGuide: thin(KeyRound),
  tip: thin(Lightbulb),
  faq: thin(HelpCircle),

  // --- Value propositions ---
  experience: thin(Award),
  loansClosed: thin(FileCheck),
  citiesServed: thin(MapPin),
  rating: thin(Star),
  community: thin(Heart),
  expertise: thin(Target),
  personalService: thin(Users),
  transparency: thin(Eye),
  localKnowledge: thin(MountainSnow),
  faceToFace: thin(Handshake),
  fasterClosings: thin(Clock),
  utahPrograms: thin(Landmark),

  // --- First-time buyer journey ---
  budget: thin(Wallet),
  preApproval: thin(ClipboardCheck),
  shopping: thin(Search),
  offer: thin(FileSignature),
  closing: thin(KeyRound),

  // --- Contact details ---
  phone: thin(Phone),
  email: thin(Mail),
  location: thin(MapPin),
  hours: thin(Clock),

  // --- Interface actions and state ---
  next: thin(ArrowRight),
  prev: thin(ArrowLeft),
  check: thin(CheckCircle),
  success: thin(CheckCircle),
  loading: thin(Loader2),
  secure: thin(ShieldCheck),
  add: thin(Plus),
  remove: thin(Trash2),
  edit: thin(Pencil),
  menu: thin(Menu),
  close: thin(X),
  expand: thin(ChevronDown),
  collapse: thin(ChevronUp),
  carouselNext: thin(ChevronRight),
  carouselPrev: thin(ChevronLeft),
  breadcrumbSeparator: thin(ChevronRight),
  rateDrop: thin(TrendingDown),

  // --- Borrower portal ---
  upload: thin(UploadCloud),
  download: thin(Download),
  document: thin(FileText),
  logout: thin(LogOut),
  warning: thin(AlertTriangle),

  // --- Social ---
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
} as const satisfies Record<string, IconComponent>;

export type IconName = keyof typeof Icons;
