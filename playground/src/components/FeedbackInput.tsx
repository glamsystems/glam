"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

const FormSchema = z.object({
    feedback: z
        .string()
        .min(10, {
            message: "Feedback must be at least 10 characters.",
        })
        .max(1000, {
            message: "Feedback must not be longer than 1,000 characters.",
        }),
})

export default function FeedbackInput() {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {
        console.log(JSON.stringify(data));
        toast({
            title: "You submitted the following feedback:",
            description: (
                <pre className="mt-2 w-[340px] bg-zinc-900 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
            ),
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="gap-y-4 flex flex-col">
                <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Feedback</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Share your feedback and suggestions here..."
                                    className="resize-none w-full"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    variant="secondary"
                >
                    Submit
                </Button>
            </form>
        </Form>
    )
}
