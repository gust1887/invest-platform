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
    res.status(500).json({ error: 'Server failed to get portfolios' });
  }
});




router.get('/:portfolioId/securities', async (req, res) => {
  const portfolioId = req.params.portfolioId;

  try {
    const pool = await getConnection();
    // Udregner nettobeholdning for hvert værdipapir: køb lægges til, salg trækkes fra
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

-- Finder datoen for seneste handel i hver portefølje

    MAX(Trades.created_at) AS lastTrade,

-- Beregner samlet værdi af porteføljen ved at gange mængde med gennemsnitlig pris (GAK)
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

            -- Udtrækker relevante data for urealiseret gevinst:
            SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.quantity ELSE -Trades.quantity END) AS totalQuantity, -- totalQuantity: samlet nettobeholdning = køb - salg
            SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.total_price ELSE 0 END) AS totalBuyCost, -- totalBuyCost: samlet beløb brugt på køb
            SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.quantity ELSE 0 END) AS totalBoughtQty, -- totalBoughtQty: totalt antal købte aktier
            MAX(Trades.total_price / NULLIF(Trades.quantity, 0)) AS latestPrice -- latestPrice: seneste pris brugt som estimeret markedspris
          FROM Trades
          JOIN Securities ON Securities.id = Trades.security_id
          JOIN Portfolios ON Portfolios.id = Trades.portfolio_id
          WHERE Portfolios.account_id = @accountId
          GROUP BY Securities.ticker, Securities.securitiesName
          HAVING SUM(CASE WHEN Trades.trade_type = 'BUY' THEN Trades.quantity ELSE -Trades.quantity END) > 0
        `);

    const data = result.recordset.map(row => {
      // Udregner gennemsnitlig købspris, aktuel værdi og kostpris
      // Bruges til at beregne urealiseret gevinst (værdi - kostpris)
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
          -- BuyData indeholder alle køb, SellData indeholder alle salg
          -- Disse bruges til at sammenligne salgsindtægt og kostpris for at beregne realiseret gevinst
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
            -- Beregner realiseret gevinst:
            -- salgsindtægt minus (antal solgte * gennemsnitlig købspris)
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


// Gem daglig værdi af alle porteføljer (Kaldes fx fra Postman)
router.post('/snapshot', async (req, res) => {
  try {
    const pool = await getConnection();

    // Hent alle porteføljer med deres værdi og valuta
    const result = await pool.request().query(`
      -- Beregner og gemmer daglig værdi og valuta for hver portefølje i PortfolioHistory
        SELECT 
          Portfolios.id AS portfolioId,
          SUM(
            CASE 
              WHEN Trades.trade_type = 'BUY' THEN Trades.quantity * Trades.total_price / NULLIF(Trades.quantity, 0)
              WHEN Trades.trade_type = 'SELL' THEN -Trades.quantity * Trades.total_price / NULLIF(Trades.quantity, 0)
              ELSE 0
            END
          ) AS totalValue,
          Accounts.currency
        FROM Portfolios
        LEFT JOIN Trades ON Trades.portfolio_id = Portfolios.id
        JOIN Accounts ON Accounts.id = Portfolios.account_id
        GROUP BY Portfolios.id, Accounts.currency
      `);

    // Gem snapshot for hver portefølje
    for (const row of result.recordset) {
      await pool.request()
        .input("portfolio_id", sql.Int, row.portfolioId)
        .input("value", sql.Decimal(18, 2), row.totalValue || 0)
        .input("currency", sql.NVarChar, row.currency)
        .query(`
            INSERT INTO PortfolioHistory (portfolio_id, value, currency)
            VALUES (@portfolio_id, @value, @currency)
          `);
    }

    res.json({ success: true, message: `${result.recordset.length} snapshots saved` });
  } catch (err) {
    console.error("Fejl ved snapshot:", err);
    res.status(500).json({ error: "Snapshot failed" });
  }
});


// Returner ændringer over tid for samlet værdi (24h, 7d, 30d)
router.get('/change/:accountId', async (req, res) => {
  const accountId = parseInt(req.params.accountId);

  try {
    const pool = await getConnection();

    const query = `
        SELECT 
          PortfolioHistory.value,
          PortfolioHistory.recorded_at
        FROM PortfolioHistory
        JOIN Portfolios ON PortfolioHistory.portfolio_id = Portfolios.id
        WHERE Portfolios.account_id = @accountId
          AND PortfolioHistory.recorded_at >= DATEADD(DAY, -30, GETDATE())
        ORDER BY PortfolioHistory.recorded_at DESC
      `;

    const result = await pool.request()
      .input('accountId', sql.Int, accountId)
      .query(query);

    const latest = result.recordset[0]?.value || 0;

    // Finder den værdi der ligger tættest på tidspunktet for X dage siden
    // Bruges til at beregne ændring over 1, 7 og 30 dage
    const getClosest = (days) => {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const match = result.recordset.find(r => new Date(r.recorded_at).getTime() <= cutoff);
      return match?.value || latest;
    };

    const d1 = getClosest(1);
    const d7 = getClosest(7);
    const d30 = getClosest(30);

    const pct = (a, b) => b === 0 ? '0.00%' : `${(((a - b) / b) * 100).toFixed(2)}%`;

    res.json({
      change24h: pct(latest, d1),
      change7d: pct(latest, d7),
      change30d: pct(latest, d30)
    });
  } catch (err) {
    console.error("Fejl ved hentning af ændringer:", err);
    res.status(500).json({ error: "Serverfejl ved change data" });
  }
});


// Returner 24h ændring per portefølje
router.get('/change/individual/:accountId', async (req, res) => {
  const accountId = parseInt(req.params.accountId);

  try {
    const pool = await getConnection();

    const result = await pool.request()
      .input('accountId', sql.Int, accountId)
      .query(`
          SELECT 
            PortfolioHistory.portfolio_id,
            PortfolioHistory.value,
            PortfolioHistory.recorded_at
          FROM PortfolioHistory
          JOIN Portfolios ON PortfolioHistory.portfolio_id = Portfolios.id
          WHERE Portfolios.account_id = @accountId
            AND PortfolioHistory.recorded_at >= DATEADD(DAY, -2, GETDATE())
          ORDER BY PortfolioHistory.recorded_at DESC
        `);

    const grouped = {};

    for (const row of result.recordset) {
      const pid = row.portfolio_id;
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push({ value: row.value, recorded_at: row.recorded_at });
    }

    const changes = {};
    for (const [pid, entries] of Object.entries(grouped)) {
      // Finder seneste og tidligere snapshot for hver portefølje og udregner procentvis ændring over 24 timer
      const sorted = entries.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
      const latest = sorted[0]?.value || 0;
      const prev = sorted.find(e => new Date(e.recorded_at).getTime() < Date.now() - 24 * 60 * 60 * 1000)?.value || latest;
      const pct = prev === 0 ? 0 : ((latest - prev) / prev) * 100;
      changes[pid] = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    }

    res.json(changes);
  } catch (err) {
    console.error("Fejl ved individuelle ændringer:", err);
    res.status(500).json({ error: "Serverfejl" });
  }
});



module.exports = router;
