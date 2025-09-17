# Email Setup Guide for NetworkF2

This guide will help you set up email functionality using Resend and Supabase Edge Functions for sending welcome emails to new users.

## Prerequisites

- Supabase project (already set up)
- Resend account (free tier available)
- Domain verification (for production)

## Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Resend API Key

1. Navigate to the Resend dashboard
2. Go to **API Keys** in the sidebar
3. Click **"Create API Key"**
4. Give it a name (e.g., "NetworkF2 Production" or "NetworkF2 Development")
5. Select the appropriate permissions:
   - **Sending access**: For sending emails
   - **Domain access**: If you plan to manage domains via API
6. Copy the API key (starts with `re_`) - **save this securely**

## Step 3: Configure Supabase Secrets

You need to add your Resend API key as a secret in Supabase:

### Using Supabase CLI (Recommended)

```bash
# Make sure you're linked to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set the Resend API key as a secret
supabase secrets set SUPA_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. In the **Function Secrets** section, click **"Add new secret"**
4. Set:
   - **Name**: `SUPA_RESEND_API_KEY`
   - **Value**: Your Resend API key (e.g., `re_xxxxxxxxxxxxxxxxx`)
5. Click **"Add secret"**

## Step 4: Deploy the Edge Function

Deploy the welcome email function to Supabase:

```bash
# Deploy the function
supabase functions deploy send-welcome-email --no-verify-jwt

# Verify deployment
supabase functions list
```

The `--no-verify-jwt` flag allows the function to be called without authentication (useful for webhooks).

## Step 5: Domain Verification (Production Only)

For production use, you'll need to verify your domain with Resend:

### Add a Domain

1. In Resend dashboard, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `networkf2.com`)
4. Resend will provide DNS records to add

### DNS Configuration

Add these DNS records to your domain registrar:

#### MX Record
- **Type**: MX
- **Name**: `send` (creates send.yourdomain.com)
- **Value**: `feedback-smtp.us-east-1.amazonses.com` (or region-specific)
- **Priority**: 10

#### SPF Record (TXT)
- **Type**: TXT
- **Name**: `send`
- **Value**: `v=spf1 include:amazonses.com ~all`

#### DKIM Record (TXT)
- **Type**: TXT
- **Name**: `resend._domainkey`
- **Value**: (Provided by Resend in dashboard)

### Verify Domain

1. After adding DNS records, go back to Resend dashboard
2. Click **"Verify"** next to your domain
3. Wait for verification (can take up to 24 hours)

## Step 6: Update Email Configuration

Once your domain is verified, update the Edge Function:

1. Edit `supabase/functions/send-welcome-email/index.ts`
2. Change the `from` field:
   ```typescript
   from: 'NetworkF2 <onboarding@yourdomain.com>',
   ```

3. Redeploy the function:
   ```bash
   supabase functions deploy send-welcome-email --no-verify-jwt
   ```

## Step 7: Test the Setup

### Using the Development Debug Panel

1. Start your development server
2. The **EnvironmentChecker** component (visible only in development) now includes a **"Test Welcome Email"** button
3. Click the button to send a test email

### Manual Testing

You can also test the function directly:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-welcome-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "test@example.com",
    "subject": "Test Welcome Email"
  }'
```

## Integrating with User Registration

To automatically send welcome emails when users sign up, you can:

### Option 1: Database Trigger
Set up a database trigger that calls the Edge Function when a new user is created.

### Option 2: Auth Hook
Use Supabase Auth Hooks to trigger the email function on user signup.

### Option 3: Client-side Integration
Call the function from your frontend after successful user registration:

```typescript
const sendWelcomeEmail = async (userEmail: string) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      to: userEmail,
      subject: 'Welcome to NetworkF2!',
    }),
  });
  
  if (!response.ok) {
    console.error('Failed to send welcome email');
  }
};
```

## Troubleshooting

### Common Issues

1. **"SUPA_RESEND_API_KEY not configured"**
   - Make sure you've set the secret in Supabase
   - Redeploy the function after setting secrets

2. **"Authentication required"**
   - Ensure you're using the `--no-verify-jwt` flag when deploying
   - Check that you're passing the correct Authorization header

3. **"Domain not verified"**
   - For development, you can use the default Resend domain (`onboarding@resend.dev`)
   - For production, complete domain verification

4. **DNS propagation issues**
   - DNS changes can take up to 24 hours to propagate
   - Use online DNS checkers to verify records

### Rate Limits

Resend free tier includes:
- 100 emails per day
- 3,000 emails per month

For production use, consider upgrading to a paid plan.

## Security Considerations

1. **Never expose your Resend API key** in client-side code
2. Use **Supabase secrets** for storing sensitive credentials
3. Consider implementing **rate limiting** to prevent abuse
4. For production, implement **proper email validation** and **user consent**

## Next Steps

1. Customize the email template in the Edge Function
2. Set up email analytics and tracking
3. Implement unsubscribe functionality
4. Add support for different email types (confirmation, password reset, etc.)

---

For more information:
- [Resend Documentation](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)