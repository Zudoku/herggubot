var NavigationBar = React.createClass({
  render: function() {
    return (
      <nav className="navbar navbar-default">
        <div className="container-fluid">
          <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul className="nav navbar-nav">
              <li><a href="/">Dashboard</a></li>
              <li><a href="/">Configuration</a></li>
              <li><a href="/">Modules</a></li>
            </ul>
          </div>
        </div>
      </nav>
    );
  }
});

ReactDOM.render(
        <NavigationBar />,
        document.getElementById('navigationbar')
      );