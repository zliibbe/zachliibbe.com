'use client';

import { FaEnvelope, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { analytics } from '../utils/analytics';

interface ShareButtonsProps {
  slug: string;
  title: string;
  author: string;
  shareUrl: string;
  className?: string;
}

/**
 * Social share buttons with analytics tracking
 * Single responsibility: Render share buttons and track clicks
 */
export default function ShareButtons({
  slug,
  title,
  author,
  shareUrl,
  className,
}: ShareButtonsProps) {
  const shareText = encodeURIComponent(`Check out "${title}" by ${author}`);

  const handleShareClick = (platform: 'twitter' | 'linkedin' | 'email') => {
    if (analytics.isEnabled()) {
      analytics.trackBlogShare(slug, platform);
    }
  };

  return (
    <div className={className}>
      <a
        href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleShareClick('twitter')}
        aria-label="Share on Twitter"
      >
        <FaTwitter size={30} />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleShareClick('linkedin')}
        aria-label="Share on LinkedIn"
      >
        <FaLinkedin size={30} />
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${shareText}%0A%0A${shareUrl}`}
        onClick={() => handleShareClick('email')}
        aria-label="Share via Email"
      >
        <FaEnvelope size={30} />
      </a>
    </div>
  );
}
