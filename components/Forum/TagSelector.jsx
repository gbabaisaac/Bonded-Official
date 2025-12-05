import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native'
import { X, Search, ChevronDown, ChevronUp, CheckCircle2 } from '../Icons'
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'

// Predefined tags for Bonded forums
const AVAILABLE_TAGS = [
  'Housing',
  'STEM',
  'Need Help',
  'Lost & Found',
  'Roommate Match',
  'Events',
  'Advice',
  'Clubs',
  'Random',
  'Confessions',
  'Study Group',
  'Class Discussion',
  'Campus Life',
  'Food',
  'Transportation',
  'Jobs',
  'Buy/Sell',
]

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

const MAX_TAGS = 3

// Helper function to get tag color
const getTagColor = (tag) => {
  return TAG_COLORS[tag] || DEFAULT_TAG_COLOR
}

export default function TagSelector({ selectedTags = [], onTagsChange, style }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllTags, setShowAllTags] = useState(false)

  const filteredTags = AVAILABLE_TAGS.filter((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      // Remove tag
      onTagsChange(selectedTags.filter((t) => t !== tag))
    } else {
      // Add tag (max 3)
      if (selectedTags.length < MAX_TAGS) {
        onTagsChange([...selectedTags, tag])
      }
    }
  }

  const removeTag = (tag) => {
    onTagsChange(selectedTags.filter((t) => t !== tag))
  }

  const displayTags = showAllTags ? filteredTags : filteredTags.slice(0, 6)

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Tags (optional, max {MAX_TAGS})</Text>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedTagsScroll}
          >
            {selectedTags.map((tag) => {
              const tagColor = getTagColor(tag)
              return (
                <View 
                  key={tag} 
                  style={[
                    styles.selectedTag,
                    { backgroundColor: tagColor.border }
                  ]}
                >
                  <Text style={styles.selectedTagText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => removeTag(tag)}
                    style={styles.removeTagButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X
                      size={hp(1.6)}
                      color={theme.colors.white}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                </View>
              )
            })}
          </ScrollView>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search
          size={hp(1.6)}
          color={theme.colors.softBlack}
          strokeWidth={2}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tags..."
          placeholderTextColor={theme.colors.softBlack}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Available Tags */}
      <View style={styles.tagsContainer}>
        <ScrollView
          style={styles.tagsScroll}
          contentContainerStyle={styles.tagsScrollContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.tagsGrid}>
            {displayTags.map((tag) => {
              const isSelected = selectedTags.includes(tag)
              const isDisabled = !isSelected && selectedTags.length >= MAX_TAGS

              const tagColor = getTagColor(tag)
              
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagChip,
                    { 
                      backgroundColor: isSelected ? tagColor.border : tagColor.bg,
                      borderColor: tagColor.border,
                    },
                    isDisabled && styles.tagChipDisabled,
                  ]}
                  onPress={() => toggleTag(tag)}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      { 
                        color: isSelected ? theme.colors.white : tagColor.text,
                      },
                      isDisabled && styles.tagChipTextDisabled,
                    ]}
                  >
                    {tag}
                  </Text>
                  {isSelected && (
                    <CheckCircle2
                      size={hp(1.6)}
                      color={theme.colors.white}
                      strokeWidth={2.5}
                      style={{ marginLeft: wp(1) }}
                    />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>

        {filteredTags.length > 6 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllTags(!showAllTags)}
            activeOpacity={0.7}
          >
            <Text style={styles.showMoreText}>
              {showAllTags ? 'Show Less' : `Show All (${filteredTags.length})`}
            </Text>
            {showAllTags ? (
              <ChevronUp
                size={hp(1.5)}
                color={theme.colors.bondedPurple}
                strokeWidth={2.5}
              />
            ) : (
              <ChevronDown
                size={hp(1.5)}
                color={theme.colors.bondedPurple}
                strokeWidth={2.5}
              />
            )}
          </TouchableOpacity>
        )}
      </View>

      {selectedTags.length >= MAX_TAGS && (
        <Text style={styles.maxTagsWarning}>
          Maximum {MAX_TAGS} tags selected
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: hp(1.5),
  },
  label: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1.5),
  },
  selectedTagsContainer: {
    marginBottom: hp(1.5),
    minHeight: hp(4),
  },
  selectedTagsScroll: {
    paddingRight: wp(4),
    paddingVertical: hp(0.5),
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.pill,
    marginRight: wp(2),
  },
  selectedTagText: {
    fontSize: hp(1.4),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  removeTagButton: {
    marginLeft: wp(1.5),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    marginBottom: hp(1.5),
  },
  searchIcon: {
    marginRight: wp(2),
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
  },
  tagsContainer: {
    maxHeight: hp(25),
    marginBottom: hp(1),
  },
  tagsScroll: {
    flex: 1,
  },
  tagsScrollContent: {
    paddingBottom: hp(3),
    paddingTop: hp(0.5),
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    paddingBottom: hp(2),
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
  },
  tagChipDisabled: {
    opacity: 0.4,
  },
  tagChipText: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  tagChipTextDisabled: {
    color: theme.colors.softBlack,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1),
    marginTop: hp(0.5),
  },
  showMoreText: {
    fontSize: hp(1.5),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    marginRight: wp(1),
  },
  maxTagsWarning: {
    fontSize: hp(1.3),
    color: theme.colors.error,
    fontFamily: theme.typography.fontFamily.body,
    marginTop: hp(0.5),
    fontStyle: 'italic',
  },
})

