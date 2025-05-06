const express = require('express');
const sql = require('mssql');
const { getConnection } = require('../database');

const router = express.Router();

// Definerer en POST-rute på /opretkonto, som bliver tilgængelig via /api/accounts/opretkonto
router.post('/opretkonto', async (req, res) => {
    // Vi henter data sendt fra klienten (f.eks. via Postman eller en form)
    const { user_id, accountName, currency } = req.body;

    try {
        // Vi får en forbindelse til databasen
        const pool = await getConnection();

        // Vi laver en SQL-forespørgsel, hvor vi bruger input-parametre
        // for at undgå SQL injection og sikre korrekt datatyper
        await pool.request()
            .input('user_id', sql.Int, user_id) // Brugerens ID (Foreign-key til Users-tabellen)
            .input('accountName', sql.NVarChar, accountName)   // Navn på kontoen, fx "Opsparing"
            .input('currency', sql.NVarChar, currency)  // Valuta, fx "DKK"
            .query(`
        INSERT INTO Accounts (user_id, accountName, currency, balance, created_at)
        VALUES (@user_id, @accountName, @currency, 0, GETDATE())
      `);  // Vi indsætter en ny konto i Accounts-tabellen med startbalance 0 og nuværende dato

        // Hvis alt lykkes, sender vi svar tilbage med statuskode 201 (Created)
        res.status(201).json({ message: 'Account created' });
    } catch (err) {
        // Hvis der opstår fejl, logger vi det og sender fejlbesked til klienten
        console.error(err);
        res.status(500).json({ error: 'Error when creating account' });
    }
});
// Eksporterer routeren, så den kan bruges i index.js via app.use(...)
module.exports = router;
