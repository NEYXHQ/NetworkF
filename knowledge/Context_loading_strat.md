Based on the comprehensive CONTEXT.MD file we just updated, here are the best ways to teach a new agent the context of this WFounders app:

## 🎯 **Recommended Approach: Layered Context Loading**

### 1. **Start with CONTEXT.MD (Primary Context)**
```markdown
# First, read this file for complete app understanding:
knowledge/CONTEXT.MD
```
This gives the agent:
- **High-level architecture** and system overview
- **Current development status** (buyflow in progress)
- **Technology stack** and key integrations
- **Auto-switching logic** between DEV/PROD environments
- **Complete project structure** with progress indicators

### 2. **Supplement with Buy Flow Specifics**
```markdown
# For buy flow implementation details:
knowledge/buyFlow/BUY_FLOW.MD          # High-level overview & milestones
knowledge/buyFlow/BUY_SPECS.json       # Technical specifications
knowledge/buyFlow/REPO_TREE.MD         # Current progress status
```

### 3. **Reference Implementation Examples**
```markdown
# Show actual implementation patterns:
src/config/contracts.ts                # Auto-switching contract logic
src/config/env.ts                      # Environment configuration
src/config/networks.ts                 # Network auto-selection
```

## 🚀 **Quick Start Instructions for New Agents**

```markdown example
## Welcome to WFounders! Here's your context:

1. **Read CONTEXT.MD first** - This is your primary context file
2. **Current focus**: Building NEYXT token purchase flow (buyflow)
3. **Status**: M1-M2 complete, M3 in progress, M4-M7 scaffolded
4. **Key insight**: Everything auto-switches between DEV/PROD environments
5. **Architecture**: React + TypeScript + Vite frontend, Supabase backend, Polygon blockchain

## What You Need to Know:
- **Auto-switching**: All configs automatically select testnet/mainnet based on environment
- **Buy Flow**: 3-step process (select → quote → confirm) with gasless transactions
- **Providers**: 0x API, Transak, Biconomy, QuickSwap v2
- **Security**: Price validation, slippage protection, router allowlisting

## Current Task Context:
- We're implementing the buy flow functionality
- All components are scaffolded and ready for implementation
- Focus on connecting the frontend hooks to backend APIs
- Ensure proper error handling and user experience
```

## 🔧 **Context Loading Strategy**

### **For General Development:**
1. Start with `CONTEXT.MD` (comprehensive overview)
2. Reference specific component files as needed
3. Use `buyFlow/` folder for implementation details

### **For Buy Flow Development:**
1. Read `CONTEXT.MD` for system context
2. Read `BUY_FLOW.MD` for flow-specific requirements
3. Reference `BUY_SPECS.json` for technical details
4. Check `REPO_TREE.MD` for current progress

### **For Architecture Questions:**
1. `CONTEXT.MD` has complete system diagrams
2. `config/` folder shows actual implementation patterns
3. `buyFlow/` folder has detailed technical specifications

## �� **Pro Tips for New Agents**

1. **Always start with CONTEXT.MD** - it's the single source of truth
2. **Understand the auto-switching logic** - it's central to the architecture
3. **Check current milestone status** - know what's done vs. what's needed
4. **Reference the config folder** - see how environment switching actually works
5. **Use the buyFlow folder** - it has the most detailed technical context

## 📚 **Context File Priority Order**

1. **`knowledge/CONTEXT.MD`** - Primary context (read first)
2. **`knowledge/buyFlow/BUY_FLOW.MD`** - Current development focus
3. **`knowledge/buyFlow/BUY_SPECS.json`** - Technical specifications
4. **`src/config/` files** - Implementation examples
5. **`knowledge/buyFlow/REPO_TREE.MD`** - Progress tracking

This approach ensures new agents get:
- **Complete system understanding** from CONTEXT.MD
- **Current development context** from buyFlow files
- **Implementation patterns** from actual code
- **Progress awareness** to focus on the right tasks

The CONTEXT.MD file we just updated is designed to be the **single entry point** that gives agents everything they need to understand the app and start contributing effectively.