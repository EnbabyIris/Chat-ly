import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/auth-context'
import { SocketProvider } from '@/contexts/socket-context'

// Mock implementations
export const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
}

export const mockMessage = {
  id: 'msg-1',
  content: 'Hello world!',
  senderId: 'user-1',
  chatId: 'chat-1',
  type: 'text' as const,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
}

export const mockChat = {
  id: 'chat-1',
  name: 'Test Chat',
  type: 'direct' as const,
  participants: [mockUser],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
}

// Custom render function with providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test utilities
export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
})

export const createMockMessage = (overrides = {}) => ({
  ...mockMessage,
  ...overrides,
})

export const createMockChat = (overrides = {}) => ({
  ...mockChat,
  ...overrides,
})

// Mock API responses
export const mockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
})

export const mockApiError = (message: string, status = 400) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error: message }),
})

// Local storage mocks
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key])
      },
      key: (index: number) => Object.keys(store)[index] || null,
      get length() {
        return Object.keys(store).length
      },
    },
    writable: true,
  })
}

// Intersection Observer mock
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {
      return null
    }
    disconnect() {
      return null
    }
    unobserve() {
      return null
    }
  }
}

// Resize Observer mock
export const mockResizeObserver = () => {
  global.ResizeObserver = class ResizeObserver {
    constructor(cb: ResizeObserverCallback) {
      this.cb = cb
    }
    cb: ResizeObserverCallback
    observe() {}
    disconnect() {}
    unobserve() {}
  }
}

// Match Media mock
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  })
}

// WebSocket mock
export const mockWebSocket = () => {
  global.WebSocket = class MockWebSocket {
    constructor() {
      this.readyState = 1 // OPEN
    }
    readyState: number
    send = jest.fn()
    close = jest.fn()
    addEventListener = jest.fn()
    removeEventListener = jest.fn()
    dispatchEvent = jest.fn()
  } as any
}

// Setup all mocks
export const setupTestEnvironment = () => {
  mockLocalStorage()
  mockIntersectionObserver()
  mockResizeObserver()
  mockMatchMedia()
  mockWebSocket()

  // Mock environment variables
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000'
  process.env.NEXT_PUBLIC_SOCKET_URL = 'http://localhost:8000'
}

// Cleanup utilities
export const cleanupTestEnvironment = () => {
  jest.clearAllMocks()
  jest.clearAllTimers()

  // Reset localStorage
  if (window.localStorage) {
    window.localStorage.clear()
  }
}

// Custom test hooks
export const useTestSetup = () => {
  beforeEach(() => {
    setupTestEnvironment()
  })

  afterEach(() => {
    cleanupTestEnvironment()
  })
}

// Performance testing utilities
export const measureRenderTime = async (component: ReactElement) => {
  const startTime = performance.now()

  customRender(component)

  // Wait for next tick
  await new Promise(resolve => setTimeout(resolve, 0))

  const endTime = performance.now()
  return endTime - startTime
}

// Accessibility testing utilities
export const expectAccessible = (element: HTMLElement) => {
  // Basic accessibility checks
  expect(element).toBeInTheDocument()

  // Check for ARIA labels where needed
  if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label') && !element.textContent?.trim()) {
    console.warn('Button without accessible label:', element)
  }

  // Check for alt text on images
  if (element.tagName === 'IMG' && !element.getAttribute('alt')) {
    console.warn('Image without alt text:', element)
  }

  return element
}