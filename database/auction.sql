USE autovault_db;

CREATE TABLE IF NOT EXISTS auctions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL UNIQUE,
  starting_price DECIMAL(12,2) NOT NULL,
  ends_at DATETIME NOT NULL,
  status ENUM('open','closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auction_id INT NOT NULL,
  bidder_name VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
);

-- Demo auctions: Camry (listing 1) and Mercedes (listing 3), open for 7 days
INSERT IGNORE INTO auctions (listing_id, starting_price, ends_at) VALUES
(1, 90000, DATE_ADD(NOW(), INTERVAL 7 DAY)),
(3, 200000, DATE_ADD(NOW(), INTERVAL 7 DAY));