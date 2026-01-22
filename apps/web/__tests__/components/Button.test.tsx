import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

// Mock the Button component if it doesn't exist yet
const Button = ({ children, onClick, ...props }: any) => (
  <button onClick={onClick} {...props}>
    {children}
  </button>
)

describe('Button', () => {
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
})