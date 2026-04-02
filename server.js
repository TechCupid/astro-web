const express = require('express');
const app = express();
const port = 8090;

// Example route
app.get('/test/health', (req, res) => {
  res.json({ message: 'Hello from API' });
});

// Listen on all network interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
