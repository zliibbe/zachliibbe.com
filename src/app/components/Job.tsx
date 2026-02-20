'use client';

import Image, { type StaticImageData } from 'next/image';
import type React from 'react';
import { useState } from 'react';
import { useInView } from '../hooks/useInView';
import { analytics } from '../utils/analytics';
import styles from './job.module.css';

interface JobProps {
  title: string;
  logo: StaticImageData | string;
  role: string;
  companyName: string;
  companySubName?: string;
  companyLink: string;
  description?: string;
  taskList: Array<string | { title: string; subtasks: string[] }>;
  timeframe: string;
  contractStatus?: string;
  id: number;
  index: number;
  isFirst: boolean;
}

const Job: React.FC<JobProps> = ({
  title,
  logo,
  role,
  companyName,
  companySubName,
  companyLink,
  description,
  taskList,
  timeframe,
  contractStatus,
  id,
  index,
  isFirst,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [ref, isInView] = useInView(0.1);

  const isHealthcareJob = companyName === 'Centura Health';

  const containerClasses = [
    styles.jobContainer,
    `job${id}`,
    isInView ? styles.visible : styles.hidden,
    isFirst ? styles.firstJob : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={containerClasses}
      style={{ '--index': index } as React.CSSProperties}
    >
      <div className={styles.timelineNode}>
        <div className={`${styles.node} ${isFirst ? styles.nodePulse : ''}`} />
      </div>
      <div className={styles.jobContent}>
        <div className={styles.jobImage}>
          <Image
            src={logo}
            alt={`${companyName} logo`}
            width={40}
            height={40}
            className={styles.companyLogo}
          />
        </div>
        <div className={styles.jobTitle}>
          <div className={styles.jobTitleAndCompany}>
            {isFirst && (
              <span className={styles.mostRecentLabel}>Most Recent</span>
            )}
            {isHealthcareJob ? (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={styles.expandButton}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${role} details`}
              >
                <span
                  className={isExpanded ? styles.caretDown : styles.caretRight}
                ></span>
                <h3 style={{ display: 'inline-block', marginLeft: '8px' }}>
                  {role}
                </h3>
              </button>
            ) : (
              <h3>{role}</h3>
            )}
            <a
              href={companyLink}
              className={styles.companyLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                analytics.trackExternalLink(
                  companyLink,
                  `${companyName} Company Link`
                )
              }
            >
              {companyName}
              {companySubName && (
                <span className={styles.companySubName}>{companySubName}</span>
              )}
            </a>
          </div>
          <div className={styles.jobTimeContainer}>
            <div className={styles.jobTimeframe}>{timeframe}</div>
            {contractStatus && (
              <div className={styles.contractBadge}>{contractStatus}</div>
            )}
          </div>
        </div>

        {(!isHealthcareJob || isExpanded) && (
          <div className={styles.jobDetails}>
            <p>{description}</p>
            <ul>
              {taskList.map(task =>
                typeof task === 'string' ? (
                  <li key={task} className={styles.jobListItem}>
                    {task}
                  </li>
                ) : (
                  <li key={task.title} className={styles.jobListItem}>
                    <div className={styles.taskTitle}>{task.title}</div>
                    <ul className={styles.subTaskList}>
                      {task.subtasks.map(subtask => (
                        <li key={subtask} className={styles.subTaskItem}>
                          {subtask}
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              )}
            </ul>
          </div>
        )}
        <div className={styles.jobDivider}></div>
      </div>
    </div>
  );
};

export default Job;
