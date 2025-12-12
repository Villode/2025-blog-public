-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,           -- URL 友好的标识符
    title TEXT NOT NULL,                  -- 文章标题
    summary TEXT,                         -- 文章摘要
    author TEXT DEFAULT 'Villode',        -- 作者
    tags TEXT,                            -- 标签（JSON 数组）
    cover_key TEXT,                       -- R2 封面图 key
    content_key TEXT NOT NULL,            -- R2 正文 key
    status TEXT DEFAULT 'draft',          -- draft | published
    views INTEGER DEFAULT 0,              -- 浏览数
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT                     -- 发布时间
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
