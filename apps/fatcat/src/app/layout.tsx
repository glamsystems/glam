import { ThemeProviderWrapper } from "../providers/themeProvider";
import { WalletAdapterProvider } from "../providers/walletAdapterProvider";
import type { Metadata } from "next";
import "./globals.css";
import { UmiProvider } from "../providers/umiProvider";
import { cn } from "../lib/utils";
import {PersistentWarning} from "../components/persistent-warning";
import { GeistSans } from 'geist/font/sans';
import { Analytics } from "@vercel/analytics/react"
import Header from "../components/header";
import { SpeedInsights } from "@vercel/speed-insights/next"


export const metadata: Metadata = {
    title: "FatCat",
    description: "Jupiter Governance Vote Automation.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <link rel="icon" href="/favicon.ico"/>
            <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png"/>
            <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png"/>
            <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png"/>
            <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png"/>
            <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png"/>
            <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png"/>
            <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png"/>
            <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png"/>
            <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png"/>
            <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png"/>
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
            <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png"/>
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
            <link rel="manifest" href="/manifest.json"/>
        </head>
        <body
            className={cn(GeistSans.className, "min-h-screen bg-background antialiased select-none")}
        >
        <Analytics/>
        <WalletAdapterProvider>
            <UmiProvider>
                <ThemeProviderWrapper
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <Header/>
                    {children}
                    <PersistentWarning/>
                </ThemeProviderWrapper>
            </UmiProvider>
        </WalletAdapterProvider>
        <SpeedInsights/>
        </body>
        </html>);
}

