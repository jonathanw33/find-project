import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation';
import { useScheduledAlert } from '../../context/ScheduledAlertContext';
import { ScheduleType } from '../../services/scheduledAlerts/scheduledAlertService';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

type NavigationProp = StackNavigationProp<MainStackParamList, 'CreateScheduledAlert'>;
type RouteProps = RouteProp<MainStackParamList, 'CreateScheduledAlert' | 'EditScheduledAlert'>;

const CreateScheduledAlertScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { 
    createScheduledAlert, 
    updateScheduledAlert, 
    getScheduledAlertsForTracker, 
    loading 
  } = useScheduledAlert();
  
  const isEditing = route.name === 'EditScheduledAlert';
  const { trackerId } = route.params;
  const alertId = isEditing ? (route.params as any).alertId : null;
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('one_time');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [date, setDate] = useState(new Date());
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [loadingAlert, setLoadingAlert] = useState(isEditing);

  // Load existing alert if editing
  useEffect(() => {
    if (isEditing && alertId) {
      loadAlertDetails();
    }
    
    // Set navigation title
    navigation.setOptions({
      title: isEditing ? 'Edit Scheduled Alert' : 'Create Scheduled Alert',
    });
  }, [isEditing, alertId]);  const loadAlertDetails = async () => {
    try {
      setLoadingAlert(true);
      
      // Get all alerts for this tracker
      const alerts = await getScheduledAlertsForTracker(trackerId);
      const alert = alerts.find(a => a.id === alertId);
      
      if (!alert) {
        Alert.alert('Error', 'Alert not found');
        navigation.goBack();
        return;
      }
      
      // Set form values
      setTitle(alert.title);
      setMessage(alert.message);
      setScheduleType(alert.scheduleType);
      setIsActive(alert.isActive);
      
      // Set time
      if (alert.scheduledTime) {
        const [hours, minutes] = alert.scheduledTime.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes);
        setTime(timeDate);
      }
      
      // Set date for one-time alerts
      if (alert.scheduleType === 'one_time' && alert.scheduledDate) {
        setDate(new Date(alert.scheduledDate));
      }
      
      // Set day of week for weekly alerts
      if (alert.scheduleType === 'weekly' && alert.dayOfWeek !== undefined) {
        setDayOfWeek(alert.dayOfWeek);
      }
      
      // Set day of month for monthly alerts
      if (alert.scheduleType === 'monthly' && alert.dayOfMonth !== undefined) {
        setDayOfMonth(alert.dayOfMonth);
      }
    } catch (error) {
      console.error('Error loading alert details:', error);
      Alert.alert('Error', 'Failed to load alert details');
    } finally {
      setLoadingAlert(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for this alert');
      return;
    }
    
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message for this alert');
      return;
    }
    
    // Format time to HH:MM
    const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    
    // Format date to YYYY-MM-DD
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    
    try {
      if (isEditing && alertId) {
        await updateScheduledAlert(alertId, {
          title,
          message,
          scheduleType,
          scheduledTime: timeString,
          scheduledDate: scheduleType === 'one_time' ? dateString : undefined,
          dayOfWeek: scheduleType === 'weekly' ? dayOfWeek : undefined,
          dayOfMonth: scheduleType === 'monthly' ? dayOfMonth : undefined,
          isActive,
        });
        
        Alert.alert('Success', 'Alert updated successfully');
      } else {        await createScheduledAlert({
          trackerId,
          title,
          message,
          scheduleType,
          scheduledTime: timeString,
          scheduledDate: scheduleType === 'one_time' ? dateString : undefined,
          dayOfWeek: scheduleType === 'weekly' ? dayOfWeek : undefined,
          dayOfMonth: scheduleType === 'monthly' ? dayOfMonth : undefined,
          isActive,
        });
        
        Alert.alert('Success', 'Alert created successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving alert:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} alert`);
    }
  };

  const renderScheduleSettings = () => {
    switch (scheduleType) {
      case 'one_time':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {date.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setTime(selectedTime);
                    }
                  }}
                />
              )}
            </View>
          </>
        );      case 'daily':
        return (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity 
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Ionicons name="time-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    setTime(selectedTime);
                  }
                }}
              />
            )}
          </View>
        );
      case 'weekly':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Day of Week</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={dayOfWeek}
                  onValueChange={(itemValue) => setDayOfWeek(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Sunday" value={0} />
                  <Picker.Item label="Monday" value={1} />
                  <Picker.Item label="Tuesday" value={2} />
                  <Picker.Item label="Wednesday" value={3} />
                  <Picker.Item label="Thursday" value={4} />
                  <Picker.Item label="Friday" value={5} />
                  <Picker.Item label="Saturday" value={6} />
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setTime(selectedTime);
                    }
                  }}
                />
              )}
            </View>
          </>
        );      case 'monthly':
        return (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Day of Month</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={dayOfMonth}
                  onValueChange={(itemValue) => setDayOfMonth(itemValue)}
                  style={styles.picker}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <Picker.Item key={day} label={day.toString()} value={day} />
                  ))}
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setTime(selectedTime);
                    }
                  }}
                />
              )}
            </View>
          </>
        );
      default:
        return null;
    }
  };

  if (loadingAlert) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading alert details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter alert title"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter alert message"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Schedule Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={scheduleType}
                onValueChange={(itemValue) => setScheduleType(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="One-time" value="one_time" />
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
              </Picker>
            </View>
          </View>
          
          {renderScheduleSettings()}
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#ccc', true: '#bbd6fe' }}
              thumbColor={isActive ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Alert' : 'Create Alert'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },  picker: {
    width: '100%',
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CreateScheduledAlertScreen;