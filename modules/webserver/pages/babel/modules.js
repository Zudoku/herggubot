var Modules = React.createClass({
  getInitialState: function() {
    return {config : {}};
  },
  componentDidMount: function() {
    $.ajax({
      url: "/herggubot/api/modules",
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({modules : data});
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
        		{JSON.stringify(this.state.modules, null, ' ')}
      		</pre>
      	</div>

    );
  }
});

ReactDOM.render(
        <Modules />,
        document.getElementById('modules')
      );