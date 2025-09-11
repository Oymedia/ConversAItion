# ConversAItion - AI-Powered Conversation Practice Platform

## Overview

ConversAItion is a web application that enables users to practice real-life conversations through AI-powered simulations. Users can create custom conversation scenarios with specific characters, topics, and goals, then engage in interactive dialogues where an AI plays the role of the other party. The platform provides multiple response options with different communication approaches (diplomatic, assertive, empathetic) and tracks conversation progress with detailed feedback and analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Component-based UI using React 18 with TypeScript for type safety
- **Vite Build System**: Modern bundler with hot module replacement for development
- **Wouter Router**: Lightweight client-side routing for navigation between pages
- **shadcn/ui Components**: Pre-built UI component library based on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **TanStack Query**: Server state management for data fetching, caching, and synchronization

### Backend Architecture
- **Express.js Server**: RESTful API server handling HTTP requests and responses
- **TypeScript**: Type-safe server-side development
- **Middleware Pattern**: Request logging, error handling, and JSON parsing
- **In-Memory Storage**: Simple storage implementation using Maps for development (designed to be replaceable with database)

### Data Storage Solutions
- **Drizzle ORM**: SQL query builder and ORM configured for PostgreSQL
- **Schema-First Design**: Centralized database schema definitions in shared directory
- **Memory Storage Fallback**: Development storage using in-memory Maps when database unavailable

### Database Schema
- **Users Table**: User authentication and identification
- **Scenarios Table**: Conversation setup including purpose, character profiles, topics, and goals
- **Conversations Table**: Active conversations with message history, progress tracking, and outcomes stored as JSONB

### API Structure
- **RESTful Endpoints**: Standard HTTP methods for CRUD operations
- **Scenario Management**: Create scenarios and initiate conversations
- **Conversation Flow**: Message exchange, response option generation, and progress tracking
- **State Management**: Conversation completion detection and outcome analysis

### Authentication & Authorization
- **Session-Based**: Uses connect-pg-simple for PostgreSQL session storage
- **Cookie Management**: Secure session handling with HTTP-only cookies
- **User Context**: Tracks user sessions across conversation interactions

## External Dependencies

### AI Integration
- **OpenAI API**: GPT-5 model for generating AI responses, conversation analysis, and response options
- **Environment Variables**: Secure API key management through environment configuration

### Database Services
- **Neon Database**: Serverless PostgreSQL database for production data persistence
- **Connection Pooling**: Efficient database connection management

### UI Framework Dependencies
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema validation
- **Lucide React**: Icon library for consistent visual elements

### Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration
- **TypeScript Compiler**: Type checking and compilation

### Third-Party Services
- **Replit Integration**: Development environment integration with cartographer and runtime error handling
- **Font Delivery**: Google Fonts integration for typography (Architects Daughter, DM Sans, Fira Code, Geist Mono)