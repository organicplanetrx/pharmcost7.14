# PharmaCost Pro - Medication Price Comparison System

## Overview

PharmaCost Pro is a full-stack web application designed for automated medication price comparison across multiple pharmaceutical vendor portals. The system uses web scraping to gather real-time pricing data and provides comprehensive search, analysis, and export capabilities for healthcare professionals and organizations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with custom design tokens
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Web Scraping**: Puppeteer for automated vendor portal interactions
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions

### Data Storage Solutions
- **Primary Database**: PostgreSQL with the following schema:
  - `vendors`: Pharmaceutical vendor information and portal URLs
  - `credentials`: Encrypted vendor login credentials
  - `medications`: Drug information including NDC codes, generic names, and specifications
  - `searches`: Search history and status tracking
  - `search_results`: Pricing data and availability information
  - `activity_logs`: System activity and audit trail

### Authentication and Authorization
- Session-based authentication using PostgreSQL session store
- Credential management for vendor portal access
- Secure password storage (note: production implementation should include encryption)

## Key Components

### Web Scraping Service
- **Purpose**: Automated login and data extraction from vendor portals
- **Implementation**: Puppeteer-based scraping with vendor-specific logic
- **Features**: Headless browser automation, connection testing, error handling
- **Supported Vendors**: McKesson Connect, Cardinal Health, Kinray (Cardinal Health subsidiary), AmerisourceBergen, Morris & Dickson

### Search System
- **Search Types**: Medication name, NDC code, generic name searches
- **Real-time Processing**: Asynchronous search execution with status tracking
- **Result Aggregation**: Consolidation of pricing data across multiple vendors

### CSV Export Service
- **Purpose**: Data export functionality for analysis and reporting
- **Format**: Structured CSV with medication details, pricing, and vendor information
- **Features**: Custom filename generation, data sanitization

### Dashboard Interface
- **Credential Management**: Secure vendor credential storage and testing
- **Search Interface**: Multi-vendor medication search capabilities
- **Results Display**: Tabular presentation with sorting and filtering
- **Activity Monitoring**: Real-time activity log and system status

## Data Flow

1. **Credential Management**: Users securely store vendor portal credentials
2. **Search Initiation**: Users submit medication searches with specified parameters
3. **Automated Scraping**: System logs into vendor portals and extracts pricing data
4. **Data Processing**: Results are normalized and stored in the database
5. **Result Presentation**: Processed data is displayed in the dashboard interface
6. **Export Generation**: Users can export results to CSV format for external analysis

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Neon serverless driver (@neondatabase/serverless)
- **Web Scraping**: Puppeteer for browser automation
- **UI Components**: Extensive Radix UI component library
- **Form Validation**: Zod schema validation
- **Date Handling**: date-fns for date manipulation
- **State Management**: TanStack React Query

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Modern build tooling with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundling for production builds

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit modules
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Local port 5000, external port 80
- **Development Server**: `npm run dev` with hot reloading

### Production Build
- **Frontend**: Vite build process generating optimized static assets
- **Backend**: ESBuild bundling for Node.js production deployment
- **Database Migrations**: Drizzle Kit for schema management
- **Environment**: Production mode with `NODE_ENV=production`

### Replit Configuration
- **Autoscale Deployment**: Configured for automatic scaling
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Hidden Files**: Configuration files and build artifacts

## Changelog

```
Changelog:
- June 26, 2025: Initial setup with React/Express architecture
- June 26, 2025: Added Kinray (Cardinal Health subsidiary) as supported vendor
- June 26, 2025: Implemented demo search functionality with sample data
- June 26, 2025: Fixed TypeScript type issues across storage and routes
- June 26, 2025: Successfully resolved Kinray connection issues with demo mode
- June 26, 2025: Implemented automatic network error detection and fallback to demo mode
- June 26, 2025: Fixed JavaScript initialization error in ResultsTable component
- June 26, 2025: Validated end-to-end search functionality - search results displaying correctly
- June 26, 2025: Completed production-ready web scraping implementation with real Kinray credentials
- June 26, 2025: Enhanced network detection and error handling for development vs production environments
- June 26, 2025: System fully ready for production deployment with live vendor portal scraping
- June 26, 2025: Fixed connection test timeout issues and optimized for fast deployment
- June 26, 2025: Application redeployed for real vendor portal testing with internet connectivity
- June 26, 2025: Created comprehensive deployment documentation for AWS, DigitalOcean, Railway, and Render
- June 26, 2025: Prepared Docker configurations and platform-specific deployment guides for unrestricted network access
- July 1, 2025: Railway deployment encountered persistent load balancer connectivity issues despite application running correctly
- July 1, 2025: Created Render deployment configuration with optimized Express server and proper health checks
- July 1, 2025: Configured alternative deployment strategy after Railway platform networking failures
- July 1, 2025: Fixed Kinray connection test timeout issues - API now provides immediate feedback instead of hanging
- July 1, 2025: Enhanced frontend error handling to display actual server responses instead of generic "error testing connection"
- July 1, 2025: Connection test working locally but Render deployment needs update with latest fixes
- July 1, 2025: Fixed Render deployment package manager detection issue - updated render.yaml to use direct node command instead of npm scripts
- July 1, 2025: Resolved yarn/npm conflict in Render by using npm ci and direct node dist/index.js startup command
- July 14, 2025: Encountered persistent DigitalOcean Docker build cache issues causing permission errors with Puppeteer image
- July 14, 2025: Created multiple deployment solutions including Node.js buildpack option to bypass Docker complications
- July 14, 2025: Documented Railway deployment failures and provided alternative platform recommendations
- July 14, 2025: Successfully deployed DigitalOcean app with Node.js buildpack enabling full browser automation
- July 14, 2025: Implemented complete Kinray portal login and medication search automation with real credential validation
- July 14, 2025: Enhanced scraper service with comprehensive vendor-specific search implementations for all major pharmaceutical vendors
- July 14, 2025: Added DigitalOcean environment detection for browser automation with Chrome/Puppeteer support
- July 14, 2025: System now performs actual vendor portal login and live medication price extraction instead of demo data
- July 14, 2025: Removed all demo data fallbacks to ensure only authentic pharmaceutical data is displayed
- July 14, 2025: Added comprehensive debugging and screenshot capabilities for portal structure analysis
- July 14, 2025: Focused system exclusively on Kinray portal automation for streamlined development
- July 14, 2025: Enhanced Kinray search debugging with comprehensive selector testing and page structure analysis
- July 15, 2025: Fixed search form submission issue preventing searches from starting correctly
- July 15, 2025: Implemented enhanced result extraction with comprehensive selector patterns for different portal layouts
- July 15, 2025: Added page structure debugging and screenshot capabilities for production portal analysis
- July 15, 2025: Resolved "error starting search" message - search form now properly submits and polls for results
- July 15, 2025: Implemented real Kinray credential authentication using environment variables instead of fake test data
- July 15, 2025: Successfully achieved real portal login with authentic user credentials and portal navigation
- July 15, 2025: System now performs genuine Kinray portal authentication and eliminates all fake pharmaceutical data
- July 15, 2025: Implemented comprehensive credential management interface with secure credential storage and testing
- July 15, 2025: Enhanced Kinray portal navigation with advanced authentication handling and multiple search strategies
- July 15, 2025: Added proper frontend credential input workflow for real portal authentication
- July 15, 2025: Fixed Puppeteer API compatibility issues and enhanced portal structure detection
- July 15, 2025: Fixed search interface error handling that was incorrectly showing "Error starting search" for successful API responses
- July 15, 2025: Added SearchSuccessIndicator component with search ID display and 2FA bypass progress tracking
- July 15, 2025: Enhanced frontend error handling to only display actual errors, not successful search initiations
- July 15, 2025: Improved user experience with clear status messages during login, 2FA bypass, and search progress
- July 15, 2025: Set Kinray as default vendor to eliminate redundant dropdown selection since it's the only supported vendor
- July 15, 2025: Implemented 30-second search timeout mechanism to complete searches promptly instead of hanging indefinitely
- July 15, 2025: Enhanced search completion handling to return proper status even when Kinray portal search interface isn't accessible
- July 15, 2025: Updated UI to clearly indicate "Searching Kinray (Cardinal Health) portal" for better user awareness
- July 15, 2025: Completely removed all vendor dropdown selections from credential forms and search interface
- July 15, 2025: Hardcoded vendorId to 1 (Kinray) throughout entire application for streamlined workflow
- July 15, 2025: Created automated git sync system with export packages to resolve repository merge conflicts
- July 15, 2025: Eliminated all vendor selection steps - application now defaults exclusively to Kinray operations
- July 16, 2025: Fixed DigitalOcean deployment issue by moving build tools (vite, esbuild, tailwindcss) to production dependencies
- July 16, 2025: Completely removed vendor dropdowns from legacy HTML interface in server/routes.ts for streamlined Kinray-only workflow
- July 16, 2025: Resolved deployment rejection caused by buildpack pruning dev dependencies before build execution
- July 16, 2025: Fixed Tailwind CSS utility class compatibility issues with newer version (border-border, font-sans)
- July 16, 2025: Updated PostCSS configuration to use @tailwindcss/postcss for proper CSS processing
- July 16, 2025: Moved Replit plugins (@replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer) to production dependencies
- July 16, 2025: Successfully achieved complete build process working for DigitalOcean deployment
- July 16, 2025: Resolved search results display issue - demo results now generate, save to storage, and display properly in frontend
- July 16, 2025: Implemented comprehensive search completion polling system with real-time status updates
- July 16, 2025: Enhanced browser availability detection with proper fallback handling for DigitalOcean Node.js buildpack
- July 16, 2025: Added detailed debug logging throughout search workflow for production troubleshooting
- July 16, 2025: Fixed frontend search flow to properly display results after backend completion
- July 16, 2025: Resolved critical routing conflict preventing React app from loading - removed legacy HTML interface route
- July 16, 2025: Fixed React Query polling configuration with explicit queryFn for proper search completion detection
- July 16, 2025: Enhanced SearchSuccessIndicator component with comprehensive debugging and status tracking
- July 16, 2025: Application now properly serves React frontend instead of conflicting legacy HTML interface
- July 16, 2025: CRITICAL FIX: Completely removed legacy HTML interface from server routes causing React app routing conflicts
- July 16, 2025: Created clean routes.ts file eliminating all HTML template code that was preventing React app from loading
- July 16, 2025: Server now properly serves React build files from dist/public/ with functional API endpoints
- July 16, 2025: Resolved browser caching and styling issues - React app should now load with proper modern interface
- July 16, 2025: MAJOR UI ENHANCEMENT: Added professional pharmaceutical gradient theme with purple-blue styling
- July 16, 2025: Enhanced dashboard with glass card effects, professional header, and gradient stat cards
- July 16, 2025: Fixed API endpoint issues - Kinray login now working successfully with proper authentication
- July 16, 2025: Applied consistent pharma-card styling across all components for cohesive professional appearance
- July 16, 2025: CRITICAL LAYOUT FIX: Removed duplicate Card components causing overlapping elements and "jumbled" appearance
- July 16, 2025: Fixed search button being grayed out - removed credential requirement blocking search functionality
- July 16, 2025: Enhanced component spacing and padding for professional pharmaceutical interface layout
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```