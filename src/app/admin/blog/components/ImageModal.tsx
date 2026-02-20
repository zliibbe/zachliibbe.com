'use client';

import Image from 'next/image';
import styles from './ImageModal.module.css';
import Modal from './Modal';

export interface ImageOption {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt: string;
  attribution: {
    text: string;
    url: string;
  };
  width: number;
  height: number;
}

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'loading' | 'quick-result' | 'selection' | 'success' | 'error';
  title?: string;
  message?: string;
  image?: ImageOption;
  images?: ImageOption[];
  onSelectImage?: (image: ImageOption) => void;
  onRetry?: () => void;
}

export default function ImageModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  image,
  images = [],
  onSelectImage,
  onRetry,
}: ImageModalProps) {
  const renderContent = () => {
    switch (type) {
      case 'loading':
        return (
          <div className={styles.loadingContent}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>{message}</p>
          </div>
        );

      case 'quick-result':
        return (
          <div className={styles.quickResultContent}>
            {image && (
              <>
                <div className={styles.imageContainer}>
                  <Image
                    src={image.thumbnailUrl}
                    alt={image.alt}
                    width={300}
                    height={200}
                    className={styles.resultImage}
                  />
                </div>
                <div className={styles.imageDetails}>
                  <p className={styles.imageAlt}>{image.alt}</p>
                  <p className={styles.attribution}>
                    Photo by{' '}
                    <a
                      href={image.attribution.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.attributionLink}
                    >
                      {image.attribution.text}
                    </a>
                  </p>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={onClose}
                  >
                    Perfect!
                  </button>
                  {onRetry && (
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={onRetry}
                    >
                      Try Different Image
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );

      case 'selection':
        return (
          <div className={styles.selectionContent}>
            {images.length > 0 ? (
              <div className={styles.imageGrid}>
                {images.map((img, index) => (
                  <div key={img.id} className={styles.imageOption}>
                    <div className={styles.imageWrapper}>
                      <Image
                        src={img.thumbnailUrl}
                        alt={img.alt}
                        width={250}
                        height={150}
                        className={styles.selectionImage}
                      />
                    </div>
                    <div className={styles.imageInfo}>
                      <p className={styles.imageTitle}>Option {index + 1}</p>
                      <p className={styles.imageAttribution}>
                        {img.attribution.text}
                      </p>
                      <button
                        type="button"
                        className={styles.selectButton}
                        onClick={() => onSelectImage?.(img)}
                      >
                        Select This Image
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🖼️</div>
                <p className={styles.noResultsText}>
                  No suitable images found for this post.
                </p>
                <p className={styles.noResultsSubtext}>
                  You can try different tags or add an image manually later.
                </p>
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className={styles.successContent}>
            <div className={styles.successIcon}>✅</div>
            <p className={styles.successText}>{message}</p>
            {image && (
              <>
                <div className={styles.successImageContainer}>
                  <Image
                    src={image.thumbnailUrl}
                    alt={image.alt}
                    width={200}
                    height={120}
                    className={styles.successImage}
                  />
                </div>
                <p className={styles.successDetails}>
                  📸 {image.alt}
                  <br />📷 Photo by {image.attribution.text}
                </p>
              </>
            )}
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        );

      case 'error':
        return (
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>❌</div>
            <p className={styles.errorText}>{message}</p>
            <div className={styles.errorActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={onClose}
              >
                Close
              </button>
              {onRetry && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={onRetry}
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={type === 'selection' ? 'large' : 'medium'}
      showCloseButton={type !== 'loading'}
    >
      {renderContent()}
    </Modal>
  );
}
