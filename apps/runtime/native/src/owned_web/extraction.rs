use scraper::{Html, Selector};

pub(super) const MAX_BODY_BYTES: usize = 1_048_576;
const MAX_OUTPUT_BYTES: usize = 262_144;

#[derive(Debug)]
pub(super) struct Extracted {
    pub text: String,
    pub selector: String,
}

pub(super) fn extract(media_type: &str, body: &[u8]) -> Result<Extracted, &'static str> {
    if body.len() > MAX_BODY_BYTES {
        return Err("EXTRACT_BODY_LIMIT_EXCEEDED");
    }
    let source = std::str::from_utf8(body).map_err(|_| "EXTRACT_UTF8_REQUIRED")?;
    let text = match media_type {
        "text/plain" => source.to_owned(),
        "text/html" => extract_html(source)?,
        _ => return Err("MIME_UNSUPPORTED"),
    };
    if text.len() > MAX_OUTPUT_BYTES {
        return Err("EXTRACT_OUTPUT_LIMIT_EXCEEDED");
    }
    Ok(Extracted {
        text,
        selector: "representation:utf8-bytes:0".into(),
    })
}

fn extract_html(source: &str) -> Result<String, &'static str> {
    let document = Html::parse_document(source);
    let blocked = Selector::parse("script,style,noscript,iframe,object,embed,svg,canvas")
        .map_err(|_| "EXTRACT_POLICY_INVALID")?;
    if document.select(&blocked).next().is_some() {
        return Err("EXTRACT_ACTIVE_CONTENT_REJECTED");
    }
    let body = Selector::parse("body").map_err(|_| "EXTRACT_POLICY_INVALID")?;
    let root = document
        .select(&body)
        .next()
        .map_or(document.root_element(), |node| node);
    let text = root
        .text()
        .map(str::trim)
        .filter(|part| !part.is_empty())
        .collect::<Vec<_>>()
        .join(" ");
    Ok(text)
}
