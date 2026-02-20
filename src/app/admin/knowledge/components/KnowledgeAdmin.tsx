'use client';

import Link from 'next/link';
import type { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { HiChatBubbleLeftRight } from 'react-icons/hi2';
import {
  MdAnalytics,
  MdArrowBack,
  MdDescription,
  MdEdit,
  MdFolder,
  MdRefresh,
} from 'react-icons/md';
import EmbeddingStatus from './EmbeddingStatus';
import styles from './KnowledgeAdmin.module.css';
import KnowledgeFileEditor from './KnowledgeFileEditor';
import TestQueryInterface from './TestQueryInterface';

interface KnowledgeAdminProps {
  session: Session;
}

interface KnowledgeFile {
  filename: string;
  content: string;
  lastModified: string;
  embeddingStatus?: 'current' | 'outdated' | 'missing';
  chunkCount?: number;
}

type ViewMode = 'overview' | 'editor' | 'status' | 'testing';

export default function KnowledgeAdmin({ session }: KnowledgeAdminProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);

  useEffect(() => {
    loadKnowledgeFiles();
  }, []);

  const loadKnowledgeFiles = async () => {
    try {
      const response = await fetch('/api/admin/knowledge');
      if (response.ok) {
        const files = await response.json();
        setKnowledgeFiles(files);
      }
    } catch (error) {
      console.error('Error loading knowledge files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFile = (file: KnowledgeFile) => {
    setSelectedFile(file);
    setViewMode('editor');
  };

  const handleReprocessAll = async () => {
    setReprocessing(true);
    try {
      const response = await fetch('/api/admin/knowledge/reprocess', {
        method: 'POST',
      });
      if (response.ok) {
        await loadKnowledgeFiles();
      }
    } catch (error) {
      console.error('Error reprocessing embeddings:', error);
    } finally {
      setReprocessing(false);
    }
  };

  const renderOverview = () => (
    <div className={styles.overview}>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleReprocessAll}
          disabled={reprocessing}
          className={styles.actionButton}
        >
          <MdRefresh />
          {reprocessing ? 'Reprocessing...' : 'Reprocess All'}
        </button>
      </div>

      <div className={styles.fileGrid}>
        {knowledgeFiles.map(file => (
          <div key={file.filename} className={styles.fileCard}>
            <div className={styles.fileIcon}>
              <MdDescription size={24} />
            </div>
            <div className={styles.fileInfo}>
              <h3>{file.filename}</h3>
              <p>
                Last modified:{' '}
                {new Date(file.lastModified).toLocaleDateString()}
              </p>
              {file.chunkCount && (
                <p className={styles.chunkInfo}>{file.chunkCount} chunks</p>
              )}
            </div>
            <div className={styles.fileActions}>
              <button
                type="button"
                onClick={() => handleEditFile(file)}
                className={styles.editButton}
                title="Edit file"
              >
                <MdEdit />
              </button>
              <div
                className={`${styles.statusIndicator} ${styles[file.embeddingStatus || 'missing']}`}
                title={`Embedding status: ${file.embeddingStatus || 'missing'}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNavigation = () => (
    <div className={styles.navigation}>
      <button
        type="button"
        onClick={() => setViewMode('overview')}
        className={viewMode === 'overview' ? styles.active : ''}
      >
        <MdFolder />
        Files
      </button>
      <button
        type="button"
        onClick={() => setViewMode('status')}
        className={viewMode === 'status' ? styles.active : ''}
      >
        <MdAnalytics />
        Status
      </button>
      <button
        type="button"
        onClick={() => setViewMode('testing')}
        className={viewMode === 'testing' ? styles.active : ''}
      >
        <HiChatBubbleLeftRight />
        Test Chat
      </button>
    </div>
  );

  return (
    <div className="universal-gradient-container">
      <div className="universal-gradient-background" />
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          <main className={styles.content}>
            <header className={styles.header}>
              <div className={styles.headerContent}>
                <div className={styles.headerLeft}>
                  <Link href="/admin" className={styles.backButton}>
                    <MdArrowBack />
                    Back to Dashboard
                  </Link>
                  <h1>Knowledge Base Management</h1>
                </div>
              </div>
            </header>

            {renderNavigation()}

            <div className={styles.mainContent}>
              {loading ? (
                <div className={styles.loading}>Loading knowledge files...</div>
              ) : (
                <>
                  {viewMode === 'overview' && renderOverview()}
                  {viewMode === 'editor' && selectedFile && (
                    <KnowledgeFileEditor
                      file={selectedFile}
                      onSave={loadKnowledgeFiles}
                      onClose={() => setViewMode('overview')}
                    />
                  )}
                  {viewMode === 'status' && (
                    <EmbeddingStatus files={knowledgeFiles} />
                  )}
                  {viewMode === 'testing' && <TestQueryInterface />}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
