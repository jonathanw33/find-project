import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { Tracker, setSelectedTracker } from '../../redux/slices/trackerSlice';
import { useTracker } from '../../context/TrackerContext';
import { useSupabaseTrackers } from '../../hooks/useSupabaseTrackers';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import EmptyState from '../../components/EmptyState';
import EnhancedTrackerCard from '../../components/EnhancedTrackerCard';

type NavigationProp = StackNavigationProp<MainStackParamList>;

const EnhancedTrackerListScreen: React.FC = () => {
  const { trackers, loading, error } = useSelector((state: RootState) => state.trackers);
  const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();
  const { deleteTracker: contextDeleteTracker } = useTracker();
  const { fetchTrackers, deleteTracker: supabaseDeleteTracker } = useSupabaseTrackers();
  const [refreshing, setRefreshing] = useState(false);

  const trackersArray = Object.values(trackers);

  useEffect(() => {
    const loadTrackers = async () => {
      try {
        await fetchTrackers();
      } catch (error) {
        console.error('Error loading trackers on mount:', error);
      }
    };
    
    const timer = setTimeout(loadTrackers, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [user]);

  const handleAddTracker = () => {
    navigation.navigate('AddTracker');
  };

  const handleTrackerPress = (tracker: Tracker) => {
    dispatch(setSelectedTracker(tracker));
    navigation.navigate('TrackerDetail', { trackerId: tracker.id });
  };

  const handleDeleteTracker = (tracker: Tracker) => {
    Alert.alert(
      'Delete Tracker',
      `Are you sure you want to delete "${tracker.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabaseDeleteTracker(tracker.id);
              contextDeleteTracker(tracker.id);
            } catch (error) {
              console.error('Error deleting tracker:', error);
              Alert.alert('Error', 'Failed to delete tracker. Please try again.');
            }
          },
        },
      ],
    );
  };