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


// Udregn urealiseret gevinst
router.get('/unrealized/:accountId', async (req, res) => {
  const accountId = req.params.accountId;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("accountId", sql.Int, accountId)
      .query(`
        SELECT 
          Securities.ticker,
          Securities.securitiesName,
          SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.quantity ELSE -Trades.quantity END) AS totalQuantity,
          SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.total_price ELSE 0 END) AS totalBuyCost,
          SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.quantity ELSE 0 END) AS totalBoughtQty,
          MAX(Trades.total_price / NULLIF(Trades.quantity, 0)) AS latestPrice
        FROM Trades
        JOIN Securities ON Securities.id = Trades.security_id
        JOIN Portfolios ON Portfolios.id = Trades.portfolio_id
        WHERE Portfolios.account_id = @accountId
        GROUP BY Securities.ticker, Securities.securitiesName
        HAVING SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.quantity ELSE -Trades.quantity END) > 0
      `);

    const data = result.recordset.map(row => {
      const avgBuyPrice = row.totalBoughtQty > 0 ? row.totalBuyCost / row.totalBoughtQty : 0;
      const currentValue = row.totalQuantity * row.latestPrice;
      const costBasis = row.totalQuantity * avgBuyPrice;
      const unrealizedGain = currentValue - costBasis;

      return {
        ticker: row.ticker,
        name: row.securitiesName,
        quantity: row.totalQuantity,
        currentPrice: row.latestPrice,
        avgBuyPrice: avgBuyPrice,
        unrealizedGain: unrealizedGain
      };
    });

    const totalUnrealized = data.reduce((sum, s) => sum + s.unrealizedGain, 0);

    res.json({ total: totalUnrealized, details: data });
  } catch (err) {
    console.error("Fejl ved beregning af urealiseret gevinst:", err);
    res.status(500).json({ error: "Serverfejl" });
  }
});


//  Udregn realiseret gevinst
router.get('/realized/:accountId', async (req, res) => {
  const accountId = req.params.accountId;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("accountId", sql.Int, accountId)
      .query(`
        WITH BuyData AS (
          SELECT 
            Securities.id AS securityId,
            Securities.ticker,
            SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.total_price ELSE 0 END) AS totalBuyCost,
            SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.quantity ELSE 0 END) AS totalBoughtQty
          FROM Trades
          JOIN Securities ON Securities.id = Trades.security_id
          JOIN Portfolios ON Portfolios.id = Trades.portfolio_id
          WHERE Portfolios.account_id = @accountId
          GROUP BY Securities.id, Securities.ticker
        ),
        SellData AS (
          SELECT 
            Securities.id AS securityId,
            Securities.ticker,
            SUM(CASE WHEN Trades.trade_type = 'SELL' THEN Trades.total_price ELSE 0 END) AS totalSellValue,
            SUM(CASE WHEN Trades.trade_type = 'SELL' THEN Trades.quantity ELSE 0 END) AS totalSoldQty
          FROM Trades
          JOIN Securities ON Securities.id = Trades.security_id
          JOIN Portfolios ON Portfolios.id = Trades.portfolio_id
          WHERE Portfolios.account_id = @accountId
          GROUP BY Securities.id, Securities.ticker
        )
        SELECT 
          BuyData.ticker,
          BuyData.totalBoughtQty,
          SellData.totalSoldQty,
          BuyData.totalBuyCost,
          SellData.totalSellValue,
          (
            SellData.totalSellValue - 
            (SellData.totalSoldQty * (BuyData.totalBuyCost / NULLIF(BuyData.totalBoughtQty, 0)))
          ) AS realizedGain
        FROM BuyData
        JOIN SellData ON SellData.securityId = BuyData.securityId
        WHERE SellData.totalSoldQty > 0
      `);

    const totalRealized = result.recordset.reduce((sum, s) => sum + (s.realizedGain || 0), 0);
    res.json({ total: totalRealized, details: result.recordset });
  } catch (err) {
    console.error("Fejl ved beregning af realiseret gevinst:", err);
    res.status(500).json({ error: "Serverfejl" });
  }
});




module.exports = router;
