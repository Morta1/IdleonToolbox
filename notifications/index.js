const subscribe = () => {
  if (!("Notification" in window)) {
    return { err: "This browser does not support desktop notification" };
  }
  // Otherwise, we need to ask the user for permission
  if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function (permission) {
    });
  }
};

const notify = () => {
  if (Notification.permission === "granted") {
    const notification = new Notification("Hi there!");

  }
}

export {
  subscribe
}