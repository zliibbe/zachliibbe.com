'use client';

import React, { useState } from 'react';
import Image, { StaticImageData } from 'next/image';
import styles from './job.module.css';
import { analytics } from '../utils/analytics';

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
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isHealthcareJob = companyName === 'Centura Health';

  return (
    <div className={`${styles.jobContainer} job${id}`}>
      <div className={styles.jobImage}>
        {typeof logo === 'string' ? (
          <Image
            src={logo}
            alt={`${companyName} logo`}
            width={40}
            height={40}
            className={styles.companyLogo}
          />
        ) : (
          <Image
            src={logo}
            alt={`${companyName} logo`}
            width={40}
            height={40}
            className={styles.companyLogo}
          />
        )}
      </div>
      <div className={styles.jobTitle}>
        <div className={styles.jobTitleAndCompany}>
          {isHealthcareJob ? (
            <button
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
            <div className={styles.contractStatus}>{contractStatus}</div>
          )}
        </div>
      </div>

      {(!isHealthcareJob || isExpanded) && (
        <div className={styles.jobDetails}>
          <p>{description}</p>
          <ul>
            {taskList.map((task, index) =>
              typeof task === 'string' ? (
                <li key={index} className={styles.jobListItem}>
                  {task}
                </li>
              ) : (
                <li key={index} className={styles.jobListItem}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <ul className={styles.subTaskList}>
                    {task.subtasks.map((subtask, subIndex) => (
                      <li
                        key={`${index}-${subIndex}`}
                        className={styles.subTaskItem}
                      >
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
  );
};

export default Job;
