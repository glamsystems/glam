'use client'

import dynamic from "next/dynamic";
import ThemeSwitcher from "./themeSwitcher";
import Link from 'next/link'
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import { AdjustmentsHorizontalIcon, EllipsisVerticalIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@solana/wallet-adapter-react";
import {SettingsDialog} from "@/components/settings-dialog";

const WalletMultiButtonDynamic = dynamic(
    async () =>
        (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
    { ssr: false }
);

const Header = () => {
    const { connected } = useWallet();

    return (
        <header className="w-full fixed bg-gradient-to-t from-transparent to-background z-50">
            <div className="max-w-5xl mx-auto px-4 py-12 md:py-10 flex items-center justify-between">
                <Link href="/">
                    <h1 className="text-3xl font-light text-muted-foreground">
                        =^.^=
                    </h1>
                </Link>
                <div className="flex items-center gap-4">
                    <WalletMultiButtonDynamic />
                    <Popover>
                        <PopoverTrigger asChild>
                            <div className="w-12 h-12 rounded cursor-pointer hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center border border-input bg-background shadow-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0">
                                <EllipsisVerticalIcon className="h-4 w-4"/>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="flex flex-col w-fit gap-y-4 shadow-none bg-transparent border-none ">
                            <Link href="https://x.com/fatcatvote" target="_blank">
                                <Button className="w-12 h-12 rounded focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0" variant="outline">
                                    @
                                </Button>
                            </Link>
                            <Link href="mailto:help@fatcat.vote?subject=FatCat Support Ticket" target="_blank">
                                <Button className="w-12 h-12 rounded focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0" variant="outline">
                                    <EnvelopeIcon/>
                                </Button>
                            </Link>
                            {connected && (
                                <SettingsDialog />
                            )}
                            <ThemeSwitcher />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </header>
    );
};

export default Header;