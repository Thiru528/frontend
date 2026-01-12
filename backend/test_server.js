const http = require('http');

console.log("Starting minimal server...");

try {
    const server = http.createServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Hello World');
    });

    server.listen(5000, () => {
        console.log('Server running at http://localhost:5000/');
    });
} catch (e) {
    console.error("Crash:", e);
}
