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
      this.refs.logs.state.update_logs_flag = true;
      this.refs.logs.state.max_index = 1;
      this.refs.logs.loadLogsFromServer();
      this.forceUpdate();
    }.bind(this));
    
  },
  tryToRestart: function(event){
    var password = prompt("Password","");
    $.ajax({
      url: "/herggubot/api/restart",
      dataType: 'json',
      type: "POST",
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
  render: function() {
    return (
      <div>
        <div>
          <button type="button" onClick={this.tryToRestart} className="btn btn-danger">Restart</button>
        </div>
        <hr/>
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
       update_logs_flag: true,
       max_index: 1,
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

       }
    };
  },
  forceLoadLogs : function() {
    console.log("refreshing everything")
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

    var newLogs = [];
    var gotten = [];
    var allValues = [];

    for(var x = 0 ; x <= this.state.max_index; x++){
      this.state.index = x;
      settings.index = x;
      allValues.push(x);
      $.ajax({
        url: url,
        dataType: 'json',
        cache: false,
        data: settings,
        success: function(data) {
          //console.log("got " + data.index);
          if(gotten.indexOf(data.index) == -1){
              gotten.push(parseInt(data.index));
              //console.log("added to gotten");
              if(data.logs != undefined){
                newLogs = newLogs.concat(data.logs);
                newLogs.sort(function(a,b){
                  return b.date - a.date;
                });
              }

              var success = allValues.every(function(v,i) {
                return gotten.indexOf(v) !== -1;
              });
              //console.log("success=" + success);
              //console.log(allValues);
              //console.log(gotten);
              if(success && data.index >= this.state.max_index){
                //console.log("new logs in place");
                var scrolledTo = $(window).scrollTop();
                this.setState({logs: newLogs, action_settings: this.state.action_settings });
                /*setTimeout(function(){
                  $('html, body').animate({
                    scrollTop: scrolledTo
                  }, 1);
                },700); */
              }
          }
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    }
  },
  loadLogsFromServer: function() {
    if(this.state.update_logs_flag){
      console.log("flag set");
      this.forceLoadLogs();
      this.state.update_logs_flag = false;
    }else{

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

      this.state.settings.index == 0;
      $.ajax({
        url: url,
        dataType: 'json',
        cache: false,
        data: settings,
        success: function(data) {
          if(this.state.logs.length > 0){
            data.logs.reverse();
            if(this.state.logs[0] != data.logs[0]){
              //console.log("Different log");
              this.forceLoadLogs();
            }else{
              //console.log("same log");
            }
          }
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
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
    setInterval(this.loadLogsFromServer, 20000);

    setInterval(function(){
      if($(window).scrollTop() + $(window).height() == $(document).height() && this.state.logs.length != 0) {
        this.state.max_index++;
        this.forceLoadLogs();
      }
    }.bind(this),2000);
  },
  actionConfigChanged: function(event) {    
    var value = $(event.target)[0].checked;
    var field = $(event.target).attr("data-config");
    var newState = this.state;
    newState.action_settings[field] = value;
    this.setState(newState);
    this.loadLogsFromServer();

  },
  searchChanged: function(event){
    var newState = this.state;
    newState.action_settings.search = event.target.value;
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
