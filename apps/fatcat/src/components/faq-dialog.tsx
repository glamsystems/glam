"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion"

// Add interface for props
interface FaqDialogProps {
    className?: string;
}

const faqItems = [
  {
    "question": "What is FatCat?",
    "answer": "FatCat is a web application that simplifies participation in Jupiter's Governance by automating the voting process. It creates a GLAM Vault for you and allows you to delegate your voting authority to the FatCat service, making governance participation effortless."
  },
  {
    "question": "What are the benefits of using FatCat?",
    "answer": "FatCat ensures you never miss participating in Jupiter Governance votes, increases overall governance participation, and saves you time by automating the voting process. It's perfect for JUP holders who want to participate in governance but may not have the time to actively monitor and vote on all proposals."
  },
  {
    "question": "How does FatCat work?",
    "answer": "FatCat works in three simple steps: 1) It helps you create a GLAM Vault for your JUP tokens, 2) You delegate your voting authority to the FatCat service, and 3) FatCat will automatically participate in governance votes on your behalf. Importantly, if you choose to vote directly on a proposal, FatCat will respect your vote and will not override it."
  },
  {
    "question": "What is a GLAM Vault?",
    "answer": "GLAM Vaults are programmatic wallets with embedded controls. Users can send assets into their vault, enable integrations (swaps, lending, etc.), and delegate permissions to external managers, bots, or AI agents. In FatCat's case, you're delegating governance voting permissions while maintaining control of your assets."
  },
  {
    "question": "Is FatCat safe to use?",
    "answer": "We do our best to ensure FatCat's security and reliability. However, please note that GLAM Vaults are not audited yet. While your tokens remain in your GLAM Vault which you control, and you can revoke FatCat's voting authority at any time, you should proceed at your own risk. Please see our full disclaimer for more details."
  },
  {
    "question": "How do I get started with FatCat?",
    "answer": "Connect your wallet and FatCat will guide you through creating a GLAM Vault if you don't have one, and then help you delegate your voting authority. Once set up, FatCat automatically handles governance voting for you."
  },
  {
    "question": "Can I still vote myself if I use FatCat?",
    "answer": "Absolutely! While FatCat automates voting for you, you maintain full control. If you choose to vote directly on any proposal, FatCat will detect this and respect your vote, never overriding your personal voting decisions."
  }
]

export function FaqDialog({ className }: FaqDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={`opacity-80 hover:opacity-100 transition-opacity w-full ${className || ''}`}
                >
                    WTF is FatCat?
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-muted rounded">
                <DialogHeader>
                    <DialogTitle>Frequently Asked Questions</DialogTitle>
                    <DialogDescription>
                        Learn more about FatCat and how it can help you manage your JUP votes.
                    </DialogDescription>
                </DialogHeader>
                <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger>{item.question}</AccordionTrigger>
                            <AccordionContent>{item.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </DialogContent>
        </Dialog>
    )
}

