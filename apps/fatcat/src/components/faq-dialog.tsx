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
        question: "What is FatCat?",
        answer: "FatCat is a platform that allows you to put your JUP votes on autopilot, making it easier to manage your cryptocurrency investments."
    },
    {
        question: "How does FatCat work?",
        answer: "FatCat uses advanced algorithms to automatically allocate your JUP votes based on predefined strategies, optimizing your voting power and potential returns."
    },
    {
        question: "Is FatCat safe to use?",
        answer: "Yes, FatCat prioritizes security. We use industry-standard encryption and never store your private keys. However, always exercise caution and do your own research when using any financial platform."
    },
    {
        question: "How do I get started with FatCat?",
        answer: "To get started, simply connect your wallet, set your voting preferences, and FatCat will handle the rest. Our user-friendly interface makes it easy for both beginners and experienced users."
    },
    {
        question: "What are the benefits of using FatCat?",
        answer: "FatCat saves you time, optimizes your voting strategy, and potentially increases your returns. It's like having a crypto expert managing your JUP votes 24/7."
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

