import Database from 'better-sqlite3';
import { join } from 'path';

const db = new Database(join(process.cwd(), 'database.db'));
db.pragma('journal_mode = WAL');
db.pragma('synchronous = normal');

try {
    db.prepare("ALTER TABLE users ADD COLUMN last_crime TEXT DEFAULT '1970-01-01T00:00:00.000Z'").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE users ADD COLUMN last_work TEXT DEFAULT '1970-01-01T00:00:00.000Z'").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE users ADD COLUMN last_slut TEXT DEFAULT '1970-01-01T00:00:00.000Z'").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE users ADD COLUMN last_flip TEXT DEFAULT '1970-01-01T00:00:00.000Z'").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE users ADD COLUMN last_rob TEXT DEFAULT '1970-01-01T00:00:00.000Z'").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE users ADD COLUMN last_rw TEXT DEFAULT '1970-01-01T00:00:00.000Z'").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE users ADD COLUMN last_claim_pj TEXT DEFAULT '1970-01-01T00:00:00.000Z'").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE chats ADD COLUMN warn INTEGER DEFAULT 0").run();
} catch (e) {}
try {
    db.prepare("ALTER TABLE users ADD COLUMN birthday TEXT DEFAULT NULL").run();
} catch (e) {}

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        jid TEXT PRIMARY KEY,
        wallet INTEGER DEFAULT 0,
        bank INTEGER DEFAULT 0,
        genre TEXT DEFAULT 'No definido',
        marry TEXT DEFAULT NULL,
        birthday TEXT DEFAULT NULL,
        last_claim TEXT DEFAULT '1970-01-01T00:00:00.000Z',
        last_crime TEXT DEFAULT '1970-01-01T00:00:00.000Z',
        last_work TEXT DEFAULT '1970-01-01T00:00:00.000Z',
        last_slut TEXT DEFAULT '1970-01-01T00:00:00.000Z',
        last_flip TEXT DEFAULT '1970-01-01T00:00:00.000Z',
        last_rob TEXT DEFAULT '1970-01-01T00:00:00.000Z',
        last_rw TEXT DEFAULT '1970-01-01T00:00:00.000Z',
        last_claim_pj TEXT DEFAULT '1970-01-01T00:00:00.000Z'
    );
    CREATE TABLE IF NOT EXISTS chats (
        jid TEXT PRIMARY KEY,
        welcome INTEGER DEFAULT 0,
        antilink INTEGER DEFAULT 0,
        detect INTEGER DEFAULT 0,
        warn INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS warnings (
        group_jid TEXT,
        user_jid TEXT,
        count INTEGER DEFAULT 0,
        PRIMARY KEY (group_jid, user_jid)
    );
    CREATE TABLE IF NOT EXISTS gacha_ownership (
        group_jid TEXT,
        user_jid TEXT,
        character_id TEXT,
        status TEXT DEFAULT 'domado',
        PRIMARY KEY (group_jid, character_id)
    );
    CREATE TABLE IF NOT EXISTS gacha_shop (
        group_jid TEXT,
        seller_jid TEXT,
        character_id TEXT,
        character_name TEXT,
        sale_price INTEGER,
        listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_jid, character_id)
    );
    CREATE TABLE IF NOT EXISTS rpg (
        group_jid TEXT,
        user_jid TEXT,
        rank TEXT DEFAULT 'Novato de las Cuevas',
        diamantes INTEGER DEFAULT 0,
        rubies INTEGER DEFAULT 0,
        oro INTEGER DEFAULT 0,
        esmeraldas INTEGER DEFAULT 0,
        zafiros INTEGER DEFAULT 0,
        amatistas INTEGER DEFAULT 0,
        perlas INTEGER DEFAULT 0,
        PRIMARY KEY (group_jid, user_jid)
    );
`);

const normalizeJid = (j) => j ? j.split('@')[0].split(':')[0].trim() + '@s.whatsapp.net' : null;

export const database = {
    getUser: async (j) => {
        const c = normalizeJid(j);
        return db.prepare('SELECT * FROM users WHERE jid = ?').get(c) || null;
    },
    saveUser: async (j, d) => {
        const c = normalizeJid(j);
        const { 
            wallet = 0, 
            bank = 0, 
            genre = 'No definido', 
            marry = null, 
            birthday = null,
            last_claim = '1970-01-01T00:00:00.000Z',
            last_crime = '1970-01-01T00:00:00.000Z',
            last_work = '1970-01-01T00:00:00.000Z',
            last_slut = '1970-01-01T00:00:00.000Z',
            last_flip = '1970-01-01T00:00:00.000Z',
            last_rob = '1970-01-01T00:00:00.000Z',
            last_rw = '1970-01-01T00:00:00.000Z',
            last_claim_pj = '1970-01-01T00:00:00.000Z'
        } = d;
        db.prepare(`
            INSERT INTO users (jid, wallet, bank, genre, marry, birthday, last_claim, last_crime, last_work, last_slut, last_flip, last_rob, last_rw, last_claim_pj)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(jid) DO UPDATE SET
            wallet = excluded.wallet, bank = excluded.bank, genre = excluded.genre,
            marry = excluded.marry, birthday = excluded.birthday, last_claim = excluded.last_claim, last_crime = excluded.last_crime,
            last_work = excluded.last_work, last_slut = excluded.last_slut, last_flip = excluded.last_flip,
            last_rob = excluded.last_rob, last_rw = excluded.last_rw, last_claim_pj = excluded.last_claim_pj
        `).run(c, wallet, bank, genre, marry, birthday, last_claim, last_crime, last_work, last_slut, last_flip, last_rob, last_rw, last_claim_pj);
    },
    getChat: async (j) => {
        return db.prepare('SELECT * FROM chats WHERE jid = ?').get(j) || null;
    },
    saveChat: async (j, d) => {
        const welcome = d.welcome || 0;
        const antilink = d.antilink || 0;
        const detect = d.detect || 0;
        const warn = d.warn || 0;
        db.prepare(`
            INSERT INTO chats (jid, welcome, antilink, detect, warn)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(jid) DO UPDATE SET
            welcome = excluded.welcome, antilink = excluded.antilink, detect = excluded.detect, warn = excluded.warn
        `).run(j, welcome, antilink, detect, warn);
    },
    getHarem: async (g, u) => {
        const c = normalizeJid(u);
        return db.prepare('SELECT character_id FROM gacha_ownership WHERE group_jid = ? AND user_jid = ?').all(g, c);
    },
    claimCharacter: async (g, u, i) => {
        const c = normalizeJid(u);
        db.prepare(`
            INSERT INTO gacha_ownership (group_jid, user_jid, character_id, status)
            VALUES (?, ?, ?, 'domado')
            ON CONFLICT(group_jid, character_id) DO UPDATE SET user_jid = excluded.user_jid, status = 'domado'
        `).run(g, c, i);
    },
    getCharacterOwner: async (g, i) => {
        return db.prepare('SELECT user_jid, status FROM gacha_ownership WHERE group_jid = ? AND character_id = ?').get(g, i) || null;
    },
    listShop: async (g) => {
        return db.prepare('SELECT * FROM gacha_shop WHERE group_jid = ? ORDER BY listed_at DESC').all(g);
    },
    listCharacter: async (g, s, i, n, p) => {
        const c = normalizeJid(s);
        const t = db.transaction(() => {
            db.prepare(`
                INSERT INTO gacha_shop (group_jid, seller_jid, character_id, character_name, sale_price) 
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(group_jid, character_id) DO UPDATE SET 
                seller_jid = excluded.seller_jid, character_name = excluded.character_name, sale_price = excluded.sale_price, listed_at = CURRENT_TIMESTAMP
            `).run(g, c, i, n, p);
            db.prepare("UPDATE gacha_ownership SET status = 'en_venta' WHERE group_jid = ? AND character_id = ?").run(g, i);
        });
        t();
    },
    buyCharacter: async (g, b, i, p) => {
        const c = normalizeJid(b);
        const s = db.prepare('SELECT seller_jid FROM gacha_shop WHERE group_jid = ? AND character_id = ?').get(g, i);
        if (!s) throw new Error('404');
        const t = db.transaction(() => {
            db.prepare('UPDATE users SET wallet = wallet - ? WHERE jid = ?').run(p, c);
            db.prepare('UPDATE users SET wallet = wallet + ? WHERE jid = ?').run(p, s.seller_jid);
            db.prepare("UPDATE gacha_ownership SET user_jid = ?, status = 'domado' WHERE group_jid = ? AND character_id = ?").run(c, g, i);
            db.prepare('DELETE FROM gacha_shop WHERE group_jid = ? AND character_id = ?').run(g, i);
        });
        t();
        return s.seller_jid;
    }
};

export const query = async (t, p = []) => {
    const cleanQuery = t.trim().toLowerCase();
    if (cleanQuery.startsWith('select')) {
        return { rows: db.prepare(t).all(...p) };
    } else {
        const res = db.prepare(t).run(...p);
        return { rows: [], ...res };
    }
};