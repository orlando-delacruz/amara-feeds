import styled from 'styled-components'

export interface SegmentedOption {
  value: string
  label: string
}

interface SegmentedControlProps {
  label: string
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
}

const Group = styled.div`
  display: inline-flex;
  max-width: 100%;
  overflow-x: auto;
  padding: ${({ theme }) => theme.space.xs};
  gap: ${({ theme }) => theme.space.xs};
  background-color: ${({ theme }) => theme.color.surface.subtle};
  border: 1px solid ${({ theme }) => theme.color.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const Option = styled.button<{ $selected: boolean }>`
  min-height: ${({ theme }) => theme.touch.minTarget};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: none;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.color.surface.card : 'transparent'};
  box-shadow: ${({ theme, $selected }) => ($selected ? theme.shadow.sm : 'none')};
  color: ${({ theme, $selected }) =>
    $selected ? theme.color.text.primary : theme.color.text.muted};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme, $selected }) =>
    $selected ? theme.font.weight.semibold : theme.font.weight.medium};
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.motion.fast} ease-out,
    box-shadow ${({ theme }) => theme.motion.fast} ease-out,
    color ${({ theme }) => theme.motion.fast} ease-out;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.color.text.primary};
  }
`

export function SegmentedControl({ label, options, value, onChange }: SegmentedControlProps) {
  return (
    <Group role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <Option
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          $selected={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Option>
      ))}
    </Group>
  )
}
