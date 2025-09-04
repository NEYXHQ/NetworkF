# Environment Management Guide

## Hybrid Environment Reality

This project uses a **hybrid environment approach** where some services connect to production even during development. This is necessary because many DeFi protocols (like QuickSwap) don't have development versions.

## Environment Types

### Development Environment
- **Database**: Development Supabase project
- **Blockchain**: Polygon Amoy Testnet (chainId: 80002)
- **DeFi Services**: Production QuickSwap (hybrid)
- **Tokens**: Testnet versions of NEYXT, WETH, USDC

### Production Environment  
- **Database**: Production Supabase project
- **Blockchain**: Polygon Mainnet (chainId: 137)
- **DeFi Services**: Production QuickSwap
- **Tokens**: Mainnet versions of NEYXT, WETH, USDC

## Hybrid Services

These services connect to production even in development:

| Service | Variable | Why Hybrid |
|---------|----------|------------|
| QuickSwap Factory | `VITE_POLYGON_QUICKSWAP_FACTORY` | No testnet version available |
| QuickSwap Router | `VITE_POLYGON_QUICKSWAP_ROUTER` | Different router addresses per network |

## Environment Management Commands

### Validation
```bash
npm run env:validate  # Comprehensive validation report
npm run env:check     # Quick health check
```

### Sync to Supabase
```bash
npm run env:sync dev   # Sync .env.development to dev Supabase
npm run env:sync prod  # Sync .env.production to prod Supabase
```

### Direct Supabase Commands
```bash
npm run secrets:dev   # Direct sync to dev (legacy)
npm run secrets:prod  # Direct sync to prod (legacy)
```

## Best Practices

1. **Always validate before syncing**: `npm run env:validate`
2. **Use confirmation prompts**: `npm run env:sync` includes safety checks
3. **Document hybrid services**: Update this file when adding new hybrid services
4. **Test both environments**: Ensure hybrid services work in both dev and prod contexts