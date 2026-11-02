import "./style.css";

const destination = "https://www.duolingo.com/";

// Accounts, lessons, courses, and progress are provided by Duolingo's official web application.
if (window.location.hostname !== "www.duolingo.com") {
  window.location.replace(destination);
}
