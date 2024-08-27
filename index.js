const http = require("http");
const url = require("url");
const request = require("request");

// HTML content for instructions
const instructionsHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple Web Server</title>
</head>
<body>
  <h1>Welcome to the Simple Web Server!</h1>
  <p>To use this server:</p>
  <ul>
    <li>Navigate to <code>/</code> to see this message.</li>
    <li>Navigate to <code>/search?person=NAME</code> to search for a person on Wikipedia.</li>
  </ul>
  <p>Example:</p>
  <p><a href="http://localhost:3000/search?person=Albert+Einstein">http://localhost:3000/search?person=Albert+Einstein</a></p>
</body>
</html>
`;

// HTML content for search results
const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Search Error</title>
</head>
<body>
  <h1>Error</h1>
  <p>Sorry, an error occurred.</p>
</body>
</html>
`;

// Create the server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  if (pathname === "/") {
    // Display instructions in HTML
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(instructionsHtml);
  } else if (pathname === "/search") {
    if (query.person) {
      let apiUrl = "https://en.wikipedia.org/w/api.php";
      let params = {
        action: "opensearch",
        search: query.person,
        limit: "1",
        namespace: "0",
        format: "json",
      };

      apiUrl += "?";
      Object.keys(params).forEach((key) => {
        apiUrl += "&" + key + "=" + encodeURIComponent(params[key]);
      });

      // Get Wikipedia search results
      request(apiUrl, (err, _, body) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(errorHtml);
          return;
        }

        const result = JSON.parse(body);
        const x = result[3][0].substring(30); // Extract title from URL

        // Get Wikipedia page summary
        request(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(x)}&prop=extracts&exintro&format=json`, (err, _, body) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "text/html" });
            res.end(errorHtml);
            return;
          }

          const page = JSON.parse(body);
          const pageId = Object.keys(page.query.pages)[0];
          const extract = page.query.pages[pageId].extract;

          // Send HTML response
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Search Results</title>
            </head>
            <body>
              <h1>Wikipedia Summary for ${query.person}</h1>
              <div>${extract || "No extract found."}</div>
              <a href="/">Back to Home</a>
            </body>
            </html>
          `);
        });
      });
    } else {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bad Request</title>
        </head>
        <body>
          <h1>Bad Request</h1>
          <p>Please provide a <code>person</code> query parameter.</p>
          <a href="/">Back to Home</a>
        </body>
        </html>
      `);
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Not Found</title>
      </head>
      <body>
        <h1>404 Not Found</h1>
        <p>Sorry, the page you are looking for does not exist.</p>
        <a href="/">Back to Home</a>
      </body>
      </html>
    `);
  }
});

// Listen on port 3000
server.listen(3000, () => {
  console.log("Server is listening on port 3000...");
});
