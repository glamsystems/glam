'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DelegateForm from '../../components/delegate-form'
import VoteList from "@/components/vote-list";
import {motion} from "framer-motion";

export default function Dashboard() {
    const { connected } = useWallet()
    const router = useRouter()

    useEffect(() => {
        if (!connected) {
            router.push('/')
        }
    }, [connected, router])

    if (!connected) {
        return null // or a loading spinner
    }

    return (<motion.div className="min-h-screen flex flex-col"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
    >
            <main className="flex-grow flex flex-col items-center justify-start py-24 gap-y-4 mt-12 md:mt-10">
                <DelegateForm/>
                <VoteList/>
            </main>
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
        </motion.div>)
}

