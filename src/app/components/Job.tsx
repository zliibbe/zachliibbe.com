import React from "react";
import Image, { StaticImageData } from "next/image";
import styles from "./job.module.css";
interface JobProps {
  title: string;
  logo: StaticImageData | string;
  role: string;
  companyName: string;
  companyLink: string;
  description: string;
  taskList: string[];
  timeframe: string;
  id: number;
}

const Job: React.FC<JobProps> = ({
  title,
  logo,
  role,
  companyName,
  companyLink,
  description,
  taskList,
  timeframe,
  id,
}) => {
  return (
    <div className={`${styles.jobContainer} job${id}`}>
      <div className={styles.jobImage}>
        {typeof logo === "string" ? (
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
          <h3>{role}</h3>
          <a
            href={companyLink}
            className={styles.companyLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {companyName}
          </a>
        </div>
        <div className={styles.jobTimeframe}>{timeframe}</div>
      </div>
      <div className={styles.jobDetails}>
        <p>{description}</p>
        <ul>
          {taskList.map((task) => (
            <li key={task} className={styles.jobListItem}>
              {task}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Job;
