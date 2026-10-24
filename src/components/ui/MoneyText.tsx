import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { formatPeso } from '@/lib/money'
import type { Money } from '@/lib/money'

interface MoneyTextProps {
  amountMinor: Money
  /** Shrink the rendered amount to fit its container when it is too wide. */
  fit?: boolean
}

const Value = styled.span`
  font-variant-numeric: tabular-nums;
`

export function MoneyText({ amountMinor, fit = false }: MoneyTextProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!fit) {
      return
    }
    const element = ref.current
    const parent = element?.parentElement
    if (!element || !parent) {
      return
    }
    const fitToContainer = () => {
      // Start from the inherited card typography, then step down only as
      // far as needed so normal amounts keep their original size.
      element.style.fontSize = ''
      let size = Number.parseFloat(window.getComputedStyle(element).fontSize)
      if (!Number.isFinite(size) || size <= 0) {
        return
      }
      if (parent.clientWidth <= 0) {
        return
      }
      const minimum = 10
      while (element.scrollWidth > parent.clientWidth && size > minimum) {
        size -= 1
        element.style.fontSize = `${size}px`
      }
    }

    fitToContainer()
    const observer = new ResizeObserver(fitToContainer)
    observer.observe(parent)
    observer.observe(element)
    return () => observer.disconnect()
  }, [amountMinor, fit])

  return <Value ref={ref}>{formatPeso(amountMinor)}</Value>
}
