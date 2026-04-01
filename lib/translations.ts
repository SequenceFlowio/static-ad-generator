export type Lang = "en" | "nl";

export const translations: Record<string, Record<Lang, string>> = {
  // Sidebar nav
  "nav.home": { en: "Home", nl: "Home" },
  "nav.stores": { en: "Stores", nl: "Winkels" },
  "nav.adGen": { en: "Ad Generator", nl: "Advertenties" },
  "nav.contentGen": { en: "Content Generator", nl: "Content" },
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
  "settings.subtitle": { en: "Manage your account and subscription", nl: "Beheer je account en abonnement" },
  "settings.profile": { en: "Profile", nl: "Profiel" },
  "settings.billing": { en: "Subscription", nl: "Abonnement" },
  "settings.fullName": { en: "Full Name", nl: "Naam" },
  "settings.email": { en: "Email", nl: "E-mail" },
  "settings.oauthNote": { en: "Profile info is managed via Google OAuth.", nl: "Profielinfo wordt beheerd via Google." },
  "settings.language": { en: "Language", nl: "Taal" },
  "settings.close": { en: "Close", nl: "Sluiten" },
  "settings.upgradePlan": { en: "Upgrade", nl: "Upgraden" },
  "settings.currentPlan": { en: "Your current plan", nl: "Je huidige plan" },
  "settings.manageBilling": { en: "Manage subscription →", nl: "Abonnement beheren →" },
  "settings.creditsTitle": { en: "Generations this month", nl: "Generaties deze maand" },
  "settings.creditsUsed": { en: "used", nl: "gebruikt" },
  "settings.creditsOf": { en: "of", nl: "van" },
  "settings.creditsUnlimited": { en: "Unlimited", nl: "Onbeperkt" },

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
  "stores.subtitle": { en: "Manage your brand stores and their DNA.", nl: "Beheer je merkwinkels en hun DNA." },
  "stores.connect": { en: "Connect Store", nl: "Winkel toevoegen" },
  "stores.of": { en: "of", nl: "van" },
  "stores.connected": { en: "store connected", nl: "winkel verbonden" },
  "stores.connectedPlural": { en: "stores connected", nl: "winkels verbonden" },
  "stores.freePlan": { en: "Free plan", nl: "Gratis plan" },
  "stores.freePlanLimit": { en: "Limit reached — upgrade for more stores", nl: "Limiet bereikt — upgrade voor meer winkels" },
  "stores.upgradeMore": { en: "Upgrade →", nl: "Upgraden →" },
  "stores.noStores": { en: "No stores yet", nl: "Nog geen winkels" },
  "stores.noStoresDesc": { en: "Connect your brand to start generating ads and content.", nl: "Voeg een winkel toe om te beginnen met advertenties en content maken." },
  "stores.loading": { en: "Loading stores…", nl: "Winkels laden…" },
  "stores.deleteConfirm": { en: "Delete this store? This cannot be undone.", nl: "Winkel verwijderen? Dit kan niet ongedaan worden gemaakt." },

  // Ad Generator page
  "adGen.title": { en: "Ad Generator", nl: "Advertenties maken" },
  "adGen.subtitle": { en: "Select a store to start generating ads.", nl: "Kies een winkel om advertenties te maken." },
  "adGen.noStores": { en: "No stores yet", nl: "Nog geen winkels" },
  "adGen.connectFirst": { en: "Add a store first", nl: "Voeg eerst een winkel toe" },
  "adGen.generate": { en: "Make ads →", nl: "Advertenties maken →" },

  // Content Generator page
  "contentGen.title": { en: "Content Generator", nl: "Content maken" },
  "contentGen.subtitle": { en: "Select a store to start generating social content.", nl: "Kies een winkel om social content te maken." },
  "contentGen.noStores": { en: "No stores yet", nl: "Nog geen winkels" },
  "contentGen.connectFirst": { en: "Add a store first", nl: "Voeg eerst een winkel toe" },
  "contentGen.generate": { en: "Make content →", nl: "Content maken →" },

  // Home page
  "home.badge": { en: "Powered by your Brand DNA", nl: "Aangedreven door je merkDNA" },
  "home.headline": { en: "Create on-brand ads & content in minutes", nl: "Maak merkgebonden advertenties & content in minuten" },
  "home.subtext": { en: "Train the AI on your brand once. Generate unlimited ads and social content that actually sound and look like you.", nl: "Train de AI eenmalig op je merk. Maak onbeperkt advertenties en content die echt klinken en eruitzien als jij." },
  "home.getStarted": { en: "Get started →", nl: "Aan de slag →" },
  "home.generateAds": { en: "Generate ads", nl: "Advertenties maken" },
  "home.adTemplates": { en: "Ad Templates", nl: "Advertentiesjablonen" },
  "home.adTemplatesTitle": { en: "Performance ad formats", nl: "Advertentieformaten" },
  "home.adTemplatesLink": { en: "Make ads →", nl: "Advertenties maken →" },
  "home.contentTemplates": { en: "Content Templates", nl: "Contentsjablonen" },
  "home.contentTemplatesTitle": { en: "Social content formats", nl: "Social contentformaten" },
  "home.contentTemplatesLink": { en: "Make content →", nl: "Content maken →" },

  // Home support section
  "home.support.title": { en: "Support", nl: "Support" },
  "home.support.desc": { en: "Have a question or running into an issue? Our team is here to help.", nl: "Heb je een vraag of loop je ergens tegenaan? Ons team helpt je graag." },
  "home.support.cta": { en: "Contact support", nl: "Neem contact op" },
  "home.requestSection.title": { en: "Request a section", nl: "Sectie aanvragen" },
  "home.requestSection.desc": { en: "Need a specific section for your store? Tell us and we'll build it.", nl: "Heb je een specifieke sectie nodig? Laat het ons weten en we bouwen het." },
  "home.requestSection.cta": { en: "Request section", nl: "Sectie aanvragen" },
  "home.requestFeature.title": { en: "Request a feature", nl: "Functie aanvragen" },
  "home.requestFeature.desc": { en: "Have an idea that would make SequenceFlow better? We'd love to hear it.", nl: "Heb je een idee om SequenceFlow te verbeteren? We horen het graag." },
  "home.requestFeature.cta": { en: "Request feature", nl: "Functie aanvragen" },
  "home.partner.title": { en: "Become a partner", nl: "Partner worden" },
  "home.partner.desc": { en: "Join our affiliate program and earn commission on every referral.", nl: "Word affiliate partner en verdien commissie op elke doorverwijzing." },
  "home.partner.cta": { en: "Join affiliate program", nl: "Aanmelden als partner" },

  // Support modal
  "support.title": { en: "Contact Support", nl: "Contact opnemen" },
  "support.subtitle": { en: "Have questions or need help? Reach out to our team.", nl: "Vragen of hulp nodig? Neem contact op met ons team." },
  "support.helpCenter": { en: "Help Center", nl: "Kennisbank" },
  "support.helpCenterDesc": { en: "Browse guides, tutorials, and FAQs", nl: "Bekijk handleidingen, tutorials en veelgestelde vragen" },
  "support.copy": { en: "Copy", nl: "Kopiëren" },
  "support.copied": { en: "Copied!", nl: "Gekopieerd!" },
  "support.sendEmail": { en: "Send Email", nl: "E-mail sturen" },

  // Credits / generations
  "credits.quality": { en: "Quality", nl: "Kwaliteit" },
  "credits.efficiency": { en: "Efficiency", nl: "Efficiëntie" },
  "credits.qualityDesc": { en: "Best results, 2 generations per image", nl: "Beste resultaat, 2 generaties per afbeelding" },
  "credits.efficiencyDesc": { en: "Fast & lightweight, 1 generation per image", nl: "Snel & licht, 1 generatie per afbeelding" },
  "credits.insufficient": { en: "Not enough generations remaining. Upgrade your plan.", nl: "Niet genoeg generaties over. Upgrade je plan." },

  // Onboarding
  "onboarding.step1": { en: "What best describes your work?", nl: "Wat beschrijft je werk het beste?" },
  "onboarding.step2": { en: "Where did you hear about us?", nl: "Hoe heb je ons gevonden?" },
  "onboarding.step3": { en: "What do you want to achieve?", nl: "Wat wil je bereiken?" },
  "onboarding.continue": { en: "Continue", nl: "Doorgaan" },
  "onboarding.back": { en: "Back", nl: "Terug" },
  "onboarding.skip": { en: "Skip for now", nl: "Nu overslaan" },
  "onboarding.getStarted": { en: "Get Started", nl: "Aan de slag" },
  "onboarding.saving": { en: "Saving…", nl: "Opslaan…" },
};
