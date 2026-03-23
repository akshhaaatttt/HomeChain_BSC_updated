# Webasthetic Home Automation - Feature Analysis & Page Design

## 1. SMART CONTRACT ENDPOINTS ANALYSIS

### Read Operations (View/Query)
- `getDeviceStatus(uint256 roomId, uint256 deviceId)` - Get device value
- `rooms(uint256 roomId)` - Get room details (name, espIP, deviceCount)
- `rooms[roomId].devices[deviceId]` - Get specific device details
- `accessRules[roomId][user]` - Get user access rules

### Write Operations (State Changing)
- `operateDevice(uint256 roomId, uint256 deviceId, uint256 value)` - Control device
- `createRoom(string name, string ip)` - Create new room [SUPER_ADMIN]
- `defineDevice(uint256 roomId, string name, uint256 pin, DeviceType type)` - Add device [SUPER_ADMIN]
- `grantAccess(uint256 roomId, address user, uint256 start, uint256 end, bytes32 role)` - Grant permissions [SUPER_ADMIN]
- `revokeAccess(uint256 roomId, address user, bytes32 role)` - Revoke permissions [SUPER_ADMIN]

### Role Management
- `addSuperAdmin(address newAdmin)` - Add super admin [SUPER_ADMIN]
- `removeSuperAdmin(address admin)` - Remove super admin [SUPER_ADMIN]

### Events (For Real-time Sync)
- `StateChanged(uint256 roomId, uint256 deviceId, uint256 newValue)` - Device status changed
- `AccessUpdated(uint256 roomId, address user, uint256 from, uint256 to, bytes32 role)` - Permission changed
- `RoomCreated(uint256 roomId, string name)` - Room created

---

## 2. BACKEND MIDDLEWARE FEATURES

- **Event Listening**: Subscribes to `StateChanged` events in real-time
- **Event Decoding**: Unpacks 96-byte data (roomId, deviceId, value)
- **MQTT Publishing**: Broadcasts commands to `home/room[ID]/device[ID]`
- **mDNS Discovery**: Auto-finds ESP32 nodes on network
- **Error Recovery**: Handles ABI mismatches gracefully

---

## 3. PAGES & FEATURES REQUIRED

### A. DASHBOARD (Home)
**Purpose**: Real-time device control & status overview
**Features**:
- Room selector with live status indicators
- Device cards with controls (toggle, fan speed, RGB picker)
- Device history/last updated timestamps
- Quick stats (devices online, rooms created, guest sessions active)
- Responsive grid layout with smooth transitions

**Endpoints Used**:
- `getDeviceStatus()` - Poll for device states
- `operateDevice()` - Control devices

---

### B. ROOMS MANAGEMENT
**Purpose**: Create, edit, delete rooms and devices
**Features**:
- List all rooms with device counts
- Add new room (ESP32 IP discovery)
- Device configuration per room
- Device type selection (OnOff, Fan, Dimmer, RGB)
- Pin mapping visualization

**Endpoints Used**:
- `createRoom()` - New room
- `defineDevice()` - New device
- Auto-discovery via mDNS

---

### C. ACCESS CONTROL (RBAC/ABAC)
**Purpose**: Manage user permissions and guest sessions
**Features**:
- User registry with roles (SUPER_ADMIN, ROOM_ADMIN, GUEST)
- Grant access form (user address, room, role, time window)
- Active access rules with revocation buttons
- Countdown timers for guest access expiration
- Audit log of permission changes

**Endpoints Used**:
- `grantAccess()` - Grant permissions
- `revokeAccess()` - Revoke permissions
- `accessRules()` - View active rules
- `AccessUpdated` event - Real-time updates

---

### D. SUPER ADMIN PANEL
**Purpose**: System-level administration
**Features**:
- Admin user management (add/remove super admins)
- System statistics dashboard
- Contract address & network info display
- Transaction history
- Settings & configuration

**Endpoints Used**:
- `addSuperAdmin()` - Add admins
- `removeSuperAdmin()` - Remove admins
- `roomCount` - Total rooms

---

### E. GUEST ACCESS MANAGER
**Purpose**: Time-based guest invitations
**Features**:
- Generate invite links/codes
- Set access duration (hours, days, weeks)
- Pre-configured room presets
- One-click revocation
- Guest activity tracking

**Endpoints Used**:
- `grantAccess()` with time limits
- `revokeAccess()` - Immediate access removal

---

### F. DEVICE HISTORY & ANALYTICS
**Purpose**: Track device usage patterns
**Features**:
- Device activity timeline
- Usage statistics (on/off frequency, duration)
- Peak usage hours chart
- Energy estimation
- Export data

**Endpoints Used**:
- `StateChanged` events - Store historically
- `getDeviceStatus()` - Current state

---

### G. SETTINGS & PROFILE
**Purpose**: User preferences & wallet management
**Features**:
- Connected wallet display
- Theme preference (light/dark)
- Notification settings
- Two-factor authentication (optional)
- Privacy settings

---

## 4. NAVIGATION HIERARCHY

```
├── Dashboard (Home) /
│   ├── Quick Device Control
│   ├── Room Status Cards
│   └── Quick Stats
│
├── Rooms /rooms
│   ├── Room List
│   ├── Device Manager
│   └── mDNS Setup Wizard
│
├── Access Control /access
│   ├── User Registry
│   ├── Permission Grantor
│   ├── Guest Sessions
│   └── Audit Log
│
├── Admin Panel /admin
│   ├── Admin Management
│   ├── System Stats
│   ├── Contract Info
│   └── Transaction History
│
├── Analytics /analytics
│   ├── Device History
│   ├── Usage Charts
│   └── Energy Stats
│
└── Settings /settings
    ├── Profile
    ├── Preferences
    └── Security
```

---

## 5. MODERN UI DESIGN PRINCIPLES

✨ **Minimalist**: No unnecessary elements, clean white space
🎨 **Professional**: Modern color palette, consistent typography
⚡ **Responsive**: Mobile-first, works on all devices
✅ **Accessible**: WCAG compliant, keyboard navigation
🎭 **Animated**: Subtle, purposeful micro-interactions
🔒 **Secure**: Visual feedback for blockchain interactions

---

## 6. COLOR SCHEME

| Purpose | Color | Hex |
|---------|-------|-----|
| Primary | Blue | #007BFF |
| Success | Green | #10B981 |
| Warning | Amber | #F59E0B |
| Danger | Red | #EF4444 |
| Background | White | #FFFFFF |
| Text Primary | Slate | #0F172A |
| Text Secondary | Slate | #64748B |
| Border | Slate | #E2E8F0 |

---

## 7. TYPOGRAPHY HIERARCHY

- **Display**: 2.25rem (Bold) - Page titles
- **H1**: 1.875rem (Bold) - Section titles
- **H2**: 1.5rem (Semibold) - Subsection titles
- **H3**: 1.25rem (Semibold) - Card titles
- **Body**: 1rem (Normal) - Main content
- **Body Small**: 0.875rem (Normal) - Secondary text
- **Label**: 0.875rem (Medium) - Form labels
- **Caption**: 0.75rem (Normal) - Helper text

---

## 8. ANIMATION GUIDELINES

- **Page Load**: fadeIn (150ms)
- **Card Hover**: slideUp (200ms) + shadow increase
- **Button Click**: scale (98%, 150ms)
- **Toggle Switch**: translate (200ms)
- **List Item Entry**: slideInUp (200ms) with stagger
- **Status Changes**: pulse glow (green/red)
- **Loading**: shimmer effect
- **Transitions**: All 200ms ease cubic-bezier(0.4, 0, 0.2, 1)

