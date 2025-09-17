## Vercel + OpenAI: Environment Setup Guide

This guide walks you through adding your OpenAI API key to Vercel so the serverless endpoint `api/chat.ts` can access it securely. The key is never exposed to the browser.

## Prerequisites

- An OpenAI API key (keep it private). You can create/manage keys in the OpenAI dashboard.
- This repo deployed to Vercel.

## Get an OpenAI API Key

1. Sign in to the OpenAI dashboard: [OpenAI Platform](https://platform.openai.com/)
2. Open the menu: User avatar → View API Keys
3. Click “Create new secret key”
4. Optionally name the key (e.g., "WFounders-Prod")
5. Copy the key (starts with `sk-...`) and store it securely (you won’t be able to view it again)
6. Ensure you have a valid billing setup on your OpenAI account if required for your usage

Notes:
- You don’t need to expose or set organization/project IDs in this app; only `SUPA_OPENAI_API_KEY` is required.
- Make sure the models you intend to use (default: `gpt-4o-mini`) are available to your account.

## Variable Name

- Use this exact environment variable name on Vercel: `SUPA_OPENAI_API_KEY`

## Add the Key via Vercel Dashboard (Recommended)

1. Open your project in Vercel
2. Go to Settings → Environment Variables
3. Add a new variable:
   - Name: `SUPA_OPENAI_API_KEY`
   - Value: your OpenAI API key (starts with `sk-...`)
   - Environment: select Production (and also Preview/Development if desired)
4. Click “Save”
5. Trigger a redeploy (or push a commit) so the new variable is available to the deployment

## Add the Key via Vercel CLI (Optional)

If you prefer CLI or want to script it:

```bash
# Production
vercel env add SUPA_OPENAI_API_KEY production

# Preview
vercel env add SUPA_OPENAI_API_KEY preview

# Development
vercel env add SUPA_OPENAI_API_KEY development
```

You’ll be prompted to paste the key securely.

## Where It’s Used

- `api/chat.ts` (Edge Function) reads `process.env.SUPA_OPENAI_API_KEY` and calls the OpenAI Chat Completions API.
- The client (browser) never sees this key. The frontend calls `/api/chat` instead.

## Local Development Options

You have two ways to test locally:

1) Using Vercel Dev (matches serverless env):

```bash
vercel dev
# Add SUPA_OPENAI_API_KEY for the development env if prompted (or pre-add it via CLI as above)
```

2) Using a temporary local env file for Edge function emulation:

- Create a local environment variable for the dev runtime (do NOT commit this file):
  - `SUPA_OPENAI_API_KEY=sk-...`
- Start your local dev that supports the Edge function route (e.g., `vercel dev`).

Note: `npm run dev` (Vite) only starts the frontend. The `/api/chat` route is served by Vercel runtime; use `vercel dev` to run both together locally, or test on a deployed preview.

## Testing the Endpoint

Once deployed (or running via `vercel dev`), test with curl:

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in one short sentence."}
    ]
  }' \
  https://<your-vercel-domain>/api/chat | jq
```

Or open the UI tester `AIProfilingModal.tsx` within the app to send a message.

## Security Notes

- Never put `SUPA_OPENAI_API_KEY` in client-side `.env` with `VITE_` prefix.
- Keep all OpenAI calls on the server (`api/chat.ts`).
- Rotate the key if it’s ever exposed or suspected compromised.

## Troubleshooting

- 500 “Server misconfigured: SUPA_OPENAI_API_KEY missing”
  - Ensure the variable is set in Vercel and the deployment has been redeployed.
  - For local `vercel dev`, ensure the `development` env var is added.

- 502 “OpenAI API error”
  - Check the OpenAI status and your key’s validity/permissions.
  - Confirm the model name used (default is `gpt-4o-mini`).

- 405 “Method Not Allowed”
  - Ensure you’re POSTing to `/api/chat` with a JSON body that includes `messages`.

## Model & Temperature

- Default model: `gpt-4o-mini`.
- You can override by sending `model` and `temperature` in the request body; see `api/chat.ts` for fields.


