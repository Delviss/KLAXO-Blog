'use strict';

/**
 * Initial schema for the Klaxo Blog backend.
 *
 * Tables:
 *   - session          (connect-pg-simple store; created here so it is indexed)
 *   - admin_users      (#16 auth)
 *   - categories       (#17 optional category badge list)
 *   - articles         (#17 content model — source of truth for the pipeline)
 *   - analytics_events (#20 first-party analytics)
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true }); // gen_random_uuid()
  pgm.createExtension('citext', { ifNotExists: true }); // case-insensitive email

  // ---- session store (connect-pg-simple default schema) -------------------
  pgm.createTable('session', {
    sid: { type: 'varchar', notNull: true, primaryKey: true },
    sess: { type: 'json', notNull: true },
    expire: { type: 'timestamptz', notNull: true },
  });
  pgm.createIndex('session', 'expire', { name: 'IDX_session_expire' });

  // ---- admin_users (#16) --------------------------------------------------
  pgm.createTable('admin_users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'citext', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    role: { type: 'text', notNull: true, default: 'admin' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    last_login_at: { type: 'timestamptz' },
  });

  // ---- categories (#17, optional) -----------------------------------------
  pgm.createTable('categories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    slug: { type: 'text', notNull: true, unique: true },
    name: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // ---- articles (#17) -----------------------------------------------------
  pgm.createTable('articles', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    slug: { type: 'text', notNull: true, unique: true },
    title: { type: 'text', notNull: true },
    excerpt: { type: 'text', notNull: true, default: '' },
    category: { type: 'text', notNull: true, default: 'Field Notes' },
    hero_image_url: { type: 'text', notNull: true, default: '' },
    hero_image_alt: { type: 'text', notNull: true, default: '' },
    body_html: { type: 'text', notNull: true, default: '' },
    body_json: { type: 'jsonb' },
    author_name: { type: 'text', notNull: true, default: 'Daniel (Klaxo Team)' },
    read_time_minutes: { type: 'integer', notNull: true, default: 5 },
    status: { type: 'text', notNull: true, default: 'draft' },
    seo_title: { type: 'text' },
    seo_description: { type: 'text' },
    publish_state: { type: 'text', notNull: true, default: 'idle' }, // idle|publishing|published|publish_failed
    publish_error: { type: 'text' },
    last_commit_sha: { type: 'text' },
    published_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('articles', 'articles_status_check', {
    check: "status IN ('draft', 'published')",
  });
  pgm.createIndex('articles', 'status');
  pgm.createIndex('articles', 'published_at');

  // ---- analytics_events (#20) ---------------------------------------------
  pgm.createTable('analytics_events', {
    id: { type: 'bigserial', primaryKey: true },
    event_type: { type: 'text', notNull: true, default: 'pageview' }, // pageview|click|custom
    path: { type: 'text', notNull: true, default: '/' },
    article_slug: { type: 'text' },
    referrer: { type: 'text' },
    utm_source: { type: 'text' },
    utm_medium: { type: 'text' },
    utm_campaign: { type: 'text' },
    visitor_hash: { type: 'text' },
    session_id: { type: 'text' },
    device: { type: 'text' },
    browser: { type: 'text' },
    os: { type: 'text' },
    country: { type: 'text' },
    meta: { type: 'jsonb' }, // event-specific payload (e.g. click target/label)
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('analytics_events', 'created_at');
  pgm.createIndex('analytics_events', 'event_type');
  pgm.createIndex('analytics_events', 'article_slug');
  pgm.createIndex('analytics_events', ['event_type', 'created_at']);

  // updated_at trigger for articles
  pgm.createFunction(
    'set_updated_at',
    [],
    { returns: 'trigger', language: 'plpgsql', replace: true },
    `BEGIN NEW.updated_at = now(); RETURN NEW; END;`
  );
  pgm.createTrigger('articles', 'trg_articles_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'set_updated_at',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('analytics_events');
  pgm.dropTrigger('articles', 'trg_articles_updated_at');
  pgm.dropTable('articles');
  pgm.dropFunction('set_updated_at', []);
  pgm.dropTable('categories');
  pgm.dropTable('admin_users');
  pgm.dropTable('session');
};
