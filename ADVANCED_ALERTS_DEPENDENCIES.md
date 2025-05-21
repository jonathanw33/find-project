# Advanced Alerts Feature - Dependencies

For the Advanced Alerts feature to work correctly, you'll need to add the following dependencies to your project:

```bash
npm install @react-native-community/datetimepicker @react-native-picker/picker @react-native-community/slider
```

or add them directly to your package.json dependencies:

```json
"dependencies": {
  // ... existing dependencies
  "@react-native-community/datetimepicker": "7.6.2",
  "@react-native-picker/picker": "2.6.1",
  "@react-native-community/slider": "4.5.0"
}
```

## Project Structure

The advanced alerts feature adds the following components to your project:

### Services
- `src/services/geofence/geofenceService.ts`: Service for managing geofences
- `src/services/scheduledAlerts/scheduledAlertService.ts`: Service for managing scheduled alerts

### Contexts
- `src/context/GeofenceContext.tsx`: Context provider for geofence functionality
- `src/context/ScheduledAlertContext.tsx`: Context provider for scheduled alerts

### Screens
- Geofence Screens:
  - `src/screens/geofences/GeofencesScreen.tsx`: List of all geofences
  - `src/screens/geofences/CreateGeofenceScreen.tsx`: Create/edit geofences
  - `src/screens/geofences/TrackerGeofencesScreen.tsx`: Link geofences to a tracker
  - `src/screens/geofences/SelectGeofenceScreen.tsx`: Select geofences to link

- Scheduled Alert Screens:
  - `src/screens/scheduledAlerts/TrackerScheduledAlertsScreen.tsx`: List of scheduled alerts for a tracker
  - `src/screens/scheduledAlerts/CreateScheduledAlertScreen.tsx`: Create/edit scheduled alerts

### Backend
- `supabase/migrations/20250521_advanced_alerts/up.sql`: Database migration
- `supabase/functions/check-alerts/index.ts`: Edge function to check for alert conditions
- `.github/workflows/check-alerts.yml`: GitHub Action to trigger alert checks regularly
