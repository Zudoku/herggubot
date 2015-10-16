var Config = React.createClass({
  getInitialState: function() {
    return {config : {}};
  },
  componentDidMount: function() {
    $.ajax({
      url: "/herggubot/api/config",
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({config : data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  render: function() {

    return (
    	<div>
      		<pre>
        		{JSON.stringify(this.state.config, null, ' ')}
      		</pre>
      		Some values are hidden.
      	</div>

    );
  }
});

ReactDOM.render(
        <Config />,
        document.getElementById('config')
      );