const express = require("express");
const app = express();
const request = require("request");
const wikip = require("wiki-infobox-parser");

// ejs
app.set("view engine", "ejs");
app.set("views", "./views");

// routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/index", (req, response) => {
  let url = "https://en.wikipedia.org/w/api.php";
  let params = {
    action: "opensearch",
    search: req.query.person,
    limit: "1",
    namespace: "0",
    format: "json",
  };

  url = url + "?";
  Object.keys(params).forEach((key) => {
    url += "&" + key + "=" + params[key];
  });

  // get wikip search string
  request(url, (err, res, body) => {
    if (err) {
      return response.redirect("404");
    }

    const result = JSON.parse(body);
    const x = result[3][0].substring(30); // Extract title from URL

    // get wikip json
    wikip(x, (err, final) => {
      if (err) {
        return response.redirect("404");
      } else {
        // Render the JSON with EJS template
        response.render("json", { title: req.query.person, data: final });
      }
    });
  });
});

// port
app.listen(3000, () => console.log("Listening at port 3000..."));
