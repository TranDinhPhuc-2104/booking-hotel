-- Demo data for booking_db. ADDITIVE and safe to re-run:
--   users/room types/rooms are skipped if they already exist (unique keys),
--   hotels are skipped by name, bookings are skipped if they would overlap an existing one.
-- Booking dates are relative to the day you run it.
-- All demo accounts use the password: password123
-- Usage: mysql -u root -p booking_db < database/seed.sql

START TRANSACTION;

-- ---------------------------------------------------------------- users
INSERT IGNORE INTO users (full_name, email, password_hash, phone, role) VALUES
  ('Hoang Anh Pham', 'anh.pham@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', '0903 112 233', 'MANAGER'),
  ('Thu Ha Le', 'ha.le@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', '0912 445 667', 'MANAGER'),
  ('Quang Vo', 'quang.vo@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', '0938 778 990', 'MANAGER'),
  ('An Do', 'an.do@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Bao Ngo', 'bao.ngo@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Chi Dang', 'chi.dang@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Duc Bui', 'duc.bui@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Giang Ho', 'giang.ho@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Hieu Phan', 'hieu.phan@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Khanh Vu', 'khanh.vu@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Lan Truong', 'lan.truong@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Mai Dinh', 'mai.dinh@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER'),
  ('Nam Ly', 'nam.ly@demo.vn', '$2b$10$wOkU4rSHVgTN08/ZbegcBuwHE6XoRDw.Xx/81bRrUfsgJAi4CN.N6', NULL, 'CUSTOMER');

-- ---------------------------------------------------------------- hotels, room types, rooms
-- Saigon Loft
INSERT INTO hotels (manager_id, name, address, city, phone, description, status)
SELECT u.id, 'Saigon Loft', '45 Dong Khoi, District 1', 'Ho Chi Minh City', '028 3822 4455', 'Industrial-style lofts above Dong Khoi street, a short walk from the Opera House and the riverfront.', 'ACTIVE' FROM users u
WHERE u.email = 'anh.pham@demo.vn' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Saigon Loft');
SET @h = (SELECT id FROM hotels WHERE name = 'Saigon Loft' ORDER BY id LIMIT 1);
INSERT IGNORE INTO room_types (hotel_id, name, description, price_per_night, capacity) VALUES
  (@h, 'Studio', 'Queen bed, rain shower, city view', 900000.00, 2),
  (@h, 'Loft', 'Mezzanine bedroom, kitchenette', 1350000.00, 3),
  (@h, 'Penthouse', 'Two bedrooms, private rooftop terrace', 2800000.00, 4);
INSERT IGNORE INTO rooms (hotel_id, room_number, room_type_id, floor, status) VALUES
  (@h, '101', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Studio'), 1, 'AVAILABLE'),
  (@h, '102', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Studio'), 1, 'AVAILABLE'),
  (@h, '103', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Studio'), 1, 'AVAILABLE'),
  (@h, '104', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Studio'), 1, 'AVAILABLE'),
  (@h, '201', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Loft'), 2, 'AVAILABLE'),
  (@h, '202', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Loft'), 2, 'AVAILABLE'),
  (@h, '203', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Loft'), 2, 'AVAILABLE'),
  (@h, '301', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Penthouse'), 3, 'AVAILABLE');

-- West Lake Residence
INSERT INTO hotels (manager_id, name, address, city, phone, description, status)
SELECT u.id, 'West Lake Residence', '51 Xuan Dieu, Tay Ho', 'Hanoi', '024 3718 6622', 'Calm serviced apartments on the shore of West Lake, with sunset views and a lakeside cafe.', 'ACTIVE' FROM users u
WHERE u.email = 'anh.pham@demo.vn' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'West Lake Residence');
SET @h = (SELECT id FROM hotels WHERE name = 'West Lake Residence' ORDER BY id LIMIT 1);
INSERT IGNORE INTO room_types (hotel_id, name, description, price_per_night, capacity) VALUES
  (@h, 'Lake View Double', 'King bed, balcony over the lake', 1100000.00, 2),
  (@h, 'One-Bedroom Apartment', 'Living room, full kitchen', 1650000.00, 3),
  (@h, 'Family Apartment', 'Two bedrooms, washing machine', 2300000.00, 5);
INSERT IGNORE INTO rooms (hotel_id, room_number, room_type_id, floor, status) VALUES
  (@h, '101', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Lake View Double'), 1, 'AVAILABLE'),
  (@h, '102', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Lake View Double'), 1, 'AVAILABLE'),
  (@h, '103', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Lake View Double'), 1, 'AVAILABLE'),
  (@h, '104', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Lake View Double'), 1, 'AVAILABLE'),
  (@h, '201', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'One-Bedroom Apartment'), 2, 'AVAILABLE'),
  (@h, '202', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'One-Bedroom Apartment'), 2, 'AVAILABLE'),
  (@h, '203', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'One-Bedroom Apartment'), 2, 'AVAILABLE'),
  (@h, '301', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Family Apartment'), 3, 'AVAILABLE'),
  (@h, '302', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Family Apartment'), 3, 'AVAILABLE');

-- Old Town Lantern Inn
INSERT INTO hotels (manager_id, name, address, city, phone, description, status)
SELECT u.id, 'Old Town Lantern Inn', '18 Nguyen Thai Hoc', 'Hoi An', '0235 386 1212', 'A restored merchant house in the Ancient Town. Lanterns, courtyard breakfast, and free bicycles.', 'ACTIVE' FROM users u
WHERE u.email = 'manager@demo.vn' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Old Town Lantern Inn');
SET @h = (SELECT id FROM hotels WHERE name = 'Old Town Lantern Inn' ORDER BY id LIMIT 1);
INSERT IGNORE INTO room_types (hotel_id, name, description, price_per_night, capacity) VALUES
  (@h, 'Garden Double', 'Overlooks the courtyard garden', 750000.00, 2),
  (@h, 'Heritage Room', 'Original timber beams, four-poster bed', 1050000.00, 2),
  (@h, 'River Suite', 'Thu Bon river view, soaking tub', 1700000.00, 3);
INSERT IGNORE INTO rooms (hotel_id, room_number, room_type_id, floor, status) VALUES
  (@h, '101', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Garden Double'), 1, 'AVAILABLE'),
  (@h, '102', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Garden Double'), 1, 'AVAILABLE'),
  (@h, '103', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Garden Double'), 1, 'AVAILABLE'),
  (@h, '201', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Heritage Room'), 2, 'AVAILABLE'),
  (@h, '202', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Heritage Room'), 2, 'AVAILABLE'),
  (@h, '203', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Heritage Room'), 2, 'AVAILABLE'),
  (@h, '301', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'River Suite'), 3, 'AVAILABLE'),
  (@h, '302', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'River Suite'), 3, 'AVAILABLE');

-- Pine Hill Retreat
INSERT INTO hotels (manager_id, name, address, city, phone, description, status)
SELECT u.id, 'Pine Hill Retreat', '9 Tran Hung Dao', 'Da Lat', '0263 382 7788', 'Wooden cottages among the pines, ten minutes from Xuan Huong Lake. Cool nights, fireplace evenings.', 'ACTIVE' FROM users u
WHERE u.email = 'ha.le@demo.vn' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Pine Hill Retreat');
SET @h = (SELECT id FROM hotels WHERE name = 'Pine Hill Retreat' ORDER BY id LIMIT 1);
INSERT IGNORE INTO room_types (hotel_id, name, description, price_per_night, capacity) VALUES
  (@h, 'Cottage', 'Fireplace, pine forest view', 850000.00, 2),
  (@h, 'Family Cottage', 'Two rooms, small garden', 1400000.00, 4),
  (@h, 'Treehouse', 'Raised deck among the pines', 1900000.00, 2);
INSERT IGNORE INTO rooms (hotel_id, room_number, room_type_id, floor, status) VALUES
  (@h, '101', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Cottage'), 1, 'AVAILABLE'),
  (@h, '102', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Cottage'), 1, 'AVAILABLE'),
  (@h, '103', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Cottage'), 1, 'AVAILABLE'),
  (@h, '104', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Cottage'), 1, 'AVAILABLE'),
  (@h, '201', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Family Cottage'), 2, 'AVAILABLE'),
  (@h, '202', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Family Cottage'), 2, 'AVAILABLE'),
  (@h, '203', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Family Cottage'), 2, 'AVAILABLE'),
  (@h, '301', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Treehouse'), 3, 'AVAILABLE');

-- Mist Valley Lodge
INSERT INTO hotels (manager_id, name, address, city, phone, description, status)
SELECT u.id, 'Mist Valley Lodge', '3 Fansipan Road', 'Sapa', '0214 387 1199', 'Stone lodge facing the Muong Hoa valley and its rice terraces. Trekking guides arranged on request.', 'ACTIVE' FROM users u
WHERE u.email = 'ha.le@demo.vn' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Mist Valley Lodge');
SET @h = (SELECT id FROM hotels WHERE name = 'Mist Valley Lodge' ORDER BY id LIMIT 1);
INSERT IGNORE INTO room_types (hotel_id, name, description, price_per_night, capacity) VALUES
  (@h, 'Valley Double', 'Floor-to-ceiling valley view', 800000.00, 2),
  (@h, 'Bunk Room', 'Two bunk beds, shared balcony', 450000.00, 4),
  (@h, 'Terrace Suite', 'Private terrace, wood-fired bath', 1600000.00, 3);
INSERT IGNORE INTO rooms (hotel_id, room_number, room_type_id, floor, status) VALUES
  (@h, '101', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Valley Double'), 1, 'AVAILABLE'),
  (@h, '102', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Valley Double'), 1, 'AVAILABLE'),
  (@h, '103', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Valley Double'), 1, 'AVAILABLE'),
  (@h, '104', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Valley Double'), 1, 'AVAILABLE'),
  (@h, '201', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Bunk Room'), 2, 'AVAILABLE'),
  (@h, '202', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Bunk Room'), 2, 'AVAILABLE'),
  (@h, '203', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Bunk Room'), 2, 'AVAILABLE'),
  (@h, '301', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Terrace Suite'), 3, 'AVAILABLE'),
  (@h, '302', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Terrace Suite'), 3, 'AVAILABLE');

-- Coral Bay Resort
INSERT INTO hotels (manager_id, name, address, city, phone, description, status)
SELECT u.id, 'Coral Bay Resort', '72 Tran Phu', 'Nha Trang', '0258 352 6644', 'Beachfront resort on Nha Trang bay with an infinity pool and island boat trips from the private pier.', 'ACTIVE' FROM users u
WHERE u.email = 'quang.vo@demo.vn' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Coral Bay Resort');
SET @h = (SELECT id FROM hotels WHERE name = 'Coral Bay Resort' ORDER BY id LIMIT 1);
INSERT IGNORE INTO room_types (hotel_id, name, description, price_per_night, capacity) VALUES
  (@h, 'Ocean Double', 'Sea view, balcony', 1250000.00, 2),
  (@h, 'Pool Access Room', 'Steps from the infinity pool', 1750000.00, 2),
  (@h, 'Beach Villa', 'Three bedrooms, private garden on the sand', 3500000.00, 6);
INSERT IGNORE INTO rooms (hotel_id, room_number, room_type_id, floor, status) VALUES
  (@h, '101', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Ocean Double'), 1, 'AVAILABLE'),
  (@h, '102', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Ocean Double'), 1, 'AVAILABLE'),
  (@h, '103', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Ocean Double'), 1, 'AVAILABLE'),
  (@h, '104', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Ocean Double'), 1, 'AVAILABLE'),
  (@h, '105', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Ocean Double'), 1, 'MAINTENANCE'),
  (@h, '201', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Pool Access Room'), 2, 'AVAILABLE'),
  (@h, '202', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Pool Access Room'), 2, 'AVAILABLE'),
  (@h, '203', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Pool Access Room'), 2, 'AVAILABLE'),
  (@h, '301', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Beach Villa'), 3, 'AVAILABLE'),
  (@h, '302', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Beach Villa'), 3, 'AVAILABLE');

-- Long Beach Hideaway
INSERT INTO hotels (manager_id, name, address, city, phone, description, status)
SELECT u.id, 'Long Beach Hideaway', '120 Tran Hung Dao', 'Phu Quoc', '0297 398 5577', 'Thatched bungalows on Long Beach, famous for its sunsets. Snorkelling gear and kayaks included.', 'ACTIVE' FROM users u
WHERE u.email = 'quang.vo@demo.vn' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Long Beach Hideaway');
SET @h = (SELECT id FROM hotels WHERE name = 'Long Beach Hideaway' ORDER BY id LIMIT 1);
INSERT IGNORE INTO room_types (hotel_id, name, description, price_per_night, capacity) VALUES
  (@h, 'Garden Bungalow', 'Tropical garden, outdoor shower', 1150000.00, 2),
  (@h, 'Beachfront Bungalow', 'Directly on the sand', 1950000.00, 3);
INSERT IGNORE INTO rooms (hotel_id, room_number, room_type_id, floor, status) VALUES
  (@h, '101', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Garden Bungalow'), 1, 'AVAILABLE'),
  (@h, '102', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Garden Bungalow'), 1, 'AVAILABLE'),
  (@h, '103', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Garden Bungalow'), 1, 'AVAILABLE'),
  (@h, '104', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Garden Bungalow'), 1, 'AVAILABLE'),
  (@h, '201', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Beachfront Bungalow'), 2, 'AVAILABLE'),
  (@h, '202', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Beachfront Bungalow'), 2, 'AVAILABLE'),
  (@h, '203', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Beachfront Bungalow'), 2, 'AVAILABLE');

-- Mekong Garden Homestay
INSERT INTO hotels (manager_id, name, address, city, phone, description, status)
SELECT u.id, 'Mekong Garden Homestay', '7 Ninh Kieu', 'Can Tho', '0292 381 3344', 'Family-run homestay among fruit orchards near the Cai Rang floating market. Closed for renovation.', 'INACTIVE' FROM users u
WHERE u.email = 'manager@demo.vn' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.name = 'Mekong Garden Homestay');
SET @h = (SELECT id FROM hotels WHERE name = 'Mekong Garden Homestay' ORDER BY id LIMIT 1);
INSERT IGNORE INTO room_types (hotel_id, name, description, price_per_night, capacity) VALUES
  (@h, 'Orchard Room', 'Fan, mosquito net, garden view', 550000.00, 2),
  (@h, 'Family Room', 'Two double beds', 850000.00, 4);
INSERT IGNORE INTO rooms (hotel_id, room_number, room_type_id, floor, status) VALUES
  (@h, '101', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Orchard Room'), 1, 'AVAILABLE'),
  (@h, '102', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Orchard Room'), 1, 'AVAILABLE'),
  (@h, '103', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Orchard Room'), 1, 'AVAILABLE'),
  (@h, '201', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Family Room'), 2, 'AVAILABLE'),
  (@h, '202', (SELECT id FROM room_types WHERE hotel_id = @h AND name = 'Family Room'), 2, 'AVAILABLE');

-- ---------------------------------------------------------------- bookings
CREATE TEMPORARY TABLE seed_bookings (email VARCHAR(150), hotel VARCHAR(150), room VARCHAR(10),
  start_offset INT, end_offset INT, guests INT, status VARCHAR(20), note VARCHAR(500), created_offset INT)
  DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
INSERT INTO seed_bookings VALUES
  ('duc.bui@demo.vn', 'West Lake Residence', '203', -87, -84, 1, 'COMPLETED', NULL, -113),
  ('bao.ngo@demo.vn', 'West Lake Residence', '202', -4, 1, 3, 'COMPLETED', 'Airport pickup please', -17),
  ('duc.bui@demo.vn', 'Saigon Loft', '201', -87, -86, 1, 'COMPLETED', 'Vegetarian breakfast', -115),
  ('mai.dinh@demo.vn', 'Saigon Loft', '104', -19, -17, 2, 'COMPLETED', 'Late arrival around 22:00', -35),
  ('an.do@demo.vn', 'Long Beach Hideaway', '202', -15, -12, 1, 'COMPLETED', 'Airport pickup please', -43),
  ('duc.bui@demo.vn', 'Coral Bay Resort', '102', -55, -53, 2, 'COMPLETED', NULL, -79),
  ('hieu.phan@demo.vn', 'West Lake Residence', '104', -42, -41, 2, 'COMPLETED', NULL, -72),
  ('mai.dinh@demo.vn', 'Mist Valley Lodge', '101', -85, -81, 1, 'COMPLETED', 'Airport pickup please', -111),
  ('nam.ly@demo.vn', 'West Lake Residence', '103', -20, -17, 2, 'COMPLETED', NULL, -48),
  ('duc.bui@demo.vn', 'Old Town Lantern Inn', '302', -82, -81, 2, 'COMPLETED', NULL, -92),
  ('giang.ho@demo.vn', 'Pine Hill Retreat', '201', -78, -74, 4, 'COMPLETED', 'Need a baby cot', -89),
  ('duc.bui@demo.vn', 'Old Town Lantern Inn', '201', -43, -40, 2, 'COMPLETED', NULL, -51),
  ('chi.dang@demo.vn', 'Old Town Lantern Inn', '202', -22, -20, 2, 'COMPLETED', 'Airport pickup please', -50),
  ('duc.bui@demo.vn', 'Mist Valley Lodge', '102', -9, -4, 2, 'COMPLETED', NULL, -34),
  ('khanh.vu@demo.vn', 'Pine Hill Retreat', '201', -86, -83, 3, 'COMPLETED', NULL, -92),
  ('duc.bui@demo.vn', 'Pine Hill Retreat', '103', -18, -15, 2, 'COMPLETED', 'Airport pickup please', -33),
  ('chi.dang@demo.vn', 'Long Beach Hideaway', '203', -72, -69, 1, 'COMPLETED', 'Vegetarian breakfast', -102),
  ('nam.ly@demo.vn', 'Mist Valley Lodge', '101', -16, -12, 2, 'COMPLETED', 'Need a baby cot', -20),
  ('lan.truong@demo.vn', 'Pine Hill Retreat', '104', -73, -68, 1, 'COMPLETED', NULL, -103),
  ('khanh.vu@demo.vn', 'West Lake Residence', '203', -71, -69, 3, 'COMPLETED', NULL, -89),
  ('lan.truong@demo.vn', 'Coral Bay Resort', '203', -42, -37, 2, 'COMPLETED', 'Vegetarian breakfast', -52),
  ('giang.ho@demo.vn', 'Saigon Loft', '102', -76, -71, 2, 'COMPLETED', NULL, -85),
  ('lan.truong@demo.vn', 'Mist Valley Lodge', '201', -1, 2, 1, 'CONFIRMED', 'Celebrating an anniversary', -30),
  ('giang.ho@demo.vn', 'Old Town Lantern Inn', '203', 0, 2, 1, 'CONFIRMED', NULL, -17),
  ('nam.ly@demo.vn', 'Coral Bay Resort', '201', -2, 0, 2, 'CONFIRMED', 'Quiet room if possible', -16),
  ('giang.ho@demo.vn', 'Saigon Loft', '103', -2, 2, 1, 'CONFIRMED', NULL, -14),
  ('bao.ngo@demo.vn', 'Pine Hill Retreat', '202', 0, 2, 4, 'CONFIRMED', NULL, -29),
  ('lan.truong@demo.vn', 'West Lake Residence', '302', 9, 15, 5, 'CONFIRMED', NULL, -28),
  ('khanh.vu@demo.vn', 'Mist Valley Lodge', '101', 34, 39, 1, 'CONFIRMED', 'Vegetarian breakfast', -30),
  ('hieu.phan@demo.vn', 'Pine Hill Retreat', '101', 20, 24, 2, 'CONFIRMED', 'Vegetarian breakfast', -10),
  ('duc.bui@demo.vn', 'Long Beach Hideaway', '202', 8, 10, 1, 'CONFIRMED', 'Need a baby cot', -10),
  ('duc.bui@demo.vn', 'Saigon Loft', '103', 38, 43, 1, 'CONFIRMED', NULL, -3),
  ('duc.bui@demo.vn', 'West Lake Residence', '102', 41, 42, 1, 'CONFIRMED', NULL, -24),
  ('duc.bui@demo.vn', 'Coral Bay Resort', '101', 5, 10, 2, 'CONFIRMED', 'Quiet room if possible', -9),
  ('nam.ly@demo.vn', 'Pine Hill Retreat', '103', 35, 37, 2, 'CONFIRMED', 'Late arrival around 22:00', -15),
  ('bao.ngo@demo.vn', 'Long Beach Hideaway', '101', 13, 14, 2, 'CONFIRMED', 'Need a baby cot', -13),
  ('an.do@demo.vn', 'Long Beach Hideaway', '103', 27, 31, 1, 'CONFIRMED', NULL, -11),
  ('duc.bui@demo.vn', 'Coral Bay Resort', '302', 22, 23, 2, 'CONFIRMED', 'Late arrival around 22:00', -30),
  ('duc.bui@demo.vn', 'Old Town Lantern Inn', '301', 18, 22, 1, 'CONFIRMED', 'Quiet room if possible', -5),
  ('mai.dinh@demo.vn', 'West Lake Residence', '201', 4, 10, 1, 'CONFIRMED', NULL, -27),
  ('lan.truong@demo.vn', 'Pine Hill Retreat', '202', 11, 15, 4, 'CONFIRMED', 'Late arrival around 22:00', -11),
  ('chi.dang@demo.vn', 'Coral Bay Resort', '302', 59, 60, 4, 'PENDING', NULL, -14),
  ('giang.ho@demo.vn', 'Coral Bay Resort', '203', 18, 22, 2, 'PENDING', 'Vegetarian breakfast', -23),
  ('duc.bui@demo.vn', 'Old Town Lantern Inn', '103', 14, 17, 1, 'PENDING', NULL, -19),
  ('an.do@demo.vn', 'Saigon Loft', '301', 49, 52, 1, 'PENDING', NULL, -15),
  ('bao.ngo@demo.vn', 'Old Town Lantern Inn', '201', 5, 10, 1, 'PENDING', NULL, -24),
  ('khanh.vu@demo.vn', 'West Lake Residence', '101', 45, 47, 1, 'PENDING', NULL, -29),
  ('an.do@demo.vn', 'Pine Hill Retreat', '203', 39, 44, 1, 'PENDING', 'Airport pickup please', -20),
  ('hieu.phan@demo.vn', 'Mist Valley Lodge', '301', 18, 20, 1, 'PENDING', 'Celebrating an anniversary', -13),
  ('lan.truong@demo.vn', 'Coral Bay Resort', '301', 10, 13, 3, 'PENDING', NULL, -3),
  ('nam.ly@demo.vn', 'Saigon Loft', '102', 31, 36, 1, 'PENDING', NULL, -6),
  ('duc.bui@demo.vn', 'West Lake Residence', '302', 24, 25, 3, 'PENDING', 'Celebrating an anniversary', -11),
  ('giang.ho@demo.vn', 'Old Town Lantern Inn', '201', 30, 35, 1, 'PENDING', 'Vegetarian breakfast', -8),
  ('chi.dang@demo.vn', 'Mist Valley Lodge', '202', 44, 45, 3, 'PENDING', NULL, -21),
  ('chi.dang@demo.vn', 'West Lake Residence', '202', 49, 54, 2, 'PENDING', 'Celebrating an anniversary', -11),
  ('giang.ho@demo.vn', 'Pine Hill Retreat', '102', 3, 5, 2, 'CANCELLED', 'Celebrating an anniversary', -4),
  ('giang.ho@demo.vn', 'Saigon Loft', '203', -29, -25, 1, 'CANCELLED', NULL, -35),
  ('chi.dang@demo.vn', 'Coral Bay Resort', '101', -24, -21, 2, 'CANCELLED', 'Vegetarian breakfast', -46),
  ('bao.ngo@demo.vn', 'Long Beach Hideaway', '103', 31, 32, 1, 'CANCELLED', NULL, -16),
  ('khanh.vu@demo.vn', 'Saigon Loft', '201', 7, 9, 1, 'CANCELLED', NULL, -14),
  ('hieu.phan@demo.vn', 'Mist Valley Lodge', '203', 6, 7, 2, 'CANCELLED', 'Late arrival around 22:00', -26),
  ('nam.ly@demo.vn', 'West Lake Residence', '202', 5, 9, 3, 'CANCELLED', NULL, -28),
  ('khanh.vu@demo.vn', 'Pine Hill Retreat', '202', -20, -18, 1, 'CANCELLED', NULL, -33);

INSERT INTO bookings (user_id, room_id, check_in, check_out, guests, total_price, status, note, created_at)
SELECT u.id, r.id,
       DATE_ADD(CURDATE(), INTERVAL s.start_offset DAY), DATE_ADD(CURDATE(), INTERVAL s.end_offset DAY),
       s.guests, (s.end_offset - s.start_offset) * t.price_per_night, s.status, s.note,
       DATE_ADD(NOW(), INTERVAL s.created_offset DAY)
FROM seed_bookings s
JOIN users u ON u.email = s.email
JOIN hotels h ON h.id = (SELECT MIN(id) FROM hotels WHERE name = s.hotel)
JOIN rooms r ON r.hotel_id = h.id AND r.room_number = s.room
JOIN room_types t ON t.id = r.room_type_id
WHERE NOT EXISTS (  -- never double-book: skip if it overlaps a non-cancelled booking already there
        SELECT 1 FROM bookings b WHERE b.room_id = r.id AND b.status <> 'CANCELLED'
          AND b.check_in < DATE_ADD(CURDATE(), INTERVAL s.end_offset DAY)
          AND b.check_out > DATE_ADD(CURDATE(), INTERVAL s.start_offset DAY))
  AND NOT EXISTS (  -- and do not repeat the same booking on a re-run
        SELECT 1 FROM bookings b WHERE b.room_id = r.id AND b.user_id = u.id
          AND b.check_in = DATE_ADD(CURDATE(), INTERVAL s.start_offset DAY));

DROP TEMPORARY TABLE seed_bookings;

COMMIT;
