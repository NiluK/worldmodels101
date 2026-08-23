import type { Metadata } from "next";
import { Instrument_Serif, Newsreader, IBM_Plex_Mono, Noto_Serif_SC, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { headers } from "next/headers";
import { LocaleProvider } from "@/components/locale-provider";
import { localeFromPath, LOCALE_META } from "@/lib/i18n";
import { getStars } from "@/lib/github";
import { StarButton } from "@/components/star-cta";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

/* Instrument Serif and Newsreader carry no CJK glyphs, so Chinese needs its own
   pair rather than a fallback that silently swaps mid-sentence. */
const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const description =
  "A free, interactive primer on world models: how machines learn to imagine what happens next. From next-state prediction and latent dynamics to Dreamer, JEPA, and video world simulators.";

export const metadata: Metadata = {
  metadataBase: new URL("https://worldmodels101.com"),
  title: {
    default: "World Models 101",
    template: "%s · World Models 101",
  },
  description,
  openGraph: {
    title: "World Models 101",
    description,
    url: "https://worldmodels101.com",
    siteName: "World Models 101",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "World Models 101", description },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [headerStore, stars] = await Promise.all([headers(), getStars()]);
  const pathname = headerStore.get("x-pathname") ?? "/";
  const locale = localeFromPath(pathname);
  return (
    <html
      lang={LOCALE_META[locale].htmlLang}
      data-locale={locale}
      className={`${instrument.variable} ${newsreader.variable} ${plexMono.variable} ${notoSerifSC.variable} ${notoSansSC.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="relative min-h-full flex flex-col pb-20 md:pb-0 print:pb-0">
        <LocaleProvider locale={locale}>
          <SiteHeader stars={stars} />
          <main className="relative z-10 flex-1">{children}</main>
          <SiteFooter />
          <div
            data-print-hide
            className="pointer-events-none fixed inset-x-0 z-[70] flex justify-center px-4 md:hidden"
            style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <StarButton locale={locale} stars={stars} placement="mobile" />
          </div>
        </LocaleProvider>
      </body>
    </html>
  );
}
