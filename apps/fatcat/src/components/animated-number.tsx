// components/animated-number.tsx
'use client'

import { motion, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"

interface AnimatedNumberProps {
    value: number
    className?: string
}

export function AnimatedNumber({ value, className = "" }: AnimatedNumberProps) {
    const spring = useSpring(0, {
        damping: 25,
        stiffness: 100,
    })

    const display = useTransform(spring, (current) => {
        return new Intl.NumberFormat('en-US').format(Math.round(current))
    })

    useEffect(() => {
        spring.set(value)
    }, [value, spring])

    return (
        <motion.span className={className}>
            {display}
        </motion.span>
    )
}