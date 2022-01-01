import React from 'react';
import { Button } from "@material-ui/core";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    // You can also log error messages to an error reporting service here
  }

  handleClick() {
    localStorage.clear();
    window.location.reload();
  }

  render() {
    if (this.state.errorInfo) {
      // Error path
      return (
        <div style={{ color: 'white', padding: 20 }}>
          <h2>Something went wrong.</h2>
          <div>Please delete your current Local Storage data by clicking on the button below and import your data
            again
          </div>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <div>If the problem persist, please look at the console by clicking F12 -> Console and send the error text
            to Morojo#2331
          </div>
          <div style={{ marginTop: 20 }}>
            <Button color={'primary'} variant={'contained'}
                    onClick={this.handleClick}>
              Reset Local Storage
            </Button>
          </div>
        </div>
      );
    }
    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary