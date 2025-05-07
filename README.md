# FIND System - Fast, Intelligent, Navigable, Dependable

FIND is a next-generation smart tracking system designed to prevent and find lost items. The system combines IoT technology, artificial intelligence, and cloud computing to provide users with real-time tracking, preventive alerts, and item recovery options.

## Project Structure

```
find-project/
├── mobile-app/           # React Native app for users
├── admin-portal/         # React-based web app for administrators (future)
├── iot-firmware/         # ESP32 Arduino/PlatformIO code (future)
├── supabase/             # Supabase database setup and schema
└── shared/               # Shared types, utilities, etc.
```

## Features

- **User Authentication**: Secure login and registration
- **Tracker Management**: Add, configure, and manage physical and virtual trackers
- **Location Tracking**: Real-time mapping and history of tracker locations
- **Dummy Mode**: Test app features without physical trackers
- **Alert System**: Notifications for potential lost items or unusual movement
- **User Profiles and Settings**: Personalized experience and preferences

## Technology Stack

- **Mobile App**: React Native, TypeScript, Redux Toolkit
- **Backend**: Supabase (Authentication, Database, Storage)
- **Maps**: Google Maps integration
- **IoT**: ESP32 (future implementation)

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- React Native development environment
- Supabase account

### Mobile App Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/find-project.git
   cd find-project/mobile-app
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. Start the development server:
   ```
   npm start
   # or
   yarn start
   ```

### Supabase Setup

1. Create a new Supabase project
2. Execute the SQL schema in `supabase/schema.sql` in the SQL Editor
3. Configure authentication (email/password)
4. Set up storage buckets (if needed)

## Development Phases

### Phase 1: Core Mobile App (Current)

- User authentication system
- Basic profile management
- Dummy mode implementation
- Basic map interface
- Simple alert simulation

### Phase 2: Enhanced Features (Next)

- Improved tracking visualization
- Advanced alert configurations
- Location history analytics
- Settings and preferences management

### Phase 3: IoT Integration (Future)

- ESP32 firmware development
- Physical device pairing
- Battery optimization
- Real hardware tracking

### Phase 4: Admin Portal and Logistics (Future)

- Web-based admin interface
- User management tools
- Logistics service integration
- Analytics dashboard

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.