CREATE DATABASE IF NOT EXISTS autovault_db;
USE autovault_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('buyer','dealer') DEFAULT 'buyer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dealers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(120) NOT NULL,
  location VARCHAR(120),
  phone VARCHAR(30),
  email VARCHAR(120),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dealer_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  mileage INT DEFAULT 0,
  fuel_type VARCHAR(20) DEFAULT 'Petrol',
  transmission VARCHAR(20) DEFAULT 'Automatic',
  location VARCHAR(120),
  description TEXT,
  status ENUM('active','sold') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE
);

CREATE TABLE listing_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE listing_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  feature VARCHAR(100) NOT NULL,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dealer_id INT NOT NULL,
  user_id INT NULL,
  reviewer_name VARCHAR(100) NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES dealers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
);