// Importerer Express frameworket, som bruges til at lave webserver og ruter
const express = require('express');

// Importerer mssql biblioteket, som bruges til at sende SQL-queries til Microsoft SQL Server
const sql = require('mssql');

// Importerer funktionen getConnection, som laver forbindelse til databasen
const { getConnection } = require('../database');

// Opretter en ny "router" fra Express, så vi kan lave API-ruter separat fra index.js
const router = express.Router();

// Definerer en POST-rute på /opretbruger (det bliver /api/opretbruger i index.js)
router.post('/opretbruger', async (req, res) => {
  // Vi henter de tre felter fra body'en i requesten
  const { username, password, email } = req.body;
  

  try {
    // Vi opretter forbindelse til databasen (hentes en gang og genbruges)
    const pool = await getConnection();

    // Vi opretter en SQL-forespørgsel og sender de tre værdier som parametre
    await pool.request()
      .input('username', sql.NVarChar, username)  // Beskytter mod SQL injection
      .input('password', sql.NVarChar, password)  
      .input('email', sql.NVarChar, email)
      .query(`
        INSERT INTO Users (username, password, email)
        VALUES (@username, @password, @email)
      `); // Vi indsætter en ny bruger i databasen

    // Hvis det lykkes, sender vi svar tilbage med statuskode 201 (Created)
    res.status(201).json({ message: "User created" });
  } catch (err) {
    // Hvis noget går galt, skriver vi fejlen i konsollen
    console.error(err);
    // Sender en fejlmeddelelse tilbage til klienten
    res.status(500).json({ error: "Error when creating user" });
  }
});



// Eksporterer routeren så den kan bruges i index.js
module.exports = router;
