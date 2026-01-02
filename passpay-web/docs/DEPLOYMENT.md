# 🚀 Deployment Guide

Complete guide to deploying your LazorKit-powered Next.js app to production.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Other Hosting Options](#other-hosting-options)
- [Production Checklist](#production-checklist)
- [Domain & SSL](#domain--ssl)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

### Required Accounts

| Platform | Account                                     | Purpose        |
| -------- | ------------------------------------------- | -------------- |
| Vercel   | [vercel.com](https://vercel.com)            | Hosting        |
| GitHub   | [github.com](https://github.com)            | Source control |
| LazorKit | [portal.lazor.sh](https://portal.lazor.sh)  | API access     |
| Helius   | [helius.dev](https://helius.dev) (optional) | Production RPC |

### Required Tools

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

---

## Environment Configuration

### Development vs Production

| Variable                          | Development                | Production                  |
| --------------------------------- | -------------------------- | --------------------------- |
| `NEXT_PUBLIC_SOLANA_RPC_URL`      | `api.devnet.solana.com`    | `mainnet.helius-rpc.com`    |
| `NEXT_PUBLIC_PAYMASTER_URL`       | `kora.devnet.lazorkit.com` | `kora.mainnet.lazorkit.com` |
| `NEXT_PUBLIC_LAZORKIT_PORTAL_URL` | `portal.lazor.sh`          | `portal.lazor.sh`           |

### Environment Files

```bash
# .env.local (development - not committed)
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://kora.devnet.lazorkit.com

# .env.production (production defaults)
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
NEXT_PUBLIC_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://kora.mainnet.lazorkit.com
```

---

## Vercel Deployment (Recommended)

### Option A: Deploy via CLI

```bash
# From project root
vercel

# Follow prompts:
# ? Set up and deploy? Yes
# ? Which scope? Your account
# ? Link to existing project? No
# ? Project name? passpay-web
# ? Directory? ./
# ? Override settings? No
```

### Option B: Deploy via GitHub

1. **Push to GitHub:**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/passpay-web.git
   git push -u origin main
   ```

2. **Import to Vercel:**

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure project settings
   - Click "Deploy"

### Configure Environment Variables

1. Go to your project on Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:

```
NEXT_PUBLIC_SOLANA_RPC_URL = https://mainnet.helius-rpc.com/?api-key=xxx
NEXT_PUBLIC_LAZORKIT_PORTAL_URL = https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL = https://kora.mainnet.lazorkit.com
```

### Configure Build Settings

In `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

---

## Other Hosting Options

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=.next
```

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

Update `next.config.ts`:

```typescript
const nextConfig = {
  output: "standalone",
};

export default nextConfig;
```

Build and run:

```bash
docker build -t passpay-web .
docker run -p 3000:3000 passpay-web
```

### Self-Hosted (Node.js)

```bash
# Build
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "passpay-web" -- start
pm2 save
```

---

## Production Checklist

### Security

- [ ] **HTTPS only** - WebAuthn requires HTTPS
- [ ] **Environment variables** - Never commit secrets
- [ ] **CSP headers** - Configure Content Security Policy
- [ ] **Rate limiting** - Protect API routes

### Performance

- [ ] **Use production RPC** - Helius, QuickNode, or Triton
- [ ] **Enable caching** - Configure cache headers
- [ ] **Optimize images** - Use Next.js Image component
- [ ] **Bundle analysis** - Run `npm run analyze`

### Reliability

- [ ] **Error tracking** - Setup Sentry or similar
- [ ] **Monitoring** - Setup uptime monitoring
- [ ] **Analytics** - Add Vercel Analytics or Plausible
- [ ] **Logging** - Configure structured logging

### Configuration

```typescript
// next.config.ts - Production settings
const nextConfig = {
  // Enable strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    domains: ["your-cdn.com"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## Domain & SSL

### Custom Domain on Vercel

1. Go to **Project Settings** → **Domains**
2. Add your domain (e.g., `passpay.app`)
3. Configure DNS:
   - For apex domain: Add A record pointing to `76.76.21.21`
   - For subdomain: Add CNAME record pointing to `cname.vercel-dns.com`
4. SSL is automatically provisioned

### ⚠️ Important for WebAuthn

Passkeys are bound to the domain. If you change domains:

- Users will need to create new passkeys
- Old passkeys won't work on the new domain

---

## Post-Deployment

### Verify Deployment

1. **Check home page** - Visit your deployed URL
2. **Test passkey flow** - Create a new wallet
3. **Test transaction** - Send a small amount on devnet first
4. **Check error tracking** - Verify errors are captured

### Monitoring Setup

```typescript
// lib/monitoring.ts
export function trackError(error: Error, context?: Record<string, unknown>) {
  // Send to Sentry
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, { extra: context });
  }
  console.error(error);
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  // Send to analytics
  if (typeof window !== "undefined" && window.analytics) {
    window.analytics.track(name, properties);
  }
}
```

### Health Check Endpoint

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
}
```

### Rollback Strategy

With Vercel:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

---

## Mainnet Transition Checklist

When moving from Devnet to Mainnet:

1. **Update RPC URL:**

   ```env
   NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
   ```

2. **Update Paymaster URL:**

   ```env
   NEXT_PUBLIC_PAYMASTER_URL=https://kora.mainnet.lazorkit.com
   ```

3. **Update USDC Mint (if used):**

   ```typescript
   // Devnet USDC
   const USDC_DEVNET = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";

   // Mainnet USDC
   const USDC_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
   ```

4. **Test thoroughly** - Use a small amount first

5. **Monitor closely** - Watch for any errors in the first 24 hours
