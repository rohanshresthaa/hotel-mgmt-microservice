INSERT INTO hotels(name, location)
VALUES
('Hotel Everest', 'Kathmandu'),
('Hotel Annapurna', 'Pokhara');

-- rooms for hotel 1
INSERT INTO rooms(hotel_id, room_number, price)
SELECT
    (SELECT id FROM hotels LIMIT 1),
    generate_series(101,105),
    1000;

-- rooms for hotel 2
INSERT INTO rooms(hotel_id, room_number, price)
SELECT
    (SELECT id FROM hotels OFFSET 1 LIMIT 1),
    generate_series(201,205),
    1500;