/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/webview/**/*.{html,tsx,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        vsc: {
          sidebar: 'var(--vscode-sideBar-background)',
          editor: 'var(--vscode-editor-background)',
          foreground: 'var(--vscode-editor-foreground)',
          border: 'var(--vscode-widget-border)',
          input: 'var(--vscode-input-background)',
          inputFg: 'var(--vscode-input-foreground)',
          inputBorder: 'var(--vscode-input-border)',
          button: 'var(--vscode-button-background)',
          buttonHover: 'var(--vscode-button-hoverBackground)',
          buttonFg: 'var(--vscode-button-foreground)',
          selection: 'var(--vscode-editor-inactiveSelectionBackground)',
          hover: 'var(--vscode-list-hoverBackground)'
        },
        axiom: {
          primary: 'var(--vscode-button-background)',
          primaryHover: 'var(--vscode-button-hoverBackground)',
          accent: 'var(--vscode-focusBorder)',
          text: {
            DEFAULT: 'var(--vscode-editor-foreground)',
            muted: 'var(--vscode-descriptionForeground)',
            dim: 'var(--vscode-disabledForeground)',
            inverse: 'var(--vscode-button-foreground)'
          },
          bg: {
            primary: 'var(--vscode-sideBar-background)',
            secondary: 'var(--vscode-editor-background)',
            tertiary: 'var(--vscode-input-background)'
          },
          border: {
            DEFAULT: 'var(--vscode-widget-border)'
          },
          success: 'var(--vscode-testing-iconPassed)',
          warning: 'var(--vscode-editorWarning-foreground)',
          error: 'var(--vscode-errorForeground)',
          cursor: 'var(--vscode-editorCursor-foreground)'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'var(--vscode-font-family)', 'system-ui', 'sans-serif'],
        mono: ['var(--vscode-editor-font-family)', 'monospace'],
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' }
        }
      },
      animation: {
        slideUp: 'slideUp 0.2s ease-out forwards',
        fadeIn: 'fadeIn 0.15s ease-out forwards',
        blink: 'blink 1s step-end infinite'
      }
    },
  },
  plugins: [],
};
