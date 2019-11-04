import React, { Component } from 'react';
import './App.css';
import Bookworm from 'bookworm-vega';
import Form from "react-jsonschema-form";
import { get, set } from 'lodash-es';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';


class App extends Component {

  constructor(props) {    
    super(props)
    let query

    // Attempt to load the query from the URL hash.
    try {
      query = JSON.parse(decodeURI(window.location.hash.slice(1)))
    } catch (e) {
      query = {
        "database": "federalist_bookworm",
        "host": "http://localhost:10012",
        "search_limits": [{"word": ["test"]}, {"word": ["search"]}],
        "aesthetic": {"y": "WordsPerMillion", "x": "date_day", "color": "Search"},
        "plottype": "linechart"
      }
    }
    // Default to this same web site.
    const host = query.host ? query.host : "/"
    const bookworm = new Bookworm("#canvas", host, window.innerWidth * 0.75, window.innerHeight * 0.66)
    bookworm.query = query;
    this.state = { bookworm: bookworm }
  }

  componentDidMount() {
    this.state.bookworm.querySchema()
      .then(d => { this.setState({schema: d}) })
    this.state.bookworm.plotAPI(this.state.bookworm.query)
  }

  render() {
 
    const styles = {"transform": "scale(0.7, 0.7)"}

    return <div className="App container">
       <div className="row">
       <div>
         <h2> Bookworm Explorer Demonstration </h2>
         This is a demonstration of the redone Bookworm charting and 
         querying logic for debugging, developer exploration, and preliminary sharing.
       </div>
     </div>
     <div className="row">
      <div className ="col-md-12"> <Chart /> </div>
     </div>
         
      <div className = "col-md-12 row" style={styles}>
      <button onClick={()=>{ alert(JSON.stringify(this.state.bookworm.query)); }}>Show Query</button>
      <div className = "col-md-4">
      <BookwormCustom APIkey = "plottype" bookworm={this.state.bookworm} />
      </div>
      <div className = "col-md-6">
      <BookwormWords bookworm={this.state.bookworm} />
      </div>
      </div>
      </div>
  }
}

class BookwormCustom extends Component {
  
  constructor(props) {
    super(props)
    this.state = {schema: {}, key: props.APIkey}
  }
  
  componentDidMount() {
    this.props.bookworm.querySchema().then(
      fullSchema => {
	console.log(fullSchema)
	let schema = get(fullSchema.properties, this.state.key)
	if (schema) {
	  schema.definitions = fullSchema.definitions;
	} else {
	  schema = {"type": "array", "items": {"type": "string"}}
	}
	
        this.setState({schema: schema})
      }
    )
  }

  
  render() {
    const onSubmit = ({formData}, e) => {
      const query = JSON.parse(JSON.stringify(this.props.bookworm.query))
      set(query, this.state.key, formData)
      window.location.hash = encodeURI(JSON.stringify(query))
      this.props.bookworm.plotAPI(query)
  }
 
    return <Form schema={this.state.schema}
    formData = {get(this.state.key, this.props.bookworm.query)}
    
     onSubmit = {onSubmit}
     onError  = {({formData}, e) => {console.log(e)} }/>
  }
  
}

class BookwormWords extends Component {

  constructor(props) {
    super(props);
    this.state = {schema: {}};
  }

  componentDidMount() {
    this.props.bookworm.querySchema().then(
      d => {
	const schema = {
	  description: "words",
	  type: "array",
	  items: {"type": "string"}
	}
        this.setState({schema: schema})
      }
    )
  }

  componentDidUpdate(prevProps, prevState) {
    
    if (prevProps.database !== this.props.database) {
      console.log("Rebuilding master UI Schema")
      this.props.bookworm.querySchema().then(
        d => {
          this.setState({schema: d})
        }
      )
    }
  }

  render() {
    const onSubmit = ({formData}, e) => {
      const query = this.props.bookworm.query
      formData.forEach((word, i) => {
	if (query.search_limits[i] === undefined) {
	  query.search_limits[i] = JSON.parse(JSON.stringify(query.search_limits[0]))
	}
	query.search_limits[i].word = word.split(",").map(d => d.trim())
      })
      // Drop any queries that were deleted
      query.search_limits = query.search_limits.slice(0, formData.length)
      window.location.hash = encodeURI(JSON.stringify(query))
      this.props.bookworm.plotAPI(query)
    }
    
    return <Form schema={this.state.schema}
    formData = {this.props.bookworm.query.search_limits.map(d => d.word[0])}
   //  onChange = {console.log("State change registered")}
     onSubmit = {onSubmit}
     onError  = {({formData}, e) => {console.log(e)} }/>
  }
}


class BookwormForm extends Component {

  constructor(props) {
    super(props);
    this.state = {schema: {}, key: props.APIkey};
  }

  componentDidMount() {
    this.props.bookworm.querySchema().then(
      d => {
        this.setState({schema: d})
      }
    )
  }

  componentDidUpdate(prevProps, prevState) {
    
    if (prevProps.database !== this.props.database) {
      console.log("Rebuilding master UI Schema")
      this.props.bookworm.querySchema().then(
        d => {
          this.setState({schema: d})
        }
      )
    }
  }

  render() {
    const onSubmit = ({formData}, e) => {
      
      window.location.hash = encodeURI(JSON.stringify(formData))
      this.props.bookworm.plotAPI(formData)
    }
    
    const UISchema = { 
      "search_limits": {"ui:options": {"orderable": false}},
    }
    if (this.state.schema.properties === undefined) {return null}

    for (const k of Object.keys(this.state.schema.properties)) {
      if (UISchema[k] === undefined) {
	UISchema[k] = {}
      }
      UISchema[k]["ui:widget"] = (k === this.state.key) ? undefined : "hidden"
    }

    const schema = JSON.parse(JSON.stringify(this.state.schema.properties[this.state.key]))
    
    console.log(UISchema)
    
    return <Form schema={this.state.schema}
     uiSchema = {UISchema}
     formData = {this.props.bookworm.query}
   //  onChange = {console.log("State change registered")}
     onSubmit = {onSubmit}
     onError  = {({formData}, e) => {console.log(e)} }/>
  }
}

class Chart extends Component {

  render() {
    return <div id="canvas"></div>
  }
  
}

export default App
