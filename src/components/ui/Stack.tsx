import styled from 'styled-components'
import type { ReactNode } from 'react'

export type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

interface StackProps {
  gap?: StackGap
  children: ReactNode
}

const Wrapper = styled.div<{ $gap: StackGap }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme, $gap }) => theme.space[$gap]};
`

export function Stack({ gap = 'lg', children }: StackProps) {
  return <Wrapper $gap={gap}>{children}</Wrapper>
}
