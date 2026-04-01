CREATE TABLE IF NOT EXISTS users
(
    id                  VARCHAR(36) PRIMARY KEY,
    username            VARCHAR(50) NOT NULL UNIQUE,
    email               VARCHAR(255) UNIQUE,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    bio                 TEXT,
    profile_picture_url VARCHAR(500),
    status              VARCHAR(50),
    phone_number        VARCHAR(30),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_profile_private  BOOLEAN   DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS groups
(
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    description  VARCHAR(500),
    privacy      VARCHAR(50),
    avatar_image VARCHAR(500),
    cover_image  VARCHAR(500),
    location     VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner_id     VARCHAR(36),
    rules        VARCHAR(1000),
    member_count INT       DEFAULT 0,
    post_count   INT       DEFAULT 0,
    CONSTRAINT fk_groups_users FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts
(
    id         BIGSERIAL PRIMARY KEY,
    text       VARCHAR(2000),
    views      BIGINT    DEFAULT 0,
    likes      BIGINT    DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author_id  VARCHAR(36),
    group_id   BIGINT,
    CONSTRAINT fk_posts_users FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_posts_groups FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
);


-- element collection
CREATE TABLE IF NOT EXISTS posts_images
(
    post_id BIGINT       NOT NULL,
    image   VARCHAR(500) NOT NULL,
    PRIMARY KEY (post_id, image),
    CONSTRAINT fk_posts_images_posts FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE ON UPDATE NO ACTION
);


--manytomany
CREATE TABLE IF NOT EXISTS group_members
(
    group_id BIGINT      NOT NULL,
    user_id  VARCHAR(36) NOT NULL,
    PRIMARY KEY (group_id, user_id),
    CONSTRAINT fk_group_members_groups FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

--manytomany
CREATE TABLE IF NOT EXISTS group_admins
(
    group_id BIGINT      NOT NULL,
    user_id  VARCHAR(36) NOT NULL,
    PRIMARY KEY (group_id, user_id),
    CONSTRAINT fk_group_members_groups FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_members_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

--manytomany
CREATE TABLE IF NOT EXISTS user_friends
(
    user_id   VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    friend_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, friend_id),
    CONSTRAINT user_not_self CHECK (user_id <> friend_id)
);

CREATE TABLE IF NOT EXISTS users_roles
(
    user_id VARCHAR(36)  NOT NULL,
    role    VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT fk_users_roles_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE conversations
(
    id         VARCHAR(36) PRIMARY KEY,
    is_group   BOOLEAN,
    title      VARCHAR(255),
    created_at TIMESTAMP,
    deleted    BOOLEAN DEFAULT FALSE
);

CREATE TABLE conversation_members
(
    conversation_id VARCHAR(36),
    user_id         VARCHAR(36),
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages
(
    id              VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36),
    sender_id       VARCHAR(36),
    content         TEXT,
    status          VARCHAR(20),
    deleted         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP,
    CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES conversations (id),
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users (id)
);

CREATE TABLE message_attachments
(
    id           VARCHAR(36) PRIMARY KEY,
    message_id   VARCHAR(36),
    file_url     TEXT,
    file_name    VARCHAR(255),
    content_type VARCHAR(100),
    file_size    BIGINT,
    CONSTRAINT fk_att_msg FOREIGN KEY (message_id) REFERENCES messages (id)
);

CREATE TABLE IF NOT EXISTS users_bookmarks
(
    user_id VARCHAR(36) NOT NULL,
    post_id BIGINT      NOT NULL,
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_users_bookmarks_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_users_bookmarks_posts FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users_likedposts
(
    user_id VARCHAR(36) NOT NULL,
    post_id BIGINT      NOT NULL,
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_users_likedposts_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_users_likedposts_posts FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments
(
    id         BIGSERIAL PRIMARY KEY,
    post_id    BIGINT       NOT NULL,
    author_id  VARCHAR(36)  NOT NULL,
    content    VARCHAR(1000) NOT NULL,
    likes      BIGINT    DEFAULT 0,
    dislikes   BIGINT    DEFAULT 0,
    is_edited  BOOLEAN   DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_posts FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_users FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comment_likes
(
    comment_id BIGINT      NOT NULL,
    user_id    VARCHAR(36) NOT NULL,
    is_like    BOOLEAN     NOT NULL, -- TRUE for like, FALSE for dislike
    PRIMARY KEY (comment_id, user_id),
    CONSTRAINT fk_comment_likes_comments FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_likes_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS notifications
(
    id           BIGSERIAL PRIMARY KEY,
    recipient_id VARCHAR(36)  NOT NULL,
    sender_id    VARCHAR(36),
    type         VARCHAR(255) NOT NULL,
    status       VARCHAR(255) NOT NULL,
    reference_id VARCHAR(36),
    created_at   TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL
    );