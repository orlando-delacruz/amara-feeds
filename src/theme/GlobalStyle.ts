import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
  }

  ul {
    padding: 0;
  }

  html {
    -webkit-text-size-adjust: 100%;
    scroll-padding-top: calc(
      ${({ theme }) => theme.layout.headerHeight} + env(safe-area-inset-top, 0px) +
        ${({ theme }) => theme.space.sm}
    );
  }

  body {
    font-family: ${({ theme }) => theme.font.family};
    font-size: ${({ theme }) => theme.font.size.md};
    line-height: ${({ theme }) => theme.font.lineHeight.base};
    letter-spacing: ${({ theme }) => theme.font.tracking.normal};
    color: ${({ theme }) => theme.color.text.primary};
    background-color: ${({ theme }) => theme.color.surface.page};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  #root {
    min-height: 100dvh;
    overflow-x: hidden;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }

  button,
  a,
  select {
    touch-action: manipulation;
  }

  img,
  svg {
    display: block;
    max-width: 100%;
  }

  ::selection {
    background-color: ${({ theme }) => theme.color.brand[100]};
    color: ${({ theme }) => theme.color.text.primary};
  }

  ::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }

  ::-webkit-scrollbar-track {
    background-color: ${({ theme }) => theme.color.surface.page};
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.color.border.strong};
    border: 3px solid ${({ theme }) => theme.color.surface.page};
    border-radius: ${({ theme }) => theme.radius.full};
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: ${({ theme }) => theme.color.neutral[400]};
  }

  input,
  textarea {
    caret-color: ${({ theme }) => theme.color.brand[600]};
  }

  a {
    text-underline-offset: 3px;
    text-decoration-thickness: 2px;
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.focus.ring};
    outline-offset: 2px;
    box-shadow: 0 0 0 4px ${({ theme }) => theme.color.focus.glow};
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