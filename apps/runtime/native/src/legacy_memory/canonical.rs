use super::{
    diagnostic::{Code, Failure, fail},
    json::{JsString, Json, js_key_cmp, qualified_key},
};

pub(crate) fn canonical_json(value: &Json) -> Result<String, Failure> {
    let mut out = String::new();
    write_value(value, &mut out, false)?;
    Ok(out)
}

fn write_value(value: &Json, out: &mut String, array: bool) -> Result<(), Failure> {
    match value {
        Json::Null => out.push_str("null"),
        Json::Bool(value) => out.push_str(if *value { "true" } else { "false" }),
        Json::Number(value) => out.push_str(&js_number(*value)),
        Json::String(value) => write_string(value, out),
        Json::Array(items) => {
            out.push('[');
            for (index, item) in items.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                if matches!(
                    item,
                    Json::Undefined | Json::Function | Json::Symbol | Json::Hole
                ) {
                    out.push_str("null");
                } else {
                    write_value(item, out, true)?;
                }
            }
            out.push(']');
        }
        Json::Object(entries) => {
            out.push('{');
            let mut retained: Vec<_> = entries
                .iter()
                .filter(|(_, value)| {
                    !matches!(value, Json::Undefined | Json::Function | Json::Symbol)
                })
                .collect();
            if retained.len() > 1 && retained.iter().any(|(key, _)| !qualified_key(key)) {
                return Err(fail(Code::ParityCollationUnsupported, None));
            }
            retained.sort_by(|(a, _), (b, _)| js_key_cmp(a, b));
            for (index, (key, item)) in retained.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                write_string(key, out);
                out.push(':');
                write_value(item, out, false)?;
            }
            out.push('}');
        }
        Json::Undefined | Json::Function | Json::Symbol if !array => {
            return Err(fail(Code::ParityCanonicalResultUndefined, None));
        }
        Json::BigInt | Json::Cycle => return Err(fail(Code::ParityCanonicalizationFailed, None)),
        Json::Hole | Json::Undefined | Json::Function | Json::Symbol => out.push_str("null"),
    }
    Ok(())
}

pub(crate) fn stringify(value: &Json) -> Result<String, Failure> {
    let mut out = String::new();
    write_plain(value, &mut out, false)?;
    Ok(out)
}
fn write_plain(value: &Json, out: &mut String, array: bool) -> Result<(), Failure> {
    match value {
        Json::Object(entries) => {
            out.push('{');
            let mut first = true;
            for (key, value) in entries.iter().filter(|(_, value)| {
                !matches!(value, Json::Undefined | Json::Function | Json::Symbol)
            }) {
                if !first {
                    out.push(',')
                }
                first = false;
                write_string(key, out);
                out.push(':');
                write_plain(value, out, false)?
            }
            out.push('}')
        }
        Json::Array(items) => {
            out.push('[');
            for (index, value) in items.iter().enumerate() {
                if index > 0 {
                    out.push(',')
                }
                if matches!(
                    value,
                    Json::Undefined | Json::Function | Json::Symbol | Json::Hole
                ) {
                    out.push_str("null")
                } else {
                    write_plain(value, out, true)?
                }
            }
            out.push(']')
        }
        Json::Null => out.push_str("null"),
        Json::Bool(v) => out.push_str(if *v { "true" } else { "false" }),
        Json::Number(v) => out.push_str(&js_number(*v)),
        Json::String(v) => write_string(v, out),
        Json::Undefined | Json::Function | Json::Symbol if !array => {
            return Err(fail(Code::ParityCanonicalResultUndefined, None));
        }
        Json::BigInt | Json::Cycle => return Err(fail(Code::ParityCanonicalizationFailed, None)),
        _ => out.push_str("null"),
    };
    Ok(())
}

pub(crate) fn write_string(value: &JsString, out: &mut String) {
    out.push('"');
    let mut at = 0;
    while at < value.0.len() {
        let unit = value.0[at];
        match unit {
            0x08 => out.push_str("\\b"),
            0x09 => out.push_str("\\t"),
            0x0a => out.push_str("\\n"),
            0x0c => out.push_str("\\f"),
            0x0d => out.push_str("\\r"),
            0x22 => out.push_str("\\\""),
            0x5c => out.push_str("\\\\"),
            0x00..=0x1f => out.push_str(&format!("\\u{unit:04x}")),
            0xd800..=0xdbff
                if value
                    .0
                    .get(at + 1)
                    .is_some_and(|next| (0xdc00..=0xdfff).contains(next)) =>
            {
                let scalar = 0x10000
                    + ((u32::from(unit) - 0xd800) << 10)
                    + (u32::from(value.0[at + 1]) - 0xdc00);
                if let Some(ch) = char::from_u32(scalar) {
                    out.push(ch);
                }
                at += 1;
            }
            0xd800..=0xdfff => out.push_str(&format!("\\u{unit:04x}")),
            _ => {
                if let Some(ch) = char::from_u32(unit.into()) {
                    out.push(ch);
                }
            }
        }
        at += 1;
    }
    out.push('"');
}

pub(crate) fn js_number(value: f64) -> String {
    if !value.is_finite() {
        return "null".into();
    }
    if value == 0.0 {
        return "0".into();
    }
    ryu_js::Buffer::new().format_finite(value).to_owned()
}

pub(crate) fn sha256_text(bytes: &[u8]) -> String {
    format!("sha256:{}", hex(&Sha256::digest(bytes)))
}
fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

struct Sha256 {
    h: [u32; 8],
    data: Vec<u8>,
}
impl Sha256 {
    fn digest(input: &[u8]) -> [u8; 32] {
        let mut state = Self {
            h: [
                0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
                0x5be0cd19,
            ],
            data: input.to_vec(),
        };
        let bits = (state.data.len() as u64) * 8;
        state.data.push(0x80);
        while state.data.len() % 64 != 56 {
            state.data.push(0);
        }
        state.data.extend(bits.to_be_bytes());
        for block in state.data.chunks_exact(64) {
            let mut b = [0; 64];
            b.copy_from_slice(block);
            compress(&mut state.h, &b);
        }
        let mut out = [0; 32];
        for (chunk, value) in out.chunks_exact_mut(4).zip(state.h) {
            chunk.copy_from_slice(&value.to_be_bytes());
        }
        out
    }
}
fn compress(h: &mut [u32; 8], b: &[u8; 64]) {
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];
    let mut w = [0u32; 64];
    for (i, c) in b.chunks_exact(4).enumerate() {
        w[i] = u32::from_be_bytes([c[0], c[1], c[2], c[3]])
    }
    for i in 16..64 {
        let a = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
        let z = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
        w[i] = w[i - 16]
            .wrapping_add(a)
            .wrapping_add(w[i - 7])
            .wrapping_add(z)
    }
    let mut v = *h;
    for i in 0..64 {
        let s1 = v[4].rotate_right(6) ^ v[4].rotate_right(11) ^ v[4].rotate_right(25);
        let ch = (v[4] & v[5]) ^ (!v[4] & v[6]);
        let t1 = v[7]
            .wrapping_add(s1)
            .wrapping_add(ch)
            .wrapping_add(K[i])
            .wrapping_add(w[i]);
        let s0 = v[0].rotate_right(2) ^ v[0].rotate_right(13) ^ v[0].rotate_right(22);
        let maj = (v[0] & v[1]) ^ (v[0] & v[2]) ^ (v[1] & v[2]);
        let t2 = s0.wrapping_add(maj);
        v = [
            t1.wrapping_add(t2),
            v[0],
            v[1],
            v[2],
            v[3].wrapping_add(t1),
            v[4],
            v[5],
            v[6],
        ]
    }
    for i in 0..8 {
        h[i] = h[i].wrapping_add(v[i])
    }
}
