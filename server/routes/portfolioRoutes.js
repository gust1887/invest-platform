const express = require('express');
const sql = require('mssql');
const { getConnection } = require('../database');

const router = express.Router();

// POST /api/portfolios – opret ny portefølje
router.post('/', async (req, res) => {
  const { portfolioName, account_id, user_id } = req.body;

  if (!account_id || !portfolioName) {
    return res.status(400).json({ error: 'Data is missing' });
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

    res.status(201).json({ message: 'Portofole created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fail to create the portofole' });
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
    console.error('Server fail to get:', err);
    res.status(500).json({ error: 'Server fail to get' });
  }
});




router.get('/:portfolioId/securities', async (req, res) => {
  const portfolioId = req.params.portfolioId;

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('portfolioId', sql.Int, portfolioId)
      .query(`
SELECT 
  Securities.securitiesName,
  Securities.ticker,
  SUM(CASE 
        WHEN Trades.trade_type = 'BUY' THEN Trades.quantity
        WHEN Trades.trade_type = 'SELL' THEN -Trades.quantity
        ELSE 0
      END) AS totalQuantity
FROM Trades
JOIN Securities ON Trades.security_id = Securities.id
WHERE Trades.portfolio_id = @portfolioId
GROUP BY Securities.securitiesName, Securities.ticker
HAVING SUM(CASE 
             WHEN Trades.trade_type = 'BUY' THEN Trades.quantity
             WHEN Trades.trade_type = 'SELL' THEN -Trades.quantity
             ELSE 0
           END) > 0
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Fejl ved hentning af værdipapirer:', err);
    res.status(500).json({ error: 'Serverfejl' });
  }
});


// Hent navn, seneste handel og samlet værdi for hver portefølje
router.get('/summary/:accountId', async (req, res) => {
  const accountId = parseInt(req.params.accountId);

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('account_id', sql.Int, accountId)
      .query(`
SELECT 
  Portfolios.id,
  Portfolios.portfolioName,


  MAX(Trades.created_at) AS lastTrade,

  -- Totalværdi beregnet som: nettobeholdning * gennemsnitlig pris
SUM(
  CASE 
    WHEN Trades.trade_type = 'BUY' THEN Trades.quantity * Trades.total_price / NULLIF(Trades.quantity, 0)
    WHEN Trades.trade_type = 'SELL' THEN -1 * Trades.quantity * Trades.total_price / NULLIF(Trades.quantity, 0)
    ELSE 0
  END
) AS totalValue

FROM Portfolios

-- Join alle handler knyttet til porteføljen
LEFT JOIN Trades ON Trades.portfolio_id = Portfolios.id

-- Kun for porteføljer under en bestemt konto
WHERE Portfolios.account_id = @account_id

-- Grupper pr. portefølje
GROUP BY Portfolios.id, Portfolios.portfolioName
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Fejl i /summary/:accountId", err);
    res.status(500).json({ error: "Serverfejl ved hentning af portefølje-data" });
  }
});


module.exports = router;
