import { MessageService } from '../../src/services/message.service'

// Simple test to verify service can be instantiated
describe('MessageService', () => {
  it('should be defined', () => {
    expect(MessageService).toBeDefined()
  })
})
jest.mock('@repo/shared/constants', () => ({
  ERROR_MESSAGES: {
    MESSAGE_NOT_FOUND: 'Message not found',
    UNAUTHORIZED: 'Unauthorized access',
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe('MessageService', () => {
  let messageService: MessageService

  beforeEach(() => {
    messageService = new MessageService()
    jest.clearAllMocks()
  })

  describe('createMessage', () => {
    const messageData = {
      content: 'Hello world!',
      type: 'text' as const,
      chatId: 'chat-1',
      senderId: 'user-1',
    }

    it('should create a message successfully', async () => {
      const mockMessage = {
        id: 'msg-1',
        ...messageData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockMessage]),
      } as any)

      const result = await messageService.createMessage(messageData)

      expect(result).toEqual(mockMessage)
      expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle database errors', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any)

      await expect(messageService.createMessage(messageData)).rejects.toThrow('Database error')
    })
  })

  describe('getMessagesByChat', () => {
    const chatId = 'chat-1'

    it('should return messages for a chat', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Hello',
          chatId,
          senderId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'msg-2',
          content: 'Hi there!',
          chatId,
          senderId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockDb.query.messages.findMany.mockResolvedValue(mockMessages as any)

      const result = await messageService.getMessagesByChat(chatId)

      expect(result).toEqual(mockMessages)
      expect(mockDb.query.messages.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Function),
        limit: 50,
      })
    })

    it('should handle pagination', async () => {
      const mockMessages = [
        {
          id: 'msg-3',
          content: 'Paginated message',
          chatId,
          senderId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockDb.query.messages.findMany.mockResolvedValue(mockMessages as any)

      const result = await messageService.getMessagesByChat(chatId, {
        limit: 10,
        before: 'msg-2',
      })

      expect(result).toEqual(mockMessages)
      expect(mockDb.query.messages.findMany).toHaveBeenCalledWith({
        where: expect.any(Function),
        orderBy: expect.any(Function),
        limit: 10,
      })
    })

    it('should return empty array for chat with no messages', async () => {
      mockDb.query.messages.findMany.mockResolvedValue([])

      const result = await messageService.getMessagesByChat(chatId)

      expect(result).toEqual([])
    })
  })

  describe('updateMessage', () => {
    const messageId = 'msg-1'
    const updateData = { content: 'Updated content' }

    it('should update a message successfully', async () => {
      const mockUpdatedMessage = {
        id: messageId,
        content: 'Updated content',
        chatId: 'chat-1',
        senderId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUpdatedMessage]),
      } as any)

      const result = await messageService.updateMessage(messageId, updateData)

      expect(result).toEqual(mockUpdatedMessage)
    })

    it('should throw error when message not found', async () => {
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
      } as any)

      await expect(messageService.updateMessage(messageId, updateData))
        .rejects.toThrow('Message not found')
    })
  })

  describe('deleteMessage', () => {
    const messageId = 'msg-1'

    it('should delete a message successfully', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue({}),
      } as any)

      await expect(messageService.deleteMessage(messageId)).resolves.not.toThrow()

      expect(mockDb.delete).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle database errors during deletion', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockRejectedValue(new Error('Delete failed')),
      } as any)

      await expect(messageService.deleteMessage(messageId)).rejects.toThrow('Delete failed')
    })
  })

  describe('markMessageAsRead', () => {
    const messageId = 'msg-1'
    const userId = 'user-1'

    it('should mark message as read', async () => {
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        onConflictDoNothing: jest.fn().mockResolvedValue({}),
      } as any)

      await expect(messageService.markMessageAsRead(messageId, userId)).resolves.not.toThrow()

      expect(mockDb.insert).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle duplicate read receipts gracefully', async () => {
      // Simulate conflict (message already marked as read)
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnThis(),
        onConflictDoNothing: jest.fn().mockResolvedValue({}),
      } as any)

      await expect(messageService.markMessageAsRead(messageId, userId)).resolves.not.toThrow()
    })
  })

  describe('getUnreadCount', () => {
    const userId = 'user-1'
    const chatId = 'chat-1'

    it('should return unread message count', async () => {
      mockDb.$count.mockResolvedValue(5)

      const result = await messageService.getUnreadCount(userId, chatId)

      expect(result).toBe(5)
      expect(mockDb.$count).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should return 0 for chat with no unread messages', async () => {
      mockDb.$count.mockResolvedValue(0)

      const result = await messageService.getUnreadCount(userId, chatId)

      expect(result).toBe(0)
    })
  })
})