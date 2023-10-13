import React, { useState } from 'react';
import Job from './Job';

interface JobsProps {
        title: any
        role: any
        companyName: any
        companyLink: any
        description: any
        taskList: any
        timeframe: any
        id: number
}

const Jobs = () => {
  const jobs = [
    {title: "Quantum Ressearch International", 
    role: "Software Engineer", 
    companyName: "", 
    companyLink: "", 
    description: "",
    taskList: "",
    timeframe: "",
    id: 2},
    { title: "Bluestaq", 
      role: "Software Engineer", 
      companyName: "", 
      companyLink: "", 
      description: "",
      taskList: "",
      timeframe: "",
      id: 1
    },
  
  ]
  

  const jobCards  = jobs.map(job => {
    return (
      <Job 
        title = {job.title}
        role = {job.role}
        companyName = {job.companyName}
        companyLink = {job.companyLink}
        description = {job.description}
        taskList = {job.taskList}
        timeframe = {job.timeframe}
        id = {job.id}
      />
    )};
  )
    
  return (
      <div className='jobs-container'>
        {jobCards}
      </div>
    )
}

export default Jobs
