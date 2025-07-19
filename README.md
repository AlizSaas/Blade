🧠 Blade – AI Assistant for Sellers
Blade is a modern SaaS platform that gives sellers (from a motorcycle dealership or similar business) an AI-powered assistant to help answer questions and handle internal requests.

🔧 Key Features
✅ AI Chatbot for Sellers

Only available to authenticated sellers.

Each seller gets one unique AI conversation per company.

Messages are persisted in a PostgreSQL database.

Chatbot can be toggled via a floating button.

🔒 Role-Based Access Control

validateAuthRequest() ensures only SELLER roles can access the assistant.

Buyers are redirected elsewhere.

💬 Conversation Management

Uses prisma.conversation.upsert() with a compound unique key (@@unique([sellerId, companyId])) to avoid duplicate conversations.

Previous code created a new conversation on every page load — now fixed.

💡 Smart Chat UI

Modal UI using ChatbotModal.

Floating button built with Tailwind and Lucide icons (<MessageCircle /> and <X />).

Handles toggling, opening, and closing of the modal.

💵 Stripe Subscriptions

Sellers on the FREE plan are shown an UpgradeDialog.

Pro/Plus plans get full access to the chatbot.

Subscription session URL is dynamically passed in.

⚙️ Tech Stack
Frontend:

React (Client components + Server components)

Next.js 15 App Router

ShadCN UI + Tailwind CSS

React Query (for caching and fetching chat-related data)

Backend / Server-side

Prisma ORM + PostgreSQL

Stripe for billing and subscription logic

Clerk for authentication

Performance Optimization

Uses React.cache() for memoizing DB calls like getConversationId() and adminUser()

Suspense for lazily loading the chatbot component


