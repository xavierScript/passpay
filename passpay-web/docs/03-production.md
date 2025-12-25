# Production Deployment

This guide covers deploying your Lazorkit subscription app to production on Vercel.

## Pre-Deployment Checklist

### Security

- [ ] **Environment Variables:** Never commit `.env.local` to Git
- [ ] **CRON_SECRET:** Generate a strong secret (32+ characters)
- [ ] **API Rate Limiting:** Add rate limiting to API routes
- [ ] **Input Validation:** Sanitize all user inputs
- [ ] **CORS Headers:** Restrict API access to your domain

### Database

- [ ] **Choose Provider:** Supabase, PlanetScale, or Neon
- [ ] **Schema Migration:** Create tables for subscriptions, payments
- [ ] **Indexes:** Index `walletAddress`, `nextBilling`, `status`
- [ ] **Backup Strategy:** Configure automated backups

### Solana Mainnet

- [ ] **RPC Provider:** Use Helius or QuickNode (not public RPC)
- [ ] **USDC Mint:** Update to mainnet USDC address
- [ ] **Test Wallet:** Fund a test wallet with small amounts
- [ ] **Transaction Monitoring:** Set up alerts for failed txs

## Step 1: Setup Database

Example Supabase schema:

```sql
-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  tier VARCHAR(20) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  next_billing TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  approval_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  signature VARCHAR(88) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_wallet_address ON subscriptions(wallet_address);
CREATE INDEX idx_next_billing ON subscriptions(next_billing);
CREATE INDEX idx_status ON subscriptions(status);
```

## Step 2: Update Environment Variables

Production `.env.local`:

```env
# Mainnet RPC (use private provider)
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Lazorkit API Key
NEXT_PUBLIC_LAZORKIT_API_KEY=your_production_key

# Mainnet USDC Mint
NEXT_PUBLIC_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Cron Secret (generate with: openssl rand -base64 32)
CRON_SECRET=your_strong_random_secret_here

# Database Connection
DATABASE_URL=postgresql://user:pass@host:5432/db

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Step 3: Deploy to Vercel

### Install Vercel CLI

```bash
npm i -g vercel
```

### Deploy

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Configure Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add all variables from `.env.local`
3. Set **Production** as the environment

### Setup Cron Job

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/subscription/charge",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs the charge endpoint daily at midnight UTC.

## Step 4: Implement Database Queries

Update subscription endpoints to use your database:

```tsx
// app/api/subscription/create/route.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(req: NextRequest) {
  const { planId, walletAddress } = await req.json();

  const plan = PLANS.find((p) => p.id === planId);
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      wallet_address: walletAddress,
      tier: plan.id,
      start_date: new Date().toISOString(),
      next_billing: nextBilling.toISOString(),
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data });
}
```

## Step 5: Add Error Monitoring

Install Sentry:

```bash
npm install @sentry/nextjs
```

Configure Sentry:

```tsx
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

## Step 6: Implement Rate Limiting

Use Upstash Redis for rate limiting:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```tsx
// lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// Apply to API routes
export async function POST(req: NextRequest) {
  const ip = req.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // ... rest of endpoint
}
```

## Step 7: Testing on Mainnet

### Small Test Transactions

1. Fund a test wallet with minimal USDC (1-5 USDC)
2. Create a test subscription
3. Verify transaction on [Solscan](https://solscan.io)
4. Monitor for errors in Sentry

### Test Checklist

- [ ] Passkey login works on mobile devices
- [ ] Subscription creation succeeds
- [ ] USDC transfer completes with paymaster
- [ ] Transaction signatures are logged
- [ ] Cron job runs at scheduled time
- [ ] Failed payments trigger grace period
- [ ] Cancellation revokes delegation

## Step 8: Monitoring & Alerts

### Setup Webhook Monitoring

Monitor subscription charges:

```tsx
// app/api/subscription/charge/route.ts
export async function POST(req: NextRequest) {
  // ... charge logic

  // Log to monitoring service
  await fetch("https://your-webhook-url.com/subscription-charged", {
    method: "POST",
    body: JSON.stringify({ charged: results }),
  });
}
```

### Alert Configuration

Set up alerts for:

- **Failed Transactions:** > 5% failure rate
- **Low USDC Balance:** Paymaster balance < 100 USDC
- **Cron Failures:** Charge endpoint errors
- **API Errors:** 5xx responses > 1%

## Step 9: Documentation

Update README with:

- **Live Demo URL:** Link to deployed app
- **Video Tutorial:** 2-3 minute walkthrough
- **Architecture Diagram:** Updated with production stack
- **Contact Information:** Support email/Discord

## Common Production Issues

### Issue: Transactions Timing Out

**Solution:** Increase `computeUnitLimit` in transaction options:

```tsx
await signAndSendTransaction({
  instructions,
  transactionOptions: {
    computeUnitLimit: 1_000_000, // Increase for complex txs
  },
});
```

### Issue: Cron Job Not Running

**Solution:** Verify `vercel.json` is committed and redeploy:

```bash
git add vercel.json
git commit -m "Add cron config"
vercel --prod
```

### Issue: Database Connection Errors

**Solution:** Use connection pooling for Serverless:

```tsx
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## Performance Optimization

1. **CDN Caching:** Enable Vercel Edge Caching for static assets
2. **Image Optimization:** Use Next.js Image component
3. **Bundle Size:** Analyze with `npm run build` and tree-shake unused code
4. **Database Queries:** Add indexes on frequently queried columns
5. **RPC Requests:** Batch multiple queries with `getMultipleAccounts`

## Security Best Practices

1. **Never Log Private Keys:** Sanitize logs before sending to monitoring
2. **Validate All Inputs:** Use Zod schemas for request validation
3. **Secure Headers:** Add CSP, X-Frame-Options, HSTS
4. **Audit Dependencies:** Run `npm audit` regularly
5. **Rotate Secrets:** Change `CRON_SECRET` every 90 days

## Maintenance

### Weekly Tasks

- [ ] Review error logs in Sentry
- [ ] Check cron job execution logs
- [ ] Monitor USDC balance in paymaster wallet
- [ ] Review database query performance

### Monthly Tasks

- [ ] Update dependencies (`npm update`)
- [ ] Review failed payment reports
- [ ] Analyze user retention metrics
- [ ] Backup database

## Scaling Considerations

When you reach 1000+ subscribers:

1. **Database:** Migrate to dedicated instance
2. **RPC:** Use dedicated node or geographic redundancy
3. **Caching:** Add Redis for subscription status queries
4. **Queue:** Use BullMQ for background payment processing
5. **CDN:** Cache subscription plans at edge locations

---

**Congratulations!** Your Lazorkit subscription service is now production-ready. 🚀
