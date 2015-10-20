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
        $("#configTextArea")[0].value = JSON.stringify(this.state.config, null, ' ');
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  uploadConfig: function(event) {
    console.log($("#configTextArea")[0].value);
    var configPayLoad = $("#configTextArea")[0].value;
    var password = prompt("Password","");
    $.ajax({
      url: "/herggubot/api/uploadconfig",
      dataType: 'json',
      type: "POST",
      data: {config: configPayLoad, pw: password},
      success: function(data) {
        if(data.success == true){
          alert("Config uploaded! Restart the bot for it to take effect.");
        }else{
          alert("Config not uploaded correctly.");
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        alert("Config not uploaded correctly.");
      }.bind(this)
    });
  },
  textAreaChanged : function(event){

  },
  render: function() {

    return (
    	<div>
      		<textarea id="configTextArea" className="form-control" rows="30" onChange={this.textAreaChanged} defaultValue={JSON.stringify(this.state.config, null, ' ')}>
        		
      		</textarea>
      		Some values are hidden and can't be modified. Only JSON is accepted.
          <hr/>
          <button type="button" onClick={this.uploadConfig} className="btn btn-success">Save</button>
      	</div>

    );
  }
});

ReactDOM.render(
        <Config />,
        document.getElementById('config')
      );