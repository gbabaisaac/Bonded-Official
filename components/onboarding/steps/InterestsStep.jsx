import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ALL_INTERESTS } from '../../../constants/interests'
import { ONBOARDING_THEME } from '../../../constants/onboardingTheme'
import { hp, wp } from '../../../helpers/common'
import { ONBOARDING_STEPS } from '../../../stores/onboardingStore'

const InterestsStep = ({ formData, updateFormData, onScroll }) => {
  const styles = createStyles(ONBOARDING_THEME)
  const [localData, setLocalData] = useState({
    interests: formData.interests || [],
  })

  const handleInterestToggle = (interest) => {
    const newInterests = localData.interests.includes(interest)
      ? localData.interests.filter(i => i !== interest)
      : [...localData.interests, interest]
    
    const newData = { ...localData, interests: newInterests }
    setLocalData(newData)
    updateFormData(ONBOARDING_STEPS.INTERESTS, newData)
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
      bounces={true}
    >
      <Text style={styles.title}>What are you interested in?</Text>
      <Text style={styles.subtitle}>Help us find your people (optional)</Text>

      {/* Interests Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.sectionSubtitle}>Select as many as you like</Text>
        <View style={styles.tagsContainer}>
          {ALL_INTERESTS.map((interest) => {
            const isSelected = localData.interests.includes(interest)
            return (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.tag,
                  isSelected && styles.tagSelected,
                ]}
                onPress={() => handleInterestToggle(interest)}
              >
                <Text
                  style={[
                    styles.tagText,
                    isSelected && styles.tagTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}

export default InterestsStep

const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: hp(2),
    paddingBottom: hp(20), // Extra padding for fixed navigation buttons at bottom
  },
  title: {
    fontSize: hp(4),
    fontWeight: '800',
    color: '#1A1A1A',
    fontFamily: 'System',
    marginBottom: hp(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(2.2),
    color: '#8E8E8E',
    fontFamily: 'System',
    marginBottom: hp(4),
    textAlign: 'center',
  },
  section: {
    marginBottom: hp(4),
  },
  sectionTitle: {
    fontSize: hp(2.5),
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'System',
    marginBottom: hp(0.5),
  },
  sectionSubtitle: {
    fontSize: hp(1.8),
    color: '#8E8E8E',
    fontFamily: 'System',
    marginBottom: hp(2),
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: '#A45CFF',
    borderColor: '#A45CFF',
  },
  tagText: {
    fontSize: hp(1.8),
    color: '#1A1A1A',
    fontFamily: 'System',
  },
  tagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
})
