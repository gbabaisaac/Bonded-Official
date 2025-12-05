import React, { createContext, useContext, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'

const base = {
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999, full: 9999 },
  typography: {
    fontFamily: {
      body: 'System',
      heading: 'System',
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
  },
}

export const lightTheme = {
  mode: 'light',
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    border: '#E2E8F0',
    accent: '#9F6CFF',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.4)',
  },
  ...base,
}

export const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#0F0D14',
    surface: '#16141D',
    card: '#16141D',
    textPrimary: '#E6E6EF',
    textSecondary: '#B6B6C2',
    border: 'rgba(255,255,255,0.08)',
    accent: '#9F6CFF',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.6)',
  },
  ...base,
}

const ThemeContext = createContext({ theme: lightTheme, setMode: () => {} })

export const ThemeProvider = ({ children }) => {
  const scheme = useColorScheme()
  const [mode, setMode] = useState(scheme === 'dark' ? 'dark' : 'light')

  const value = useMemo(() => {
    const theme = mode === 'dark' ? darkTheme : lightTheme
    return { theme, setMode }
  }, [mode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider')
  return ctx.theme
}

export const useThemeMode = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider')
  return { mode: ctx.theme.mode, setMode: ctx.setMode }
}

// Default export to satisfy Expo Router expectations
export default ThemeProvider

