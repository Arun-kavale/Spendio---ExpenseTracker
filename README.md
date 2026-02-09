# Spendio

A production-quality React Native mobile application for personal expense tracking. Built with a local-first architecture, this app works completely offline while offering optional Google Drive backup.

## Features

### Core Features
- **Local-First Data**: All data stored locally using MMKV for instant performance
- **Works Offline**: Full functionality without internet connection
- **Beautiful Dashboard**: Analytics with line charts, pie charts, and bar charts
- **Expense Management**: Add, edit, delete, search, and filter expenses
- **Category Management**: Customizable categories with icons and colors
- **Date Filtering**: Today, week, month, year, and custom date ranges

### Analytics
- Monthly expense trends
- Category-wise spending breakdown
- Daily spending patterns
- Month-over-month comparison
- Average daily spend calculations

### Optional Cloud Features
- Google Sign-In (optional)
- Google Drive backup to App Data folder
- Auto-backup on app background
- Conflict resolution (replace, merge, keep local)
- Manual backup & restore

### Export Options
- Export to CSV (spreadsheet format)
- Export to JSON (developer format)
- Full backup export including settings

### Customization
- Light & Dark mode (+ system preference)
- 30+ currency options
- Custom categories with 80+ icons and 20+ colors

## Tech Stack

- **React Native** - Cross-platform mobile development
- **TypeScript** - Type safety
- **Zustand** - State management
- **MMKV** - Ultra-fast local storage
- **React Navigation** - Navigation
- **React Native Reanimated** - Smooth animations
- **React Native SVG** - Charts and graphics
- **React Native Paper** - Material Design components
- **date-fns** - Date manipulation

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── EmptyState.tsx
│   │   ├── CategoryIcon.tsx
│   │   └── ScreenHeader.tsx
│   ├── charts/          # Chart components
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   └── BarChart.tsx
│   └── expense/         # Expense-specific components
│       ├── ExpenseCard.tsx
│       ├── DateFilterChips.tsx
│       └── CategoryPicker.tsx
├── constants/
│   ├── categories.ts    # Default categories, icons, colors
│   └── currencies.ts    # Currency definitions
├── hooks/
│   ├── useTheme.ts      # Theme hook
│   └── useCurrency.ts   # Currency formatting hook
├── navigation/
│   ├── RootNavigator.tsx
│   └── TabNavigator.tsx
├── screens/
│   ├── Dashboard/       # Analytics dashboard
│   ├── Expenses/        # Expense list, add, details
│   ├── Categories/      # Category management
│   └── Settings/        # App settings, backup, about
├── services/
│   ├── storage/         # MMKV storage abstraction
│   ├── auth/            # Google authentication
│   └── backup/          # Google Drive backup, export
├── store/
│   ├── settingsStore.ts # App settings state
│   ├── categoryStore.ts # Categories state
│   └── expenseStore.ts  # Expenses state with analytics
├── theme/
│   ├── colors.ts        # Light and dark color palettes
│   ├── typography.ts    # Font styles
│   └── spacing.ts       # Spacing and border radius
├── types/
│   └── index.ts         # TypeScript type definitions
└── utils/
    ├── formatters.ts    # Date and number formatters
    └── validators.ts    # Input validation
```

## Getting Started

### Prerequisites

- Node.js 18+
- React Native development environment set up
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

1. Clone the repository:
```bash
cd Spendio
```

2. Install dependencies:
```bash
npm install
```

3. Install iOS pods:
```bash
cd ios && pod install && cd ..
```

4. Configure Google Sign-In (optional):
   - Create a project in Google Cloud Console
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Update `webClientId` in `src/services/auth/googleAuth.ts`
   - Follow platform-specific setup for @react-native-google-signin/google-signin

### Running the App

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

## Configuration

### Google Drive Backup Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials (Web & iOS/Android)
5. Update configuration in `src/services/auth/googleAuth.ts`:
```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  // ...
});
```

### Adding Custom Categories

Categories can be added through the app UI or by modifying `src/constants/categories.ts`.

### Adding New Currencies

Add new currencies in `src/constants/currencies.ts`:
```typescript
{
  code: 'XYZ',
  symbol: '¤',
  name: 'Currency Name',
  decimalPlaces: 2,
  symbolPosition: 'before',
}
```

## Data Storage

All data is stored locally using MMKV:
- **Expenses**: Complete expense history
- **Categories**: System + custom categories
- **Settings**: Theme, currency, backup preferences

Data is encrypted with MMKV's built-in encryption.

## Privacy

- All data stays on your device by default
- No analytics or tracking
- Google Drive backup is optional and user-initiated
- Backup data goes to your personal Drive App Data folder (hidden from normal view)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `npm run lint`
5. Run type checking: `npm run type-check`
6. Submit a pull request

## License

MIT License - feel free to use this for personal or commercial projects.

## Acknowledgments

- Icons from Material Community Icons
- Charts inspired by Victory Native
- Design patterns from modern fintech apps
# Spendio---ExpenseTracker
