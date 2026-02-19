import threeDSystemsLogo from "../../../public/3d-systems-logo.png";
import beatLogo from "../../../public/beat-logo.png";
import bluestaqLogo from "../../../public/bluestaq-logo.jpeg";
import centuraLogo from "../../../public/centura-logo.png";
import quantumLogo from "../../../public/quantum-logo.jpeg";
import raytheonLogo from "../../../public/raytheon-logo.png";
import Job from "./Job";
import styles from "./job.module.css";

export const Jobs = () => {
  const jobs = [
    {
      title: "Raytheon",
      logo: raytheonLogo,
      role: "Software Engineer",
      companyName: "Raytheon",
      companyLink: "https://www.rtx.com/raytheon",
      description: "",
      taskList: [
        "Develop and maintain Java/Spring backend services supporting large-scale data workflows and API integrations.",
        "Update legacy components and libraries to modern standards while protecting service reliability and uptime.",
        "Create robust test suites using JUnit, improving regression reliability across services.",
        "Improve CI/CD pipelines by integrating automated scenario tests that execute targeted code paths on every merge to main, reducing regression risk and increasing confidence in deployments.",
      ],
      timeframe: "Sep 2025 - Present",
      id: 0,
    },
    {
      title: "3D Systems",
      logo: threeDSystemsLogo,
      role: "Software Engineer",
      companyName: "3D Systems, Inc.",
      companyLink: "https://www.3dsystems.com/ext-titan-pellet-3d-printers",
      description: "",
      taskList: [
        "Developed and maintained software for 3D printing systems, including firmware and user interfaces.",
        "Established robust software quality assurance infrastructure by implementing Test-Driven Development (TDD) practices across multiple repositories, writing comprehensive test suites for untested codebases, and integrating CI/CD pipelines that enhanced code reliability and consistency.",
        "Spearheaded documentation initiatives by creating internal technical documentation for multiple repositories and establishing Git templates fostering a culture of documentation, significantly improving knowledge transfer and development efficiency.",
        "Optimized engineering workflows by reorganizing physical project components and implementing project-associated bin systems that measurably increased cross-functional team productivity and reduced project setup time.",
        "Collaborated with controls engineers to improve integration between front-end printer interfaces and automation systems, contributing to the advancement of next-generation extrusion 3D printer platforms.",
      ],
      timeframe: "Mar 2025 - Jun 2025",
      id: 1,
    },
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
      timeframe: "Jan 2024 - Feb 2025",
      contractStatus: "Contract position - completed successfully",
      id: 2,
    },
    {
      title: "Quantum Research International",
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
      contractStatus: "Contract position - completed successfully",
      id: 3,
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
      contractStatus: "Contract position - completed successfully",
      id: 4,
    },
    {
      title: "Centura Health",
      logo: centuraLogo,
      role: "Clinical RN Manager",
      companyName: "Centura Health",
      companySubName: " (now CommonSpirit Health)",
      companyLink: "https://www.centura.org/",
      id: 5,
      taskList: [
        {
          title: "Clinical RN Manager (Jun 2021 – Nov 2021):",
          subtasks: [
            "Designed & built internal Sharepoint website establishing clear, standardized communication and shared resources",
            "Managed a team of 25 nurses working for 42 doctors in 8 locations across Colorado, optimizing staffing allocations to ensure exceptional patient care while maintaining budget constraints",
            "Developed and implemented standardized communication frameworks that eliminated dangerous information gaps between facilities, resulting in seamless care transitions, reduced medical errors, and significantly improved patient satisfaction scores",
          ],
        },
        {
          title: "Cardiac RN (Mar 2017 – Nov 2021):",
          subtasks: [
            "Accelerated recovery of 900+ patients recovering from medical ailments including heart attack and acute heart disease",
            "Mastered the art of efficient care delivery while ensuring each patient felt truly seen and heard—transforming routine medical interactions into meaningful connections that supported emotional healing alongside physical recovery",
            "Sharpened critical thinking skills to spot subtle warning signs and connect seemingly unrelated symptoms, developing creative solutions to complex cardiac challenges that standard protocols couldn't address",
          ],
        },
        {
          title: "Telemetry Tech (Jul 2016 – Mar 2017):",
          subtasks: [
            "Monitored and interpreted cardiac rhythms in real-time, rapidly identifying life-threatening arrhythmias and immediately alerting clinical staff to intervene in potential cardiac emergencies.",
            "Demonstrated exceptional pattern recognition skills by distinguishing subtle ECG changes from baseline readings across multiple patients simultaneously, providing critical clinical information that directly impacted patient survival outcomes.",
          ],
        },
        {
          title:
            "CNA (May 2016 – Jul 2016) & Patient Transporter (2014 – May 2016):",
          subtasks: [
            "Delivered compassionate frontline care while serving as the crucial eyes and ears for the nursing team, identifying and reporting subtle changes in patient condition that prevented potential complications and accelerated recovery timelines",
            "Mastered the art of safe patient mobility across a 350+ bed hospital, expertly navigating complex medical equipment and adapting techniques for patients with varying mobility challenges while maintaining their dignity and comfort",
          ],
        },
      ],
      timeframe: "May 2013 - Nov 2021",
    },
  ];
  const jobCards = jobs.map((job, index) => (
    <Job key={job.id} {...job} index={index} isFirst={index === 0} />
  ));

  return <div className={styles.timelineContainer}>{jobCards}</div>;
};

export default Jobs;
