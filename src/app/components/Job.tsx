import React from 'react'

function Job( title: string, role: string, companyName: string, companyLink: string, description: string, taskList: string, date: string, id:number) {
  return (
    <div className={`job${id} tw-flex `}>
      <div className="job_titleAndCompany">
        <h3>{ title }</h3>
        <a href={`${companyLink}`} target='blank' rel="noopener noreferrer">{ companyName }</a>
      </div>
      <h4>{  }</h4>
      <p>{ description }</p>
    </div>
    
  )
}

export default Job