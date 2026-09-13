import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.dialog};
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: ${({ theme }) => theme.color.surface.overlay};
  backdrop-filter: blur(4px);
  padding: ${({ theme }) => theme.space.lg};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    align-items: center;
  }
`

const Panel = styled.div`
  width: 100%;
  max-width: 32rem;
  max-height: 85dvh;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.color.surface.card};
  border-radius: ${({ theme }) => theme.radius.xl} ${({ theme }) => theme.radius.xl}
    ${({ theme }) => theme.radius.lg} ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  padding: ${({ theme }) => theme.space.lg};

  @media (min-width: ${({ theme }) => theme.breakpoint.tablet}) {
    border-radius: ${({ theme }) => theme.radius.xl};
  }
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.lg};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: ${({ theme }) => theme.font.lineHeight.tight};
  letter-spacing: ${({ theme }) => theme.font.tracking.tight};
`

export function Dialog({ open, title, onClose, children }: DialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    closeRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <Overlay
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <Panel role="dialog" aria-modal="true" aria-label={title}>
        <Header>
          <Title>{title}</Title>
          <Button ref={closeRef} variant="subtle" size="sm" onClick={onClose}>
            Close
          </Button>
        </Header>
        {children}
      </Panel>
    </Overlay>
  )
}
