USE autovault_db;

INSERT INTO dealers (name, location, phone, email, description) VALUES
('Accra Prime Motors', 'East Legon, Accra', '0244000111', 'sales@accraprime.com', 'Quality used and foreign-used cars.'),
('Kumasi Auto Hub', 'Adum, Kumasi', '0200222333', 'info@kumasiautohub.com', 'Trusted dealer in the Ashanti region.'),
('Takoradi Car Mart', 'Market Circle, Takoradi', '0555444666', 'hello@takoradicarmart.com', 'Affordable cars for every budget.');

INSERT INTO listings (dealer_id, title, make, model, year, price, mileage, fuel_type, transmission, location, description) VALUES
(1, 'Toyota Camry SE', 'Toyota', 'Camry', 2017, 98000, 82000, 'Petrol', 'Automatic', 'Accra', 'Clean title, accident free, first owner.'),
(1, 'Honda Accord Sport', 'Honda', 'Accord', 2016, 85000, 95000, 'Petrol', 'Automatic', 'Accra', 'Well maintained, cold AC.'),
(1, 'Mercedes-Benz C300', 'Mercedes-Benz', 'C300', 2018, 215000, 54000, 'Petrol', 'Automatic', 'Accra', 'Leather seats, panoramic roof.'),
(2, 'Toyota Corolla LE', 'Toyota', 'Corolla', 2015, 62000, 110000, 'Petrol', 'Automatic', 'Kumasi', 'Fuel efficient, perfect for the city.'),
(2, 'Hyundai Elantra', 'Hyundai', 'Elantra', 2017, 58000, 98000, 'Petrol', 'Automatic', 'Kumasi', 'Smooth drive, low running cost.'),
(2, 'Nissan Rogue SV', 'Nissan', 'Rogue', 2016, 92000, 88000, 'Petrol', 'Automatic', 'Kumasi', 'Spacious SUV, great for family.'),
(3, 'Toyota Hilux Double Cabin', 'Toyota', 'Hilux', 2019, 245000, 60000, 'Diesel', 'Manual', 'Takoradi', 'Strong 4x4 pickup, ready for work.'),
(3, 'Kia Sportage EX', 'Kia', 'Sportage', 2018, 105000, 72000, 'Petrol', 'Automatic', 'Takoradi', 'Reverse camera, alloy wheels.');

INSERT INTO listing_photos (listing_id, url, is_primary) VALUES
(1, 'https://placehold.co/800x500/16161a/d90429?text=Toyota+Camry', 1),
(2, 'https://placehold.co/800x500/16161a/d90429?text=Honda+Accord', 1),
(3, 'https://placehold.co/800x500/16161a/d90429?text=Mercedes+C300', 1),
(4, 'https://placehold.co/800x500/16161a/d90429?text=Toyota+Corolla', 1),
(5, 'https://placehold.co/800x500/16161a/d90429?text=Hyundai+Elantra', 1),
(6, 'https://placehold.co/800x500/16161a/d90429?text=Nissan+Rogue', 1),
(7, 'https://placehold.co/800x500/16161a/d90429?text=Toyota+Hilux', 1),
(8, 'https://placehold.co/800x500/16161a/d90429?text=Kia+Sportage', 1);

INSERT INTO listing_features (listing_id, feature) VALUES
(1,'Bluetooth'),(1,'Reverse camera'),(1,'Cruise control'),
(2,'Sunroof'),(2,'Leather seats'),
(3,'Panoramic roof'),(3,'Navigation'),(3,'Heated seats'),
(4,'Cold AC'),(4,'Alloy wheels'),
(5,'Bluetooth'),(5,'Keyless entry'),
(6,'Third row seating'),(6,'Reverse camera'),
(7,'4x4'),(7,'Tow bar'),(7,'Canopy'),
(8,'Alloy wheels'),(8,'Reverse camera');

INSERT INTO reviews (dealer_id, reviewer_name, rating, comment) VALUES
(1, 'Kwame A.', 5, 'Smooth process and the car was exactly as described.'),
(1, 'Efua M.', 4, 'Good prices and friendly staff.'),
(2, 'Yaw B.', 5, 'Honest dealer, would buy again.'),
(2, 'Abena K.', 4, 'Quick response and fair negotiation.'),
(3, 'Kofi S.', 4, 'Good cars for the price.');

INSERT INTO inquiries (listing_id, name, email, phone, message) VALUES
(1, 'Demo Buyer', 'buyer@example.com', '0240000000', 'Is the Camry still available?');