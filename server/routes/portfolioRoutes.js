const express = require('express');
const sql = require('mssql');
const { getConnection } = require('../database');

const router = express.Router();

// POST /api/portfolios – opret ny portefølje
router.post('/', async (req, res) => {
    const { portfolioName, account_id, user_id } = req.body;

    if (!account_id || !portfolioName) {
        return res.status(400).json({ error: 'Mangler data' });
    }

    try {
        const pool = await getConnection();
        await pool.request()
        .input('portfolioName', sql.NVarChar, portfolioName)
        .input('account_id', sql.Int, account_id)
        .input('user_id', sql.Int, user_id)
        .query(`
          INSERT INTO Portfolios (portfolioName, account_id, user_id)
          VALUES (@portfolioName, @account_id, @user_id)
        `);

        res.status(201).json({ message: 'Portefølje oprettet' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Fejl ved oprettelse af portefølje' });
    }
});

// Hent porteføljer for den specifikke konto
router.get('/konto/:accountId', async (req, res) => {
    const accountId = parseInt(req.params.accountId);
  
    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('account_id', sql.Int, accountId)
        .query('SELECT * FROM Portfolios WHERE account_id = @account_id');
  
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error('Fejl ved hentning af porteføljer:', err);
      res.status(500).json({ error: 'Serverfejl ved hentning' });
    }
  });
  



module.exports = router;
