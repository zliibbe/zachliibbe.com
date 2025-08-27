"use client";

import { useState, useEffect } from "react";
import { Metadata } from "next";
import styles from "./page.module.css";

interface UnsplashStatus {
  mode: "demo" | "production" | "unconfigured";
  configured: boolean;
  limits: {
    requests_per_hour: number;
    description: string;
  };
  usage: {
    remaining: number;
    resetTime: string;
    resetIn: number;
  };
  productionRequirements: {
    needed: boolean;
    criteria: string[];
    applicationUrl: string;
    guidelines: string;
  };
}

export default function UnsplashAdminPage() {
  const [status, setStatus] = useState<UnsplashStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/unsplash/status");
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className={styles.loading}>Loading Unsplash status...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!status)
    return <div className={styles.error}>No status data available</div>;

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "production":
        return "#22c55e";
      case "demo":
        return "#eab308";
      case "unconfigured":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h1>Unsplash API Status</h1>
          <p>Monitor your Unsplash API usage and apply for production access</p>
        </header>

        <div className={styles.grid}>
          {/* Current Status */}
          <div className={styles.card}>
            <h2>Current Status</h2>
            <div
              className={styles.statusBadge}
              style={{ color: getModeColor(status.mode) }}
            >
              {status.mode.toUpperCase()}
            </div>
            <p className={styles.statusDescription}>
              {status.limits.description}
            </p>
            {!status.configured && (
              <div className={styles.warning}>
                ⚠️ Unsplash API key not configured. Add UNSPLASH_ACCESS_KEY to
                your environment variables.
              </div>
            )}
          </div>

          {/* Usage Statistics */}
          {status.configured && (
            <div className={styles.card}>
              <h2>Usage Statistics</h2>
              <div className={styles.usage}>
                <div className={styles.usageItem}>
                  <span className={styles.usageLabel}>Requests Remaining:</span>
                  <span className={styles.usageValue}>
                    {status.usage.remaining}
                  </span>
                </div>
                <div className={styles.usageItem}>
                  <span className={styles.usageLabel}>Hourly Limit:</span>
                  <span className={styles.usageValue}>
                    {status.limits.requests_per_hour}
                  </span>
                </div>
                <div className={styles.usageItem}>
                  <span className={styles.usageLabel}>Resets In:</span>
                  <span className={styles.usageValue}>
                    {status.usage.resetIn} minutes
                  </span>
                </div>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${(status.usage.remaining / status.limits.requests_per_hour) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Production Application */}
          {status.productionRequirements.needed && (
            <div className={styles.card}>
              <h2>Apply for Production Access</h2>
              <p>
                To increase your rate limit to 5,000 requests/hour, you need to
                apply for production access.
              </p>

              <h3>Requirements Checklist:</h3>
              <ul className={styles.checklist}>
                {status.productionRequirements.criteria.map(
                  (criterion, index) => (
                    <li key={index} className={styles.checklistItem}>
                      <span className={styles.checkbox}>☐</span>
                      {criterion}
                    </li>
                  ),
                )}
              </ul>

              <div className={styles.applicationInfo}>
                <h3>Your Application Details:</h3>
                <div className={styles.applicationDetails}>
                  <p>
                    <strong>Application Name:</strong> Zach Liibbe Personal
                    Website
                  </p>
                  <p>
                    <strong>Use Case:</strong> Automatically fetch featured
                    images for blog posts
                  </p>
                  <p>
                    <strong>Expected Usage:</strong> 2-5 requests per blog post,
                    approximately 10-20 requests per month
                  </p>
                  <p>
                    <strong>Attribution:</strong> Full photographer and Unsplash
                    attribution displayed on each image
                  </p>
                </div>
              </div>

              <div className={styles.actions}>
                <a
                  href={status.productionRequirements.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.button}
                >
                  Apply for Production Access
                </a>
                <a
                  href={status.productionRequirements.guidelines}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.buttonSecondary}
                >
                  Read API Guidelines
                </a>
              </div>
            </div>
          )}

          {/* Implementation Status */}
          <div className={styles.card}>
            <h2>Implementation Status</h2>
            <div className={styles.implementationList}>
              <div className={styles.implementationItem}>
                <span className={styles.checkmark}>✅</span>
                Photo search functionality
              </div>
              <div className={styles.implementationItem}>
                <span className={styles.checkmark}>✅</span>
                Automatic blog post image matching
              </div>
              <div className={styles.implementationItem}>
                <span className={styles.checkmark}>✅</span>
                Proper attribution display
              </div>
              <div className={styles.implementationItem}>
                <span className={styles.checkmark}>✅</span>
                Download tracking (required by API)
              </div>
              <div className={styles.implementationItem}>
                <span className={styles.checkmark}>✅</span>
                Rate limit monitoring
              </div>
              <div className={styles.implementationItem}>
                <span className={styles.checkmark}>✅</span>
                Caching to minimize API calls
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={fetchStatus} className={styles.refreshButton}>
            Refresh Status
          </button>
        </div>
      </div>
    </main>
  );
}
