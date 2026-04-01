-- =========================
-- USERS
-- =========================
INSERT INTO users (id, username, email, first_name, last_name, bio, status)
VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'max', 'max@example.com', 'Max', 'Dev', 'Backend + AI enthusiast', 'BUSY'),
    ('550e8400-e29b-41d4-a716-446655440002', 'anna', 'anna@example.com', 'Anna', 'Smith', 'Frontend developer', 'OFFLINE'),
    ('550e8400-e29b-41d4-a716-446655440003', 'mark', 'mark@example.com', 'Mark', 'Stone', 'Trader & analyst', 'OFFLINE'),
    ('550e8400-e29b-41d4-a716-446655440004', 'lisa', 'lisa@example.com', 'Lisa', 'Ray', 'Student in Galway', 'ONLINE'),
    ('550e8400-e29b-41d4-a716-446655440005', 'john', 'john@example.com', 'John', 'Doe', 'Fullstack engineer', 'AWAY'),
    ('550e8400-e29b-41d4-a716-446655440006', 'eva', 'eva@example.com', 'Eva', 'Green', 'UI/UX designer', 'INVISIBLE');

-- =========================
-- ROLES
-- =========================
INSERT INTO users_roles (user_id, role) VALUES
                                            ('550e8400-e29b-41d4-a716-446655440001','USER'),
                                            ('550e8400-e29b-41d4-a716-446655440002','USER'),
                                            ('550e8400-e29b-41d4-a716-446655440003','USER'),
                                            ('550e8400-e29b-41d4-a716-446655440004','USER'),
                                            ('550e8400-e29b-41d4-a716-446655440005','USER'),
                                            ('550e8400-e29b-41d4-a716-446655440006','USER');

-- =========================
-- FRIENDSHIPS (bidirectional)
-- =========================
INSERT INTO user_friends (user_id, friend_id) VALUES
                                                  ('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440002'),
                                                  ('550e8400-e29b-41d4-a716-446655440002','550e8400-e29b-41d4-a716-446655440001'),

                                                  ('550e8400-e29b-41d4-a716-446655440001','550e8400-e29b-41d4-a716-446655440003'),
                                                  ('550e8400-e29b-41d4-a716-446655440003','550e8400-e29b-41d4-a716-446655440001'),

                                                  ('550e8400-e29b-41d4-a716-446655440004','550e8400-e29b-41d4-a716-446655440006'),
                                                  ('550e8400-e29b-41d4-a716-446655440006','550e8400-e29b-41d4-a716-446655440004');

-- =========================
-- GROUPS
-- =========================
INSERT INTO groups (id, name, description, privacy, location, owner_id, rules, member_count, post_count)
VALUES
    (1, 'Java Backend', 'Spring Boot, microservices, Kafka', 'PUBLIC', 'Global',
     '550e8400-e29b-41d4-a716-446655440001', 'No spam. Share knowledge.', 3, 2),

    (2, 'Frontend UI', 'React, TS, design systems', 'PUBLIC', 'Global',
     '550e8400-e29b-41d4-a716-446655440002', 'Show code.', 3, 1),

    (3, 'Crypto Traders', 'Crypto analysis & trends', 'PUBLIC', 'Global',
     '550e8400-e29b-41d4-a716-446655440003', 'No scams.', 2, 1),

    (4, 'Galway Students', 'Housing & student life', 'PRIVATE', 'Galway',
     '550e8400-e29b-41d4-a716-446655440004', 'Students only.', 2, 1),

    (5, 'Startup Builders', 'MVPs, ideas, startups', 'PUBLIC', 'Global',
     '550e8400-e29b-41d4-a716-446655440005', 'Be constructive.', 3, 1);

-- =========================
-- GROUP MEMBERS
-- =========================
INSERT INTO group_members (group_id, user_id) VALUES
                                                  (1,'550e8400-e29b-41d4-a716-446655440001'),
                                                  (1,'550e8400-e29b-41d4-a716-446655440002'),
                                                  (1,'550e8400-e29b-41d4-a716-446655440005'),

                                                  (2,'550e8400-e29b-41d4-a716-446655440002'),
                                                  (2,'550e8400-e29b-41d4-a716-446655440001'),
                                                  (2,'550e8400-e29b-41d4-a716-446655440006'),

                                                  (3,'550e8400-e29b-41d4-a716-446655440003'),
                                                  (3,'550e8400-e29b-41d4-a716-446655440001'),

                                                  (4,'550e8400-e29b-41d4-a716-446655440004'),
                                                  (4,'550e8400-e29b-41d4-a716-446655440006'),

                                                  (5,'550e8400-e29b-41d4-a716-446655440005'),
                                                  (5,'550e8400-e29b-41d4-a716-446655440001'),
                                                  (5,'550e8400-e29b-41d4-a716-446655440002');

-- =========================
-- GROUP ADMINS
-- =========================
INSERT INTO group_admins (group_id, user_id) VALUES
                                                 (1,'550e8400-e29b-41d4-a716-446655440001'),
                                                 (2,'550e8400-e29b-41d4-a716-446655440002'),
                                                 (3,'550e8400-e29b-41d4-a716-446655440003'),
                                                 (4,'550e8400-e29b-41d4-a716-446655440004'),
                                                 (5,'550e8400-e29b-41d4-a716-446655440005');

-- =========================
-- POSTS
-- =========================
INSERT INTO posts (id, text, author_id, group_id, views, likes)
VALUES
    (1, 'How to structure Spring Boot microservices?', '550e8400-e29b-41d4-a716-446655440001', 1, 120, 15),
    (2, 'Kafka vs RabbitMQ?', '550e8400-e29b-41d4-a716-446655440005', 1, 80, 10),
    (3, 'Best React architecture?', '550e8400-e29b-41d4-a716-446655440002', 2, 95, 12),
    (4, 'BTC prediction next week', '550e8400-e29b-41d4-a716-446655440003', 3, 200, 25),
    (5, 'Looking for Galway roommates', '550e8400-e29b-41d4-a716-446655440004', 4, 60, 5),
    (6, 'Validating startup ideas', '550e8400-e29b-41d4-a716-446655440005', 5, 70, 9);

-- =========================
-- POSTS IMAGES
-- =========================
INSERT INTO posts_images (post_id, image) VALUES
                                              (1,'https://picsum.photos/300'),
                                              (3,'https://picsum.photos/301'),
                                              (4,'https://picsum.photos/302');

-- =========================
-- COMMENTS
-- =========================
INSERT INTO comments (id, post_id, author_id, content, likes, dislikes)
VALUES
    (1, 1, '550e8400-e29b-41d4-a716-446655440002', 'VERY COOL', 5, 0),
    (2, 1, '550e8400-e29b-41d4-a716-446655440003', 'I do not like it', 3, 1),
    (3, 2, '550e8400-e29b-41d4-a716-446655440001', 'Sounds good.', 10, 0),
    (4, 3, '550e8400-e29b-41d4-a716-446655440005', 'Seems to be interesting', 8, 0),
    (5, 4, '550e8400-e29b-41d4-a716-446655440001', '+rep', 2, 2),
    (6, 6, '550e8400-e29b-41d4-a716-446655440003', 'I am first.', 6, 0);

-- =========================
-- BOOKMARKS
-- =========================
INSERT INTO users_bookmarks (user_id, post_id)
VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 2),
    ('550e8400-e29b-41d4-a716-446655440001', 3),
    ('550e8400-e29b-41d4-a716-446655440002', 1),
    ('550e8400-e29b-41d4-a716-446655440003', 4),
    ('550e8400-e29b-41d4-a716-446655440005', 6);

-- Fix sequences after mock data
SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups));
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts));
SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments));
