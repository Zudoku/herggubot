var InformationBox = React.createClass({
  getInitialState: function() {
    return {information : {} };
  },
  componentDidMount: function() {
    setInterval(function() {
      $.ajax({
        url: "/herggubot/api/modules",
        dataType: 'json',
        cache: false,
        success: function(data) {
          this.setState({information : data[0]});
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    }.bind(this),2000);
  },
  render: function() {
    if(this.state.information.pid != undefined){
      return (
        <div>
          <h3> Bot online </h3>
          <div>
          <b>
           Uptime : {this.state.information.uptime} <br/>
           rss : {parseInt(this.state.information.memoryUsage.rss / 1000)}K<br/>
           heap total : {parseInt(this.state.information.memoryUsage.heapTotal / 1000)}K<br/>
           heap used : {parseInt(this.state.information.memoryUsage.heapUsed / 1000)}K<br/>

          </b> 
          </div>
        </div>

      );
    } else {
      return (
        <div>
          <h3> Bot offline </h3>
        </div>

      );
    }
    
  }
});

ReactDOM.render(
        <InformationBox />,
        document.getElementById('infobox')
      );