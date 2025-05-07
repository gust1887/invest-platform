const express = require('express');
const sql = require('mssql');
const { getConnection } = require('../database');

const router = express.Router();

// POST /api/portfolios – opret ny portefølje
router.post('/', async (req, res) => {
  const { account_id, portfolioName } = req.body;

  if (!account_id || !portfolioName) {
    return res.status(400).json({ error: 'Mangler data' });
  }

  try {
    const pool = await getConnection();
    await pool.request()
      .input('account_id', sql.Int, account_id)
      .input('portfolioName', sql.NVarChar, portfolioName)
      .query(`
        INSERT INTO Portfolios (account_id, portfolioName)
        VALUES (@account_id, @portfolioName)
      `);

    res.status(201).json({ message: 'Portefølje oprettet' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fejl ved oprettelse af portefølje' });
  }
});

module.exports = router;
