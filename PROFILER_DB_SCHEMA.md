# Profiler Database Schema Changes

## Overview
This document outlines the database schema modifications required to support the Founder Profiler feature, which classifies users into entrepreneurial profiles based on their responses to adaptive questions.

## New Fields Added to Users Table

### 1. Profile Classification Fields
The following fields will be added to the existing `users` table:

```sql
-- Add profiler result fields to users table
ALTER TABLE users 
ADD COLUMN profiler_profile_name VARCHAR(50),
ADD COLUMN profiler_profile_type VARCHAR(50),
ADD COLUMN profiler_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN profiler_confidence DECIMAL(3,2); -- 0.00 to 1.00
```

### 2. Field Descriptions

- **`profiler_profile_name`**: The specific profile name from the profiler (e.g., "Evangelist", "Builder", "Risk Taker")
- **`profiler_profile_type`**: The broader category type (e.g., "Vision-Oriented", "Execution-Oriented", "Innovation-Oriented")
- **`profiler_completed_at`**: Timestamp when the profiler was completed
- **`profiler_confidence`**: Confidence score (0.00 to 1.00) indicating how certain the system is about the profile classification

### 3. Profile Types Reference
Based on `profiles_config.json`, the following profile types are supported:

- **Vision-Oriented**: Dreamer, Visionary Disruptor, Evangelist
- **Strategy-Oriented**: Planner, Architect, Analyst  
- **Execution-Oriented**: Builder, Operator, Rainmaker
- **Innovation-Oriented**: Inventor, Hacker, Creative
- **Resilience-Oriented**: Risk Taker, Persistent Grinder, Opportunist
- **People-Oriented**: Connector, Mentor/Coach, Diplomat
- **Purpose-Driven**: Social Entrepreneur, Ethical Guardian

## Database Migration

### Option 1: Direct SQL (Recommended for Supabase)
```sql
-- Run this SQL in your Supabase SQL editor
ALTER TABLE users 
ADD COLUMN profiler_profile_name VARCHAR(50),
ADD COLUMN profiler_profile_type VARCHAR(50),
ADD COLUMN profiler_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN profiler_confidence DECIMAL(3,2);

-- Add indexes for better query performance
CREATE INDEX idx_users_profiler_profile_type ON users(profiler_profile_type);
CREATE INDEX idx_users_profiler_completed_at ON users(profiler_completed_at);
```

### Option 2: Prisma Migration (If using Prisma)
```bash
# Generate migration
npx prisma migrate dev --name add_profiler_fields

# Apply migration
npx prisma migrate deploy
```

## Updated TypeScript Types

The `database.types.ts` file will need to be updated to include these new fields:

```typescript
// In the users table definition
users: {
  Row: {
    // ... existing fields ...
    profiler_profile_name?: string | null
    profiler_profile_type?: string | null
    profiler_completed_at?: string | null
    profiler_confidence?: number | null
  }
  Insert: {
    // ... existing fields ...
    profiler_profile_name?: string | null
    profiler_profile_type?: string | null
    profiler_completed_at?: string | null
    profiler_confidence?: number | null
  }
  Update: {
    // ... existing fields ...
    profiler_profile_name?: string | null
    profiler_profile_type?: string | null
    profiler_completed_at?: string | null
    profiler_confidence?: number | null
  }
}
```

## Usage Examples

### Query Users by Profile Type
```sql
-- Find all Vision-Oriented entrepreneurs
SELECT name, profiler_profile_name, profiler_confidence 
FROM users 
WHERE profiler_profile_type = 'Vision-Oriented' 
AND profiler_completed_at IS NOT NULL
ORDER BY profiler_confidence DESC;
```

### Get Profile Distribution
```sql
-- Count users by profile type
SELECT profiler_profile_type, COUNT(*) as user_count
FROM users 
WHERE profiler_completed_at IS NOT NULL
GROUP BY profiler_profile_type
ORDER BY user_count DESC;
```

## Data Integrity

- **`profiler_profile_name`** and **`profiler_profile_type`** should always be set together
- **`profiler_completed_at`** should be set when the profiler is completed
- **`profiler_confidence`** should be between 0.00 and 1.00
- All fields can be NULL for users who haven't completed the profiler

## Future Considerations

This schema design allows for:
- Easy querying of users by profile characteristics
- Analytics on profile distribution across the network
- Filtering connections by complementary profile types
- Tracking profiler completion rates
- A/B testing different profiler question sets
