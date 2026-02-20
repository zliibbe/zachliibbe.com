'use client';

import { useEffect, useState } from 'react';
import { MdRefresh, MdSpeed, MdStorage, MdTrendingUp } from 'react-icons/md';
import styles from './EmbeddingStatus.module.css';

interface KnowledgeFile {
  filename: string;
  content: string;
  lastModified: string;
  embeddingStatus?: 'current' | 'outdated' | 'missing';
  chunkCount?: number;
}

interface EmbeddingStatusProps {
  files: KnowledgeFile[];
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  totalEmbeddings: number;
  averageResponseTime: number;
}

interface FileStatus {
  filename: string;
  status: 'current' | 'outdated' | 'missing';
  chunkCount: number;
  lastEmbedded: string | null;
  fileSize: number;
  processingTime?: number;
}

export default function EmbeddingStatus({ files }: EmbeddingStatusProps) {
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    totalEmbeddings: 0,
    averageResponseTime: 0,
  });
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEmbeddingStatus();
  }, [files]);

  const loadEmbeddingStatus = async () => {
    try {
      const response = await fetch('/api/admin/knowledge/status');
      if (response.ok) {
        const data = await response.json();
        setCacheStats(data.cacheStats);
        setFileStatuses(data.fileStatuses);
      }
    } catch (error) {
      console.error('Error loading embedding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmbeddingStatus();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return '#22c55e';
      case 'outdated':
        return '#f59e0b';
      case 'missing':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'current':
        return 'Up to date';
      case 'outdated':
        return 'Needs update';
      case 'missing':
        return 'Not embedded';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        Loading embedding status...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Embedding Status & Performance</h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className={styles.refreshButton}
        >
          <MdRefresh className={refreshing ? styles.spinning : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MdStorage />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{cacheStats.totalEmbeddings}</div>
            <div className={styles.statLabel}>Total Embeddings</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MdTrendingUp />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {(cacheStats.hitRate * 100).toFixed(1)}%
            </div>
            <div className={styles.statLabel}>Cache Hit Rate</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <MdSpeed />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {cacheStats.averageResponseTime}ms
            </div>
            <div className={styles.statLabel}>Avg Response Time</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {cacheStats.cacheHits} / {cacheStats.totalRequests}
            </div>
            <div className={styles.statLabel}>Cache Hits / Total</div>
          </div>
        </div>
      </div>

      <div className={styles.fileStatusSection}>
        <h3>File Status Details</h3>
        <div className={styles.fileStatusList}>
          {fileStatuses.map(fileStatus => (
            <div key={fileStatus.filename} className={styles.fileStatusCard}>
              <div className={styles.fileStatusHeader}>
                <div className={styles.fileStatusInfo}>
                  <h4>{fileStatus.filename}</h4>
                  <div className={styles.fileMetrics}>
                    <span>{fileStatus.chunkCount} chunks</span>
                    <span>{(fileStatus.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <div className={styles.fileStatusBadge}>
                  <div
                    className={styles.statusIndicator}
                    style={{
                      backgroundColor: getStatusColor(fileStatus.status),
                    }}
                  />
                  <span>{getStatusText(fileStatus.status)}</span>
                </div>
              </div>

              <div className={styles.fileStatusDetails}>
                <div className={styles.statusDetail}>
                  <span className={styles.statusLabel}>Last Embedded:</span>
                  <span className={styles.statusValue}>
                    {fileStatus.lastEmbedded
                      ? new Date(fileStatus.lastEmbedded).toLocaleString()
                      : 'Never'}
                  </span>
                </div>
                {fileStatus.processingTime && (
                  <div className={styles.statusDetail}>
                    <span className={styles.statusLabel}>Processing Time:</span>
                    <span className={styles.statusValue}>
                      {fileStatus.processingTime}ms
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.chunkProgress}>
                <div className={styles.progressLabel}>Embedding Coverage</div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${fileStatus.status === 'current' ? 100 : fileStatus.status === 'outdated' ? 75 : 0}%`,
                      backgroundColor: getStatusColor(fileStatus.status),
                    }}
                  />
                </div>
                <div className={styles.progressText}>
                  {fileStatus.status === 'current'
                    ? '100%'
                    : fileStatus.status === 'outdated'
                      ? '75%'
                      : '0%'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.cacheDetails}>
        <h3>Cache Performance Details</h3>
        <div className={styles.cacheMetrics}>
          <div className={styles.cacheMetric}>
            <div className={styles.cacheMetricLabel}>Cache Efficiency</div>
            <div className={styles.cacheMetricValue}>
              <div className={styles.efficiencyBar}>
                <div
                  className={styles.efficiencyFill}
                  style={{ width: `${cacheStats.hitRate * 100}%` }}
                />
              </div>
              <span>{(cacheStats.hitRate * 100).toFixed(1)}% hit rate</span>
            </div>
          </div>

          <div className={styles.cacheBreakdown}>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Cache Hits:</span>
              <span className={styles.breakdownValue}>
                {cacheStats.cacheHits}
              </span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Cache Misses:</span>
              <span className={styles.breakdownValue}>
                {cacheStats.cacheMisses}
              </span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.breakdownLabel}>Total Requests:</span>
              <span className={styles.breakdownValue}>
                {cacheStats.totalRequests}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
