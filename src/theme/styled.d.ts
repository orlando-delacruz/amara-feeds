import 'styled-components'
import type { Theme } from './tokens'

declare module 'styled-components' {
  // Empty on purpose: the theme type comes entirely from src/theme/tokens.ts.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}
