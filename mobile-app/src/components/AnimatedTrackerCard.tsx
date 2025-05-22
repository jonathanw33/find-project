import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tracker } from '../redux/slices/trackerSlice';
import { theme } from '../theme';

interface AnimatedTrackerCardProps {
  tracker: Tracker;
  onPress: () => void;
  onDelete?: () => void;
}

const AnimatedTrackerCard: React.FC<AnimatedTrackerCardProps> = ({
  tracker,
  onPress,
  onDelete,
}) => {
  const scaleValue = new Animated.Value(1);
  const opacityValue = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: theme.animation.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: theme.animation.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };