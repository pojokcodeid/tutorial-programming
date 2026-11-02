# Roadmap Belajar React Native dari 0 sampai Mahir

> **Asumsi:** JavaScript (termasuk ES6+) dan dasar React.js sudah dikuasai. Roadmap ini berfokus pada React Native, pengembangan aplikasi mobile, arsitektur, pengujian, dan deployment.
>
> **Target:** Mampu membangun aplikasi Android dan iOS yang maintainable, performant, serta siap dipublikasikan.
>
> **Estimasi:** 5–8 bulan dengan belajar dan praktik 1–2 jam per hari. Durasi dapat disesuaikan dengan pengalaman dan intensitas latihan.

---

## Daftar Isi

1. [Persiapan dan TypeScript](#level-0--persiapan-dan-typescript)
2. [React Native Fundamentals](#level-1--react-native-fundamentals)
3. [Navigation dan Routing](#level-2--navigation-dan-routing)
4. [API Integration dan State Management](#level-3--api-integration-dan-state-management)
5. [Storage, Authentication, dan Native Features](#level-4--storage-authentication-dan-native-features)
6. [UI/UX dan Design System](#level-5--uiux-dan-design-system)
7. [Advanced React Native](#level-6--advanced-react-native)
8. [Architecture dan Maintainability](#level-7--architecture-dan-maintainability)
9. [Testing dan Debugging](#level-8--testing-dan-debugging)
10. [Build, Deployment, dan Production](#level-9--build-deployment-dan-production)
11. [Roadmap Project](#roadmap-project)
12. [Jadwal Belajar](#jadwal-belajar)
13. [Checklist Kompetensi Akhir](#checklist-kompetensi-akhir)
14. [Referensi Resmi](#referensi-resmi)

---

## Level 0 — Persiapan dan TypeScript

Karena JavaScript dan dasar React sudah dipelajari, bagian ini cukup berupa review dan penyesuaian untuk pengembangan mobile.

### 0.1 Review JavaScript yang relevan

- [ ] ES Modules: `import` dan `export`
- [ ] Destructuring
- [ ] Spread dan Rest Operator
- [ ] Array methods: `map`, `filter`, `find`, `reduce`
- [ ] Optional chaining (`?.`)
- [ ] Nullish coalescing (`??`)
- [ ] Promise dan `async/await`
- [ ] Error handling dengan `try/catch`
- [ ] Fetch API
- [ ] Immutability
- [ ] Closures dan scope

### 0.2 TypeScript untuk React Native

- [ ] Type annotations
- [ ] `type` dan `interface`
- [ ] Union dan intersection types
- [ ] Generic
- [ ] Type narrowing
- [ ] Utility types
- [ ] Type inference
- [ ] Typing props dan state
- [ ] Typing event dan callback
- [ ] Typing API response
- [ ] Typing navigation parameters
- [ ] Typing custom hooks

**Latihan:** Buat model TypeScript untuk user, produk, transaksi, dan response API.

---

## Level 1 — React Native Fundamentals

### 1.1 Pengenalan React Native

- [ ] Konsep React Native dan cara kerjanya
- [ ] Perbedaan React Native, React DOM, dan native app
- [ ] React Native Architecture
- [ ] New Architecture
- [ ] Hermes JavaScript Engine
- [ ] Metro Bundler
- [ ] Expo vs React Native Community CLI
- [ ] Native rendering dan platform differences

### 1.2 Setup Development Environment

- [ ] Node.js dan package manager (npm, pnpm, atau yarn)
- [ ] Expo CLI dan project Expo
- [ ] Android Studio
- [ ] Android SDK dan Emulator
- [ ] Menjalankan aplikasi di perangkat fisik
- [ ] iOS Simulator (macOS)
- [ ] Expo Go
- [ ] Development Build
- [ ] Debugging environment
- [ ] Memahami struktur project

**Rekomendasi awal:** gunakan Expo untuk mempercepat setup dan pengembangan. Pelajari bare/native workflow ketika kebutuhan aplikasi mengharuskannya.

### 1.3 Core Components

- [ ] `View`
- [ ] `Text`
- [ ] `Image`
- [ ] `TextInput`
- [ ] `Pressable`
- [ ] `Button`
- [ ] `ScrollView`
- [ ] `FlatList`
- [ ] `SectionList`
- [ ] `Modal`
- [ ] `ActivityIndicator`
- [ ] `Switch`
- [ ] `StatusBar`
- [ ] `KeyboardAvoidingView`
- [ ] Safe Area dengan `react-native-safe-area-context`

### 1.4 Styling dan Layout

- [ ] `StyleSheet.create`
- [ ] Flexbox di React Native
- [ ] `flex`, `flexDirection`
- [ ] `justifyContent`, `alignItems`, `alignSelf`
- [ ] `flexWrap` dan `gap`
- [ ] Padding dan margin
- [ ] Width dan height
- [ ] Position: relative dan absolute
- [ ] Border dan radius
- [ ] Shadow/elevation Android dan iOS
- [ ] Typography
- [ ] Color system
- [ ] Responsive layout
- [ ] Dimensions dan window size
- [ ] Safe area
- [ ] Keyboard-aware layout
- [ ] Platform-specific styling

### 1.5 Platform Fundamentals

- [ ] `Platform.OS`
- [ ] `Platform.select`
- [ ] File khusus platform (`.ios.tsx`, `.android.tsx`)
- [ ] Perbedaan Android dan iOS
- [ ] Permission dasar
- [ ] Status bar dan navigation bar
- [ ] Keyboard behavior
- [ ] App lifecycle
- [ ] Accessibility dasar

**Project latihan:**
- [ ] Calculator App
- [ ] Login dan Register UI
- [ ] Profile App
- [ ] Product Listing UI
- [ ] Dashboard sederhana

---

## Level 2 — Navigation dan Routing

### 2.1 Expo Router

- [ ] File-based routing
- [ ] Folder `app`
- [ ] `index.tsx`
- [ ] `_layout.tsx`
- [ ] Stack navigation
- [ ] Tab navigation
- [ ] Drawer navigation
- [ ] Dynamic routes
- [ ] Route parameters
- [ ] Query parameters
- [ ] Nested layouts
- [ ] Modal routes
- [ ] Typed routes
- [ ] Deep linking
- [ ] Navigation guard
- [ ] Protected routes
- [ ] Authentication flow

### 2.2 Alternatif Navigation

- [ ] Konsep React Navigation
- [ ] Stack Navigator
- [ ] Bottom Tab Navigator
- [ ] Drawer Navigator
- [ ] Nested Navigator
- [ ] Navigation state
- [ ] Linking configuration

> Pilih Expo Router atau React Navigation sesuai kebutuhan. Pahami konsep navigasi dan tidak perlu mendalami keduanya secara bersamaan di awal.

**Project latihan:**
- [ ] Multi-screen Profile App
- [ ] News App dengan detail artikel
- [ ] Tabbed Dashboard
- [ ] Authentication flow dengan protected screen

---

## Level 3 — API Integration dan State Management

### 3.1 Networking dan REST API

- [ ] HTTP methods dan status codes
- [ ] Fetch API
- [ ] Axios
- [ ] Headers dan query parameters
- [ ] Request/response interceptors
- [ ] Loading, success, dan error state
- [ ] Error handling terstruktur
- [ ] Pagination
- [ ] Infinite scroll
- [ ] Pull to refresh
- [ ] Request cancellation
- [ ] Retry mechanism
- [ ] API caching
- [ ] Environment variables
- [ ] API client abstraction

### 3.2 Server State

- [ ] Konsep server state
- [ ] TanStack Query
- [ ] Query dan mutation
- [ ] Query keys
- [ ] Cache invalidation
- [ ] Optimistic updates
- [ ] Pagination dan infinite queries
- [ ] Refetch strategy
- [ ] Error dan retry policy

### 3.3 Client State

- [ ] Local state dengan `useState`
- [ ] Context API
- [ ] Zustand
- [ ] Redux Toolkit
- [ ] Global state
- [ ] State persistence
- [ ] Pemisahan client state dan server state
- [ ] Pemilihan state management berdasarkan kebutuhan

**Project latihan:**
- [ ] Weather App
- [ ] Movie Catalog
- [ ] News Application
- [ ] Product Catalog dengan pagination dan caching

---

## Level 4 — Storage, Authentication, dan Native Features

### 4.1 Authentication

- [ ] Login dan register
- [ ] JWT access token
- [ ] Refresh token
- [ ] Secure token storage
- [ ] Session persistence
- [ ] Logout dan token invalidation
- [ ] Protected routes
- [ ] Biometric authentication
- [ ] OAuth/social login
- [ ] Authentication error handling

### 4.2 Local Storage dan Database

- [ ] AsyncStorage
- [ ] Expo SecureStore
- [ ] SQLite
- [ ] File System
- [ ] Data serialization
- [ ] Local database schema
- [ ] Offline data
- [ ] Data synchronization
- [ ] Offline-first concepts
- [ ] Conflict resolution dasar

### 4.3 Form dan Validation

- [ ] Controlled form
- [ ] React Hook Form
- [ ] Zod
- [ ] Form validation
- [ ] Error messages
- [ ] Dynamic form
- [ ] Multi-step form
- [ ] File upload
- [ ] Image upload
- [ ] Keyboard handling

### 4.4 Native Device Features

- [ ] Camera
- [ ] Image picker
- [ ] Image manipulation
- [ ] GPS/location
- [ ] Maps
- [ ] Push notifications
- [ ] Local notifications
- [ ] Clipboard
- [ ] Haptic feedback
- [ ] Device information
- [ ] App permissions
- [ ] File download/upload
- [ ] Share API
- [ ] QR/barcode scanner
- [ ] Contacts (sesuai kebutuhan)
- [ ] Background tasks (sesuai batasan platform)

**Project latihan:**
- [ ] Notes App dengan SQLite
- [ ] Expense Tracker
- [ ] Attendance App dengan GPS
- [ ] Document Management App
- [ ] Shopping Cart App

---

## Level 5 — UI/UX dan Design System

### 5.1 UI/UX Mobile

- [ ] Mobile design principles
- [ ] Touch target dan gesture
- [ ] Safe area
- [ ] Responsive layout
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Skeleton loading
- [ ] Accessibility
- [ ] Dark mode
- [ ] Keyboard-aware UI
- [ ] Platform-specific UX

### 5.2 Design System

- [ ] Design tokens
- [ ] Color palette
- [ ] Typography scale
- [ ] Spacing scale
- [ ] Reusable components
- [ ] Button variants
- [ ] Input variants
- [ ] Modal dan bottom sheet
- [ ] Theme provider
- [ ] Light/dark theme
- [ ] Component documentation

### 5.3 UI Libraries (Opsional)

Pelajari satu library terlebih dahulu sesuai kebutuhan:

- [ ] React Native Paper
- [ ] NativeWind
- [ ] Tamagui
- [ ] UI Kitten atau library alternatif

**Project latihan:**
- [ ] Bangun reusable component library
- [ ] Implementasi design system dari mockup
- [ ] Dark mode pada aplikasi yang sudah dibuat

---

## Level 6 — Advanced React Native

### 6.1 Animation dan Gesture

- [ ] Animated API
- [ ] Animated values
- [ ] Interpolation
- [ ] Layout animation
- [ ] React Native Gesture Handler
- [ ] React Native Reanimated
- [ ] Shared values
- [ ] Worklets
- [ ] Gesture-based animation
- [ ] Transition animation
- [ ] Animation performance

### 6.2 Performance Optimization

- [ ] Memahami rendering React
- [ ] Component re-render
- [ ] `React.memo`
- [ ] `useMemo`
- [ ] `useCallback`
- [ ] FlatList optimization
- [ ] FlashList atau list virtualization alternatif
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Lazy loading
- [ ] Memory management
- [ ] JS thread dan UI thread
- [ ] FPS dan frame drops
- [ ] Profiling
- [ ] Release build profiling

### 6.3 Networking Lanjutan

- [ ] WebSocket
- [ ] Socket.IO
- [ ] Real-time communication
- [ ] Network connectivity detection
- [ ] Background sync
- [ ] Offline queue
- [ ] Conflict resolution
- [ ] Reconnection strategy

### 6.4 Native Development

- [ ] React Native New Architecture
- [ ] JSI
- [ ] Fabric
- [ ] TurboModules
- [ ] Codegen
- [ ] Native modules
- [ ] Expo Modules API
- [ ] Kotlin fundamentals
- [ ] Swift fundamentals
- [ ] Android native integration
- [ ] iOS native integration
- [ ] Custom native components
- [ ] Native dependency troubleshooting

**Project latihan:**
- [ ] Chat Application
- [ ] Real-time Dashboard
- [ ] Offline-first Task Management
- [ ] Custom native module sederhana

---

## Level 7 — Architecture dan Maintainability

### 7.1 Struktur Aplikasi

- [ ] Feature-based architecture
- [ ] Separation of concerns
- [ ] Component composition
- [ ] Custom hooks
- [ ] Service layer
- [ ] API layer
- [ ] Repository pattern
- [ ] Shared utilities
- [ ] Constants dan configuration
- [ ] Type definitions
- [ ] Dependency management

### 7.2 Clean Code dan Design

- [ ] SOLID principles
- [ ] DRY dan KISS
- [ ] Composition over inheritance
- [ ] Design patterns yang relevan
- [ ] Dependency injection (bila diperlukan)
- [ ] Domain layer
- [ ] Data layer
- [ ] Presentation layer
- [ ] Modular architecture
- [ ] Scalability
- [ ] Maintainability
- [ ] Refactoring

### 7.3 Contoh Struktur Project

```text
my-app/
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   ├── products/
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── ui/
│   │   └── common/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   └── products/
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── utils/
│   ├── constants/
│   └── types/
├── assets/
├── tests/
└── package.json
```

> Struktur di atas adalah contoh, bukan aturan wajib. Sesuaikan dengan skala aplikasi dan tim.

---

## Level 8 — Testing dan Debugging

### 8.1 Testing

- [ ] Unit testing
- [ ] Component testing
- [ ] Integration testing
- [ ] End-to-end testing
- [ ] Mock API
- [ ] Mock native modules
- [ ] Testing hooks
- [ ] Testing navigation
- [ ] Testing authentication
- [ ] Testing error handling
- [ ] Test coverage dan test strategy

### 8.2 Tools

- [ ] Jest
- [ ] React Native Testing Library
- [ ] Maestro
- [ ] Detox (opsional, sesuai kebutuhan)
- [ ] Mock Service Worker atau mock API alternatif

### 8.3 Debugging

- [ ] React Native DevTools
- [ ] Hermes debugger
- [ ] Network debugging
- [ ] Native logs
- [ ] Android Logcat
- [ ] iOS Console
- [ ] Crash analysis
- [ ] Performance profiling
- [ ] Memory profiling
- [ ] Debugging release build

**Praktik:** tambahkan unit test dan end-to-end test pada project Expense Tracker atau E-commerce.

---

## Level 9 — Build, Deployment, dan Production

### 9.1 Build

- [ ] Development build
- [ ] Preview build
- [ ] Production build
- [ ] Android APK
- [ ] Android AAB
- [ ] iOS IPA
- [ ] Application signing
- [ ] Android keystore
- [ ] iOS certificates dan provisioning
- [ ] App versioning
- [ ] Build configuration
- [ ] Environment configuration

### 9.2 CI/CD

- [ ] Git dan branching workflow
- [ ] GitHub Actions
- [ ] EAS Build
- [ ] EAS Submit
- [ ] Automated testing
- [ ] Build automation
- [ ] Release automation
- [ ] OTA updates
- [ ] Deployment workflow
- [ ] Secrets management

### 9.3 Production Readiness

- [ ] Application security
- [ ] API security
- [ ] Secure storage
- [ ] Environment variables
- [ ] Logging
- [ ] Analytics
- [ ] Crash reporting
- [ ] Monitoring
- [ ] Privacy policy
- [ ] App Store guidelines
- [ ] Google Play guidelines
- [ ] Permission disclosure
- [ ] Production checklist

**Project akhir:** bangun aplikasi mobile lengkap, lakukan testing, build release, dan publikasikan ke Google Play (serta App Store jika tersedia perangkat dan akun yang diperlukan).

---

## Roadmap Project

Urutan project berikut membantu menerapkan materi secara bertahap.

| No. | Project | Level | Materi Utama |
|---|---|---|---|
| 1 | Todo App | Beginner | Components, state, styling, FlatList |
| 2 | Weather App | Beginner | API, async/await, loading, error |
| 3 | News App | Beginner–Intermediate | Routing, API, pagination |
| 4 | E-commerce App | Intermediate | Auth, state, API, cart, form |
| 5 | Expense Tracker | Intermediate | SQLite, chart, form, offline |
| 6 | Attendance App | Intermediate–Advanced | GPS, camera, API, offline |
| 7 | Chat App | Advanced | WebSocket, real-time, notifications |
| 8 | Enterprise Mobile App | Professional | Architecture, testing, CI/CD, production |

### Kriteria Project Portfolio

Setiap project sebaiknya memiliki:

- [ ] README dan dokumentasi setup
- [ ] UI yang konsisten
- [ ] TypeScript
- [ ] Error dan loading handling
- [ ] Struktur folder yang jelas
- [ ] API integration (jika relevan)
- [ ] Testing dasar
- [ ] Screenshot aplikasi
- [ ] Demo atau video singkat
- [ ] Build yang dapat dijalankan

---

## Jadwal Belajar

Estimasi berikut untuk praktik sekitar 1–2 jam per hari.

| Periode | Fokus | Output |
|---|---|---|
| Bulan 1 | TypeScript review, setup, core components, styling | Calculator dan Profile App |
| Bulan 2 | Navigation, routing, API, state management | News App |
| Bulan 3 | Auth, storage, forms, native features | Expense Tracker |
| Bulan 4 | UI/UX, design system, offline basics | Attendance App |
| Bulan 5 | Animation, performance, architecture | Chat App atau aplikasi real-time |
| Bulan 6 | Testing, CI/CD, deployment | Aplikasi production-ready |
| Bulan 7–8 | Pendalaman dan polishing | Portfolio dan publikasi |

---

## Checklist Kompetensi Akhir

### React Native
- [ ] Memahami core components dan styling
- [ ] Menguasai layout dan responsive UI
- [ ] Memahami perbedaan Android dan iOS
- [ ] Menguasai navigation dan deep linking

### Application Development
- [ ] Mengintegrasikan REST API
- [ ] Mengelola client state dan server state
- [ ] Membuat authentication flow
- [ ] Menggunakan local storage/database
- [ ] Mengintegrasikan native device features
- [ ] Membuat aplikasi offline-first dasar

### Advanced
- [ ] Mengoptimalkan rendering dan performa
- [ ] Membuat animasi dan gesture
- [ ] Memahami native modules
- [ ] Merancang architecture yang maintainable

### Production
- [ ] Menulis unit/component test
- [ ] Melakukan end-to-end testing
- [ ] Debugging Android dan iOS
- [ ] Build aplikasi release
- [ ] Menggunakan CI/CD
- [ ] Memahami proses publikasi dan monitoring

---

## Referensi Resmi

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Documentation](https://react.dev/learn)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Navigation](https://reactnavigation.org/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [React Native Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
- [Maestro](https://maestro.mobile.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)

---

## Catatan Belajar

1. **Utamakan praktik.** Setiap materi sebaiknya langsung diterapkan dalam mini project.
2. **Jangan mempelajari semua library sekaligus.** Pilih satu solusi untuk kebutuhan tertentu, lalu pahami konsepnya.
3. **Gunakan TypeScript sejak awal project.**
4. **Pelajari Android terlebih dahulu jika perangkat iOS belum tersedia**, tetapi tetap pahami perbedaan platform.
5. **Uji di perangkat fisik.** Emulator tidak selalu mewakili behavior perangkat sebenarnya.
6. **Pelajari native development secara bertahap.** Tidak harus menguasai Kotlin dan Swift sebelum mulai membuat aplikasi React Native.
7. **Selesaikan project sampai build release.** Jangan berhenti pada tampilan yang berjalan di development mode.

> **Target akhir:** mampu merancang, membangun, menguji, mengoptimalkan, dan merilis aplikasi mobile Android/iOS dengan React Native secara mandiri.
