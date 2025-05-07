
-- Tabel for users -- 
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE
);


-- Konto -- 
CREATE TABLE Accounts (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    accountName NVARCHAR(100),
    currency NVARCHAR(10),
    balance DECIMAL(18,2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    closed_at DATETIME NULL,
    is_closed BIT DEFAULT 0;
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Portføljer
CREATE TABLE Portfolios (
    id INT PRIMARY KEY IDENTITY(1,1),
    account_id INT NOT NULL,
    portfolioName NVARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (account_id) REFERENCES Accounts(id)
);

-- Aktier/Securities
CREATE TABLE Securities (
    id INT PRIMARY KEY IDENTITY(1,1),
    securitiesName NVARCHAR(100) NOT NULL,
    ticker NVARCHAR(10) NOT NULL UNIQUE,
    securityType NVARCHAR(50) NOT NULL  -- fx Aktier, Obligationer, Kryptovaluta
);

-- Handler
CREATE TABLE Trades (
    id INT PRIMARY KEY IDENTITY(1,1),
    portfolio_id INT NOT NULL,
    security_id INT NOT NULL,
    account_id INT NOT NULL,
    trade_type NVARCHAR(10) NOT NULL, -- 'buy' eller 'sell'
    quantity DECIMAL(18,4) NOT NULL,
    total_price DECIMAL(18,2) NOT NULL,
    fee DECIMAL(18,2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (portfolio_id) REFERENCES Portfolios(id),
    FOREIGN KEY (security_id) REFERENCES Securities(id),
    FOREIGN KEY (account_id) REFERENCES Accounts(id)
);

-- Konto Transaktioner
CREATE TABLE AccountTransactions (
    id INT PRIMARY KEY IDENTITY(1,1),
    account_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency NVARCHAR(10) NOT NULL,
    transaction_type NVARCHAR(10) NOT NULL, -- 'deposit' eller 'withdraw'
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (account_id) REFERENCES Accounts(id)
);
