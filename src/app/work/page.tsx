import Layout from "../dashboard/layout"

export default  function Work() {
  return (
    <Layout>
      <h1>currently a work in progress...</h1>
      <h2 className="overview">Overview</h2>
      <p className="overview"> overview in 3-5 lines goes here</p>
  
      <div className="month">
        What I'm up to in "$ {"month"}"
        <ul>
          <li>Something technical</li>
          <li>Something non-techincal</li>
          <li>Something fun</li>
        </ul>
      </div>
    </Layout>
  )
}
