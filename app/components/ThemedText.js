import React from 'react'
import { Text } from 'react-native'
import { useAppTheme } from '../theme'

const ThemedText = ({ children, style, variant = 'primary', ...rest }) => {
  const theme = useAppTheme()
  const color = variant === 'secondary' ? theme.colors.textSecondary : theme.colors.textPrimary
  return (
    <Text style={[{ color, fontFamily: theme.typography.fontFamily.body }, style]} {...rest}>
      {children}
    </Text>
  )
}

export default ThemedText

