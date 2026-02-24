import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const COLORS = {
  bg: '#FAFAFA',
  primary: '#6366f1',
  lightPurple: '#F5F3FF',
  white: '#FFFFFF',
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
};

interface PostCardProps {
  title: string;
  likes: number;
  comments: number;
  image?: string;
}

interface EventCardProps {
  title: string;
  likes: number;
  comments: number;
  image?: string;
  interest?: string;
  date?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ title, likes, comments, image }) => {
  return (
    <View style={[styles.postCard, { backgroundColor: COLORS.white }]}>
      {/* Post Image */}
      {image && (
        <View style={styles.postImageContainer}>
          <Text style={styles.postImage}>{image}</Text>
        </View>
      )}

      {/* Post Header */}
      <View style={[styles.postHeader, image && { marginTop: 12 }]}>
        <View style={styles.postTitleWrapper}>
          <Text style={[styles.postTitle, { color: COLORS.gray900 }]}>
            {title}
          </Text>
          <Text style={[styles.postType, { color: COLORS.gray500 }]}>
            Post
          </Text>
        </View>
      </View>

      {/* Post Stats - Minimal */}
      <View style={styles.postStatsContainer}>
        <TouchableOpacity style={styles.statItem}>
          <MaterialCommunityIcons
            name="heart-outline"
            size={16}
            color={COLORS.primary}
          />
          <Text style={[styles.statValue, { color: COLORS.gray600 }]}>
            {likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statItem}>
          <MaterialCommunityIcons
            name="message-outline"
            size={16}
            color={COLORS.primary}
          />
          <Text style={[styles.statValue, { color: COLORS.gray600 }]}>
            {comments}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const EventCard: React.FC<EventCardProps> = ({ 
  title, 
  likes, 
  comments, 
  image, 
  interest, 
  date 
}) => {
  return (
    <View style={[styles.eventCard, { backgroundColor: COLORS.white }]}>
      {/* Event Image */}
      <View style={styles.eventImageContainer}>
        <Text style={styles.eventImage}>{image}</Text>
        {interest && (
          <View style={[styles.interestBadgeEvent, { backgroundColor: COLORS.primary }]}>
            <Text style={[styles.interestBadgeText, { color: COLORS.white }]}>
              {interest}
            </Text>
          </View>
        )}
      </View>

      {/* Event Content */}
      <View style={styles.eventContent}>
        <Text style={[styles.eventTitle, { color: COLORS.gray900 }]}>
          {title}
        </Text>
        
        {date && (
          <View style={styles.eventDateContainer}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={[styles.eventDate, { color: COLORS.gray600 }]}>
              {date}
            </Text>
          </View>
        )}

        {/* Event Stats */}
        <View style={styles.eventStatsContainer}>
          <TouchableOpacity style={styles.eventStatItem}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={[styles.eventStatValue, { color: COLORS.gray600 }]}>
              {likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.eventStatItem}>
            <MaterialCommunityIcons
              name="message-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={[styles.eventStatValue, { color: COLORS.gray600 }]}>
              {comments}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.eventStatItem, { marginLeft: 'auto' }]}>
            <MaterialCommunityIcons
              name="share-outline"
              size={16}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Post Card Styles
  postCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  postImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.lightPurple,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  postImage: {
    fontSize: 64,
  },
  postHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  postTitleWrapper: {
    flex: 1,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  postType: {
    fontSize: 12,
    fontWeight: '500',
  },
  postStatsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Event Card Styles
  eventCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gray100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  eventImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.lightPurple,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eventImage: {
    fontSize: 72,
  },
  interestBadgeEvent: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  interestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  eventStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventStatValue: {
    fontSize: 13,
    fontWeight: '600',
  },
});