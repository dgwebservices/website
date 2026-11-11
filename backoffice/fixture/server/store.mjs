import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex');
export const canonical = value => value === undefined ? 'null' : value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;

export function createStore(path = ':memory:') {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  if (path !== ':memory:') chmodSync(path, 0o600);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS fixture_state (
      workspace_id TEXT NOT NULL, principal_id TEXT NOT NULL, key TEXT NOT NULL,
      value TEXT NOT NULL CHECK(json_valid(value)), revision INTEGER NOT NULL CHECK(revision > 0), updated_at TEXT NOT NULL,
      PRIMARY KEY(workspace_id, principal_id, key)
    );
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, kind TEXT NOT NULL, name TEXT NOT NULL,
      data TEXT NOT NULL CHECK(json_valid(data)), revision INTEGER NOT NULL CHECK(revision > 0), updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS integrations_scope ON integrations(workspace_id, updated_at, id);
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, integration_id TEXT NOT NULL REFERENCES integrations(id),
      action TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)), created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS jobs_scope ON jobs(workspace_id, created_at, id);
    CREATE TRIGGER IF NOT EXISTS jobs_scope_insert BEFORE INSERT ON jobs
      WHEN NOT EXISTS(SELECT 1 FROM integrations WHERE id=NEW.integration_id AND workspace_id=NEW.workspace_id)
      BEGIN SELECT RAISE(ABORT, 'resource scope mismatch'); END;
    CREATE TRIGGER IF NOT EXISTS jobs_scope_update BEFORE UPDATE OF workspace_id,integration_id ON jobs
      WHEN NOT EXISTS(SELECT 1 FROM integrations WHERE id=NEW.integration_id AND workspace_id=NEW.workspace_id)
      BEGIN SELECT RAISE(ABORT, 'resource scope mismatch'); END;
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, workspace_id TEXT NOT NULL, action TEXT NOT NULL,
      target_id TEXT NOT NULL, outcome TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)), created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS audit_scope ON audit_events(workspace_id, created_at, id);
    CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit_events BEGIN SELECT RAISE(ABORT, 'append-only audit'); END;
    CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit_events BEGIN SELECT RAISE(ABORT, 'append-only audit'); END;
    CREATE TABLE IF NOT EXISTS idempotency (
      workspace_id TEXT NOT NULL, actor_id TEXT NOT NULL, key TEXT NOT NULL, fingerprint TEXT NOT NULL,
      status INTEGER NOT NULL, response TEXT NOT NULL CHECK(json_valid(response)), created_at TEXT NOT NULL,
      PRIMARY KEY(workspace_id, actor_id, key)
    );
    CREATE TABLE IF NOT EXISTS support_organizations (
      workspace_id TEXT NOT NULL,id TEXT NOT NULL,name TEXT NOT NULL,source TEXT NOT NULL CHECK(source IN ('fixture','registry')),
      registry_organization_id TEXT,services TEXT NOT NULL CHECK(json_valid(services)),PRIMARY KEY(workspace_id,id),
      CHECK((source='fixture' AND registry_organization_id IS NULL) OR (source='registry' AND registry_organization_id=id)),
      FOREIGN KEY(workspace_id,registry_organization_id) REFERENCES local_customer_orgs(workspace_id,id)
    );
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,organization_id TEXT NOT NULL,subject TEXT NOT NULL,
      service TEXT NOT NULL,category TEXT NOT NULL,priority TEXT NOT NULL CHECK(priority IN ('normal','high','urgent')),
      status TEXT NOT NULL CHECK(status IN ('new','open','waiting','resolved')),assignee TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK(revision>0),public_revision INTEGER NOT NULL CHECK(public_revision>0),
      created_at TEXT NOT NULL,updated_at TEXT NOT NULL,public_updated_at TEXT NOT NULL,
      UNIQUE(workspace_id,id),FOREIGN KEY(workspace_id,organization_id) REFERENCES support_organizations(workspace_id,id)
    );
    CREATE INDEX IF NOT EXISTS support_tickets_scope ON support_tickets(workspace_id,organization_id,public_updated_at,id);
    CREATE TABLE IF NOT EXISTS support_public_messages (
      id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,ticket_id TEXT NOT NULL,author TEXT NOT NULL,
      body TEXT NOT NULL,at TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('message','system')),event_order INTEGER NOT NULL,
      FOREIGN KEY(workspace_id,ticket_id) REFERENCES support_tickets(workspace_id,id)
    );
    CREATE INDEX IF NOT EXISTS support_public_thread ON support_public_messages(workspace_id,ticket_id,at,id);
    CREATE TABLE IF NOT EXISTS support_internal_notes (
      id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,ticket_id TEXT NOT NULL,author TEXT NOT NULL,
      body TEXT NOT NULL,at TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN ('message','system')),event_order INTEGER NOT NULL,
      FOREIGN KEY(workspace_id,ticket_id) REFERENCES support_tickets(workspace_id,id)
    );
    CREATE INDEX IF NOT EXISTS support_internal_thread ON support_internal_notes(workspace_id,ticket_id,at,id);
    CREATE TRIGGER IF NOT EXISTS support_public_no_update BEFORE UPDATE ON support_public_messages BEGIN SELECT RAISE(ABORT,'append-only support message'); END;
    CREATE TRIGGER IF NOT EXISTS support_public_no_delete BEFORE DELETE ON support_public_messages BEGIN SELECT RAISE(ABORT,'append-only support message'); END;
    CREATE TRIGGER IF NOT EXISTS support_internal_no_update BEFORE UPDATE ON support_internal_notes BEGIN SELECT RAISE(ABORT,'append-only support note'); END;
    CREATE TRIGGER IF NOT EXISTS support_internal_no_delete BEFORE DELETE ON support_internal_notes BEGIN SELECT RAISE(ABORT,'append-only support note'); END;
    CREATE TABLE IF NOT EXISTS support_drafts (
      workspace_id TEXT NOT NULL,principal_scope TEXT NOT NULL,key TEXT NOT NULL,
      value TEXT NOT NULL CHECK(json_valid(value)),revision INTEGER NOT NULL CHECK(revision>0),updated_at TEXT NOT NULL,
      PRIMARY KEY(workspace_id,principal_scope,key)
    );
  `);
  const tx = action => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = action(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  };
  const audit = (actor, action, targetId, outcome, requestId, metadata = {}) => {
    // Deliberately do not record payloads, names, values, URLs or provider errors.
    const id = randomUUID(), createdAt = new Date().toISOString();
    const safe = { requestId, environment: 'fixture', ...metadata };
    db.prepare('INSERT INTO audit_events VALUES(?,?,?,?,?,?,?,?)').run(id, actor.id, actor.workspaceId, action, targetId, outcome, JSON.stringify(safe), createdAt);
    return id;
  };
  return { db, tx, audit };
}
