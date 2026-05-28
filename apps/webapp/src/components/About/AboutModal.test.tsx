import { render } from '@testing-library/react';
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
    const { queryByText } = render(<AboutModal showAbout={false} toggleAboutPopup={vi.fn()} />);
    expect(queryByText(/Sobre o Radare/)).not.toBeInTheDocument();
  });

  it('should render correctly when showAbout is true', () => {
    const { getByText, getAllByText } = render(<AboutModal showAbout={true} toggleAboutPopup={vi.fn()} />);
    expect(getByText(/Sobre o Radare/)).toBeInTheDocument();
    // RADARE appears multiple times
    expect(getAllByText(/RADARE/)[0]).toBeInTheDocument();
    expect(getByText(/Nilton Aguiar dos Santos/)).toBeInTheDocument();
    expect(getByText(/Go e React Flow/)).toBeInTheDocument();
  });

  it('should show contact links', () => {
    const { getByText } = render(<AboutModal showAbout={true} toggleAboutPopup={vi.fn()} />);
    expect(getByText('GitHub')).toBeInTheDocument();
    expect(getByText('LinkedIn')).toBeInTheDocument();
    expect(getByText('Email')).toBeInTheDocument();
  });
});
