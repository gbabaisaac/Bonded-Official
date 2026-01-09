import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Alert, ImageBackground, Keyboard, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View, useColorScheme } from 'react-native'
import AnimatedLogo from '../components/AnimatedLogo'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import ScreenWrapper from '../components/ScreenWrapper'
import { hp } from '../helpers/common'
import { useSendOTP } from '../hooks/useSendOTP'
import { useVerifyOTP } from '../hooks/useVerifyOTP'
import { useAppTheme, useThemeMode } from './theme'

const getFriendlyOtpError = (error) => {
  const raw = (error?.message || '').toLowerCase()

  if (raw.includes('expired')) {
    return 'That code has expired. Tap "Resend Code" to get a new one.'
  }

  if (raw.includes('invalid') || raw.includes('token') || raw.includes('otp')) {
    return 'That code is not correct. Double-check the numbers and try again.'
  }

  return 'We could not verify that code. Please try again, or resend a new one.'
}

export default function OTP() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const { email } = useLocalSearchParams()

  const [code, setCode] = useState('')
  const [resendCooldown, setResendCooldown] = useState(60) // Start with 60s cooldown
  const { mutate: sendOTP, isPending: isSending } = useSendOTP()
  const { mutate: verifyOTP, isPending: isVerifying } = useVerifyOTP()
  const cooldownTimerRef = useRef(null)
  const { setMode } = useThemeMode()
  const systemScheme = useColorScheme() || 'light'

  // Force light mode while OTP screen is displayed, then restore system preference
  // Use useLayoutEffect to ensure theme changes BEFORE render
  useLayoutEffect(() => {
    setMode('light')
    return () => {
      setMode(systemScheme)
    }
  }, [setMode, systemScheme])

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownTimerRef.current = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
    } else {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current)
      }
    }
  }, [resendCooldown])

  const handleVerify = () => {
    if (!email) {
      Alert.alert('Error', 'Email is missing. Please go back and try again.')
      return
    }

    if (code.length !== 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code we emailed you.')
      return
    }

    verifyOTP(
      { email: String(email), token: code },
      {
        onSuccess: () => {
          Alert.alert('Success', 'You are signed in!', [
            {
              text: 'Continue',
              onPress: () => router.replace('/onboarding'),
            },
          ])
        },
        onError: (error) => {
          console.error('Error verifying OTP:', error)
          const message = getFriendlyOtpError(error)
          Alert.alert('Couldn’t verify code', message)
        },
      }
    )
  }

  const handleResend = () => {
    if (!email) {
      Alert.alert('Error', 'Email is missing. Please go back and try again.')
      return
    }

    if (resendCooldown > 0) {
      Alert.alert('Please wait', `You can request a new code in ${resendCooldown} seconds.`)
      return
    }

    console.log('🔄 Resending OTP to:', email)

    sendOTP(String(email), {
      onSuccess: () => {
        console.log('✅ OTP resent successfully')
        setCode('') // Clear old code
        setResendCooldown(60) // Set 60 second cooldown
        Alert.alert('Code sent!', 'Check your email for a new 6-digit code.\n\nNote: Codes expire after 60 seconds.')
      },
      onError: (error) => {
        console.error('❌ Error resending OTP:', error)
        const errorMessage = error?.message || ''
        if (errorMessage.includes('security purposes')) {
          Alert.alert('Too many requests', 'Please wait a minute before requesting another code.')
        } else {
          Alert.alert('Could not resend code', 'Please wait a moment and try again.')
        }
      },
    })
  }

  return (
    <ImageBackground
      source={require('../assets/images/bonded-gradient.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScreenWrapper bg="transparent">
        <StatusBar style="light" />
        <BackButton onPress={() => router.back()} />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <AnimatedLogo size={60} style={styles.animatedLogo} />
            <Text style={styles.title}>Enter your code</Text>
            <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>
            <Text style={styles.hint}>Check your inbox (and spam folder)</Text>

            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus
              placeholder="000000"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <Button
              title={isVerifying ? 'Verifying…' : 'Verify Code'}
              onPress={handleVerify}
              buttonStyle={styles.button}
              disabled={isVerifying || code.length !== 6}
            />

            <Button
              title={
                isSending
                  ? 'Sending…'
                  : resendCooldown > 0
                  ? `Resend code (${resendCooldown}s)`
                  : 'Resend code'
              }
              onPress={handleResend}
              buttonStyle={[styles.button, { marginTop: hp(2) }]}
              disabled={isSending || resendCooldown > 0}
            />
          </View>
        </TouchableWithoutFeedback>
      </ScreenWrapper>
    </ImageBackground>
  )
}

const createStyles = (theme) =>
  StyleSheet.create({
    background: {
      flex: 1,
      width: '100%',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xxxl,
    },
    animatedLogo: {
      marginTop: hp(-20),
      marginBottom: hp(4),
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.extrabold,
      textAlign: 'center',
      letterSpacing: -0.5,
      fontFamily: theme.typography.fontFamily.heading,
      marginBottom: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
    },
    subtitle: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.md,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    hint: {
      color: theme.colors.textSecondary,
      fontSize: theme.typography.sizes.sm,
      textAlign: 'center',
      marginBottom: theme.spacing.xxl,
      paddingHorizontal: theme.spacing.lg,
      opacity: 0.7,
    },
    codeInput: {
      width: '60%',
      height: hp(7),
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.9)',
      color: '#000',
      fontSize: theme.typography.sizes.xxl,
      fontWeight: theme.typography.weights.bold,
      letterSpacing: 8,
    },
    button: {
      width: '100%',
      marginTop: hp(4),
    },
  })