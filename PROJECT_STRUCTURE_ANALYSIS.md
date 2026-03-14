# Project Structure Analysis - Non-Web Application Components

This document identifies all portions of the receipt-ai project that are **NOT part of the direct web application**.

## 📱 iOS/Mobile App Development Files

### `/mobile/ios/` Directory
**Purpose:** Contains iOS app development code and documentation (Swift files)

**Contents:**
- `01-setup/README.md` - iOS setup instructions
- `02-project-structure/` - Swift code files:
  - `APIClient.swift` - iOS API client
  - `AuthService.swift` - iOS authentication service
  - `Models.swift` - iOS data models
  - `README.md` - Project structure documentation
- `03-api-integration/README.md` - API integration guide
- `04-authentication/README.md` - Authentication implementation guide
- `05-core-features/` - Core iOS features:
  - `EmailVerificationBanner.swift`
  - `EmailVerificationView.swift`
  - `MainAppView.swift`
  - `README.md`
- `06-testing/README.md` - Testing documentation
- `README.md` - Main iOS documentation

**Status:** These are reference/example files for iOS development, not part of the Next.js web app.

---

## 🛠️ Utility Scripts

### `/scripts/` Directory
**Purpose:** Database maintenance, data migration, testing, and utility scripts

**Scripts:**
- `analyze-csv-data.ts` - CSV data analysis
- `backup-jan-july-data.ts` - Data backup utility
- `check-all-collections.ts` - Database collection checker
- `check-all-invites.ts` - Invite status checker
- `check-membership.ts` - Membership verification
- `check-missing-account-ids.ts` - Account ID validation
- `create-indexes.ts` - Database index creation
- `debug-test-account.ts` - Test account debugging
- `delete-user-data.ts` - User data deletion utility
- `find-test-account.ts` - Test account finder
- `fix-ann-membership.ts` - Membership fix script
- `fix-missing-account-ids.ts` - Account ID fixer
- `fix-missing-membership.ts` - Membership repair
- `import-csv-missing-records.ts` - CSV import utility
- `import-only-missing-records.ts` - Selective import
- `list-pending-invites.ts` - Pending invites lister
- `replace-jan-july-with-csv.ts` - Data replacement script
- `rollback-csv-import.ts` - Import rollback utility
- `search-user-data.ts` - User data search
- `switch-env.js` - Environment switcher
- `test-login.ts` - Login testing script
- `verify-test-account.ts` - Test account verification

**Status:** Development/maintenance tools, not part of the web application runtime.

---

## 🚀 Deployment & Infrastructure Files

### System Startup Scripts
- `startup-pm2-apps.sh` - PM2 process manager startup script for Mac Mini
- `com.kere.pm2-startup.plist` - macOS LaunchDaemon configuration for auto-start
- `example-startup-script.sh` - Example startup script template

**Purpose:** Automatically start PM2 applications on system boot (includes multiple apps: portfolio, kwesiblack, receipt-ai, worknodey)

**Status:** Infrastructure/deployment configuration, not part of the web app code.

---

## 📄 Documentation Files

### Root Level Documentation
- `SETUP_INSTRUCTIONS.md` - PM2 auto-startup setup instructions
- `README.md` - Project documentation (may contain web app info, but also general project info)

**Status:** Documentation, not executable code.

---

## 🐛 Debug/Test Artifacts

### Bug Reports
~~- `bugreport-sdk_gphone64_arm64-BP41.250822.007-2025-10-03-22-37-08.zip` (5.3 MB)~~ ✅ **REMOVED**
~~- `bugreport-sdk_gphone64_arm64-BP41.250822.007-2025-10-03-22-38-14.zip` (5.6 MB)~~ ✅ **REMOVED**

**Purpose:** Android device bug reports (likely from testing mobile app)

**Status:** ~~Debug artifacts, should be removed or moved to separate location.~~ ✅ **Removed**

---

## 📁 Build Artifacts & Dependencies

### Build Output
- `.next/` - Next.js build output directory (generated, should be in .gitignore)

### Dependencies
- `node_modules/` - npm dependencies (generated, should be in .gitignore)

### TypeScript Build Info
- `tsconfig.tsbuildinfo` - TypeScript incremental build cache

**Status:** Generated files, not source code.

---

## 🔧 Configuration Files (Non-Runtime)

### Environment & Config
- `.env.local` - Local environment variables (sensitive, should not be committed)
- `env.example` - Example environment file ✅ (`.env.local.example` removed)
- `.nvmrc` - Node version manager configuration
- `.gitignore` - Git ignore rules

### Next.js Config
- `next.config.mjs` - Next.js configuration ✅
- ~~`next.config.ts` - TypeScript Next.js config (duplicate?)~~ ✅ **REMOVED**
- `next-env.d.ts` - Next.js TypeScript definitions (generated, now ignored)

### ~~Middleware Backup~~ ✅ **REMOVED**
- ~~`middleware.ts.backup` - Backup of middleware file~~

**Status:** ~~Configuration files, not part of application logic.~~ ✅ **Removed**

---

## 📂 Miscellaneous Directories

### ~~`/RecieptAI/` Directory~~ ✅ **REMOVED**
- ~~Empty or minimal directory structure~~
- ~~Appeared to be a duplicate or old folder structure~~

**Status:** ~~Likely obsolete, should be reviewed for removal.~~ ✅ **Removed - contained only iOS asset config file**

### ~~`/img/` Directory~~ ✅ **REMOVED**
- ~~Contains `no-wahala.png` - Logo/image asset~~
- ~~Also exists in `/public/` (which is the correct location for Next.js)~~

**Status:** ~~May be duplicate assets, should consolidate with `/public/`.~~ ✅ **Removed - duplicate of `/public/`**

---

## 📊 Summary

### Direct Web Application Components (KEEP):
- `/app/` - Next.js application code (pages, API routes, components)
- `/lib/` - Shared library code (utilities, services)
- `/public/` - Static assets served by Next.js
- `/styles/` - CSS stylesheets
- `/types/` - TypeScript type definitions
- `middleware.ts` - Next.js middleware
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Non-Web Application Components (CAN BE MOVED/REMOVED):
1. **iOS Development Files** (`/mobile/ios/`) - Reference code for mobile app
2. **Utility Scripts** (`/scripts/`) - Database/maintenance tools
3. **Deployment Scripts** (`.sh`, `.plist` files) - Infrastructure setup
4. **Documentation** (`SETUP_INSTRUCTIONS.md`) - Setup guides
5. **Bug Reports** (`.zip` files) - Debug artifacts
6. **Build Artifacts** (`.next/`, `node_modules/`) - Generated files
7. ~~**Duplicate Assets** (`/img/`, `/RecieptAI/`) - Redundant directories~~ ✅ **REMOVED**

### Recommendations:
1. **Move iOS files** to a separate repository or `/mobile/ios/` subdirectory
2. **Move scripts** to `/tools/` or `/scripts/` (keep but document as dev tools)
3. ~~**Remove bug reports** or move to `/debug/` directory~~ ✅ **COMPLETED**
4. ~~**Clean up duplicates** - consolidate image assets, remove empty directories~~ ✅ **COMPLETED**
5. **Update .gitignore** to ensure build artifacts aren't committed
6. **Document** which scripts are for development vs. production use

---

## File Size Impact

**Large files that could be removed:**
- ~~Bug report ZIPs: ~11 MB total~~ ✅ **REMOVED**
- `node_modules/`: Typically 100+ MB (should be in .gitignore)
- `.next/`: Build output (should be in .gitignore)

**Total estimated cleanup:** ~11 MB removed, ~100+ MB remaining (build artifacts)
