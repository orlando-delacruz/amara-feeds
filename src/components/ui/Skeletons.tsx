import styled from 'styled-components'

interface SkeletonProps {
  width?: string
  height?: string
}

const Block = styled.span<SkeletonProps>`
  display: block;
  width: ${({ width }) => width ?? '100%'};
  height: ${({ height }) => height ?? '16px'};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.color.surface.subtle};
  animation: pulse 1.4s ease-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
  }
`

export function Skeleton({ width, height }: SkeletonProps) {
  return <Block width={width} height={height} aria-hidden="true" />
}

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
`

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Rows role="status" aria-label="Loading content">
      {Array.from({ length: rows }, (_, index) => (
        <Block key={index} height="72px" />
      ))}
    </Rows>
  )
}

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: ${({ theme }) => theme.space.md};
`

export function StatsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <StatsGrid role="status" aria-label="Loading summaries">
      {Array.from({ length: count }, (_, index) => (
        <Block key={index} height="104px" />
      ))}
    </StatsGrid>
  )
}
