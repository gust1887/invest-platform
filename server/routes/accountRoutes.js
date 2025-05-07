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




// GET /api/accounts/:user_id – henter konti for en bruger til at vise på accounts
router.get('/:user_id', async (req, res) => {
    const userId = req.params.user_id;
    try {
        const pool = await getConnection();

        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT * FROM Accounts WHERE user_id = @user_id');

        res.json(result.recordset); // returnér konti som JSON
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fejl ved hentning af konti' });
    }
});

// PUT /api/accounts/:account_id/status – luk eller genåbn konto og opdater closed_at
router.put('/:account_id/status', async (req, res) => {
    const { is_closed } = req.body;
    const accountId = req.params.account_id;

    try {
        const pool = await getConnection();

        // Opdater både is_closed og closed_at
        const query = `
            UPDATE Accounts
            SET
                is_closed = @is_closed,
                closed_at = ${is_closed ? 'GETDATE()' : 'NULL'}
            WHERE id = @account_id
        `;

        await pool.request()
            .input('account_id', sql.Int, accountId)
            .input('is_closed', sql.Bit, is_closed)
            .query(query);

        res.status(200).json({ message: is_closed ? 'Konto lukket' : 'Konto genåbnet' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fejl ved opdatering af status' });
    }
});



// PUT /api/accounts/addbalance – tilføj beløb til konto
router.put('/addbalance', async (req, res) => {
    const { accountId, amount } = req.body;

    try {
        const pool = await getConnection();

        // Stop hvis konto er lukket
        const check = await pool.request()
            .input('accountId', sql.Int, accountId)
            .query('SELECT is_closed FROM Accounts WHERE id = @accountId');

        if (check.recordset[0].is_closed) {
            return res.status(400).json({ error: 'Kontoen er lukket og kan ikke tilføjes penge' });
        }

        await pool.request()
            .input('accountId', sql.Int, accountId)
            .input('amount', sql.Money, amount)
            .query('UPDATE Accounts SET balance = balance + @amount WHERE id = @accountId');

        res.status(200).json({ message: 'Beløb tilføjet' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fejl ved tilføjelse af penge' });
    }
});




// Eksporterer routeren, så den kan bruges i index.js via app.use(...)
module.exports = router;
