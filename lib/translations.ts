export type Lang = "en" | "nl";

export const translations: Record<string, Record<Lang, string>> = {
  // Sidebar nav
  "nav.home": { en: "Home", nl: "Home" },
  "nav.stores": { en: "Stores", nl: "Winkels" },
  "nav.adGen": { en: "Ad Generator", nl: "Advertentiegenerator" },
  "nav.contentGen": { en: "Content Generator", nl: "Contentgenerator" },
  "nav.tutorial": { en: "Tutorial", nl: "Tutorial" },
  "nav.feedback": { en: "Feedback", nl: "Feedback" },
  "nav.support": { en: "Support", nl: "Support" },

  // Theme
  "theme.light": { en: "Light", nl: "Licht" },
  "theme.dark": { en: "Dark", nl: "Donker" },

  // Auth
  "auth.signOut": { en: "Sign out", nl: "Uitloggen" },
  "auth.signingIn": { en: "Signing in…", nl: "Inloggen…" },

  // Settings
  "settings.title": { en: "Settings", nl: "Instellingen" },
  "settings.subtitle": { en: "Manage your account and subscription", nl: "Beheer uw account en abonnement" },
  "settings.profile": { en: "Profile", nl: "Profiel" },
  "settings.billing": { en: "Plans & Billing", nl: "Plannen & Facturering" },
  "settings.fullName": { en: "Full Name", nl: "Volledige naam" },
  "settings.email": { en: "Email", nl: "E-mail" },
  "settings.oauthNote": { en: "Profile info is managed via Google OAuth.", nl: "Profielinfo wordt beheerd via Google OAuth." },
  "settings.language": { en: "Language", nl: "Taal" },
  "settings.close": { en: "Close", nl: "Sluiten" },
  "settings.upgradePlan": { en: "Upgrade Plan", nl: "Plan upgraden" },
  "settings.currentPlan": { en: "Your current subscription plan", nl: "Uw huidige abonnement" },
  "settings.creditsTitle": { en: "Credits remaining", nl: "Resterend tegoed" },
  "settings.creditsSoon": { en: "Credit tracking coming soon.", nl: "Tegoedtracering komt binnenkort." },

  // Upgrade CTA
  "upgrade.title": { en: "Upgrade to Pro", nl: "Upgraden naar Pro" },
  "upgrade.desc": { en: "Unlock 3 stores, 2K generations & batch mode.", nl: "Ontgrendel 3 winkels, 2K generaties & batchmodus." },
  "upgrade.cta": { en: "See plans →", nl: "Bekijk plannen →" },

  // Trial countdown
  "trial.title": { en: "Free Trial", nl: "Gratis proefperiode" },
  "trial.expired": { en: "Expired", nl: "Verlopen" },
  "trial.daysLeft": { en: "days left", nl: "dagen over" },
  "trial.dayLeft": { en: "day left", nl: "dag over" },
  "trial.upgradeCta": { en: "Upgrade to continue →", nl: "Upgrade om door te gaan →" },

  // Stores page
  "stores.title": { en: "Stores", nl: "Winkels" },
  "stores.subtitle": { en: "Manage your brand stores and their DNA.", nl: "Beheer uw merkwinkels en hun DNA." },
  "stores.connect": { en: "Connect Store", nl: "Winkel toevoegen" },
  "stores.of": { en: "of", nl: "van" },
  "stores.connected": { en: "store connected", nl: "winkel verbonden" },
  "stores.connectedPlural": { en: "stores connected", nl: "winkels verbonden" },
  "stores.freePlan": { en: "Free plan", nl: "Gratis plan" },
  "stores.freePlanLimit": { en: "Free plan limit reached", nl: "Limiet gratis plan bereikt" },
  "stores.upgradeMore": { en: "Upgrade for more →", nl: "Upgrade voor meer →" },
  "stores.noStores": { en: "No stores connected", nl: "Geen winkels verbonden" },
  "stores.noStoresDesc": { en: "Connect your brand to start generating ads and content.", nl: "Verbind uw merk om te beginnen met advertenties en content genereren." },
  "stores.loading": { en: "Loading stores…", nl: "Winkels laden…" },

  // Home page
  "home.badge": { en: "Powered by your Brand DNA", nl: "Aangedreven door uw merkDNA" },
  "home.headline": { en: "Create on-brand ads & content in minutes", nl: "Maak merkgebonden advertenties & content in minuten" },
  "home.subtext": { en: "Train the AI on your brand once. Generate unlimited ads and social content that actually sound and look like you.", nl: "Train de AI eenmalig op uw merk. Genereer onbeperkt advertenties en socialmediacontent die echt klinken en eruitzien als u." },
  "home.getStarted": { en: "Get started →", nl: "Aan de slag →" },
  "home.generateAds": { en: "Generate ads", nl: "Advertenties genereren" },
  "home.adTemplates": { en: "Ad Templates", nl: "Advertentiesjablonen" },
  "home.adTemplatesTitle": { en: "Performance ad formats", nl: "Prestatie-advertentieformaten" },
  "home.adTemplatesLink": { en: "Generate ads →", nl: "Genereer advertenties →" },
  "home.contentTemplates": { en: "Content Templates", nl: "Contentsjablonen" },
  "home.contentTemplatesTitle": { en: "Social content formats", nl: "Sociale contentformaten" },
  "home.contentTemplatesLink": { en: "Generate content →", nl: "Genereer content →" },

  // Onboarding
  "onboarding.step1": { en: "What best describes your work?", nl: "Wat beschrijft uw werk het beste?" },
  "onboarding.step2": { en: "Where did you hear about us?", nl: "Hoe heeft u ons gevonden?" },
  "onboarding.step3": { en: "What do you want to achieve?", nl: "Wat wilt u bereiken?" },
  "onboarding.continue": { en: "Continue", nl: "Doorgaan" },
  "onboarding.back": { en: "Back", nl: "Terug" },
  "onboarding.skip": { en: "Skip for now", nl: "Nu overslaan" },
  "onboarding.getStarted": { en: "Get Started", nl: "Aan de slag" },
  "onboarding.saving": { en: "Saving…", nl: "Opslaan…" },
};
