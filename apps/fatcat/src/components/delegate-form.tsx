'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from 'next/link'

const UNSTAKE_COUNTDOWN_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

interface UnstakeItem {
    amount: string;
    endTime: number;
}

export default function DelegateForm() {
    const [stakeAmount, setStakeAmount] = useState<string>('0.00')
    const [unstakeAmount, setUnstakeAmount] = useState<string>('0.00')
    const [unstakeItems, setUnstakeItems] = useState<UnstakeItem[]>([])
    const [now, setNow] = useState(Date.now())

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleMaxClick = (type: 'stake' | 'unstake') => {
        if (type === 'stake') setStakeAmount('100.00')
        else setUnstakeAmount('50.00')
    }

    const handleHalfClick = (type: 'stake' | 'unstake') => {
        if (type === 'stake') setStakeAmount('50.00')
        else setUnstakeAmount('25.00')
    }

    const handleUnstake = () => {
        if (parseFloat(unstakeAmount) > 0) {
            setUnstakeItems([...unstakeItems, {
                amount: unstakeAmount,
                endTime: Date.now() + UNSTAKE_COUNTDOWN_TIME
            }]);
            setUnstakeAmount('0.00');
        }
    }

    const handleCancelUnstake = (index: number) => {
        setUnstakeItems(unstakeItems.filter((_, i) => i !== index));
    }

    const formatCountdown = (endTime: number) => {
        const diff = Math.max(0, endTime - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
        } else {
            return `${seconds}s`;
        }
    }

    return (
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <Card className="bg-card text-card-foreground p-0 sm:p-4 rounded border-muted select-none">
                <CardHeader>
                    <CardTitle className="text-2xl">Votes on Autopilot</CardTitle>
                    <CardDescription>
                        <span className="text-2xl font-medium">0</span>
                    </CardDescription>
                    <CardDescription>
                        Lock JUP tokens to receive your voting power.{' '}
                        <Link href="https://www.jupresear.ch/t/dao-x-vote-faq/7418" target="_blank" className="underline hover:text-primary">
                            Learn More
                        </Link>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="stake" className="w-full select-none">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="stake">Stake</TabsTrigger>
                            <TabsTrigger value="unstake">Unstake</TabsTrigger>
                            <TabsTrigger value="claim">Claim</TabsTrigger>
                        </TabsList>
                        <div className="h-[200px]">
                            <TabsContent value="stake" className="h-full">
                                <div className="space-y-4 h-full flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <Label htmlFor="stake-amount">JUP</Label>
                                        <div className="flex justify-end space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleHalfClick('stake')}>
                                                HALF
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleMaxClick('stake')}>
                                                MAX
                                            </Button>
                                        </div>
                                        <Input
                                            id="stake-amount"
                                            type="text"
                                            value={stakeAmount}
                                            onChange={(e) => setStakeAmount(e.target.value)}
                                            className="text-right text-xl sm:text-2xl"
                                        />
                                    </div>
                                    <Button className="w-full py-2 sm:py-3 text-foreground dark:text-background" disabled={parseFloat(stakeAmount) <= 0}>
                                        {parseFloat(stakeAmount) <= 0 ? 'Insufficient JUP' : 'Stake'}
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="unstake" className="h-full">
                                <div className="space-y-4 h-full flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <Label htmlFor="unstake-amount">Staked JUP</Label>
                                        <div className="flex justify-end space-x-2">
                                            <Button variant="outline" size="sm" onClick={() => handleHalfClick('unstake')}>
                                                HALF
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleMaxClick('unstake')}>
                                                MAX
                                            </Button>
                                        </div>
                                        <Input
                                            id="unstake-amount"
                                            type="text"
                                            value={unstakeAmount}
                                            onChange={(e) => setUnstakeAmount(e.target.value)}
                                            className="text-right text-xl sm:text-2xl"
                                        />
                                    </div>
                                    <Button className="w-full py-2 sm:py-3 text-foreground dark:text-background" onClick={handleUnstake} disabled={parseFloat(unstakeAmount) <= 0}>
                                        Unstake
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="claim" className="h-full">
                                <div className="space-y-4 h-full flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <Label>Claimable JUP</Label>
                                        <div className="relative">
                                            <ScrollArea className="h-[180px] sm:h-[210px] w-full rounded p-4">
                                                {unstakeItems.length === 0 ? (<p className="text-center text-muted-foreground">No unstaking in progress.</p>) : (unstakeItems.map((item, index) => (<div key={index} className="rounded mb-2 last:mb-16">
                                                    <div className="flex justify-between items-center">
                                                        <span className="w-full text-sm sm:text-base">{item.amount} JUP</span>
                                                        {now < item.endTime ? (<>
                                                                        <span className="w-full text-sm sm:text-base font-mono text-lime-500 dark:text-primary text-right mr-4">
                                                                            {formatCountdown(item.endTime)}
                                                                        </span>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleCancelUnstake(index)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </>) : (<Button
                                                            size="sm"
                                                            className="text-foreground dark:text-background"
                                                        >
                                                            Withdraw
                                                        </Button>)}
                                                    </div>
                                                </div>)))}
                                            </ScrollArea>
                                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

