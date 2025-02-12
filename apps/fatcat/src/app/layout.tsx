import { ThemeProviderWrapper } from "../providers/themeProvider";
import { WalletAdapterProvider } from "../providers/walletAdapterProvider";
import { ClientProvider } from "../providers/clientProvider";
import type { Metadata } from "next";
import "./globals.css";
import { cn } from "../lib/utils";
import { PersistentWarning } from "../components/persistent-warning";
import { GeistSans } from "geist/font/sans";
import Header from "../components/header";
import { Toaster } from "../components/ui/toaster";

export const metadata: Metadata = {
  title: "FatCat",
  description: "Jupiter Governance Vote Automation.",
  openGraph: {
    title: "FatCat",
    description: "Jupiter Governance Vote Automation.",
    images: ['/opengraph/opengraph-image-2.png'],
  },
  icons: {
    icon: '/favicon/favicon.ico',
    apple: [
      { url: '/favicon/apple-icon-57x57.png', sizes: '57x57' },
      { url: '/favicon/apple-icon-60x60.png', sizes: '60x60' },
      { url: '/favicon/apple-icon-72x72.png', sizes: '72x72' },
      { url: '/favicon/apple-icon-76x76.png', sizes: '76x76' },
      { url: '/favicon/apple-icon-114x114.png', sizes: '114x114' },
      { url: '/favicon/apple-icon-120x120.png', sizes: '120x120' },
      { url: '/favicon/apple-icon-144x144.png', sizes: '144x144' },
      { url: '/favicon/apple-icon-152x152.png', sizes: '152x152' },
      { url: '/favicon/apple-icon-180x180.png', sizes: '180x180' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/favicon/android-icon-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        url: '/favicon/favicon-96x96.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon/favicon-16x16.png',
      },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body
      className={cn(
        GeistSans.className,
        "min-h-screen bg-background antialiased select-none",
      )}
    >
    {/*<Analytics />*/}
    <WalletAdapterProvider>
      <ClientProvider>
        <ThemeProviderWrapper
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          {children as any}
          <Toaster />
          <PersistentWarning />
        </ThemeProviderWrapper>
      </ClientProvider>
    </WalletAdapterProvider>
    {/*<SpeedInsights />*/}
    </body>
    </html>
  );
}
