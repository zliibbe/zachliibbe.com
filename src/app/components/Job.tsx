import React from "react";
import Image from "next/image";
import styles from "./job.module.css";

import beatLogo from "@/public/beat-logo.png";
import quantumLogo from "@/public/quantum-logo.png";
import bluestaqLogo from "@/public/bluestaq-logo.png";

interface JobProps {
  title: string;
  role: string;
  companyName: string;
  companyLink: string;
  description: string;
  taskList: string[];
  timeframe: string;
  logo?: string;
  id: number;
}

const Job: React.FC<JobProps> = ({
  title,
  role,
  companyName,
  companyLink,
  description,
  taskList,
  timeframe,
  logo,
  id,
}) => {
  const taskListItems = taskList.map((task) => <li key={task}>{task}</li>);

  return (
    <div className={`${styles.jobContainer} job${id}`}>
      <div className={styles.job_titleAndCompany}>
        {logo && (
          <Image
            src={logo}
            alt={`${companyName} logo`}
            width={40}
            height={40}
            className={styles.companyLogo}
          />
        )}
        <h3 className={styles.title}>{role}</h3>
        <a
          href={companyLink}
          className={styles.companyLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {companyName}
        </a>
      </div>
      <p className={styles.timeframe}>{timeframe}</p>
      <p className={styles.description}>{description}</p>
      <ul className={styles.taskList}>{taskListItems}</ul>
      <hr className={styles.divider} />
    </div>
  );
};

export default Job;
