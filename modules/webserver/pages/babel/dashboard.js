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
      this.refs.logs.state.reset_logs_flag = true;
      this.refs.logs.loadLogsFromServer();
      this.forceUpdate();
    }.bind(this));

  },
  tryToRestart: function(event){
    var password = prompt("Password","");
    $.ajax({
      url: "/herggubot/api/restart",
      dataType: 'json',
      type: "GET",
      data: {pw: password},
      success: function(data) {
        if(data.success == true){
          alert("Restarting!");
        }else{
          alert("Restart not successful");
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        alert("Restart not successful");
      }.bind(this)
    });
    console.log(password);
  },
  tryToToggle: function(event){
    var password = prompt("Password","");
    $.ajax({
      url: "/herggubot/api/toggle",
      dataType: 'json',
      type: "GET",
      data: {pw: password},
      success: function(data) {
        if(data.success == true){
          alert("Success!");
        }else{
          alert("not successful");
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        alert("not successful");
      }.bind(this)
    });
    console.log(password);
  },
  render: function() {
    return (
      <div>
        <div>
          <button type="button" onClick={this.tryToRestart} className="btn btn-danger rightPadding">Restart Bot</button>
          <button type="button" onClick={this.tryToToggle} className="btn btn-danger rightPadding">Toggle Bot</button>
        </div>
        <hr/>
        <div id="infobox"> </div>
        <hr/>
        <ul className="nav nav-tabs">

          <li role="presentation" className={this.isActive("server-log")} onClick={this.changeTab}><a data-tab="server-log" href="#">Server-log</a></li>
          <li role="presentation" className={this.isActive("serverchat-log")} onClick={this.changeTab}><a data-tab="serverchat-log" href="#">Server chat log</a></li>
          <li role="presentation" className={this.isActive("privatechat-log")} onClick={this.changeTab}><a data-tab="privatechat-log" href="#">Private chat log</a></li>
          <li role="presentation" className={this.isActive("action-log")} onClick={this.changeTab}><a data-tab="action-log" href="#">Action-log</a></li>
          <li role="presentation" className={this.isActive("error-log")} onClick={this.changeTab}><a data-tab="error-log" href="#">Error-log</a></li>
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
       reset_logs_flag: true,
       index: 0,
       action_settings: {
        color_coding: false,
        client_join: false,
        client_leave: false,
        client_move: false,
        server_edit: false,
        channel_create: false,
        channel_remove: false,
        channel_edit: false,
        regex_search: false,
        search: "",
       },
       serverchat_settings: {

       },
       privatechat_settings: {

       },
       actionlog_settings: {

       },
       errorlog_settings : {

       }
    };
  },
  forceWipeLogs : function(){
    var currentState =  this.state;
    currentState.logs = [];
    currentState.index = 0;
    currentState.reset_logs_flag = false;
    this.setState(currentState);
    this.forceLoadNewLogs();
  },
  moreLogsPress : function(event) {
    var currentState =  this.state;
    currentState.index++;
    this.setState(currentState);
    this.forceLoadNewLogs();
  },
  forceLoadNewLogs : function() {
    console.log("Loading new logs, Index = " + this.state.index)
    var url= "";
    var settings = {};
    if(this.props.state == "server-log"){
      url="/herggubot/api/serverlog";
      settings = this.state.action_settings;
    }
    if(this.props.state == "serverchat-log"){
      url="/herggubot/api/serverchat";
      settings = this.state.serverchat_settings;
    }
    if(this.props.state == "privatechat-log"){
      url="/herggubot/api/privatechat";
      settings = this.state.privatechat_settings;
    }
    if(this.props.state == "action-log"){
      url="/herggubot/api/actionlog";
      settings = this.state.actionlog_settings;
    }
    if(this.props.state == "error-log"){
      url="/herggubot/api/errorlog";
      settings = this.state.errorlog_settings;
    }
    settings.index = this.state.index;

    var newLogs = [];
    var allValues = [];
    $.ajax({
        url: url,
        dataType: 'json',
        cache: false,
        data: settings,
        success: function(data) {
          console.log(data);

          if(data.logs != undefined){
            var newLogs = this.state.logs.concat(data.logs);
            newLogs.sort(function(a,b){
              return b.date - a.date;
            });
            //var scrolledTo = $(window).scrollTop();
            this.setState({logs: newLogs, action_settings: this.state.action_settings });
          }
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
    });
  },
  loadLogsFromServer: function() {
    if(this.state.reset_logs_flag){
      this.forceWipeLogs();
      this.state.reset_logs_flag = false;
    }else{
      //Kappa
    }
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
  },
  actionConfigChanged: function(event) {
    var value = $(event.target)[0].checked;
    var field = $(event.target).attr("data-config");
    var newState = this.state;
    newState.action_settings[field] = value;
    newState.reset_logs_flag=true;
    this.setState(newState);
    this.loadLogsFromServer();

  },
  searchChanged: function(event){
    var newState = this.state;
    newState.action_settings.search = event.target.value;
    newState.reset_logs_flag=true;
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
      if($("#search")[0] != undefined && $("#search")[0].value == ""){
         $("#search")[0].value = this.state.action_settings.search;
      }

    }
  },
  render: function() {
      if(this.props.state=="server-log"){
        return (
            <div className="serverLog">
              <hr/>
              <div>
                <button type="button" onClick={this.forceWipeLogs} className="btn btn-danger">Reload logs</button>
              </div>
              <hr/>
              <div className="row">
                <div className="col-md-4"><h3>Filters</h3></div>
                <div className="col-md-4"></div>
                <div className="col-md-4"></div>
              </div>
              <hr/>
              <form>
              <div className="row">
                <div className="col-md-2"></div>
                <div className="col-md-6">
                  <input type="text" onChange={this.searchChanged} className="form-control" id="search" />
                </div>
                <div className="col-md-2">
                  <div className="checkbox">
                      <label>
                        <input type="checkbox" data-config="regex_search" onClick={this.actionConfigChanged}/> REGEX
                      </label>
                    </div>
                </div>
              </div> <hr/>
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
              <hr/>
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
              <div className="row">
                <div className="col-md-4"></div>
                <div className="col-md-4"><a onClick={this.moreLogsPress} >Load more</a></div>
                <div className="col-md-4"></div>
              </div>
            </div>
            );
      }else if(this.props.state == "serverchat-log" || this.props.state =="privatechat-log"){
        return (
            <div className="serverChatLog">
              <hr/>
              <div>
                <button type="button" onClick={this.forceWipeLogs} className="btn btn-danger">Reload logs</button>
              </div>
              <hr/>
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
              <div className="row">
                <div className="col-md-4"></div>
                <div className="col-md-4"><a onClick={this.moreLogsPress} >Load more</a></div>
                <div className="col-md-4"></div>
              </div>
            </div>
        );
      }
      else if(this.props.state == "action-log"){
        return (
            <div className="actionLog">
              <hr/>
              <div>
                <button type="button" onClick={this.forceWipeLogs} className="btn btn-danger">Reload logs</button>
              </div>
              <hr/>
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
              <div className="row">
                <div className="col-md-4"></div>
                <div className="col-md-4"><a onClick={this.moreLogsPress} >Load more</a></div>
                <div className="col-md-4"></div>
              </div>
            </div>
        );
      }
      else if(this.props.state == "error-log"){
        return (
            <div className="errorLog">
              <hr/>
              <div>
                <button type="button" onClick={this.forceWipeLogs} className="btn btn-danger">Reload logs</button>
              </div>
              <hr/>
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Reporter</th>
                    <th>Error Message</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.logs.map(function(logline){
                      return (
                        <tr key={logline.id}>
                          <td>{this.formatDate(new Date(logline.date))}</td>
                          <td>{logline.reporter}</td>
                          <td>{logline.errormessage}</td>
                        </tr>
                      );
                    }.bind(this))
                  }
                </tbody>
              </table>
              <div className="row">
                <div className="col-md-4"></div>
                <div className="col-md-4"><a onClick={this.moreLogsPress} >Load more</a></div>
                <div className="col-md-4"></div>
              </div>
            </div>
        );
      }
}});

ReactDOM.render(
        <DashBoard />,
        document.getElementById('dashboard')
      );
