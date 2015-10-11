var DashBoard = React.createClass({
  getInitialState: function() {
    return {state: "server-log"};
  },
  isActive: function(tab){
    if(this.state.state == tab){
      return "active";
    } 
    else{
      return "";
    }
  },
  changeTab: function(event){
    this.setState({state: $(event.target).attr("data-tab") },function(){
      this.refs.logs.loadLogsFromServer();
      this.forceUpdate();
    }.bind(this));
    
  },
  render: function() {
    return (
      <div>
        <ul className="nav nav-tabs">

          <li role="presentation" className={this.isActive("server-log")} onClick={this.changeTab}><a data-tab="server-log" href="#">Server-log</a></li>
          <li role="presentation" className={this.isActive("serverchat-log")} onClick={this.changeTab}><a data-tab="serverchat-log" href="#">Server chat log</a></li>
          <li role="presentation" className={this.isActive("privatechat-log")} onClick={this.changeTab}><a data-tab="privatechat-log" href="#">Private chat log</a></li>
          <li role="presentation" className={this.isActive("action-log")} onClick={this.changeTab}><a data-tab="action-log" href="#">Action-log</a></li>
        </ul>
        <div className="row">
          <div className="col-md-12">
            <ServerLog ref="logs" state={this.state.state}/>
          </div>
        </div>
      </div>
    );
  }
});
var ServerLog = React.createClass({
  getInitialState: function() {
    return {
      logs: [],
       state:"server-log",
       action_settings: {
        color_coding: false,
        client_join: false,
        client_leave: false,
        client_move: false,
        server_edit: false,
        channel_create: false,
        channel_remove: false,
        channel_edit: false
       }
    };
  },
  loadLogsFromServer: function() {
    var url= "";
    if(this.props.state == "server-log"){
      url="/api/serverlog";
    }
    if(this.props.state == "serverchat-log"){
      url="/api/serverchat";
    }
    if(this.props.state == "privatechat-log"){
      url="/api/privatechat";
    }
    if(this.props.state == "action-log"){
      url="/api/actionlog";
    }

    $.ajax({
      url: url,
      dataType: 'json',
      cache: false,
      data: this.state.action_settings,
      success: function(data) {
        data.reverse();
        this.setState({logs: data, action_settings: this.state.action_settings });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  formatDate: function(date){
    var day = date.getDate();
    var monthIndex = date.getMonth() + 1;
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    if (minutes < 10){
      minutes = "0"+minutes;
    }
    return day + "." + monthIndex + "." + year + " " + hours + ":" + minutes;
  },
  componentDidMount: function() {
    this.loadLogsFromServer();
    setInterval(this.loadLogsFromServer, 10000);
  },
  actionConfigChanged: function(event) {    
    var value = $(event.target)[0].checked;
    var field = $(event.target).attr("data-config");
    var newState = this.state;
    newState.action_settings[field] = value;
    this.setState(newState);
    this.loadLogsFromServer();

  },
  componentDidUpdate: function(prevProps,prevState) {
    if(this.state.state=="server-log"){
      var inputs = $(":input");
      for(var p= 0 ; p < inputs.length; p++){
        if(this.state.action_settings[inputs[p].getAttribute("data-config")]==true){
          inputs[p].checked=true;
        }
      }
    }
  },
  render: function() {
      if(this.props.state=="server-log"){
        return (
            <div className="serverLog">
              <div className="row">
                <div className="col-md-4"><h3>Filter - do not show</h3></div>
                <div className="col-md-4"></div>
                <div className="col-md-4"></div>
              </div>
              <hr/>
              <form>
                <div className="row">
                  <div className="col-md-2"></div>
                  <div className="col-md-2">
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="client_join" onClick={this.actionConfigChanged}/> CLIENT_JOIN
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="client_leave" onClick={this.actionConfigChanged}/> CLIENT_LEAVE
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="client_move" onClick={this.actionConfigChanged}/> CLIENT_MOVE
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="server_edit" onClick={this.actionConfigChanged}/> SERVER_EDIT
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2"></div>
                </div>

                <div className="row">
                  <div className="col-md-2"></div>
                  <div className="col-md-2">
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="channel_create" onClick={this.actionConfigChanged}/> CHANNEL_CREATE
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="channel_remove" onClick={this.actionConfigChanged}/> CHANNEL_REMOVE
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="channel_edit" onClick={this.actionConfigChanged}/> CHANNEL_EDIT
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="color_coding" onClick={this.actionConfigChanged}/> Color coding
                      </label>
                    </div>
                  </div>
                  <div className="col-md-2"></div>
                </div>
              </form>


              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Log message</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.logs.map(function(logline){
                      return (
                        <tr key={logline.id}>
                          <td>{this.formatDate(new Date(logline.date))}</td>
                          <td>{logline.actiontype}</td>
                          <td>{logline.text}</td>
                        </tr>
                      );
                    }.bind(this))
                  }
                </tbody>
              </table>
            </div>
            );
      }else if(this.props.state == "serverchat-log" || this.props.state =="privatechat-log"){
        return (
            <div className="serverChatLog">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Client</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.logs.map(function(logline){
                      return (
                        <tr key={logline.id}>
                          <td>{this.formatDate(new Date(logline.date))}</td>
                          <td>{logline.sender} ({logline.databaseid})</td>
                          <td>{logline.text}</td>
                        </tr>
                      );
                    }.bind(this))
                  }
                </tbody>
              </table>
            </div>
        );
      }
      else if(this.props.state == "action-log"){
        return (
            <div className="actionLog">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.logs.map(function(logline){
                      return (
                        <tr key={logline.id}>
                          <td>{this.formatDate(new Date(logline.date))}</td>
                          <td>{logline.text}</td>
                        </tr>
                      );
                    }.bind(this))
                  }
                </tbody>
              </table>
            </div>
        );
      }
}});

ReactDOM.render(
        <DashBoard />,
        document.getElementById('dashboard')
      );
