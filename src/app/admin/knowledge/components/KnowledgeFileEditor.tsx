'use client';

import { useEffect, useState } from 'react';
import { MdClose, MdCode, MdPreview, MdSave } from 'react-icons/md';
import { markdownToHtml } from '@/lib/markdown';
import styles from './KnowledgeFileEditor.module.css';

interface KnowledgeFile {
  filename: string;
  content: string;
  lastModified: string;
  embeddingStatus?: 'current' | 'outdated' | 'missing';
  chunkCount?: number;
}

interface KnowledgeFileEditorProps {
  file: KnowledgeFile;
  onSave: () => void;
  onClose: () => void;
}

export default function KnowledgeFileEditor({
  file,
  onSave,
  onClose,
}: KnowledgeFileEditorProps) {
  const [content, setContent] = useState(file.content);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(content !== file.content);
  }, [content, file.content]);

  useEffect(() => {
    if (previewMode && content) {
      const html = markdownToHtml(content);
      setPreviewContent(html);
    }
  }, [previewMode, content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/knowledge/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.filename,
          content: content,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        onSave();
      } else {
        console.error('Failed to save file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  return (
    <div className={styles.editor}>
      <div className={styles.editorHeader}>
        <div className={styles.editorTitle}>
          <h2>Editing: {file.filename}</h2>
          {hasChanges && <span className={styles.unsavedIndicator}>●</span>}
        </div>
        <div className={styles.editorControls}>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`${styles.controlButton} ${previewMode ? styles.active : ''}`}
            title={previewMode ? 'Switch to editor' : 'Switch to preview'}
          >
            {previewMode ? <MdCode /> : <MdPreview />}
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={styles.saveButton}
            title="Save changes"
          >
            <MdSave />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            title="Close editor"
          >
            <MdClose />
          </button>
        </div>
      </div>

      <div className={styles.editorContent}>
        {previewMode ? (
          <div className={styles.preview}>
            <div
              className={styles.previewContent}
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
        ) : (
          <div className={styles.editorPane}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className={styles.textarea}
              placeholder="Enter your markdown content here..."
              spellCheck={false}
            />
            <div className={styles.editorStats}>
              <span>Lines: {content.split('\n').length}</span>
              <span>Characters: {content.length}</span>
              <span>
                Words:{' '}
                {content.split(/\s+/).filter(word => word.length > 0).length}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.editorFooter}>
        <div className={styles.fileInfo}>
          <span>
            Last modified: {new Date(file.lastModified).toLocaleString()}
          </span>
          {file.chunkCount && <span>Current chunks: {file.chunkCount}</span>}
        </div>
        <div className={styles.helpText}>
          <span>
            💡 Changes will trigger automatic re-processing of embeddings when
            saved
          </span>
        </div>
      </div>
    </div>
  );
}
