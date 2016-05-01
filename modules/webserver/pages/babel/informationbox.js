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
  isLoaded : function(modulename){
    if(this.state.information != undefined && this.state.information.modulesLoaded != undefined){
      for(var x = 0 ; x < this.state.information.modulesLoaded.length; x++){
        var handledModule = this.state.information.modulesLoaded[x];
        if(handledModule.module == modulename){
          return true;
        }
      }
      return false;
    } else {
      return false;
    }
  },
  getClassNameForModuleButton : function(modulename){
    if(this.isLoaded(modulename)){
      return "btn btn-success dropdown-toggle";
    } else {
      return "btn btn-danger dropdown-toggle";
    }
  },
  render: function() {

    return (
      <div>
        <h3> Bot status: {this.state.information.pid == null ? "Offline" : "Online"} </h3>
        <div>
        <b>
         Uptime : {this.state.information.uptime} <br/>


        </b>
        </div>
        <br/>
        <div className="table-responsive">
        <table className="table table-bordered">
          <tbody>
            <tr>
              <td>
                <div className="btn-group">
                  <button type="button" className={this.getClassNameForModuleButton("admin-tools")} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    admin-tools <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#">Restart (TODO)</a></li>
                  </ul>
                </div>
              </td>
              <td>
                <div className="btn-group">
                  <button type="button" className={this.getClassNameForModuleButton("mute-user")} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    mute-user <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#">Restart (TODO)</a></li>
                  </ul>
                </div>
              </td>
              <td>
                <div className="btn-group">
                  <button type="button" className={this.getClassNameForModuleButton("extra-logs")} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    extra-logs <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#">Restart (TODO)</a></li>
                  </ul>
                </div>
              </td>
              <td>
                <div className="btn-group">
                  <button type="button" className={this.getClassNameForModuleButton("monitor-chat")} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    monitor-chat <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#">Restart (TODO)</a></li>
                  </ul>
                </div>
              </td>
              <td>
                <div className="btn-group">
                  <button type="button" className={this.getClassNameForModuleButton("tessustats-integration")} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    tessustats-integration <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#">Restart (TODO)</a></li>
                  </ul>
                </div>
              </td>
              <td>
                <div className="btn-group">
                  <button type="button" className={this.getClassNameForModuleButton("monitor-lsc")} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    monitor-lsc <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#">Restart (TODO)</a></li>
                  </ul>
                </div>
              </td>
              <td>
                <div className="btn-group">
                  <button type="button" className={this.getClassNameForModuleButton("monitor-new")} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    module-new <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#">Restart (TODO)</a></li>
                  </ul>
                </div>
              </td>
              <td>
                <div className="btn-group">
                  <button type="button" className={this.getClassNameForModuleButton("monitor-new")} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    module-new <span className="caret"></span>
                  </button>
                  <ul className="dropdown-menu">
                    <li><a href="#">Restart (TODO)</a></li>
                  </ul>
                </div>
              </td>
            </tr>
            <tr>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

    );
  }
});

ReactDOM.render(
        <InformationBox />,
        document.getElementById('infobox')
      );
