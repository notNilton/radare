import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AboutModal from './AboutModal';

vi.mock('lucide-react', () => ({
  CircleHelp: () => <span>Info</span>,
  Github: () => <span>Github</span>,
  Linkedin: () => <span>Linkedin</span>,
  Mail: () => <span>Mail</span>,
  X: () => <span>Close</span>,
}));

describe('AboutModal', () => {
  it('should not render when showAbout is false', () => {
    render(<AboutModal showAbout={false} toggleAboutPopup={vi.fn()} />);
    expect(screen.queryByText('Sobre')).not.toBeInTheDocument();
  });

  it('should render correctly when showAbout is true', () => {
    render(<AboutModal showAbout={true} toggleAboutPopup={vi.fn()} />);
    expect(screen.getByText('Sobre')).toBeInTheDocument();
    // RADARE appears multiple times
    expect(screen.getAllByText(/RADARE/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Nilton Aguiar dos Santos/)).toBeInTheDocument();
    expect(screen.getByText(/backend em Go/)).toBeInTheDocument();
  });

  it('should show contact links', () => {
    render(<AboutModal showAbout={true} toggleAboutPopup={vi.fn()} />);
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });
});
