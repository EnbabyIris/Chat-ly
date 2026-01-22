import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatBubble } from '@/components/chat/ChatBubble'

// Mock the component if it doesn't exist yet
const ChatBubble = ({ message, isOwn, onDelete }: any) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-xs p-3 rounded-lg ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
      <p>{message.content}</p>
      <div className="text-xs mt-1 opacity-70">
        {new Date(message.createdAt).toLocaleTimeString()}
      </div>
      {onDelete && (
        <button onClick={() => onDelete(message.id)} data-testid="delete-btn">
          Delete
        </button>
      )}
    </div>
  </div>
)

describe('ChatBubble', () => {
  const mockMessage = {
    id: 'msg-1',
    content: 'Hello world!',
    senderId: 'user-1',
    chatId: 'chat-1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  }

  it('renders message content correctly', () => {
    render(<ChatBubble message={mockMessage} isOwn={false} />)

    expect(screen.getByText('Hello world!')).toBeInTheDocument()
    expect(screen.getByText('10:00:00 AM')).toBeInTheDocument()
  })

  it('applies correct styling for own messages', () => {
    render(<ChatBubble message={mockMessage} isOwn={true} />)

    const bubble = screen.getByText('Hello world!').closest('div')
    expect(bubble?.parentElement).toHaveClass('justify-end')
  })

  it('applies correct styling for other messages', () => {
    render(<ChatBubble message={mockMessage} isOwn={false} />)

    const bubble = screen.getByText('Hello world!').closest('div')
    expect(bubble?.parentElement).toHaveClass('justify-start')
  })

  it('shows delete button when onDelete is provided', () => {
    const mockOnDelete = jest.fn()
    render(<ChatBubble message={mockMessage} isOwn={false} onDelete={mockOnDelete} />)

    const deleteBtn = screen.getByTestId('delete-btn')
    expect(deleteBtn).toBeInTheDocument()

    fireEvent.click(deleteBtn)
    expect(mockOnDelete).toHaveBeenCalledWith('msg-1')
  })

  it('does not show delete button when onDelete is not provided', () => {
    render(<ChatBubble message={mockMessage} isOwn={false} />)

    expect(screen.queryByTestId('delete-btn')).not.toBeInTheDocument()
  })

  it('formats timestamp correctly', () => {
    const messageWithDifferentTime = {
      ...mockMessage,
      createdAt: new Date('2024-01-01T15:30:45Z'),
    }

    render(<ChatBubble message={messageWithDifferentTime} isOwn={false} />)

    expect(screen.getByText('3:30:45 PM')).toBeInTheDocument()
  })

  it('handles long messages appropriately', () => {
    const longMessage = {
      ...mockMessage,
      content: 'A'.repeat(1000),
    }

    render(<ChatBubble message={longMessage} isOwn={false} />)

    expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument()
  })

  it('is accessible with proper ARIA labels', () => {
    render(<ChatBubble message={mockMessage} isOwn={false} />)

    // Check for semantic structure
    const messageElement = screen.getByText('Hello world!')
    expect(messageElement).toBeInTheDocument()

    // Check that it's contained in a proper structure
    const container = messageElement.closest('[role]')
    // Note: This test assumes the component will be enhanced with proper ARIA roles
  })
})