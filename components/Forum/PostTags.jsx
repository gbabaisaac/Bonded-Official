import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'

// Color mapping for tags - Fizz-style: subtle, minimal colors
const TAG_COLORS = {
  'Housing': { bg: '#F0F9F4', text: '#166534', border: '#22C55E' }, // Subtle Green
  'STEM': { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6' }, // Subtle Blue
  'Need Help': { bg: '#FFF7ED', text: '#9A3412', border: '#F97316' }, // Subtle Orange
  'Lost & Found': { bg: '#FAF5FF', text: '#6B21A8', border: '#A855F7' }, // Subtle Purple
  'Roommate Match': { bg: '#F0F9FF', text: '#0C4A6E', border: '#0EA5E9' }, // Subtle Light Blue
  'Events': { bg: '#FDF2F8', text: '#9F1239', border: '#EC4899' }, // Subtle Pink
  'Advice': { bg: '#FEFCE8', text: '#713F12', border: '#EAB308' }, // Subtle Yellow
  'Clubs': { bg: '#EEF2FF', text: '#3730A3', border: '#6366F1' }, // Subtle Indigo
  'Random': { bg: '#F0FDF4', text: '#166534', border: '#22C55E' }, // Subtle Light Green
  'Confessions': { bg: '#FFF1F2', text: '#991B1B', border: '#EF4444' }, // Subtle Red
  'Study Group': { bg: '#F0FDFA', text: '#134E4A', border: '#14B8A6' }, // Subtle Teal
  'Class Discussion': { bg: '#F5F3FF', text: '#5B21B6', border: '#8B5CF6' }, // Subtle Deep Purple
  'Campus Life': { bg: '#F0F9F4', text: '#14532D', border: '#22C55E' }, // Subtle Green
  'Food': { bg: '#FFF7ED', text: '#9A3412', border: '#F97316' }, // Subtle Orange
  'Transportation': { bg: '#ECFEFF', text: '#164E63', border: '#06B6D4' }, // Subtle Cyan
  'Jobs': { bg: '#EEF2FF', text: '#312E81', border: '#6366F1' }, // Subtle Indigo
  'Buy/Sell': { bg: '#FAF5FF', text: '#581C87', border: '#A855F7' }, // Subtle Purple
}

// Default color for tags not in the mapping
const DEFAULT_TAG_COLOR = { bg: '#F5F5F5', text: '#616161', border: '#9E9E9E' }

// Helper function to get tag color
const getTagColor = (tag) => {
  return TAG_COLORS[tag] || DEFAULT_TAG_COLOR
}

export default function PostTags({ tags = [], maxDisplay = 2 }) {
  if (!tags || tags.length === 0) return null

  const displayTags = tags.slice(0, maxDisplay)
  const remainingCount = tags.length - maxDisplay

  return (
    <View style={styles.container}>
      {displayTags.map((tag, index) => {
        const tagColor = getTagColor(tag)
        return (
          <View 
            key={index} 
            style={[
              styles.tag,
              { 
                backgroundColor: tagColor.bg,
                borderColor: tagColor.border + '40', // More transparent border
              }
            ]}
          >
            <Text style={[styles.tagText, { color: tagColor.text + 'CC' }]}>
              {tag}
            </Text>
          </View>
        )
      })}
      {remainingCount > 0 && (
        <View style={styles.moreTag}>
          <Text style={styles.moreTagText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(1),
    marginTop: hp(0.3),
  },
  tag: {
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.25),
    borderRadius: theme.radius.pill,
    borderWidth: 0.5,
    opacity: 0.8,
  },
  tagText: {
    fontSize: hp(1.05),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
  },
  moreTag: {
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.25),
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.softBlack + '15',
    borderWidth: 0,
  },
  moreTagText: {
    fontSize: hp(1.05),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    opacity: 0.7,
  },
})

