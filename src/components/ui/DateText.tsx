import { formatDate } from '@/lib/format'

interface DateTextProps {
  value: string
}

export function DateText({ value }: DateTextProps) {
  return <span>{formatDate(value)}</span>
}
