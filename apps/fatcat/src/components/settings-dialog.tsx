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
import {AdjustmentsHorizontalIcon} from "@heroicons/react/24/outline";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {z} from "zod";
import {useWallet} from "@solana/wallet-adapter-react";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";

const formSchema = z.object({
    priorityFee: z.number().nonnegative()
})

export function SettingsDialog() {
    const [open, setOpen] = useState(false)
    const {connected} = useWallet()
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            priorityFee: 0,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
    }

    useEffect(() => {
        if (!connected) {
            router.push('/')
        }
    }, [connected, router])

    if (!connected) {
        return null // or a loading spinner
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-12 h-12 rounded focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0" variant="outline">
                    <AdjustmentsHorizontalIcon/>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-muted rounded">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="priorityFee"
                            render={({field}) => (<FormItem>
                                <FormLabel>Priority Fee</FormLabel>
                                <FormControl>
                                    <Input placeholder="123456" {...field} />
                                </FormControl>
                                <FormDescription>
                                    <code>LAMPORTS</code>
                                </FormDescription>
                                <FormMessage/>
                            </FormItem>)}
                        />
                        <Button type="submit" className="text-foreground dark:text-background">Set Priority Fee</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

