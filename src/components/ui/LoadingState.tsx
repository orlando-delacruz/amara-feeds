import styled from 'styled-components'

interface LoadingStateProps {
  text?: string
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space.md};
  padding: ${({ theme }) => theme.space.xl};
  color: ${({ theme }) => theme.color.text.secondary};
`

const Spinner = styled.span`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: 3px solid ${({ theme }) => theme.color.border.default};
  border-top-color: ${({ theme }) => theme.color.brand[600]};
  border-radius: ${({ theme }) => theme.radius.full};
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

export function LoadingState({ text = 'Loading…' }: LoadingStateProps) {
  return (
    <Wrapper role="status">
      <Spinner aria-hidden="true" />
      <span>{text}</span>
    </Wrapper>
  )
}
