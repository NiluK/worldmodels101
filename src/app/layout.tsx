import type { Metadata } from "next";
import { Instrument_Serif, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${newsreader.variable} ${plexMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="relative min-h-full flex flex-col">
        <SiteHeader />
        <main className="relative z-10 flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
