
const app = require("./app");
var server = require('http').createServer(app);

const port = 2083;

server.listen(port, () => console.log(`Listening on port ${port}..`));
