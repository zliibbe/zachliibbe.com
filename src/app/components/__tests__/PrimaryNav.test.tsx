import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import PrimaryNav from '../PrimaryNav';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.Mock;

describe('PrimaryNav', () => {
  it('renders all navigation links', () => {
    mockUsePathname.mockReturnValue('/');
    render(<PrimaryNav />);

    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Work' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Live Feed' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('links point to correct hrefs', () => {
    mockUsePathname.mockReturnValue('/');
    render(<PrimaryNav />);

    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute(
      'href',
      '/work'
    );
    expect(screen.getByRole('link', { name: 'Live Feed' })).toHaveAttribute(
      'href',
      '/live-feed'
    );
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      '/blog'
    );
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/contact'
    );
  });

  it.each([
    ['/about', 'About'],
    ['/work', 'Work'],
    ['/live-feed', 'Live Feed'],
    ['/blog', 'Blog'],
    ['/contact', 'Contact'],
  ])('marks %s link as active when pathname is %s', (pathname, linkName) => {
    mockUsePathname.mockReturnValue(pathname);
    render(<PrimaryNav />);

    const activeLink = screen.getByRole('link', { name: linkName });
    expect(activeLink.className).toMatch(/active/);
  });

  it('marks Blog as active on nested blog paths', () => {
    mockUsePathname.mockReturnValue('/blog/my-post-slug');
    render(<PrimaryNav />);

    const blogLink = screen.getByRole('link', { name: 'Blog' });
    expect(blogLink.className).toMatch(/active/);
  });

  it('does not mark other links as active when one is active', () => {
    mockUsePathname.mockReturnValue('/about');
    render(<PrimaryNav />);

    const inactiveLinks = ['Work', 'Live Feed', 'Blog', 'Contact'];
    for (const name of inactiveLinks) {
      expect(screen.getByRole('link', { name }).className).not.toMatch(
        /active/
      );
    }
  });
});
