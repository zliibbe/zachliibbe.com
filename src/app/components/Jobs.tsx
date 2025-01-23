import React from "react";
import Job from "./Job";
import beatLogo from "../../../public/beat-logo.png";
import quantumLogo from "../../../public/quantum-logo.jpeg";
import bluestaqLogo from "../../../public/bluestaq-logo.jpeg";
import { StaticImageData } from "next/image";

export const Jobs = () => {
  const jobs = [
    {
      title: "B.E.A.T.",
      logo: beatLogo,
      role: "Web Developer",
      companyName: "B.E.A.T.",
      companyLink: "https://beatllc.com/",
      description: "",
      taskList: [
        "Developed intuitive UI for genomics software using React, Redux, and PostgreSQL, boosting user engagement by 40%.",
        "Designed and implemented a live search feature with a Trie data structure, enabling real-time results from a database of over 500,000 entries with millisecond-level response times.",
        "Collaborated with UX teams to revamp interface designs, increasing user satisfaction by 60%",
      ],
      timeframe: "Jan 2024 - present",
      id: 1,
    },
    {
      title: "Quantum Ressearch International",
      logo: quantumLogo,
      role: "Software Engineer",
      companyName: "Quantum Research International",
      companyLink: "https://www.quantum-intl.com/",
      description: "",
      taskList: [
        "Built and optimized single-page applications (SPAs) with React, Vue, and C#/.Net, reducing page load times by 15% and implementing dynamic routing and state management systems in React, boosting app performance by 20%.",
        "Developed CI/CD pipelines and implemented automated linting, testing, and deployment.",
        "Partnered with Component Owners and Project Managers to translate mockups into functional user interfaces, achieving a 95% adherence rate to design specifications.",
      ],
      timeframe: "May 2023 - Sept 2023",
      id: 2,
    },
    {
      title: "Bluestaq",
      logo: bluestaqLogo,
      role: "Software Engineer",
      companyName: "Bluestaq",
      companyLink: "https://www.bluestaq.com/",
      description: "",
      taskList: [
        "Modernized Angular-based components, introducing modular TypeScript patterns for easier maintenance and collaboration.",
        "Optimized frontend performance by leveraging lazy loading and code-splitting, decreasing initial page load times by 20%.",
        "Wrote and reviewed code in Java to support backend functionality and security.",
        "Worked cross-functionally with Component Owners, Project Managers, and testing team to deliver apps per customer specifications in an agile manner.",
      ],
      timeframe: "Jul 2022 - February 2023",
      id: 1,
    },
  ];
  const jobCards = jobs.map((job) => <Job key={job.id} {...job} />);

  return <div className="jobs-container">{jobCards}</div>;
};

export default Jobs;
