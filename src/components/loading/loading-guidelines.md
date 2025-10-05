# Loading UI Guidelines

## Loading State Hierarchy

### 1. **Page-Level Loading** (Full Page)
- **Use Cases**: Initial page load, route transitions, auth state loading
- **Component**: `<PageLoader />` or `<LoadingPage />`
- **Characteristics**:
  - Full viewport coverage
  - Brand-aware loading with logo/title
  - Skeleton layout matching target page structure
  - Smooth transitions

### 2. **Section Loading** (Large Content Areas)
- **Use Cases**: Itinerary loading, activity lists, large data sections
- **Component**: `<SectionLoader />` or specific skeletons
- **Characteristics**:
  - Contains within section boundaries
  - Skeleton matching content structure
  - Progressive loading hints

### 3. **Component Loading** (Individual Components)
- **Use Cases**: Individual cards, forms, small data sections
- **Component**: `<Skeleton />` or `<ComponentLoader />`
- **Characteristics**:
  - Minimal, focused loading
  - Content-shape-aware skeletons
  - Quick transitions

### 4. **Action Loading** (User Actions)
- **Use Cases**: Button clicks, form submissions, mutations
- **Component**: Button with `isPending` state, `<ActionLoader />`
- **Characteristics**:
  - Inline spinners or disabled states
  - Immediate feedback
  - Clear action indication

### 5. **Overlay Loading** (Modal/Blocking Operations)
- **Use Cases**: File uploads, complex operations, critical actions
- **Component**: `<LoadingOverlay />`
- **Characteristics**:
  - Semi-transparent backdrop
  - Centered spinner with message
  - Blocks user interaction

## Loading Component Patterns

### Timing
- **Instant**: 0-100ms - No loading state needed
- **Fast**: 100ms-500ms - Subtle inline spinners
- **Medium**: 500ms-2s - Skeleton components
- **Slow**: 2s+ - Full loading pages with progress if possible

### Visual Hierarchy
- **Primary**: Main content loading (skeleton of actual content)
- **Secondary**: Supporting content (simple spinners)
- **Interactive**: User-triggered actions (button states)

### Accessibility
- All loading states must include:
- `aria-live="polite"` for non-critical updates
- `aria-live="assertive"` for important state changes
- `aria-label` descriptions
- Screen reader friendly text