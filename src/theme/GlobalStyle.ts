import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.font.family};
    font-size: ${({ theme }) => theme.font.size.md};
    line-height: ${({ theme }) => theme.font.lineHeight.base};
    color: ${({ theme }) => theme.color.text.primary};
    background-color: ${({ theme }) => theme.color.surface.page};
    -webkit-font-smoothing: antialiased;
  }

  #root {
    min-height: 100dvh;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }

  img,
  svg {
    display: block;
    max-width: 100%;
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus.ring};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }

  @media print {
    header,
    nav {
      display: none !important;
    }

    main {
      max-width: none !important;
      padding: 0 !important;
    }
  }
`
