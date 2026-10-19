#Objet Décoratif
A design-led online store for sculptural candle vessels and fragrances.

Objet Décoratif brings together architectural forms, considered materials, and scent. The storefront presents candle-vessel collections with fragrance options and refill-oriented product storytelling.
Features
- Product catalogue organised into collections, including Barrique, Milano, Boite, Chateu, Elephant, Sakura, and Refill
- Product details with descriptions, imagery, pricing, and scent options
- Shopping-bag and order-creation flow
- User authentication and account interface powered by Clerk
- Order and user administration interfaces
- Legal and store-policy content, including shipping, returns, privacy, and terms
Available functionality depends on the configured application services and environment.

Tech stack
- React and TypeScript
- Vite
- Tailwind CSS and reusable UI components
- Wouter for client-side routing
- TanStack Query for API data fetching
- Clerk for authentication
- Express 5 API
- PostgreSQL with Drizzle ORM
- pnpm workspaces
Getting started
Requirements
- Node.js 24
- pnpm
- A PostgreSQL database and the required environment configuration
Install dependencies
pnpm install
Configure environment
Set the environment variables required by the API and connected services. The repository's project notes identify DATABASE_URL as the PostgreSQL connection string.

Do not commit credentials, API keys, or production secrets to the repository.
Run the development API
pnpm --filter @workspace/api-server run dev
The API server is configured to use port 5000.
Check and build the project
pnpm run typecheck
pnpm run build
The build command runs type checking and the configured workspace builds. Refer to the workspace package scripts for additional application-specific commands.
Repository structure
- original_app.tsx — main storefront application source
- artifacts/ — workspace packages and application components
- scripts/ — project scripts
- screenshots/ — project screenshots
- package.json — root scripts and workspace configuration
- pnpm-workspace.yaml — pnpm workspace setup
- replit.md — development notes and operational commands
Development notes
This project uses pnpm workspaces. Use pnpm for dependency management and follow the scripts defined in the repository rather than mixing package managers.
Status
Under active development. Setup and runtime behaviour may depend on the configured database, authentication, and API services.
License
The root package.json currently declares the MIT license. Ensure the repository includes a corresponding LICENSE file if you intend to distribute the project under MIT.
