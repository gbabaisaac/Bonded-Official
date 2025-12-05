import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useAppTheme } from '../theme'

const ThemedView = ({ children, style, variant = 'background', ...rest }) => {
  const theme = useAppTheme()
  const backgroundColor =
    variant === 'surface' ? theme.colors.surface : variant === 'card' ? theme.colors.card : theme.colors.background

  return (
    <View style={[styles.base, { backgroundColor }, style]} {...rest}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
})

export default ThemedView

