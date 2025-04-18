# LinkedOut - AI-Powered LinkedIn Inbox 

LinkedOut was built to help manage hectic LinkedIn inboxes on mobile and desktop. It includes AI draft replies and static text snippets library, making it a nimble assistant without being ChatGPT. Front-end built with Next.js, TypeScript, and Tailwind CSS. Backend runs on n8n and PocketBase. Clone it, tweak it, make it yours.


## Features

- AI-powered message drafts
- Responsive design for mobile and desktop
- Beautiful UI with dark mode support
- Secure authentication
- Setup wizard to deploy backend and set up database
- Open source: Self-host it, fork it.

## Known Outscope
- Emoji reactions will not show
- Group threads do not show (only Classic LinkedIN inbox, no Sales navigator either). Should be easy to tweak.
- Draft reply only takes previous message (and name) as context. 
- Text Snippets can be Created/ Updated / Deleted via PocketBase, not yet in-app.
- Manual setup route not documented yet (working on it)
- Setup flow does not configure AI model nodes in n8n workflow (WIP)

## Tech Stack

### Frontend
- **Framework:** Next.js  (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Custom auth with JWT

### Backend
- **Database & Auth:** use our convex
- **Workflows as Backend:** n8n via webhook endpoints, and n8n api for /setup
- **LinkedIn API Access:** own linkedin API key


## Installation
Watch a [set up video on YouTube](https://www.youtube.com/watch?v=KTLIsrOW-t0).

### Via Manual Deployment
1. **Set up n8n**
   - Create a [LinkedIn API] Header credential with your Linkedin API key
   - Import the following workflows from the GitHub repository:
     - `/inbox backend [linkedout]`
     - `/thread backend [linkedout]`
     - `New message ingress [linkedout]`
     - `/setup backend [linkedout]` (optional)

IMPORTANT : This should all be replaced into our Convex : 
   - Update all placeholder values in the workflows:
     - `****POCKETBASE_BASE_URL****`: Your PocketBase URL
     - `****POCKETBASE_SERVICE_USER_EMAIL****`: Service account email
     - `****POCKETBASE_SERVICE_USER_PASSWORD****`: Service account password
     - `****UNIPILE_ACCOUNT_ID****`: Your Unipile account ID
     - `****UNIPILE_DSN****`: Your Unipile DSN

   - Set environment variables:
     - `NEXT_PUBLIC_N8N_WEBHOOK_URL`: Your n8n webhook URL
   - Build and start the application:
     - Development: `npm run dev` or `yarn dev`
     - Production: `npm run build && npm start` or `yarn build && yarn start`

Note: Do not include trailing slashes in URL environment variables.


## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | N8N URL (without /webhook) | Yes |

