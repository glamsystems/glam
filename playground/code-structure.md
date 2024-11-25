````
src/
  app/                      # Next.js App Directory (routing and layouts)
    layout.tsx              # Root layout (global providers, error handling, wallet check)
    page.tsx                # Landing page (gui.glam.systems)
    loading.tsx             # Global fallback loading page (e.g., for suspense or long-loading components)
    error.tsx               # Global fallback error page (e.g., for uncaught errors)

    (vault)/                # Vault-specific route group
      layout.tsx            # Vault-specific layout (dynamic sidebar)
      page.tsx              # Vault overview page
      loading.tsx           # Vault-specific loading page
      error.tsx             # Vault-specific error page
      settings/             # Vault-specific settings route
        page.tsx            # Global + Vault-specific settings
      transactions/         # Vault-specific transactions route
        page.tsx            # Transactions page for Vault

    (mint)/                 # Mint-specific route group
      layout.tsx            # Mint-specific layout (dynamic sidebar)
      page.tsx              # Mint overview page
      loading.tsx           # Mint-specific loading page
      error.tsx             # Mint-specific error page
      settings/             # Mint-specific settings route
        page.tsx            # Global + Mint-specific settings
      create/               # Mint token creation route
        page.tsx            # Create Mint page
      manage/               # Mint token management route
        page.tsx            # Manage Mint page

    (playground)/           # Playground-specific route group
      layout.tsx            # Playground-specific layout (custom sidebar for all settings/pages)
      page.tsx              # Playground overview page
      loading.tsx           # Playground-specific loading page
      error.tsx             # Playground-specific error page
      settings/             # Playground settings page
        page.tsx            # Combined Global + Vault + Mint settings

  shared/                   # Shared logic, components, and settings
    settings/               # Shared settings components
      GlobalSettings.tsx    # Global settings component
      VaultSettings.tsx     # Vault-specific settings component
      MintSettings.tsx      # Mint-specific settings component
    components/             # Shared components
      Sidebar.tsx           # Dynamic sidebar component (used in Vault, Mint, Playground)
      PlaygroundSidebar.tsx # Custom sidebar for Playground
      ConnectWalletPage.tsx # Fallback for users without wallet connection
      LoadingSpinner.tsx    # Shared loading spinner component
      ErrorFallback.tsx     # Reusable error fallback component

  components/               # Reusable, generic UI and layout components
    ui/                     # Low-level UI components
      Button.tsx            # Button component
      Input.tsx             # Input component
      Modal.tsx             # Modal component
    layout/                 # Layout-related components
      Header.tsx            # Shared header component
      Footer.tsx            # Shared footer component

  constants/                # Centralized constants and configuration
    sidebarConfig.ts        # Sidebar configuration for Vault, Mint, and Playground
    appConfig.tsx           # Global app-level constants

  data/                     # Static data and schemas
    glamFormSchema.json     # Form configuration schema
    glamRiskSchema.json     # Risk settings schema

  hooks/                    # Custom React hooks
    useMobile.tsx           # Hook for detecting mobile devices
    useWallet.tsx           # Hook for managing wallet connection
    useSidebarState.tsx     # Hook for managing sidebar state (expanded/collapsed)

  lib/                      # Core utilities and business logic
    error.ts                # Centralized error handling logic
    utils.ts                # General-purpose utilities

  styles/                   # Global and shared CSS/SCSS styles
    globals.css             # Global styles
    sidebar.css             # Sidebar-specific styles
    layout.css              # Layout-specific styles
````
