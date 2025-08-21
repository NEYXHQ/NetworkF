•	Quote (GET)
    curl -i "https://kxepoivhqnurxmkgiojo.supabase.co/functions/v1/quote"
    Expect: 200 with { "ok": true, "service": "execute", ... }

•	Execute (POST)
    curl -i -X POST "https://kxepoivhqnurxmkgiojo.supabase.co/functions/v1/execute" -H "Content-Type: application/json" -d '{}'
    Expect: 200 with { "ok": true, "service": "execute", ... }

•	Status (GET)
    curl -i "https://kxepoivhqnurxmkgiojo.supabase.co/functions/v1/status"
    Expect: 200 with { "ok": true, "service": "status", ... }

•	Onramp Webhook (POST)
    curl -i -X POST "https://kxepoivhqnurxmkgiojo.supabase.co/functions/v1/onramp-webhook" -H "Content-Type: application/json" -d '{}'
    Expect: 200 with { "ok": true, "service": "onramp-webhook", ... }

•	CORS preflight (for POST routes)
    curl -i -X OPTIONS "https://kxepoivhqnurxmkgiojo.supabase.co/functions/v1/execute" -H "Origin: https://your-app.vercel.app" -H "Access-Control-Request-Method: POST"
    Expect: 204 (or 200) with the right Access-Control-Allow-* headers.