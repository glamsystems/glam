import {
    CheckCircledIcon,
    CrossCircledIcon,
    StopwatchIcon,
} from "@radix-ui/react-icons"

export const types = [
    {
        value: "native",
        label: "Native",
    },
    {
        value: "lst",
        label: "LST",
    },
    {
        value: "lrt",
        label: "LRT",
    },
]

export const statuses = [
    {
        value: "pending",
        label: "Pending",
        icon: StopwatchIcon,
    },
    {
        value: "claimable",
        label: "Claimable",
        icon: CheckCircledIcon,
    },
    {
        value: "canceled",
        label: "Canceled",
        icon: CrossCircledIcon,
    },
]