const express = require('express');
const path = require('path');
// Importerer alle ruter relateret til brugere (fx opret bruger, login)
const userRoutes = require('./routes/userRoutes');
// Importerer alle ruter relateret til bankkonti (fx opret konto, indsæt penge)
const accountRoutes = require('./routes/accountRoutes');

const app = express();
const port = 5000;


/* Når klienten besøger en sti, der starter med f.eks. /api/users,
 så videresendes det til de ruter, der er defineret i userRoutes.js
 Eksempel: POST /api/users/opretbruger */
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);


app.use(express.json()); // Gør det muligt at læse JSON i req.body

app.use(express.static(path.join(__dirname, '..', 'HTML')));  // HTML mappen ligger uden for server mappen

// Hjemmeside rute (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'HTML', 'frontpage.html'));
});

// Login rute
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../HTML', 'login.html')); 
});

// Opret bruger
app.get('/opretbruger', (req, res) => {
  res.sendFile(path.join(__dirname, '../HTML', 'opretbruger.html'));
});







// Start serveren
app.listen(port, () => {
  console.log(`Server kører på http://localhost:${port}`);
});