var Config = React.createClass({
  getInitialState: function() {
    return { config : {
        module_monitor_chat : {},
        module_mute_user : {},
        module_admin_tools : {},
        module_extra_logs : {},
        module_monitor_channel_slots : {},
        tessu_stats_integration : {},
        web_interface : {}


      }
    };
  },
  componentDidMount: function() {
    $.ajax({
      url: "/herggubot/api/config",
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({config : data});
        $("#configTextArea")[0].value = this.visualizeConfig();
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  uploadConfig: function(event) {
    console.log($("#configTextArea")[0].value);
    var configPayLoad = $("#configTextArea")[0].value;
    var password = prompt("Password","");
    $.ajax({
      url: "/herggubot/api/upload-config",
      dataType: 'json',
      type: "POST",
      data: {payload: configPayLoad, pw : password},
      success: function(data) {
        if(data.success == true){
          alert("Config uploaded! Restart the bot for it to take effect.");
        }else{
          alert("Config not uploaded correctly. " + data.reason);
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        alert("Config not uploaded correctly.");
      }.bind(this)
    });
  },
  uploadRawConfig: function(event) {
    console.log($("#configRawTextArea")[0].value);
    var configPayLoad = $("#configRawTextArea")[0].value;
    var password = prompt("Password","");
    $.ajax({
      url: "/herggubot/api/upload-config-raw",
      dataType: 'json',
      type: "POST",
      data: {payload: configPayLoad, pw : password},
      success: function(data) {
        if(data.success == true){
          alert("Config uploaded! Restart the bot for it to take effect.");
        }else{
          alert("Config not uploaded correctly. " + data.reason);
        }
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
        alert("Config not uploaded correctly.");
      }.bind(this)
    });
  },
  configChanged : function(event) {

    var rawValue = null;
    if(event.target.type == "number") {
      rawValue = Number(event.target.value);
    } else if(event.target.type == "checkbox") {
      rawValue = event.target.checked;
    } else if(event.target.type == "text" && event.target.value.charAt(0) == '[') {
      rawValue = JSON.parse(event.target.value);
    } else {
      rawValue = event.target.value;
    }
    var target = this.state.config[event.target.id];

    if(event.target.id.includes("module_monitor_chat")) {
      var lastPart = event.target.id.substring(20);
      this.state.config.module_monitor_chat[lastPart] = rawValue;
    } else if(event.target.id.includes("module_mute_user")){
      var lastPart = event.target.id.substring(17);
      this.state.config.module_mute_user[lastPart] = rawValue;
    } else if(event.target.id.includes("module_admin_tools")){
      var lastPart = event.target.id.substring(19);
      this.state.config.module_admin_tools[lastPart] = rawValue;
    } else if(event.target.id.includes("module_tessustats_integration")){
      var lastPart = event.target.id.substring(30);
      this.state.config.tessu_stats_integration[lastPart] = rawValue;
    } else if(event.target.id.includes("module_monitor_channel_slots")){
      var lastPart = event.target.id.substring(29);
      this.state.config.module_monitor_channel_slots[lastPart] = rawValue;
    } else if(event.target.id.includes("module_extra_logs")){
      var lastPart = event.target.id.substring(18);
      this.state.config.module_extra_logs[lastPart] = rawValue;
    } else if(event.target.id.includes("web_interface")){
      var lastPart = event.target.id.substring(14);
      this.state.config.web_interface[lastPart] = rawValue;
    } else {
      this.state.config[event.target.id] = rawValue;
    }
    this.setState({config : this.state.config});
  },
  arrayify : function(target) {
    if(target == undefined) {
      return "[ ]";
    } else {
      return "["+ target.toString() + "]";
    }
  },
  visualizeConfig : function() {
    var result = JSON.stringify(this.state.config,null, 4);
    return result;
  },
  textAreaChanged : function(event) {

  },
  render: function() {

    return (
      <div>
        <form className="form-horizontal">
          <br/>
          <hr/>
          <h2>General</h2>
          <hr/>
          <div className="form-group">
            <label className="col-md-2 control-label" for="virtual_server_id">virtual_server_id</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="virtual_server_id" value={this.state.config.virtual_server_id} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="ts_ip">ts_ip</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="ts_ip" value={this.state.config.ts_ip} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="serverquery_username">serverquery_username</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="serverquery_username" value={this.state.config.serverquery_username} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="serverquery_password">serverquery_password</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="serverquery_password" value={this.state.config.serverquery_password} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="web_admin_password">web_admin_password</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="web_admin_password" value={this.state.config.web_admin_password} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="nickname">nickname</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="nickname" value={this.state.config.nickname} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="reset_database">reset_database</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="reset_database" checked={this.state.config.reset_database} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="database_path">database_path</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="database_path" value={this.state.config.database_path} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="debug_network">debug_network</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="debug_network" checked={this.state.config.debug_network} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="query_time_limit">query_time_limit</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="query_time_limit" value={this.state.config.query_time_limit} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="bot_use_wrapper">bot_use_wrapper</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="bot_use_wrapper" checked={this.state.config.bot_use_wrapper} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="bot_wrapper_restart_time">bot_wrapper_restart_time</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="bot_wrapper_restart_time" value={this.state.config.bot_wrapper_restart_time} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="admin_server_groups">admin_server_groups</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="admin_server_groups" value={this.arrayify(this.state.config.admin_server_groups)} onChange={this.configChanged}/>
            </div>
          </div>
          <hr/>
          <h2>monitor-chat</h2>
          <hr/>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_monitor_chat_enabled">enabled</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="module_monitor_chat_enabled" checked={this.state.config.module_monitor_chat.enabled} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_monitor_chat_spam_message">spam_message</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="module_monitor_chat_spam_message" value={this.state.config.module_monitor_chat.spam_message} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_monitor_chat_ban_punish">ban_punish</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="module_monitor_chat_ban_punish" checked={this.state.config.module_monitor_chat.ban_punish} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_monitor_chat_ban_length">ban_length</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="module_monitor_chat_ban_length" value={this.state.config.module_monitor_chat.ban_length} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_monitor_chat_spam_limit">spam_limit</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="module_monitor_chat_spam_limit" value={this.state.config.module_monitor_chat.spam_limit} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_monitor_chat_spam_timeframe">spam_message</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="module_monitor_chat_spam_timeframe" value={this.state.config.module_monitor_chat.spam_timeframe} onChange={this.configChanged}/>
            </div>
          </div>
          <hr/>
          <h2>mute-user</h2>
          <hr/>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_mute_user_enabled">enabled</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="module_mute_user_enabled" checked={this.state.config.module_mute_user.enabled} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_mute_user_muted_server_group">muted_server_group</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="module_mute_user_muted_server_group" value={this.state.config.module_mute_user.muted_server_group} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_mute_user_mute_length">mute_length</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="module_mute_user_mute_length" value={this.state.config.module_mute_user.mute_length} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_mute_user_mute_reason">mute_reason</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="module_mute_user_mute_reason" value={this.state.config.module_mute_user.mute_reason} onChange={this.configChanged}/>
            </div>
          </div>
          <hr/>
          <h2>admin-tools</h2>
          <hr/>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_admin_tools_enabled">enabled</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="module_admin_tools_enabled" checked={this.state.config.module_admin_tools.enabled} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-3 control-label" for="module_admin_tools_inactive_users_servergroup_whitelist">inactive_users_servergroup_whitelist</label>
            <div className="col-sm-9">
              <input type="text" className="form-control" id="module_admin_tools_inactive_users_servergroup_whitelist" value={this.arrayify(this.state.config.module_admin_tools.inactive_users_servergroup_whitelist)} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_admin_tools_inactive_kick_message">inactive_kick_message</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="module_admin_tools_inactive_kick_message" value={this.state.config.module_admin_tools.inactive_kick_message} onChange={this.configChanged}/>
            </div>
          </div>
          <hr/>
          <h2>tessustats-integration</h2>
          <hr/>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_tessustats_integration_enabled">enabled</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="module_tessustats_integration_enabled" checked={this.state.config.tessu_stats_integration.enabled} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_tessustats_integration_site_root">site_root</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="module_tessustats_integration_site_root" value={this.state.config.tessu_stats_integration.site_root} onChange={this.configChanged}/>
            </div>
          </div>
          <hr/>
          <h2>monitor-channel-slots</h2>
          <hr/>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_monitor_channel_slots_enabled">enabled</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="module_monitor_channel_slots_enabled" checked={this.state.config.module_monitor_channel_slots.enabled} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_monitor_channel_slots_channel_delete_time">channel_delete_time</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="module_monitor_channel_slots_channel_delete_time" value={this.state.config.module_monitor_channel_slots.channel_delete_time} onChange={this.configChanged}/>
            </div>
          </div>
          <hr/>
          <h2>extra-logs</h2>
          <hr/>
          <div className="form-group">
            <label className="col-md-2 control-label" for="module_extra_logs_enabled">enabled</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="module_extra_logs_enabled" checked={this.state.config.module_extra_logs.enabled} onChange={this.configChanged}/>
            </div>
          </div>
          <hr/>
          <h2>web-interface</h2>
          <hr/>
          <div className="form-group">
            <label className="col-md-2 control-label" for="web_interface_enabled">enabled</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="web_interface_enabled" checked={this.state.config.web_interface.enabled} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="web_interface_launch_bot_in_startup">launch_bot_in_startup</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="web_interface_launch_bot_in_startup" checked={this.state.config.web_interface.launch_bot_in_startup} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="web_interface_port">port</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="web_interface_port" value={this.state.config.web_interface.port} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="web_interface_webserver_bind">webserver_bind</label>
            <div className="col-sm-10">
              <input type="text" className="form-control" id="web_interface_webserver_bind" value={this.state.config.web_interface.webserver_bind} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="web_interface_use_wrapper">use_wrapper</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="web_interface_use_wrapper" checked={this.state.config.web_interface.use_wrapper} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="web_interface_wrapper_restart_time">wrapper_restart_time</label>
            <div className="col-sm-10">
              <input type="number" className="form-control" id="web_interface_wrapper_restart_time" value={this.state.config.web_interface.wrapper_restart_time} onChange={this.configChanged}/>
            </div>
          </div>
          <div className="form-group">
            <label className="col-md-2 control-label" for="web_interface_allow_config_upload">allow_config_upload</label>
            <div className="col-sm-10">
              <input type="checkbox" className="form-control" id="web_interface_allow_config_upload" checked={this.state.config.web_interface.allow_config_upload} onChange={this.configChanged}/>
            </div>
          </div>
          <br/>
          <br/>
          <button type="button" onClick={this.uploadConfig} className="btn btn-primary btn-block">Upload config via the form</button>
          </form>
        <br/>
        <br/>
        <div>
          <textarea id="configTextArea" className="form-control" rows="60" onChange={this.textAreaChanged} readOnly value={this.visualizeConfig()}/>
          <br/>
          <h3>Upload RAW config file</h3>
          <textarea id="configRawTextArea" className="form-control" rows="60"/>
          <br/>
          <br/>
          <button type="button" onClick={this.uploadRawConfig} className="btn btn-primary btn-block">Upload RAW config</button>
        </div>
      </div>
    );
  }
});

ReactDOM.render(
        <Config />,
        document.getElementById('config')
      );
