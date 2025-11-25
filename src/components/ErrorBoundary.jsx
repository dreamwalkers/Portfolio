import React from 'react'

export default class ErrorBoundary extends React.Component{
  constructor(props){ super(props); this.state = {error:null, info:null} }
  componentDidCatch(error, info){
    console.error('Captured error in ErrorBoundary', error, info)
    this.setState({error, info})
  }
  render(){
    if (this.state.error){
      return (
        <div style={{padding:20,fontFamily:'Arial,Helvetica,sans-serif'}}>
          <h2>Something went wrong</h2>
          <pre style={{whiteSpace:'pre-wrap',background:'#f8d7da',color:'#721c24',padding:12,borderRadius:6}}>{this.state.error && this.state.error.toString()}</pre>
          <details style={{marginTop:10}}>
            <summary>Stack / info</summary>
            <pre style={{whiteSpace:'pre-wrap'}}>{this.state.info && this.state.info.componentStack}</pre>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}
