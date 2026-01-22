import { apiClient } from '@/lib/api/client'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    jest.clearAllMocks()
  })

  describe('GET requests', () => {
    it('makes successful GET request', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
      })

      const result = await apiClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(result).toEqual(mockResponse)
    })

    it('handles GET request with query parameters', async () => {
      const mockResponse = { data: 'test' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await apiClient.get('/test', { params: { id: 1, name: 'test' } })

      expect(mockFetch).toHaveBeenCalledWith('/test?id=1&name=test', expect.any(Object))
      expect(result).toEqual(mockResponse)
    })
  })

  describe('POST requests', () => {
    it('makes successful POST request with data', async () => {
      const mockResponse = { id: 1, message: 'created' }
      const requestData = { name: 'test' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 201,
      })

      const result = await apiClient.post('/test', requestData)

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Error handling', () => {
    it('handles 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Not found' }),
      })

      await expect(apiClient.get('/not-found')).rejects.toThrow('HTTP 404: Not Found')
    })

    it('handles 500 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      })

      await expect(apiClient.post('/error')).rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/test')).rejects.toThrow('Network error')
    })

    it('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(apiClient.get('/test')).rejects.toThrow()
    })
  })

  describe('Headers and authentication', () => {
    it('includes authorization header when token is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await apiClient.get('/protected', {
        headers: { Authorization: 'Bearer token123' }
      })

      expect(mockFetch).toHaveBeenCalledWith('/protected', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        }),
      }))
    })

    it('merges custom headers with default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await apiClient.get('/test', {
        headers: { 'X-Custom': 'value' }
      })

      expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Custom': 'value',
        }),
      }))
    })
  })

  describe('Timeout handling', () => {
    it('respects timeout configuration', async () => {
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({}),
        }), 100))
      )

      const startTime = Date.now()
      await apiClient.get('/test', { timeout: 50 })
      const endTime = Date.now()

      // Should not take the full 100ms due to timeout
      expect(endTime - startTime).toBeLessThan(80)
    })
  })

  describe('Request cancellation', () => {
    it('supports request cancellation with AbortController', async () => {
      const abortController = new AbortController()

      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Aborted')), 50)
        })
      )

      const promise = apiClient.get('/test', {
        signal: abortController.signal
      })

      // Cancel the request immediately
      abortController.abort()

      await expect(promise).rejects.toThrow()
    })
  })
})