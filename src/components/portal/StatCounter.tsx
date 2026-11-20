'use client'

import React, { useEffect, useState, useRef } from 'react'

interface StatCounterProps {
  value: number
  duration?: number
  suffix?: string
  className?: string
}

export default function StatCounter({
  value,
  duration = 1600,
  suffix = '',
  className = '',
}: StatCounterProps) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
        }
      },
      { threshold: 0.2 }
    )

    const el = elementRef.current
    if (el) {
      observer.observe(el)
    }

    return () => {
      if (el) observer.unobserve(el)
      observer.disconnect()
    }
  }, [hasAnimated])

  useEffect(() => {
    if (!hasAnimated) return

    let startTime: number | null = null
    let animationFrameId: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)

      // Ease out cubic: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentCount = Math.floor(easeOut * value)

      setCount(currentCount)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      } else {
        setCount(value)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [hasAnimated, value, duration])

  return (
    <span ref={elementRef} className={className}>
      {count.toLocaleString('id-ID')}
      {suffix}
    </span>
  )
}
