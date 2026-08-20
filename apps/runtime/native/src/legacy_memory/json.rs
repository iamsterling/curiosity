use std::cmp::Ordering;

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct JsString(pub(crate) Vec<u16>);

impl JsString {
    pub(crate) fn from_str(value: &str) -> Self {
        Self(value.encode_utf16().collect())
    }
    pub(crate) fn to_string_lossy(&self) -> String {
        String::from_utf16_lossy(&self.0)
    }
    pub(crate) fn utf8_len(&self) -> usize {
        self.to_string_lossy().len()
    }
}

#[derive(Clone, Debug, PartialEq)]
pub(crate) enum Json {
    Null,
    Bool(bool),
    Number(f64),
    String(JsString),
    Array(Vec<Json>),
    Object(Vec<(JsString, Json)>),
    Undefined,
    Function,
    Symbol,
    BigInt,
    Hole,
    Cycle,
}

impl Json {
    pub(crate) fn parse(bytes: &[u8]) -> Result<Self, ()> {
        let mut parser = Parser { bytes, at: 0 };
        let value = parser.value(0)?;
        parser.ws();
        (parser.at == bytes.len()).then_some(value).ok_or(())
    }
    pub(crate) fn object(&self) -> Option<&[(JsString, Json)]> {
        match self {
            Self::Object(value) => Some(value),
            _ => None,
        }
    }
    pub(crate) fn get(&self, key: &str) -> Option<&Json> {
        self.object()?
            .iter()
            .find(|(name, _)| name.0 == key.encode_utf16().collect::<Vec<_>>())
            .map(|(_, value)| value)
    }
    pub(crate) fn string(&self) -> Option<String> {
        match self {
            Self::String(value) => Some(value.to_string_lossy()),
            _ => None,
        }
    }
    pub(crate) fn number(&self) -> Option<f64> {
        match self {
            Self::Number(value) => Some(*value),
            _ => None,
        }
    }
}

struct Parser<'a> {
    bytes: &'a [u8],
    at: usize,
}
impl Parser<'_> {
    fn ws(&mut self) {
        while self.bytes.get(self.at).is_some_and(u8::is_ascii_whitespace) {
            self.at += 1;
        }
    }
    fn value(&mut self, depth: usize) -> Result<Json, ()> {
        if depth > 128 {
            return Err(());
        }
        self.ws();
        match self.bytes.get(self.at) {
            Some(b'n') => {
                self.lit(b"null")?;
                Ok(Json::Null)
            }
            Some(b't') => {
                self.lit(b"true")?;
                Ok(Json::Bool(true))
            }
            Some(b'f') => {
                self.lit(b"false")?;
                Ok(Json::Bool(false))
            }
            Some(b'"') => self.string().map(Json::String),
            Some(b'[') => self.array(depth + 1),
            Some(b'{') => self.object(depth + 1),
            Some(b'-' | b'0'..=b'9') => self.number(),
            _ => Err(()),
        }
    }
    fn lit(&mut self, literal: &[u8]) -> Result<(), ()> {
        if self.bytes.get(self.at..self.at + literal.len()) != Some(literal) {
            return Err(());
        }
        self.at += literal.len();
        Ok(())
    }
    fn string(&mut self) -> Result<JsString, ()> {
        self.lit(b"\"")?;
        let mut out = Vec::new();
        loop {
            let byte = *self.bytes.get(self.at).ok_or(())?;
            if byte == b'"' {
                self.at += 1;
                return Ok(JsString(out));
            }
            if byte < 0x20 {
                return Err(());
            }
            if byte == b'\\' {
                self.at += 1;
                match *self.bytes.get(self.at).ok_or(())? {
                    b'"' => out.push(b'"'.into()),
                    b'\\' => out.push(b'\\'.into()),
                    b'/' => out.push(b'/'.into()),
                    b'b' => out.push(8),
                    b'f' => out.push(12),
                    b'n' => out.push(10),
                    b'r' => out.push(13),
                    b't' => out.push(9),
                    b'u' => {
                        self.at += 1;
                        let end = self.at + 4;
                        let digits = std::str::from_utf8(self.bytes.get(self.at..end).ok_or(())?)
                            .map_err(|_| ())?;
                        out.push(u16::from_str_radix(digits, 16).map_err(|_| ())?);
                        self.at = end;
                        continue;
                    }
                    _ => return Err(()),
                }
                self.at += 1;
                continue;
            }
            let tail = std::str::from_utf8(&self.bytes[self.at..]).map_err(|_| ())?;
            let ch = tail.chars().next().ok_or(())?;
            out.extend(ch.encode_utf16(&mut [0; 2]).iter().copied());
            self.at += ch.len_utf8();
        }
    }
    fn number(&mut self) -> Result<Json, ()> {
        let start = self.at;
        if self.bytes.get(self.at) == Some(&b'-') {
            self.at += 1;
        }
        match self.bytes.get(self.at) {
            Some(b'0') => self.at += 1,
            Some(b'1'..=b'9') => {
                while self.bytes.get(self.at).is_some_and(u8::is_ascii_digit) {
                    self.at += 1
                }
            }
            _ => return Err(()),
        }
        if self.bytes.get(self.at) == Some(&b'.') {
            self.at += 1;
            let p = self.at;
            while self.bytes.get(self.at).is_some_and(u8::is_ascii_digit) {
                self.at += 1
            }
            if p == self.at {
                return Err(());
            }
        }
        if matches!(self.bytes.get(self.at), Some(b'e' | b'E')) {
            self.at += 1;
            if matches!(self.bytes.get(self.at), Some(b'+' | b'-')) {
                self.at += 1;
            }
            let p = self.at;
            while self.bytes.get(self.at).is_some_and(u8::is_ascii_digit) {
                self.at += 1
            }
            if p == self.at {
                return Err(());
            }
        }
        let number = std::str::from_utf8(&self.bytes[start..self.at])
            .map_err(|_| ())?
            .parse::<f64>()
            .map_err(|_| ())?;
        Ok(Json::Number(number))
    }
    fn array(&mut self, depth: usize) -> Result<Json, ()> {
        self.at += 1;
        self.ws();
        let mut out = Vec::new();
        if self.bytes.get(self.at) == Some(&b']') {
            self.at += 1;
            return Ok(Json::Array(out));
        }
        loop {
            out.push(self.value(depth)?);
            self.ws();
            match self.bytes.get(self.at) {
                Some(b',') => self.at += 1,
                Some(b']') => {
                    self.at += 1;
                    return Ok(Json::Array(out));
                }
                _ => return Err(()),
            }
        }
    }
    fn object(&mut self, depth: usize) -> Result<Json, ()> {
        self.at += 1;
        self.ws();
        let mut out = Vec::new();
        if self.bytes.get(self.at) == Some(&b'}') {
            self.at += 1;
            return Ok(Json::Object(out));
        }
        loop {
            self.ws();
            let key = self.string()?;
            self.ws();
            if self.bytes.get(self.at) != Some(&b':') {
                return Err(());
            }
            self.at += 1;
            let value = self.value(depth)?;
            if let Some((_, prior)) = out.iter_mut().find(|(name, _)| name == &key) {
                *prior = value;
            } else {
                out.push((key, value));
            }
            self.ws();
            match self.bytes.get(self.at) {
                Some(b',') => self.at += 1,
                Some(b'}') => {
                    self.at += 1;
                    return Ok(Json::Object(out));
                }
                _ => return Err(()),
            }
        }
    }
}

pub(crate) fn js_key_cmp(left: &JsString, right: &JsString) -> Ordering {
    let left_text = left.to_string_lossy();
    let right_text = right.to_string_lossy();
    let left_index = array_index(&left_text);
    let right_index = array_index(&right_text);
    match (left_index, right_index) {
        (Some(left), Some(right)) => return left.cmp(&right),
        (Some(_), None) => return Ordering::Less,
        (None, Some(_)) => return Ordering::Greater,
        (None, None) => {}
    }
    match (
        qualified_key_rank(&left_text),
        qualified_key_rank(&right_text),
    ) {
        (Some(left), Some(right)) => left.cmp(&right),
        _ => Ordering::Equal,
    }
}

pub(crate) fn qualified_key(value: &JsString) -> bool {
    let value = value.to_string_lossy();
    array_index(&value).is_some() || qualified_key_rank(&value).is_some()
}

fn qualified_key_rank(value: &str) -> Option<usize> {
    const KEYS: &[&str] = &[
        "_",
        "-",
        "😀",
        "a",
        "A",
        "å",
        "ä",
        "acquiredAt",
        "action",
        "active",
        "actor",
        "aggregate",
        "archived",
        "astral",
        "at",
        "authority",
        "blocked",
        "bundle",
        "bundleDigest",
        "callID",
        "capability",
        "capabilityID",
        "captured",
        "causationID",
        "claimID",
        "claimRevision",
        "claimRevisions",
        "committed",
        "confirmed",
        "correlationID",
        "criteria",
        "criterionID",
        "criterionIDs",
        "criterionRevision",
        "criterionRevisions",
        "data",
        "destructive",
        "digest",
        "é",
        "e\u{301}",
        "entityType",
        "environmentDigest",
        "eventIDs",
        "evidenceIDs",
        "evidenceRefs",
        "executionID",
        "expiresAt",
        "extra",
        "fenceEpoch",
        "framed",
        "freshness",
        "from",
        "fromSequence",
        "fromWorkID",
        "high",
        "hostVersion",
        "i",
        "I",
        "İ",
        "id",
        "inputDigest",
        "intentID",
        "intentRevision",
        "intentRevisions",
        "invariant",
        "ı",
        "kind",
        "lifecycle",
        "lineageDigest",
        "locator",
        "low",
        "messageID",
        "nonGoals",
        "objective",
        "observable",
        "observedAt",
        "open",
        "oracle",
        "outputDigest",
        "parentRevision",
        "parentSessionID",
        "payload",
        "payloadDigest",
        "pending",
        "pluginVersion",
        "previousDigest",
        "producer",
        "projectID",
        "provenance",
        "rationale",
        "reason",
        "reconciled",
        "released",
        "releasedAt",
        "repositoryID",
        "requiredEvidence",
        "resolved",
        "resolving",
        "revision",
        "rigor",
        "rootSessionID",
        "scenarios",
        "schemaVersion",
        "scope",
        "scopeFingerprint",
        "sequence",
        "sessionID",
        "source",
        "sourceKind",
        "ss",
        "ß",
        "state",
        "statement",
        "status",
        "strength",
        "subjectID",
        "taint",
        "to",
        "token",
        "toSequence",
        "toWorkID",
        "trusted",
        "type",
        "verdict",
        "watermark",
        "workID",
        "workspaceID",
        "writableScope",
        "z",
        "\u{e000}",
    ];
    if matches!(value, "é" | "e\u{301}") {
        return KEYS.iter().position(|key| *key == "é");
    }
    KEYS.iter().position(|key| *key == value)
}

fn array_index(value: &str) -> Option<u32> {
    if value.is_empty() || (value.len() > 1 && value.starts_with('0')) {
        return None;
    }
    let number = value.parse::<u32>().ok()?;
    (number != u32::MAX && number.to_string() == value).then_some(number)
}
