'use client';

import type React from 'react';
import { useState } from 'react';
import { MdClear, MdExpandLess, MdExpandMore, MdSend } from 'react-icons/md';
import styles from './TestQueryInterface.module.css';

interface ContextChunk {
  content: string;
  source: string;
  score: number;
  metadata?: {
    filename: string;
    chunkIndex: number;
  };
}

interface TestResult {
  query: string;
  response: string;
  contextChunks: ContextChunk[];
  responseTime: number;
  timestamp: string;
}

export default function TestQueryInterface() {
  const [query, setQuery] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(
    new Set()
  );

  const exampleQueries = [
    "What is Zach's professional background?",
    'What technologies does Zach work with?',
    'How can I contact Zach?',
    'What projects has Zach worked on?',
    "Tell me about Zach's experience",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/admin/knowledge/test-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        const endTime = Date.now();

        const testResult: TestResult = {
          query: query.trim(),
          response: result.response,
          contextChunks: result.contextChunks || [],
          responseTime: endTime - startTime,
          timestamp: new Date().toISOString(),
        };

        setTestResults(prev => [testResult, ...prev]);
        setQuery('');
      } else {
        console.error('Failed to test query');
      }
    } catch (error) {
      console.error('Error testing query:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const clearResults = () => {
    setTestResults([]);
    setExpandedResults(new Set());
  };

  const toggleResultExpansion = (index: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResults(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#22c55e'; // Green
    if (score >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Test RAG Query System</h2>
          <p className={styles.description}>
            Test queries against the knowledge base to see what context is
            retrieved and how the AI responds. This helps debug and optimize the
            RAG system.
          </p>
        </div>
        {testResults.length > 0 && (
          <button onClick={clearResults} className={styles.clearButton}>
            <MdClear />
            Clear Results
          </button>
        )}
      </div>

      <div className={styles.querySection}>
        <form onSubmit={handleSubmit} className={styles.queryForm}>
          <div className={styles.inputContainer}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter your test query here..."
              className={styles.queryInput}
              rows={3}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className={styles.submitButton}
            >
              <MdSend />
              {loading ? 'Testing...' : 'Test Query'}
            </button>
          </div>
        </form>

        <div className={styles.exampleQueries}>
          <div className={styles.exampleLabel}>Example queries:</div>
          <div className={styles.exampleButtons}>
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleQuery(example)}
                className={styles.exampleButton}
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.resultsSection}>
        {testResults.length === 0 ? (
          <div className={styles.noResults}>
            <p>
              No test results yet. Try submitting a query above to see how the
              RAG system responds.
            </p>
          </div>
        ) : (
          <div className={styles.resultsList}>
            {testResults.map((result, index) => {
              const isExpanded = expandedResults.has(index);
              return (
                <div key={index} className={styles.resultCard}>
                  <div className={styles.resultHeader}>
                    <div className={styles.resultQuery}>
                      <strong>Query:</strong> {result.query}
                    </div>
                    <div className={styles.resultMeta}>
                      <span className={styles.responseTime}>
                        {result.responseTime}ms
                      </span>
                      <span className={styles.timestamp}>
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => toggleResultExpansion(index)}
                        className={styles.expandButton}
                      >
                        {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                        {isExpanded ? 'Less' : 'Details'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.resultResponse}>
                    <strong>AI Response:</strong>
                    <div className={styles.responseText}>{result.response}</div>
                  </div>

                  {isExpanded && (
                    <div className={styles.contextSection}>
                      <div className={styles.contextHeader}>
                        <strong>
                          Retrieved Context ({result.contextChunks.length}{' '}
                          chunks)
                        </strong>
                      </div>
                      <div className={styles.contextChunks}>
                        {result.contextChunks.map((chunk, chunkIndex) => (
                          <div key={chunkIndex} className={styles.contextChunk}>
                            <div className={styles.chunkHeader}>
                              <div className={styles.chunkSource}>
                                <strong>Source:</strong>{' '}
                                {chunk.metadata?.filename || chunk.source}
                                {chunk.metadata?.chunkIndex !== undefined && (
                                  <span className={styles.chunkIndex}>
                                    (Chunk #{chunk.metadata.chunkIndex})
                                  </span>
                                )}
                              </div>
                              <div className={styles.chunkScore}>
                                <div
                                  className={styles.scoreIndicator}
                                  style={{
                                    backgroundColor: getScoreColor(chunk.score),
                                  }}
                                />
                                <span className={styles.scoreText}>
                                  {getScoreLabel(chunk.score)} (
                                  {(chunk.score * 100).toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                            <div className={styles.chunkContent}>
                              {chunk.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
