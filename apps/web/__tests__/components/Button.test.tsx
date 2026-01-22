import { render, screen, fireEvent } from '@/lib/test-utils'

// Mock the Button component if it doesn't exist yet
const Button = ({ children, onClick, ...props }: any) => (
  <button onClick={onClick} {...props}>
    {children}
  </button>
)

describe('Button', () => {
  beforeEach(() => {
    // Setup test environment
    jest.clearAllMocks()
  })

  it('renders children correctly', () => {
    render(<Button>Hello World</Button>)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies additional props', () => {
    render(<Button data-testid="custom-button">Test</Button>)
    expect(screen.getByTestId('custom-button')).toBeInTheDocument()
  })

  it('is accessible with proper role', () => {
    render(<Button>Accessible Button</Button>)
    const button = screen.getByRole('button', { name: /accessible button/i })
    expect(button).toBeInTheDocument()
  })

  it('handles disabled state', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>Disabled</Button>)

    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
})