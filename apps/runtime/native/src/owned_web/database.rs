use std::collections::BTreeMap;
use std::fs;
use std::io::{Read, Write};

use rusqlite::{
    Connection, OpenFlags, OptionalExtension, Transaction, TransactionBehavior, params,
};

use super::admission::{AdmittedFixture, FixtureProof};
use super::extraction::extract;
use super::root::{DatabaseIdentity, FileIdentity, SecuredRoot};
use super::sha256::digest;

const SQLITE_VERSION: &str = "3.53.2";
const SQLITE_SOURCE_ID: &str =
    "2026-06-03 19:12:13 d6e03d8c777cfa2d35e3b60d8ec3e0187f3e9f99d8e2ee9cac695fd6fcdf1a24";
const SCHEMA_VERSION: i64 = 2;
const SCHEMA_FINGERPRINT: &str = "owned-web-qualification-schema-v2-2026-08-19";
const TOMBSTONE_REASON: &str = "FIXTURE_WITHDRAWN";
const TOMBSTONE_EFFECTIVE_AT: &str = "2026-08-19T00:00:00Z";
const SCHEMA_SQL: &str = "
CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY,fingerprint TEXT NOT NULL,definition_digest TEXT NOT NULL);
CREATE TRIGGER schema_migrations_immutable_update BEFORE UPDATE ON schema_migrations BEGIN SELECT RAISE(ABORT,'migration ledger immutable'); END;
CREATE TRIGGER schema_migrations_immutable_delete BEFORE DELETE ON schema_migrations BEGIN SELECT RAISE(ABORT,'migration ledger immutable'); END;
CREATE TABLE events(event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL CHECK(event_type IN('URL_DISCOVERED','FRONTIER_ELIGIBLE','LEASE_GRANTED','LEASE_EXPIRED','FETCH_STARTED','FETCH_SETTLED','CAPTURE_COMMITTED','TOMBSTONE_PUBLISHED')),aggregate_id TEXT NOT NULL,sequence INTEGER NOT NULL CHECK(sequence>0),payload TEXT NOT NULL,payload_digest TEXT NOT NULL,UNIQUE(aggregate_id,sequence));
CREATE TRIGGER events_gap_free BEFORE INSERT ON events WHEN NEW.sequence!=(SELECT COALESCE(MAX(sequence),0)+1 FROM events WHERE aggregate_id=NEW.aggregate_id) BEGIN SELECT RAISE(ABORT,'event sequence gap'); END;
CREATE TRIGGER events_immutable_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'events immutable'); END;
CREATE TRIGGER events_immutable_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'events immutable'); END;
CREATE TABLE frontier(url_id TEXT PRIMARY KEY,state TEXT NOT NULL CHECK(state IN('DISCOVERED','READY','LEASED','FETCHING','FETCHED','TOMBSTONED')),fence INTEGER NOT NULL CHECK(fence>=0),lease_id TEXT,tombstoned INTEGER NOT NULL CHECK(tombstoned IN(0,1)));
CREATE TABLE leases(url_id TEXT PRIMARY KEY REFERENCES frontier(url_id),lease_id TEXT NOT NULL UNIQUE,fence INTEGER NOT NULL CHECK(fence>0));
CREATE TABLE tombstones(fixture_id TEXT PRIMARY KEY,tombstone_id TEXT NOT NULL,head_ref TEXT NOT NULL);
CREATE TRIGGER tombstones_event_required BEFORE INSERT ON tombstones WHEN NOT EXISTS(SELECT 1 FROM events WHERE event_type='TOMBSTONE_PUBLISHED' AND aggregate_id='tombstone:'||NEW.fixture_id) BEGIN SELECT RAISE(ABORT,'tombstone event required'); END;
CREATE TRIGGER tombstones_immutable_update BEFORE UPDATE ON tombstones BEGIN SELECT RAISE(ABORT,'tombstones immutable'); END;
CREATE TRIGGER tombstones_immutable_delete BEFORE DELETE ON tombstones BEGIN SELECT RAISE(ABORT,'tombstones immutable'); END;
CREATE TABLE captures(capture_id TEXT PRIMARY KEY,fixture_id TEXT NOT NULL,media_type TEXT NOT NULL CHECK(media_type IN('text/plain','text/html')),body_digest TEXT NOT NULL,object_name TEXT NOT NULL,warc_digest TEXT NOT NULL,receipt_id TEXT NOT NULL UNIQUE,anchor_ref TEXT NOT NULL,authority_ref TEXT NOT NULL,nonce TEXT NOT NULL UNIQUE,proof_digest TEXT NOT NULL,UNIQUE(fixture_id,body_digest));
CREATE TABLE representations(representation_id TEXT PRIMARY KEY,capture_id TEXT NOT NULL REFERENCES captures(capture_id),text_digest TEXT NOT NULL,text TEXT NOT NULL);
CREATE TABLE passages(passage_id TEXT PRIMARY KEY,representation_id TEXT NOT NULL REFERENCES representations(representation_id),ordinal INTEGER NOT NULL,start_byte INTEGER NOT NULL,end_byte INTEGER NOT NULL,text_digest TEXT NOT NULL,selector TEXT NOT NULL);
CREATE INDEX captures_fixture_idx ON captures(fixture_id);
CREATE VIEW eligible_passages AS SELECT p.passage_id,p.representation_id,p.start_byte,p.end_byte,p.selector,r.text FROM passages p JOIN representations r USING(representation_id) JOIN captures c USING(capture_id) LEFT JOIN tombstones t ON t.fixture_id=c.fixture_id WHERE t.fixture_id IS NULL;
";

pub(super) struct QualificationStore {
    connection: Connection,
    root: SecuredRoot,
    database_identity: DatabaseIdentity,
    database_before: DatabaseIdentity,
    owned_artifacts: Vec<OwnedArtifact>,
    #[cfg(test)]
    fail_after_event_insert: bool,
}

#[derive(Clone)]
struct OwnedArtifact {
    directory: &'static str,
    name: String,
    identity: FileIdentity,
}

#[allow(dead_code)]
impl QualificationStore {
    pub(super) fn open(mut root: SecuredRoot) -> Result<Self, &'static str> {
        if let Err(error) = root.verify() {
            root.cleanup_invocation()?;
            return Err(error);
        }
        let database_before = match root.database_snapshot() {
            Ok(snapshot) => snapshot,
            Err(error) => {
                root.cleanup_invocation()?;
                return Err(error);
            }
        };
        let flags = OpenFlags::SQLITE_OPEN_READ_WRITE
            | OpenFlags::SQLITE_OPEN_CREATE
            | OpenFlags::SQLITE_OPEN_NO_MUTEX
            | OpenFlags::SQLITE_OPEN_NOFOLLOW;
        let database_path = match root.database_path() {
            Ok(path) => path,
            Err(error) => {
                root.cleanup_invocation()?;
                return Err(error);
            }
        };
        let connection = match Connection::open_with_flags(database_path, flags) {
            Ok(connection) => connection,
            Err(_) => {
                root.record_owned_database(&database_before)?;
                root.cleanup_invocation()?;
                return Err("CONTROL_DATABASE_OPEN_FAILED");
            }
        };
        let setup = (|| {
            root.verify_database_children()?;
            assert_sqlite(&connection)?;
            connection.execute_batch("PRAGMA trusted_schema=OFF;PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;PRAGMA busy_timeout=5000;PRAGMA temp_store=MEMORY;").map_err(|_| "CONTROL_DATABASE_HARDENING_FAILED")?;
            assert_settings(&connection)?;
            migrate(&connection)?;
            validate_schema(&connection)?;
            root.record_owned_database(&database_before)?;
            Ok(())
        })();
        if let Err(error) = setup {
            drop(connection);
            root.record_owned_database(&database_before)?;
            root.cleanup_invocation()?;
            return Err(error);
        }
        let database_identity = root.database_identity()?;
        let store = Self {
            connection,
            root,
            database_identity,
            database_before,
            owned_artifacts: Vec::new(),
            #[cfg(test)]
            fail_after_event_insert: false,
        };
        if let Err(error) = store.reconcile() {
            store.abort_invocation()?;
            return Err(error);
        }
        Ok(store)
    }

    pub(super) fn commit_invocation(&mut self) {
        self.owned_artifacts.clear();
        self.root.commit_invocation();
    }

    pub(super) fn abort_invocation(self) -> Result<(), &'static str> {
        let Self {
            connection,
            mut root,
            database_before,
            owned_artifacts,
            ..
        } = self;
        root.record_owned_database(&database_before)?;
        if let Err((connection, _)) = connection.close() {
            drop(connection);
            root.record_owned_database(&database_before)?;
            let mut cleanup_failed = false;
            for artifact in &owned_artifacts {
                cleanup_failed |= root
                    .remove_owned_child(artifact.directory, &artifact.name, artifact.identity)
                    .is_err();
            }
            cleanup_failed |= root.cleanup_invocation().is_err();
            return if cleanup_failed {
                Err("CONTROL_CHILD_CLEANUP_UNPROVEN")
            } else {
                Err("CONTROL_DATABASE_CLOSE_FAILED")
            };
        }
        root.record_owned_database(&database_before)?;
        let mut cleanup_failed = false;
        for artifact in owned_artifacts {
            cleanup_failed |= root
                .remove_owned_child(artifact.directory, &artifact.name, artifact.identity)
                .is_err();
        }
        cleanup_failed |= root.cleanup_invocation().is_err();
        if cleanup_failed {
            Err("CONTROL_CHILD_CLEANUP_UNPROVEN")
        } else {
            Ok(())
        }
    }

    pub(super) fn qualify_fixture(
        &mut self,
        fixture: &AdmittedFixture,
    ) -> Result<(), &'static str> {
        self.reconcile()?;
        validate_proof(&fixture.proof, &fixture.body)?;
        let body_digest = digest(&fixture.body);
        let capture_id = format!("capture-{body_digest}");
        let extracted = extract(&fixture.media_type, &fixture.body)?;
        let representation_digest = digest(extracted.text.as_bytes());
        let warc = warc_record(
            &capture_id,
            &fixture.relative_path,
            &fixture.media_type,
            &fixture.body,
            &fixture.proof,
        );
        let warc_digest = digest(&warc);
        let event_payload = capture_event_payload(fixture, &warc_digest, &representation_digest);
        let event_digest = digest(event_payload.as_bytes());
        let tombstoned: i64 = self
            .connection
            .query_row(
                "SELECT count(*) FROM tombstones WHERE fixture_id=?1",
                [&fixture.relative_path],
                |row| row.get(0),
            )
            .map_err(|_| "CONTROL_TOMBSTONE_READ_FAILED")?;
        if tombstoned != 0 {
            return Err("CAPTURE_TOMBSTONED");
        }
        if let Some(existing) = self
            .connection
            .query_row(
                "SELECT payload_digest FROM events WHERE event_id=?1",
                [format!("event-{capture_id}")],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .map_err(|_| "CONTROL_EVENT_READ_FAILED")?
        {
            if existing != event_digest {
                return Err("CONTROL_EVENT_COLLISION");
            }
            self.reconcile()?;
            return Ok(());
        }
        let reused: i64 = self.connection.query_row("SELECT count(*) FROM captures WHERE (nonce=?1 OR receipt_id=?2) AND capture_id<>?3", params![fixture.proof.nonce,fixture.proof.receipt_id,capture_id], |row| row.get(0)).map_err(|_| "CAPTURE_PROOF_READ_FAILED")?;
        if reused != 0 {
            return Err("CAPTURE_PROOF_REUSED");
        }
        let object_created = self.write_artifact("objects", &body_digest, &fixture.body)?;
        if let Some(created) = object_created.as_ref() {
            self.owned_artifacts.push(created.clone());
        }
        let record_name = format!("{capture_id}.warc");
        let record_created = match self.write_artifact("records", &record_name, &warc) {
            Ok(created) => {
                if let Some(owned) = created.as_ref() {
                    self.owned_artifacts.push(owned.clone());
                }
                created
            }
            Err(error) => {
                if let Some(created) = object_created.as_ref() {
                    self.cleanup_artifact(created)?;
                }
                return Err(error);
            }
        };
        #[cfg(test)]
        let fail_after_event_insert = std::mem::take(&mut self.fail_after_event_insert);
        let result = (|| {
            self.root
                .verify_database_identity(&self.database_identity)?;
            let tx = self
                .connection
                .transaction()
                .map_err(|_| "CONTROL_TRANSACTION_FAILED")?;
            let tombstoned: i64 = tx
                .query_row(
                    "SELECT count(*) FROM tombstones WHERE fixture_id=?1",
                    [&fixture.relative_path],
                    |row| row.get(0),
                )
                .map_err(|_| "CONTROL_TOMBSTONE_READ_FAILED")?;
            if tombstoned != 0 {
                return Err("CAPTURE_TOMBSTONED");
            }
            if proof_reused(&tx, &fixture.proof, &capture_id)? {
                return Err("CAPTURE_PROOF_REUSED");
            }
            tx.execute(
                "INSERT INTO events VALUES(?1,'CAPTURE_COMMITTED',?2,1,?3,?4)",
                params![
                    format!("event-{capture_id}"),
                    capture_id,
                    event_payload,
                    event_digest
                ],
            )
            .map_err(|_| "CONTROL_EVENT_APPEND_FAILED")?;
            #[cfg(test)]
            if fail_after_event_insert {
                return Err("TEST_CAPTURE_MATERIALIZATION_FAULT");
            }
            tx.execute(
                "INSERT INTO captures VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
                params![
                    capture_id,
                    fixture.relative_path,
                    fixture.media_type,
                    body_digest,
                    body_digest,
                    warc_digest,
                    fixture.proof.receipt_id,
                    fixture.proof.anchor_ref,
                    fixture.proof.authority_ref,
                    fixture.proof.nonce,
                    fixture.proof.proof_digest
                ],
            )
            .map_err(|_| "CAPTURE_VIEW_UPDATE_FAILED")?;
            tx.execute(
                "INSERT INTO representations VALUES(?1,?2,?3,?4)",
                params![
                    format!("representation-{representation_digest}"),
                    capture_id,
                    representation_digest,
                    extracted.text
                ],
            )
            .map_err(|_| "EXTRACT_VIEW_UPDATE_FAILED")?;
            tx.execute(
                "INSERT INTO passages VALUES(?1,?2,0,0,?3,?4,?5)",
                params![
                    format!("passage-{representation_digest}"),
                    format!("representation-{representation_digest}"),
                    extracted.text.len() as i64,
                    representation_digest,
                    extracted.selector
                ],
            )
            .map_err(|_| "EXTRACT_PASSAGE_UPDATE_FAILED")?;
            self.root
                .verify_database_identity(&self.database_identity)?;
            tx.commit()
                .map_err(|_| "CONTROL_TRANSACTION_COMMIT_FAILED")?;
            self.root.verify_database_identity(&self.database_identity)
        })();
        if result.is_err() {
            let mut cleanup_failed = false;
            if let Some(created) = record_created.as_ref() {
                cleanup_failed |= self.cleanup_artifact(created).is_err();
            }
            if let Some(created) = object_created.as_ref() {
                cleanup_failed |= self.cleanup_artifact(created).is_err();
            }
            if cleanup_failed {
                return Err("CONTROL_CHILD_CLEANUP_UNPROVEN");
            }
        }
        result
    }

    pub(super) fn discover(&mut self, url_id: &str) -> Result<(), &'static str> {
        self.frontier_insert(
            url_id,
            "URL_DISCOVERED",
            "DISCOVERED",
            format!("URL_DISCOVERED|{url_id}|DISCOVERED"),
        )
    }
    pub(super) fn eligible(&mut self, url_id: &str) -> Result<(), &'static str> {
        self.frontier_transition(
            url_id,
            "FRONTIER_ELIGIBLE",
            &["DISCOVERED"],
            "READY",
            "READY",
            0,
        )
    }
    pub(super) fn claim(&mut self, url_id: &str, lease: &str) -> Result<i64, &'static str> {
        let tx = self
            .connection
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .map_err(|_| "CONTROL_TRANSACTION_FAILED")?;
        let (state, fence, current_lease): (String, i64, Option<String>) = tx
            .query_row(
                "SELECT state,fence,lease_id FROM frontier WHERE url_id=?1",
                [url_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .map_err(|_| "CONTROL_FRONTIER_ABSENT")?;
        let event_id = format!("{url_id}-LEASE_GRANTED-{lease}");
        let existing: i64 = tx
            .query_row(
                "SELECT count(*) FROM events WHERE event_id=?1",
                [&event_id],
                |row| row.get(0),
            )
            .map_err(|_| "CONTROL_EVENT_READ_FAILED")?;
        if existing != 0 {
            return if state == "LEASED" && current_lease.as_deref() == Some(lease) {
                Ok(fence)
            } else {
                Err("CONTROL_EVENT_COLLISION")
            };
        }
        let next = fence.checked_add(1).ok_or("CONTROL_FENCE_EXHAUSTED")?;
        let payload_digest =
            digest(format!("LEASE_GRANTED|{url_id}|{lease}|{next}|{next}").as_bytes());
        if state != "READY" {
            return Err("CONTROL_ILLEGAL_TRANSITION");
        }
        let sequence: i64 = tx
            .query_row(
                "SELECT MAX(sequence)+1 FROM events WHERE aggregate_id=?1",
                [url_id],
                |row| row.get(0),
            )
            .map_err(|_| "CONTROL_EVENT_READ_FAILED")?;
        let event_payload = format!("LEASE_GRANTED|{url_id}|{lease}|{next}|{next}");
        tx.execute(
            "INSERT INTO events VALUES(?1,'LEASE_GRANTED',?2,?3,?4,?5)",
            params![event_id, url_id, sequence, event_payload, payload_digest],
        )
        .map_err(|_| "CONTROL_EVENT_APPEND_FAILED")?;
        let affected=tx.execute("UPDATE frontier SET state='LEASED',fence=?3,lease_id=?4 WHERE url_id=?1 AND state='READY' AND fence=?2",params![url_id,fence,next,lease]).map_err(|_|"CONTROL_VIEW_UPDATE_FAILED")?;
        if affected != 1 {
            return Err("CONTROL_CLAIM_RACE_LOST");
        }
        tx.execute(
            "INSERT INTO leases VALUES(?1,?2,?3)",
            params![url_id, lease, next],
        )
        .map_err(|_| "CONTROL_LEASE_COLLISION")?;
        tx.commit()
            .map_err(|_| "CONTROL_TRANSACTION_COMMIT_FAILED")?;
        Ok(next)
    }
    pub(super) fn expire(&mut self, url_id: &str, fence: i64) -> Result<(), &'static str> {
        self.frontier_transition(
            url_id,
            "LEASE_EXPIRED",
            &["LEASED", "FETCHING"],
            "READY",
            "READY",
            fence,
        )
    }
    pub(super) fn start(&mut self, url_id: &str, fence: i64) -> Result<(), &'static str> {
        self.frontier_transition(
            url_id,
            "FETCH_STARTED",
            &["LEASED"],
            "FETCHING",
            "FETCHING",
            fence,
        )
    }
    pub(super) fn settle(&mut self, url_id: &str, fence: i64) -> Result<(), &'static str> {
        self.frontier_transition(
            url_id,
            "FETCH_SETTLED",
            &["FETCHING"],
            "FETCHED",
            "FETCHED",
            fence,
        )
    }

    pub(super) fn tombstone(&mut self, fixture_id: &str) -> Result<(), &'static str> {
        let tx = self
            .connection
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .map_err(|_| "CONTROL_TRANSACTION_FAILED")?;
        let event_id = format!("tombstone-event-{fixture_id}");
        let aggregate = format!("tombstone:{fixture_id}");
        let tombstone_id = format!("tombstone-{fixture_id}");
        let head = "fixture-tombstone-head-v1";
        let payload = tombstone_payload(fixture_id, &tombstone_id, head);
        let payload_digest = digest(payload.as_bytes());
        if let Some(existing) = tx
            .query_row(
                "SELECT payload_digest FROM events WHERE event_id=?1",
                [&event_id],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .map_err(|_| "CONTROL_EVENT_READ_FAILED")?
        {
            if existing != payload_digest {
                return Err("CONTROL_EVENT_COLLISION");
            }
            let exact:i64=tx.query_row("SELECT count(*) FROM tombstones WHERE fixture_id=?1 AND tombstone_id=?2 AND head_ref=?3",params![fixture_id,tombstone_id,head],|row|row.get(0)).map_err(|_|"CONTROL_TOMBSTONE_READ_FAILED")?;
            return if exact == 1 {
                Ok(())
            } else {
                Err("RECOVERY_TOMBSTONE_DIVERGED")
            };
        }
        tx.execute(
            "INSERT INTO events VALUES(?1,'TOMBSTONE_PUBLISHED',?2,1,?3,?4)",
            params![event_id, aggregate, payload, payload_digest],
        )
        .map_err(|_| "CONTROL_EVENT_APPEND_FAILED")?;
        tx.execute(
            "INSERT INTO tombstones VALUES(?1,?2,?3)",
            params![fixture_id, tombstone_id, head],
        )
        .map_err(|_| "CONTROL_VIEW_UPDATE_FAILED")?;
        tx.commit().map_err(|_| "CONTROL_TRANSACTION_COMMIT_FAILED")
    }

    pub(super) fn passage(
        &self,
        id: &str,
    ) -> Result<Option<(String, i64, i64, String)>, &'static str> {
        self.connection.query_row("SELECT text,start_byte,end_byte,selector FROM eligible_passages WHERE passage_id=?1",[id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?))).optional().map_err(|_|"EXTRACT_PASSAGE_READ_FAILED")
    }

    pub(super) fn reconcile(&self) -> Result<(), &'static str> {
        self.root
            .verify_database_identity(&self.database_identity)?;
        validate_schema(&self.connection)?;
        let integrity: String = self
            .connection
            .query_row("PRAGMA integrity_check", [], |r| r.get(0))
            .map_err(|_| "RECOVERY_INTEGRITY_FAILED")?;
        if integrity != "ok" {
            return Err("RECOVERY_INTEGRITY_FAILED");
        }
        let mut statement=self.connection.prepare("SELECT capture_id,fixture_id,media_type,body_digest,object_name,warc_digest,receipt_id,anchor_ref,authority_ref,nonce,proof_digest FROM captures").map_err(|_|"RECOVERY_RECONCILIATION_FAILED")?;
        let rows = statement
            .query_map([], |r| {
                Ok((
                    r.get::<_, String>(0)?,
                    r.get::<_, String>(1)?,
                    r.get::<_, String>(2)?,
                    r.get::<_, String>(3)?,
                    r.get::<_, String>(4)?,
                    r.get::<_, String>(5)?,
                    r.get::<_, String>(6)?,
                    r.get::<_, String>(7)?,
                    r.get::<_, String>(8)?,
                    r.get::<_, String>(9)?,
                    r.get::<_, String>(10)?,
                ))
            })
            .map_err(|_| "RECOVERY_RECONCILIATION_FAILED")?;
        for row in rows {
            let (
                capture_id,
                fixture_id,
                media,
                body_digest,
                object_name,
                warc_digest,
                receipt,
                anchor,
                authority,
                nonce,
                proof_digest,
            ) = row.map_err(|_| "RECOVERY_RECONCILIATION_FAILED")?;
            if object_name != body_digest || capture_id != format!("capture-{body_digest}") {
                return Err("RECOVERY_CAPTURE_IDENTITY_INVALID");
            }
            let body = self.read_artifact("objects", &object_name)?;
            if digest(&body) != body_digest {
                return Err("RECOVERY_CAS_DIGEST_MISMATCH");
            }
            let proof = FixtureProof {
                capture_digest: body_digest.clone(),
                receipt_id: receipt,
                anchor_ref: anchor,
                authority_ref: authority,
                nonce,
                proof_digest,
            };
            validate_proof(&proof, &body)?;
            let warc = self.read_artifact("records", &format!("{capture_id}.warc"))?;
            verify_warc(
                &warc,
                &capture_id,
                &fixture_id,
                &media,
                &body,
                &proof,
                &warc_digest,
            )?;
            let extracted = extract(&media, &body)?;
            let rep_digest = digest(extracted.text.as_bytes());
            let (stored_text, stored_digest): (String, String) = self
                .connection
                .query_row(
                    "SELECT text,text_digest FROM representations WHERE capture_id=?1",
                    [&capture_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )
                .map_err(|_| "RECOVERY_REPRESENTATION_INVALID")?;
            if stored_text != extracted.text || stored_digest != rep_digest {
                return Err("RECOVERY_REPRESENTATION_INVALID");
            }
            let (start,end,text_digest,selector):(i64,i64,String,String)=self.connection.query_row("SELECT start_byte,end_byte,text_digest,selector FROM passages WHERE representation_id=?1",[format!("representation-{rep_digest}")],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?))).map_err(|_|"RECOVERY_PASSAGE_INVALID")?;
            if start != 0
                || end != stored_text.len() as i64
                || text_digest != rep_digest
                || selector != "representation:utf8-bytes:0"
            {
                return Err("RECOVERY_PASSAGE_INVALID");
            }
            let fixture = AdmittedFixture {
                relative_path: fixture_id,
                media_type: media,
                body,
                proof,
            };
            let event =
                digest(capture_event_payload(&fixture, &warc_digest, &rep_digest).as_bytes());
            let stored: String = self
                .connection
                .query_row(
                    "SELECT payload_digest FROM events WHERE event_id=?1",
                    [format!("event-{capture_id}")],
                    |r| r.get(0),
                )
                .map_err(|_| "RECOVERY_EVENT_INVALID")?;
            if stored != event {
                return Err("RECOVERY_EVENT_INVALID");
            }
        }
        self.validate_inventory(
            "objects",
            "SELECT count(*) FROM captures WHERE object_name=?1",
        )?;
        self.validate_inventory(
            "records",
            "SELECT count(*) FROM captures WHERE capture_id=?1",
        )?;
        self.validate_event_digests()?;
        self.validate_frontier_views()?;
        self.validate_frontier_replay()?;
        self.validate_bidirectional()?;
        Ok(())
    }

    fn validate_event_digests(&self) -> Result<(), &'static str> {
        let mut statement = self
            .connection
            .prepare("SELECT payload,payload_digest FROM events")
            .map_err(|_| "RECOVERY_EVENT_DIGEST_INVALID")?;
        let rows = statement
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|_| "RECOVERY_EVENT_DIGEST_INVALID")?;
        for row in rows {
            let (payload, stored) = row.map_err(|_| "RECOVERY_EVENT_DIGEST_INVALID")?;
            if digest(payload.as_bytes()) != stored {
                return Err("RECOVERY_EVENT_DIGEST_INVALID");
            }
        }
        Ok(())
    }

    fn validate_frontier_views(&self) -> Result<(), &'static str> {
        let mismatch:i64=self.connection.query_row("SELECT count(*) FROM frontier f WHERE NOT ((state='DISCOVERED' AND (SELECT event_type FROM events WHERE aggregate_id=f.url_id ORDER BY sequence DESC LIMIT 1)='URL_DISCOVERED') OR (state='READY' AND (SELECT event_type FROM events WHERE aggregate_id=f.url_id ORDER BY sequence DESC LIMIT 1) IN('FRONTIER_ELIGIBLE','LEASE_EXPIRED')) OR (state='LEASED' AND (SELECT event_type FROM events WHERE aggregate_id=f.url_id ORDER BY sequence DESC LIMIT 1)='LEASE_GRANTED') OR (state='FETCHING' AND (SELECT event_type FROM events WHERE aggregate_id=f.url_id ORDER BY sequence DESC LIMIT 1)='FETCH_STARTED') OR (state='FETCHED' AND (SELECT event_type FROM events WHERE aggregate_id=f.url_id ORDER BY sequence DESC LIMIT 1)='FETCH_SETTLED') OR state='TOMBSTONED')",[],|row|row.get(0)).map_err(|_|"RECOVERY_VIEW_DIVERGED")?;
        if mismatch != 0 {
            return Err("RECOVERY_VIEW_DIVERGED");
        }
        Ok(())
    }

    fn validate_frontier_replay(&self) -> Result<(), &'static str> {
        let mut frontier = self
            .connection
            .prepare("SELECT url_id,state,fence,lease_id FROM frontier")
            .map_err(|_| "RECOVERY_VIEW_DIVERGED")?;
        let rows = frontier
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i64>(2)?,
                    row.get::<_, Option<String>>(3)?,
                ))
            })
            .map_err(|_| "RECOVERY_VIEW_DIVERGED")?;
        for row in rows {
            let (id, stored_state, stored_fence, stored_lease) =
                row.map_err(|_| "RECOVERY_VIEW_DIVERGED")?;
            let mut statement=self.connection.prepare("SELECT event_type,payload FROM events WHERE aggregate_id=?1 AND event_type IN('URL_DISCOVERED','FRONTIER_ELIGIBLE','LEASE_GRANTED','LEASE_EXPIRED','FETCH_STARTED','FETCH_SETTLED') ORDER BY sequence").map_err(|_|"RECOVERY_VIEW_DIVERGED")?;
            let events = statement
                .query_map([&id], |r| {
                    Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
                })
                .map_err(|_| "RECOVERY_VIEW_DIVERGED")?;
            let mut state = "ABSENT".to_owned();
            let mut fence = 0i64;
            let mut lease = None;
            for event in events {
                let (event, payload) = event.map_err(|_| "RECOVERY_VIEW_DIVERGED")?;
                match event.as_str() {
                    "URL_DISCOVERED"
                        if state == "ABSENT"
                            && payload == format!("URL_DISCOVERED|{id}|DISCOVERED") =>
                    {
                        state = "DISCOVERED".into()
                    }
                    "FRONTIER_ELIGIBLE"
                        if state == "DISCOVERED"
                            && payload == format!("FRONTIER_ELIGIBLE|{id}|READY|0") =>
                    {
                        state = "READY".into()
                    }
                    "LEASE_GRANTED" if state == "READY" => {
                        let fields: Vec<_> = payload.split('|').collect();
                        if fields.len() != 5
                            || fields[0] != "LEASE_GRANTED"
                            || fields[1] != id
                            || fields[3] != fields[4]
                        {
                            return Err("RECOVERY_VIEW_DIVERGED");
                        }
                        let next = fields[3]
                            .parse::<i64>()
                            .map_err(|_| "RECOVERY_VIEW_DIVERGED")?;
                        if next != fence + 1 {
                            return Err("RECOVERY_VIEW_DIVERGED");
                        }
                        fence = next;
                        lease = Some(fields[2].to_owned());
                        state = "LEASED".into();
                    }
                    "FETCH_STARTED"
                        if state == "LEASED"
                            && payload == format!("FETCH_STARTED|{id}|FETCHING|{fence}") =>
                    {
                        state = "FETCHING".into()
                    }
                    "FETCH_SETTLED"
                        if state == "FETCHING"
                            && payload == format!("FETCH_SETTLED|{id}|FETCHED|{fence}") =>
                    {
                        state = "FETCHED".into();
                        lease = None;
                    }
                    "LEASE_EXPIRED"
                        if matches!(state.as_str(), "LEASED" | "FETCHING")
                            && payload == format!("LEASE_EXPIRED|{id}|READY|{fence}") =>
                    {
                        state = "READY".into();
                        lease = None;
                    }
                    _ => return Err("RECOVERY_VIEW_DIVERGED"),
                }
            }
            if state != stored_state || fence != stored_fence || lease != stored_lease {
                return Err("RECOVERY_VIEW_DIVERGED");
            }
        }
        Ok(())
    }

    fn validate_bidirectional(&self) -> Result<(), &'static str> {
        let sql = [
            "SELECT count(*) FROM captures c WHERE (SELECT count(*) FROM events e WHERE e.event_type='CAPTURE_COMMITTED' AND e.aggregate_id=c.capture_id)<>1 OR (SELECT count(*) FROM representations r WHERE r.capture_id=c.capture_id)<>1",
            "SELECT count(*) FROM events e LEFT JOIN captures c ON c.capture_id=e.aggregate_id WHERE e.event_type='CAPTURE_COMMITTED' AND c.capture_id IS NULL",
            "SELECT count(*) FROM representations r WHERE (SELECT count(*) FROM passages p WHERE p.representation_id=r.representation_id)<>1 OR NOT EXISTS(SELECT 1 FROM captures c WHERE c.capture_id=r.capture_id)",
            "SELECT count(*) FROM passages p WHERE NOT EXISTS(SELECT 1 FROM representations r WHERE r.representation_id=p.representation_id)",
            "SELECT count(*) FROM frontier f WHERE (SELECT count(*) FROM events e WHERE e.aggregate_id=f.url_id AND e.event_type IN('URL_DISCOVERED','FRONTIER_ELIGIBLE','LEASE_GRANTED','LEASE_EXPIRED','FETCH_STARTED','FETCH_SETTLED'))=0",
            "SELECT count(*) FROM events e LEFT JOIN frontier f ON f.url_id=e.aggregate_id WHERE e.event_type IN('URL_DISCOVERED','FRONTIER_ELIGIBLE','LEASE_GRANTED','LEASE_EXPIRED','FETCH_STARTED','FETCH_SETTLED') AND f.url_id IS NULL",
            "SELECT count(*) FROM frontier f LEFT JOIN leases l ON l.url_id=f.url_id WHERE ((f.state IN('LEASED','FETCHING')) AND (l.url_id IS NULL OR l.lease_id<>f.lease_id OR l.fence<>f.fence)) OR ((f.state NOT IN('LEASED','FETCHING')) AND l.url_id IS NOT NULL)",
            "SELECT count(*) FROM leases l LEFT JOIN frontier f ON f.url_id=l.url_id WHERE f.url_id IS NULL",
            "SELECT count(*) FROM (SELECT aggregate_id,MIN(sequence) minimum,MAX(sequence) maximum,count(*) count FROM events GROUP BY aggregate_id) WHERE minimum<>1 OR maximum<>count",
            "SELECT count(*) FROM pragma_foreign_key_check",
        ];
        for query in sql {
            let count: i64 = self
                .connection
                .query_row(query, [], |row| row.get(0))
                .map_err(|_| "RECOVERY_CARDINALITY_INVALID")?;
            if count != 0 {
                return Err("RECOVERY_CARDINALITY_INVALID");
            }
        }
        let mut statement = self
            .connection
            .prepare("SELECT fixture_id,tombstone_id,head_ref FROM tombstones")
            .map_err(|_| "RECOVERY_TOMBSTONE_DIVERGED")?;
        let rows = statement
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                ))
            })
            .map_err(|_| "RECOVERY_TOMBSTONE_DIVERGED")?;
        for row in rows {
            let (fixture, id, head) = row.map_err(|_| "RECOVERY_TOMBSTONE_DIVERGED")?;
            let payload = tombstone_payload(&fixture, &id, &head);
            let count:i64=self.connection.query_row("SELECT count(*) FROM events WHERE event_type='TOMBSTONE_PUBLISHED' AND aggregate_id=?1 AND payload=?2 AND payload_digest=?3",params![format!("tombstone:{fixture}"),payload,digest(payload.as_bytes())],|r|r.get(0)).map_err(|_|"RECOVERY_TOMBSTONE_DIVERGED")?;
            if count != 1 {
                return Err("RECOVERY_TOMBSTONE_DIVERGED");
            }
        }
        let surplus:i64=self.connection.query_row("SELECT count(*) FROM events e LEFT JOIN tombstones t ON e.aggregate_id='tombstone:'||t.fixture_id WHERE e.event_type='TOMBSTONE_PUBLISHED' AND t.fixture_id IS NULL",[],|r|r.get(0)).map_err(|_|"RECOVERY_TOMBSTONE_DIVERGED")?;
        if surplus != 0 {
            return Err("RECOVERY_TOMBSTONE_DIVERGED");
        }
        Ok(())
    }

    fn validate_inventory(&self, dir: &str, sql: &str) -> Result<(), &'static str> {
        for entry in fs::read_dir(self.root.path().join(dir))
            .map_err(|_| "RECOVERY_OBJECT_INVENTORY_FAILED")?
        {
            let entry = entry.map_err(|_| "RECOVERY_OBJECT_INVENTORY_FAILED")?;
            if entry
                .file_type()
                .map_err(|_| "RECOVERY_OBJECT_INVENTORY_FAILED")?
                .is_symlink()
                || !entry
                    .file_type()
                    .map_err(|_| "RECOVERY_OBJECT_INVENTORY_FAILED")?
                    .is_file()
            {
                return Err("RECOVERY_OBJECT_TYPE_INVALID");
            }
            let mut name = entry
                .file_name()
                .into_string()
                .map_err(|_| "RECOVERY_OBJECT_INVENTORY_FAILED")?;
            if dir == "records" {
                name = name
                    .strip_suffix(".warc")
                    .ok_or("RECOVERY_OBJECT_INVENTORY_FAILED")?
                    .into();
            }
            let count: i64 = self
                .connection
                .query_row(sql, [name], |r| r.get(0))
                .map_err(|_| "RECOVERY_RECONCILIATION_FAILED")?;
            if count != 1 {
                return Err("RECOVERY_ORPHAN_CAPTURE");
            }
        }
        Ok(())
    }
    fn read_artifact(&self, dir: &str, name: &str) -> Result<Vec<u8>, &'static str> {
        let mut file = self.root.open_child(dir, name, false, false)?;
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes)
            .map_err(|_| "RECOVERY_ARTIFACT_READ_FAILED")?;
        Ok(bytes)
    }
    fn write_artifact(
        &self,
        dir: &'static str,
        name: &str,
        bytes: &[u8],
    ) -> Result<Option<OwnedArtifact>, &'static str> {
        let path = self.root.child(dir, name)?;
        if path.exists() {
            let existing = self.read_artifact(dir, name)?;
            return if existing == bytes {
                Ok(None)
            } else {
                Err("CAPTURE_OBJECT_COLLISION")
            };
        }
        let mut file = self.root.open_child(dir, name, true, true)?;
        let identity = SecuredRoot::child_identity(&file)?;
        let owned = OwnedArtifact {
            directory: dir,
            name: name.to_owned(),
            identity,
        };
        let written = file
            .write_all(bytes)
            .and_then(|_| file.sync_all())
            .map_err(|_| "CAPTURE_OBJECT_WRITE_FAILED")
            .and_then(|()| self.root.verify_database_identity(&self.database_identity));
        if let Err(error) = written {
            drop(file);
            self.cleanup_artifact(&owned)?;
            return Err(error);
        }
        Ok(Some(owned))
    }

    fn cleanup_artifact(&self, artifact: &OwnedArtifact) -> Result<(), &'static str> {
        self.root
            .remove_owned_child(artifact.directory, &artifact.name, artifact.identity)
    }

    fn frontier_insert(
        &mut self,
        id: &str,
        event: &str,
        state: &str,
        payload: String,
    ) -> Result<(), &'static str> {
        let event_id = format!("{id}-{event}");
        let payload_digest = digest(payload.as_bytes());
        if replay_event(&self.connection, &event_id, &payload_digest)? {
            return Ok(());
        }
        let tx = self
            .connection
            .transaction()
            .map_err(|_| "CONTROL_TRANSACTION_FAILED")?;
        tx.execute(
            "INSERT INTO events VALUES(?1,?2,?3,1,?4,?5)",
            params![event_id, event, id, payload, payload_digest],
        )
        .map_err(|_| "CONTROL_EVENT_APPEND_FAILED")?;
        tx.execute(
            "INSERT INTO frontier VALUES(?1,?2,0,NULL,0)",
            params![id, state],
        )
        .map_err(|_| "CONTROL_VIEW_UPDATE_FAILED")?;
        tx.commit().map_err(|_| "CONTROL_TRANSACTION_COMMIT_FAILED")
    }
    fn frontier_transition(
        &mut self,
        id: &str,
        event: &str,
        allowed: &[&str],
        next: &str,
        payload: &str,
        fence: i64,
    ) -> Result<(), &'static str> {
        let event_id = format!("{id}-{event}-{fence}");
        let payload_digest = digest(format!("{event}|{id}|{payload}|{fence}").as_bytes());
        if replay_event(&self.connection, &event_id, &payload_digest)? {
            return Ok(());
        }
        let tx = self
            .connection
            .transaction()
            .map_err(|_| "CONTROL_TRANSACTION_FAILED")?;
        let (state, current): (String, i64) = tx
            .query_row(
                "SELECT state,fence FROM frontier WHERE url_id=?1",
                [id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .map_err(|_| "CONTROL_FRONTIER_ABSENT")?;
        if !allowed.contains(&state.as_str()) {
            return Err("CONTROL_ILLEGAL_TRANSITION");
        }
        if event != "LEASE_GRANTED" && current != fence {
            return Err("CONTROL_STALE_FENCE");
        }
        let sequence: i64 = tx
            .query_row(
                "SELECT MAX(sequence)+1 FROM events WHERE aggregate_id=?1",
                [id],
                |r| r.get(0),
            )
            .map_err(|_| "CONTROL_EVENT_READ_FAILED")?;
        let canonical_payload = format!("{event}|{id}|{payload}|{fence}");
        tx.execute(
            "INSERT INTO events VALUES(?1,?2,?3,?4,?5,?6)",
            params![
                event_id,
                event,
                id,
                sequence,
                canonical_payload,
                payload_digest
            ],
        )
        .map_err(|_| "CONTROL_EVENT_APPEND_FAILED")?;
        let new_fence = if event == "LEASE_GRANTED" {
            fence
        } else {
            current
        };
        tx.execute("UPDATE frontier SET state=?2,fence=?3,lease_id=CASE WHEN ?2 IN('LEASED','FETCHING') THEN lease_id ELSE NULL END WHERE url_id=?1",params![id,next,new_fence]).map_err(|_|"CONTROL_VIEW_UPDATE_FAILED")?;
        if !matches!(next, "LEASED" | "FETCHING") {
            tx.execute(
                "DELETE FROM leases WHERE url_id=?1 AND fence=?2",
                params![id, current],
            )
            .map_err(|_| "CONTROL_VIEW_UPDATE_FAILED")?;
        }
        tx.commit().map_err(|_| "CONTROL_TRANSACTION_COMMIT_FAILED")
    }

    #[cfg(test)]
    pub(super) fn test_execute(&self, sql: &str) -> Result<(), &'static str> {
        self.connection
            .execute_batch(sql)
            .map_err(|_| "TEST_SQL_FAILED")
    }
    #[cfg(test)]
    pub(super) fn test_accept_live_schema_digest(&self) -> Result<(), &'static str> {
        let definition = schema_definition_digest(&self.connection)?;
        self.connection
            .execute_batch("DROP TRIGGER schema_migrations_immutable_update;")
            .map_err(|_| "TEST_SQL_FAILED")?;
        self.connection
            .execute(
                "UPDATE schema_migrations SET definition_digest=?1",
                [definition],
            )
            .map_err(|_| "TEST_SQL_FAILED")?;
        self.connection
            .execute_batch("CREATE TRIGGER schema_migrations_immutable_update BEFORE UPDATE ON schema_migrations BEGIN SELECT RAISE(ABORT,'migration ledger immutable'); END;")
            .map_err(|_| "TEST_SQL_FAILED")
    }
    #[cfg(test)]
    pub(super) fn test_count(&self, table: &str) -> i64 {
        self.connection
            .query_row(&format!("SELECT count(*) FROM {table}"), [], |r| r.get(0))
            .expect("count")
    }
    #[cfg(test)]
    pub(super) fn test_fail_after_event_insert(&mut self) {
        self.fail_after_event_insert = true;
    }
    #[cfg(test)]
    pub(super) fn test_receipt_count(&self, receipt: &str) -> i64 {
        self.connection
            .query_row(
                "SELECT count(*) FROM captures WHERE receipt_id=?1",
                [receipt],
                |row| row.get(0),
            )
            .expect("receipt count")
    }
}

fn migrate(connection: &Connection) -> Result<(), &'static str> {
    let version: i64 = connection
        .query_row("PRAGMA user_version", [], |r| r.get(0))
        .map_err(|_| "CONTROL_SCHEMA_VERSION_FAILED")?;
    if !(0..=SCHEMA_VERSION).contains(&version) {
        return Err("CONTROL_SCHEMA_VERSION_UNSUPPORTED");
    }
    if version == SCHEMA_VERSION {
        return Ok(());
    }
    if version != 0 {
        return Err("CONTROL_SCHEMA_VERSION_UNSUPPORTED");
    }
    let tx = connection
        .unchecked_transaction()
        .map_err(|_| "CONTROL_MIGRATION_FAILED")?;
    tx.execute_batch(SCHEMA_SQL)
        .map_err(|_| "CONTROL_MIGRATION_FAILED")?;
    let definition_digest = schema_definition_digest(&tx)?;
    tx.execute(
        "INSERT INTO schema_migrations VALUES(?1,?2,?3)",
        params![SCHEMA_VERSION, SCHEMA_FINGERPRINT, definition_digest],
    )
    .map_err(|_| "CONTROL_MIGRATION_FAILED")?;
    tx.pragma_update(None, "user_version", SCHEMA_VERSION)
        .map_err(|_| "CONTROL_MIGRATION_FAILED")?;
    tx.commit().map_err(|_| "CONTROL_MIGRATION_FAILED")
}
fn validate_schema(c: &Connection) -> Result<(), &'static str> {
    let (version, fingerprint, stored_definition): (i64, String, String) = c
        .query_row(
            "SELECT version,fingerprint,definition_digest FROM schema_migrations ORDER BY version DESC LIMIT 1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .map_err(|_| "CONTROL_SCHEMA_FINGERPRINT_INVALID")?;
    if version != SCHEMA_VERSION
        || fingerprint != SCHEMA_FINGERPRINT
        || stored_definition != schema_definition_digest(c)?
    {
        return Err("CONTROL_SCHEMA_FINGERPRINT_INVALID");
    }
    let reference =
        Connection::open_in_memory().map_err(|_| "CONTROL_SCHEMA_DEFINITION_INVALID")?;
    reference
        .execute_batch(SCHEMA_SQL)
        .map_err(|_| "CONTROL_SCHEMA_DEFINITION_INVALID")?;
    if schema_definition_map(c)? != schema_definition_map(&reference)? {
        return Err("CONTROL_SCHEMA_DEFINITION_INVALID");
    }
    for (name, kind) in [
        ("events", "table"),
        ("frontier", "table"),
        ("leases", "table"),
        ("captures", "table"),
        ("representations", "table"),
        ("passages", "table"),
        ("tombstones", "table"),
        ("captures_fixture_idx", "index"),
        ("events_gap_free", "trigger"),
        ("events_immutable_update", "trigger"),
        ("events_immutable_delete", "trigger"),
        ("tombstones_event_required", "trigger"),
        ("tombstones_immutable_update", "trigger"),
        ("tombstones_immutable_delete", "trigger"),
        ("schema_migrations_immutable_update", "trigger"),
        ("schema_migrations_immutable_delete", "trigger"),
        ("eligible_passages", "view"),
    ] {
        let count: i64 = c
            .query_row(
                "SELECT count(*) FROM sqlite_schema WHERE name=?1 AND type=?2",
                params![name, kind],
                |r| r.get(0),
            )
            .map_err(|_| "CONTROL_SCHEMA_DEFINITION_INVALID")?;
        if count != 1 {
            return Err("CONTROL_SCHEMA_DEFINITION_INVALID");
        }
    }
    Ok(())
}

fn schema_definition_map(
    c: &Connection,
) -> Result<BTreeMap<(String, String), String>, &'static str> {
    let mut statement=c.prepare("SELECT type,name,COALESCE(sql,'') FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").map_err(|_|"CONTROL_SCHEMA_DEFINITION_INVALID")?;
    let rows = statement
        .query_map([], |row| {
            Ok((
                (row.get::<_, String>(0)?, row.get::<_, String>(1)?),
                row.get::<_, String>(2)?,
            ))
        })
        .map_err(|_| "CONTROL_SCHEMA_DEFINITION_INVALID")?;
    let mut map = BTreeMap::new();
    for row in rows {
        let (key, value) = row.map_err(|_| "CONTROL_SCHEMA_DEFINITION_INVALID")?;
        map.insert(key, value);
    }
    Ok(map)
}

fn schema_definition_digest(c: &Connection) -> Result<String, &'static str> {
    let mut statement = c.prepare("SELECT type,name,COALESCE(sql,'') FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").map_err(|_| "CONTROL_SCHEMA_DEFINITION_INVALID")?;
    let rows = statement
        .query_map([], |row| {
            Ok(format!(
                "{}|{}|{}\n",
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?
            ))
        })
        .map_err(|_| "CONTROL_SCHEMA_DEFINITION_INVALID")?;
    let mut canonical = String::new();
    for row in rows {
        canonical.push_str(&row.map_err(|_| "CONTROL_SCHEMA_DEFINITION_INVALID")?);
    }
    Ok(digest(canonical.as_bytes()))
}
fn assert_sqlite(c: &Connection) -> Result<(), &'static str> {
    let (v, s): (String, String) = c
        .query_row("SELECT sqlite_version(),sqlite_source_id()", [], |r| {
            Ok((r.get(0)?, r.get(1)?))
        })
        .map_err(|_| "CONTROL_SQLITE_RUNTIME_UNAVAILABLE")?;
    if v != SQLITE_VERSION || s != SQLITE_SOURCE_ID {
        return Err("CONTROL_SQLITE_RUNTIME_MISMATCH");
    }
    Ok(())
}
fn assert_settings(c: &Connection) -> Result<(), &'static str> {
    let j: String = c
        .query_row("PRAGMA journal_mode", [], |r| r.get(0))
        .map_err(|_| "CONTROL_SQLITE_SETTINGS_MISMATCH")?;
    let f: i64 = c
        .query_row("PRAGMA foreign_keys", [], |r| r.get(0))
        .map_err(|_| "CONTROL_SQLITE_SETTINGS_MISMATCH")?;
    if !j.eq_ignore_ascii_case("wal") || f != 1 {
        return Err("CONTROL_SQLITE_SETTINGS_MISMATCH");
    }
    Ok(())
}
fn validate_proof(p: &FixtureProof, body: &[u8]) -> Result<(), &'static str> {
    if digest(body) != p.capture_digest {
        return Err("CAPTURE_PROOF_BINDING_MISMATCH");
    }
    let canonical = format!(
        "{}|{}|{}|{}|{}",
        p.capture_digest, p.receipt_id, p.anchor_ref, p.authority_ref, p.nonce
    );
    if p.authority_ref != "plugin-adr0024-fixture-authority-v1"
        || digest(canonical.as_bytes()) != p.proof_digest
    {
        return Err("CAPTURE_PROOF_INVALID");
    }
    Ok(())
}
fn proof_reused(
    tx: &Transaction<'_>,
    p: &FixtureProof,
    capture: &str,
) -> Result<bool, &'static str> {
    let existing: Option<String> = tx
        .query_row(
            "SELECT capture_id FROM captures WHERE nonce=?1 OR receipt_id=?2",
            params![p.nonce, p.receipt_id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|_| "CAPTURE_PROOF_READ_FAILED")?;
    Ok(existing.is_some_and(|id| id != capture))
}
fn replay_event(c: &Connection, id: &str, payload: &str) -> Result<bool, &'static str> {
    let existing: Option<String> = c
        .query_row(
            "SELECT payload_digest FROM events WHERE event_id=?1",
            [id],
            |r| r.get(0),
        )
        .optional()
        .map_err(|_| "CONTROL_EVENT_READ_FAILED")?;
    match existing {
        Some(value) if value == payload => Ok(true),
        Some(_) => Err("CONTROL_EVENT_COLLISION"),
        None => Ok(false),
    }
}
fn capture_event_payload(f: &AdmittedFixture, warc: &str, representation: &str) -> String {
    format!(
        "CAPTURE_COMMITTED|{}|{}|{}|{}|{}|{}",
        f.relative_path,
        f.proof.capture_digest,
        f.proof.proof_digest,
        f.proof.receipt_id,
        warc,
        representation
    )
}
fn tombstone_payload(fixture: &str, tombstone: &str, head: &str) -> String {
    format!(
        "TOMBSTONE_PUBLISHED|{fixture}|{tombstone}|{head}|{TOMBSTONE_REASON}|{TOMBSTONE_EFFECTIVE_AT}"
    )
}
fn warc_record(id: &str, fixture: &str, media: &str, body: &[u8], proof: &FixtureProof) -> Vec<u8> {
    let http = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: {media}\r\nContent-Length: {}\r\n\r\n",
        body.len()
    );
    let mut block = http.into_bytes();
    block.extend_from_slice(body);
    let header = format!(
        "WARC/1.1\r\nWARC-Type: response\r\nWARC-Date: 2026-08-19T00:00:00Z\r\nWARC-Record-ID: <urn:curiosity:{id}>\r\nWARC-Target-URI: urn:curiosity:fixture:{fixture}\r\nWARC-Block-Digest: sha256:{}\r\nWARC-Payload-Digest: sha256:{}\r\nContent-Type: application/http; msgtype=response\r\nContent-Length: {}\r\nX-Curiosity-Proof-Digest: {}\r\nX-Curiosity-Receipt-ID: {}\r\n\r\n",
        digest(&block),
        digest(body),
        block.len(),
        proof.proof_digest,
        proof.receipt_id
    );
    let mut record = header.into_bytes();
    record.extend(block);
    record.extend_from_slice(b"\r\n\r\n");
    record
}

fn verify_warc(
    record: &[u8],
    id: &str,
    fixture: &str,
    media: &str,
    body: &[u8],
    proof: &FixtureProof,
    expected_digest: &str,
) -> Result<(), &'static str> {
    if digest(record) != expected_digest || record != warc_record(id, fixture, media, body, proof) {
        return Err("RECOVERY_WARC_INVALID");
    }
    let split = record
        .windows(4)
        .position(|window| window == b"\r\n\r\n")
        .ok_or("RECOVERY_WARC_INVALID")?;
    let header = std::str::from_utf8(&record[..split]).map_err(|_| "RECOVERY_WARC_INVALID")?;
    if !header.starts_with("WARC/1.1\r\n") {
        return Err("RECOVERY_WARC_INVALID");
    }
    let length = header
        .lines()
        .find_map(|line| line.strip_prefix("Content-Length: "))
        .ok_or("RECOVERY_WARC_INVALID")?
        .parse::<usize>()
        .map_err(|_| "RECOVERY_WARC_INVALID")?;
    let start = split + 4;
    if record.len() != start + length + 4 || &record[record.len() - 4..] != b"\r\n\r\n" {
        return Err("RECOVERY_WARC_INVALID");
    }
    let block = &record[start..start + length];
    let block_digest = header
        .lines()
        .find_map(|line| line.strip_prefix("WARC-Block-Digest: sha256:"))
        .ok_or("RECOVERY_WARC_INVALID")?;
    let payload_digest = header
        .lines()
        .find_map(|line| line.strip_prefix("WARC-Payload-Digest: sha256:"))
        .ok_or("RECOVERY_WARC_INVALID")?;
    if digest(block) != block_digest || digest(body) != payload_digest {
        return Err("RECOVERY_WARC_INVALID");
    }
    Ok(())
}
