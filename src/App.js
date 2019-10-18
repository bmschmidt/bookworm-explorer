import React, { Component } from 'react';
import './App.css';
import Bookworm from 'bookworm-vega';
import Form from "react-jsonschema-form";

class App extends Component {

constructor(props) {    
    super(props)
    const bookworm = new Bookworm("#canvas", "http://localhost:10012", 600, 400)
          try {
             bookworm.query = JSON.parse(decodeURI(window.location.hash.slice(1)))        
          } catch (e) {
            bookworm.query = {
              "database": "federalist_bookworm",
              "search_limits": [{"word": ["test"]}, {"word": ["search"]}],
              "aesthetic": {"y": "WordsPerMillion", "x": "date_day", "color": "Search"},
              "plottype": "linechart"
            }
          }
    this.state = { bookworm: bookworm }
    bookworm.plotAPI(bookworm.query)
  }

  componentDidMount() {
    this.state.bookworm.querySchema()
      .then(d => { this.setState({schema: d}) })
  }

  render() {
    const onSubmit = ({formData}, e) => {
      this.setState(state => {
	     state.bookworm.query.database = formData
	     return state
      })
    }
    
      
    const styles = {}//"transform": "scale(0.9, 0.9)"}

    return <div className="App container">
       <div className="row">
       <div>
         <h2> Bookworm Explorer Demonstration </h2>
         This is a demonstration of the redone Bookworm charting and 
         querying logic for debugging, developer exploration, and preliminary sharing.
        It is bundled into a react Application: the 
         bottom uses the react-jsonschema-form
         library to make the full JSON schema for the Bookworm query interactive.
         (With some exceptions; I've left out a few elements that the 
         rendering library doesn't support.)
         this is not a sensible end-user UX, but it should provide a general 
         framework for showing how something like the old linechart explorer
         could be refit to a modern web environment. The right side shows the rendered
         charts; several different chart types (heatmap, streamgraph, barchart, etc.)
         are currently supported. They are all a rather light wrapper around
         vega-lite marks, with the data typing handled automatically based
         on the Boookworm-defined properties.
       </div>
     </div>
     <div className="row">
      <div className ="col-md-12"> <Chart /> </div>
     </div>
         
       <div className = "col-md-12" style={styles}>
       <button onClick={()=>{ alert(JSON.stringify(this.state.bookworm.query)); }}>Show Query</button>
                                                                                                                                                                                                                                  <BookwormForm bookworm={this.state.bookworm} database={this.state.bookworm.query.database}/>
       <Form schema={{"description": "Change the Bookworm database being queried.", "type":"string", "default": this.state.bookworm.query.database || "federalist_bookworm"}}
        onChange = {()=>{}}
        onSubmit = {onSubmit}
        onError  = {({formData}, e) => {console.log("Error", e)} }/>
       </div>

      </div>
  }
}

/* Needs to re-render on changes to props.bookworm.query, which it doesn't currently see

class QueryField extends Component {
  constructor(props) {
    super(props)
  }
  
  render() {
    return <textarea rows="15" cols="100">{JSON.stringify(this.props.bookworm.query, undefined, 2)}
    </textarea>
  }
}
*/

class BookwormForm extends Component {

  constructor(props) {
    super(props);
    this.state = {schema: {}};
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
      "smoothingSpan": {"ui:widget": "hidden"},
      // Changing the database alters the schema itself.
//      "database": {"ui:widget": "hidden"}
    }
    return <Form schema={this.state.schema}
     uiSchema = {UISchema}
     formData = {this.props.bookworm.query}
     onChange = {console.log("State change registered")}
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
