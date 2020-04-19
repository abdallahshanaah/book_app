DROP TABLE IF EXISTS books_info;
CREATE TABLE books_info (
    id SERIAL PRIMARY KEY,
    img_url TEXT,
    title TEXT,
    author TEXT,
    description TEXT,
    ISBN TEXT,
    bookshelf TEXT
);