import styled from 'styled-components'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { usePwaInstall } from './usePwaInstall'
import type { InstallPlatform } from './installSupport'

interface InstallTutorialModalProps {
  open: boolean
  onClose: () => void
}

const Steps = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  margin: 0 0 ${({ theme }) => theme.space.lg};
  padding: 0;
  list-style: none;
  counter-reset: step;
`

const Step = styled.li`
  display: flex;
  gap: ${({ theme }) => theme.space.md};
  align-items: flex-start;
  counter-increment: step;
`

const StepNumber = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ theme }) => theme.color.brand[600]};
  color: ${({ theme }) => theme.color.text.inverse};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.bold};

  &::before {
    content: counter(step);
  }
`

const StepText = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.color.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.base};
`

const PlatformLabel = styled.p`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.brand[700]};
`

const IconHint = styled.span`
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.color.text.primary};
`

const PromptSlot = styled.div`
  margin-bottom: ${({ theme }) => theme.space.lg};
`

const TITLE = 'Install ZAF ONE'

const platformLabel: Record<InstallPlatform, string> = {
  android: 'On Android (Chrome)',
  ios: 'On iPhone / iPad (Safari)',
  unsupported: 'On this device',
}

function PlatformSteps({ platform }: { platform: InstallPlatform }) {
  if (platform === 'ios') {
    return (
      <Steps>
        <Step>
          <StepNumber />
          <StepText>
            Open ZAF ONE in <strong>Safari</strong>, then tap the <IconHint>Share</IconHint> icon
            (the square with an arrow pointing up).
          </StepText>
        </Step>
        <Step>
          <StepNumber />
          <StepText>
            Scroll and tap <IconHint>Add to Home Screen</IconHint>.
          </StepText>
        </Step>
        <Step>
          <StepNumber />
          <StepText>
            Tap <IconHint>Add</IconHint> — ZAF ONE appears on your home screen like an app.
          </StepText>
        </Step>
      </Steps>
    )
  }
  return (
    <Steps>
      <Step>
        <StepNumber />
        <StepText>
          Tap the <IconHint>⋮ menu</IconHint> at the top-right corner of Chrome.
        </StepText>
      </Step>
      <Step>
        <StepNumber />
        <StepText>
          Tap <IconHint>Install app</IconHint> (or <IconHint>Add to Home screen</IconHint>).
        </StepText>
      </Step>
      <Step>
        <StepNumber />
        <StepText>Confirm — ZAF ONE opens from your home screen like an app.</StepText>
      </Step>
    </Steps>
  )
}

export function InstallTutorialModal({ open, onClose }: InstallTutorialModalProps) {
  const { platform, canPrompt, install } = usePwaInstall()

  async function handleInstall() {
    const outcome = await install()
    if (outcome === 'accepted') {
      onClose()
    }
  }

  return (
    <Dialog open={open} title={TITLE} onClose={onClose}>
      <PlatformLabel>{platformLabel[platform]}</PlatformLabel>
      <PlatformSteps platform={platform} />
      {platform === 'android' && canPrompt ? (
        <PromptSlot>
          <Button type="button" fullWidth onClick={() => void handleInstall()}>
            Install now
          </Button>
        </PromptSlot>
      ) : undefined}
      <Button type="button" variant="secondary" fullWidth onClick={onClose}>
        Maybe later
      </Button>
    </Dialog>
  )
}
