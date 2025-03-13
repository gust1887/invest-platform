const express = require('express');
const app = express();
const path = require('path');
const port = 5000;


app.use(express.static(path.join(__dirname, '..', 'HTML')));  // HTML mappen ligger uden for server mappen

// Hjemmeside rute (index.html)
app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname, '..', 'HTML', 'frontpage.html'));  // Path til frontpage.html
});


// Test1

// Start serveren
app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});
