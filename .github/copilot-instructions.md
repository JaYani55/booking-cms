# Copilot Instructions for Mentor Booking Application

## Overview
This project is a Mentor Booking Application built using modern web technologies including Vite, TypeScript, React, Shadcn UI, and Tailwind CSS. The application is structured to support modular development with a focus on scalability and maintainability.

## Key Directories and Files
- **`src/pages/`**: Defines the main pages of the application, such as `Calendar.tsx`, `Events.tsx`, `Profile.tsx`, and `PageBuilder.tsx`. Each page is a top-level component for a specific route.
- **`src/components/`**: Contains reusable UI components. Subdirectories like `admin/`, `auth/`, `calendar/`, and `pagebuilder/` organize components by feature. For example, `admin/GroupCard.tsx` is a component used in the admin section, while `pagebuilder/ContentBlockEditor.tsx` handles flexible content editing.
- **`src/hooks/`**: Custom React hooks for shared logic. For example, `useCalendarEvents.ts` fetches and manages calendar data, while `useMentorGroupsAndMentors.ts` handles state for mentor groups.
- **`src/services/`**: Handles API interactions. For instance, `mentorGroupService.ts` contains functions for fetching and updating mentor group data, and `productPageService.ts` manages product page content in Supabase.
- **`src/contexts/`**: Context providers for global state management, such as `AuthContext.tsx` for user authentication state.
- **`src/lib/`**: Contains client configurations for external services. `supabase.ts` configures the Supabase client, and `seatableClient.ts` sets up the Seatable API client.
- **`src/types/`**: TypeScript type definitions. `pagebuilder.ts` defines the content block system used for flexible page content (TextBlock, ImageBlock, QuoteBlock, ListBlock, VideoBlock).

## Architecture Patterns

### Content Block System
The application uses a flexible content block system for product pages:
- **Content Blocks**: Union type of `TextBlock | ImageBlock | QuoteBlock | ListBlock | VideoBlock`
- Each block has a unique `id` and `type` field
- Blocks support different content types with type-specific properties (e.g., `format` for text, `src` and `alt` for images)
- Used in FAQ answers, hero descriptions, and feature descriptions for rich content editing

### Database Schema
- **`mentorbooking_products`**: Core product data (name, description, pricing, mentor requirements)
- **`products`**: Product page content (slug, name, status, jsonb content field with page builder data)
- **`product_slugs`**: URL slug management with primary slug tracking
- Products link to product pages via `product_page_id` foreign key

## Developer Workflows
### Setup
1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Build for production: `npm run build`

### Testing
- Test files are located alongside the components or utilities they test.
- Use `npm test` to run all tests (Note: test runner setup may be required).

### Debugging
- Use the browser's developer tools for debugging React components and network requests.
- The `debug/` directory contains utilities that can be used for debugging purposes.

## Project-Specific Conventions
- **Component Structure**: Components are organized by feature in `src/components/`. For example, `admin/` contains components like `GroupCard.tsx` and `MentorSearch.tsx`, while `pagebuilder/` contains `HeroForm.tsx`, `FaqForm.tsx`, etc.
- **Styling**: Tailwind CSS is used for styling, following a utility-first approach. Component-specific styles are co-located with the component.
- **API Integration**: Use service files in `src/services/` for all API calls. This keeps components clean and separates data fetching logic.
- **State Management**: For global state, use React Context (e.g., `AuthContext`). For local or feature-specific state, create custom hooks (e.g., `useEventFilters.ts`).
- **Form Handling**: React Hook Form with Zod schema validation is used throughout. Field arrays (`useFieldArray`) manage dynamic lists like FAQ items and content blocks.
- **External Dependencies**:
  - **Supabase**: Used for authentication and database interactions. Configured in `src/lib/supabase.ts`.
  - **Seatable**: Used for mentor data management. Configured in `src/lib/seatableClient.ts`.

## Page Builder Feature
The page builder (`/pagebuilder/:id`) allows creating rich product pages:
1. Navigate from product edit form via "Produktseite erstellen" button
2. Edit sections: Hero, CTA, FAQ, Cards, Features
3. Each section supports content blocks for flexible content
4. Data saves to `products` table as JSONB, linked to `mentorbooking_products`
5. Slug auto-generates from product name (URL-friendly)

## Examples
### Adding a New Page
1. Create a new file in `src/pages/`, e.g., `NewPage.tsx`.
2. Define the page component and export it.
3. Add a route for the new page in the main router configuration file (likely in `src/App.tsx` or a dedicated routing file).

### Creating a New Hook
1. Add a new file in `src/hooks/`, e.g., `useNewFeature.ts`.
2. Implement the hook logic, including any state management or side effects.
3. Export the hook and use it in the relevant components.

### Adding a New Content Block Type
1. Define the block interface in `src/types/pagebuilder.ts` extending `BaseBlock`
2. Add to `ContentBlock` union type
3. Update `ContentBlockSchema` in `PageBuilderForm.tsx`
4. Add rendering logic in `ContentBlockEditor.tsx`
5. Add creation option in `AddContentBlock.tsx`

## Notes
- Follow the existing folder structure and naming conventions.
- Document any new components, hooks, or utilities in the codebase.
- Ensure that any new feature follows the established patterns for state management and API integration.
- When working with content blocks, always generate unique IDs using timestamps and random strings.
