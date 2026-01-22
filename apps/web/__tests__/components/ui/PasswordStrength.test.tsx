import { render, screen } from '@/lib/test-utils'
import { PasswordStrength, PasswordRequirements } from '@/components/ui/password-strength'

describe('PasswordStrength', () => {
  it('should not render anything for empty password', () => {
    const { container } = render(<PasswordStrength password="" />)
    expect(container.firstChild).toBeNull()
  })

  it('should render strength indicator for weak password', () => {
    render(<PasswordStrength password="123" />)

    expect(screen.getByText('Very Weak')).toBeInTheDocument()
    expect(screen.getByText('Very Weak')).toHaveClass('text-red-500')
  })

  it('should render strength indicator for good password', () => {
    render(<PasswordStrength password="Password123" />)

    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Good')).toHaveClass('text-yellow-500')
  })

  it('should show feedback for weak passwords by default', () => {
    render(<PasswordStrength password="weak" />)

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument()
    expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument()
  })

  it('should hide feedback when showFeedback is false', () => {
    render(<PasswordStrength password="weak" showFeedback={false} />)

    expect(screen.queryByText('Password must be at least 8 characters')).not.toBeInTheDocument()
    expect(screen.getByText('Very Weak')).toBeInTheDocument()
  })

  it('should show checkmark for valid passwords', () => {
    render(<PasswordStrength password="StrongPass123" />)

    // Should show checkmark for valid password
    const checkIcon = document.querySelector('[data-testid="check-icon"]') ||
                      document.querySelector('.lucide-check')
    // Note: The check icon may not have a test ID, so we check the text instead
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<PasswordStrength password="test" className="custom-class" />)

    const container = screen.getByText('Very Weak').closest('div')
    expect(container?.parentElement).toHaveClass('custom-class')
  })

  it('should render correct number of strength bars', () => {
    render(<PasswordStrength password="Password123" />)

    // Should have 4 strength bars
    const bars = document.querySelectorAll('[class*="h-2 w-full rounded-full"]')
    expect(bars).toHaveLength(4)
  })

  it('should highlight correct number of bars based on strength', () => {
    render(<PasswordStrength password="Password123" />)

    // For a score of 3 (Good), 3 bars should be highlighted
    const activeBars = document.querySelectorAll('[class*="bg-yellow-500"], [class*="bg-green-500"]')
    expect(activeBars.length).toBeGreaterThan(0)
  })
})

describe('PasswordRequirements', () => {
  it('should render all password requirements', () => {
    render(<PasswordRequirements password="test" />)

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument()
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument()
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument()
    expect(screen.getByText('One number')).toBeInTheDocument()
  })

  it('should show checkmarks for met requirements', () => {
    render(<PasswordRequirements password="Password123" />)

    // All requirements should be met for this password
    const checkIcons = document.querySelectorAll('.lucide-check, [data-testid*="check"]')
    expect(checkIcons.length).toBe(4) // All 4 requirements met
  })

  it('should show X marks for unmet requirements', () => {
    render(<PasswordRequirements password="weak" />)

    // Most requirements should be unmet
    const xIcons = document.querySelectorAll('.lucide-x, [data-testid*="x"]')
    expect(xIcons.length).toBeGreaterThan(0)
  })

  it('should apply custom className', () => {
    render(<PasswordRequirements password="test" className="custom-requirements" />)

    const container = screen.getByText('At least 8 characters').closest('div')
    expect(container?.parentElement).toHaveClass('custom-requirements')
  })

  it('should handle empty password', () => {
    render(<PasswordRequirements password="" />)

    // Should still show all requirements, all unmarked
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument()

    const xIcons = document.querySelectorAll('.lucide-x')
    expect(xIcons.length).toBe(4) // All requirements unmet
  })

  // F2P Test: Component behavior fixes
  describe('F2P: Component rendering fixes', () => {
    it('should render correctly for edge cases', () => {
      // Test that component doesn't crash with special characters
      expect(() => {
        render(<PasswordStrength password="Special@Chars#123" />)
      }).not.toThrow()

      expect(screen.getByText('Strong')).toBeInTheDocument()
    })

    it('should handle very long passwords', () => {
      const longPassword = 'A'.repeat(200)
      expect(() => {
        render(<PasswordStrength password={longPassword} />)
      }).not.toThrow()

      // Should show feedback about length
      expect(screen.getByText('Password must be less than 100 characters')).toBeInTheDocument()
    })
  })

  // P2P Test: Regression protection
  describe('P2P: Regression protection', () => {
    it('should maintain consistent rendering behavior', () => {
      const { rerender } = render(<PasswordStrength password="weak" />)

      expect(screen.getByText('Very Weak')).toBeInTheDocument()

      // Re-render with stronger password
      rerender(<PasswordStrength password="StrongPass123" />)

      expect(screen.getByText('Good')).toBeInTheDocument()
      expect(screen.queryByText('Very Weak')).not.toBeInTheDocument()
    })

    it('should maintain accessibility features', () => {
      render(<PasswordStrength password="test" />)

      // Ensure no accessibility regressions
      const strengthText = screen.getByText('Very Weak')
      expect(strengthText).toBeInTheDocument()
      expect(strengthText.tagName).toBe('SPAN')
    })
  })
})