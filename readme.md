# Expo Clerk Convex

## Introduction

This repository is an Expo starter focused on email/password authentication with Clerk, Convex, and Expo Router route protection.

#### Disclaimer

This is not supposed to be a template, boilerplate or a framework. It is an opinionated guide that shows how to do some things in a certain way. You are not forced to do everything exactly as it is shown here, decide what works best for you and your team and stay consistent with your style.

## Get Started

1. Configure Clerk
   - Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com/).
   - Enable email/password authentication for the application.
   - Configure email verification to use an email code flow for sign-up.
   - Enable the Convex integration for the Clerk application.
   - Copy the Clerk Frontend API URL that Convex will use as `CLERK_JWT_ISSUER_DOMAIN`.

2. Clone the repository to your local machine

```bash
git clone https://github.com/FlemingVincent/expo-clerk-convex.git
```

3. Navigate to the project directory

```bash
cd expo-clerk-convex
```

4. Install dependencies

```bash
bun install
```

5. Create a Convex dev deployment

```bash
npx convex dev
```

This command creates the `convex/` backend, prompts you to sign in to Convex, and prints the deployment URL you need for the Expo app.

6. Update environment variables
   - Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to your `.env.local` file with your Clerk publishable key.
   - Add `EXPO_PUBLIC_CONVEX_URL` to your `.env.local` file with your Convex deployment URL.
   - Add `CLERK_JWT_ISSUER_DOMAIN` to your Convex environment variables with the Clerk Frontend API URL.

7. Start the Expo development server

```bash
npx expo start --clear --reset-cache
```

## Authentication Flow

- Sign in uses Clerk email/password authentication.
- Sign up creates the account, sends an email verification code, and completes verification in-app.
- Route access is controlled by Clerk auth state in the root Expo Router layout.
- Convex trusts the authenticated Clerk session for backend access, without mirroring Clerk users into a Convex `users` table.

## Contributing

Contributions to this starter project are highly encouraged and welcome! If you have any suggestions, bug reports, or feature requests, please feel free to create an issue or submit a pull request. Let's work together to enhance the developer experience and make it easier for everyone to build exceptional Expo applications with Clerk.

## License

This repository is licensed under the MIT License. You are granted the freedom to use, modify, and distribute the code for personal or commercial purposes. For more details, please refer to the [LICENSE](./LICENSE) file.
