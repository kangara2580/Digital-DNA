const noopConsole = () => {
  console.log("A project by Distil Immersive. Visit us https://www.distil.im");
  const methods = [
    "assert",
    "clear",
    "count",
    "debug",
    "dir",
    "dirxml",
    "error",
    "exception",
    "group",
    "groupCollapsed",
    "groupEnd",
    "info",
    "markTimeline",
    "profile",
    "profileEnd",
    "table",
    "time",
    "timeEnd",
    "timeStamp",
    "trace",
    "warn",
    "log",
  ];
  methods.forEach((method) => {
    console[method] = () => {};
  });
};
noopConsole();
