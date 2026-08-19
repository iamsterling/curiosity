#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(super) struct TokenTooLong;

pub(super) fn analyze(value: &str) -> Result<Vec<Vec<u8>>, TokenTooLong> {
    let mut output = Vec::new();
    visit(value, |token| output.push(token.to_vec()))?;
    Ok(output)
}

pub(super) fn analyze_count(value: &str) -> Result<usize, TokenTooLong> {
    let mut count = 0usize;
    visit(value, |_| count += 1)?;
    Ok(count)
}

pub(super) fn analyze_metrics(value: &str) -> Result<(u64, u64), TokenTooLong> {
    let mut count = Some(0u64);
    let mut bytes = Some(0u64);
    visit(value, |token| {
        count = count.and_then(|value| value.checked_add(1));
        bytes = bytes.and_then(|value| value.checked_add(token.len() as u64));
    })?;
    Ok((count.ok_or(TokenTooLong)?, bytes.ok_or(TokenTooLong)?))
}

pub(super) fn is_single_token(value: &str, expected: &[u8]) -> Result<bool, TokenTooLong> {
    let mut count = 0usize;
    let mut equal = false;
    visit(value, |token| {
        count += 1;
        equal = token == expected;
    })?;
    Ok(count == 1 && equal)
}

pub(super) fn term_frequency(value: &str, expected: &[u8]) -> Result<usize, TokenTooLong> {
    let mut count = 0usize;
    visit(value, |token| count += usize::from(token == expected))?;
    Ok(count)
}

fn visit(mut value: &str, mut emit: impl FnMut(&[u8])) -> Result<(), TokenTooLong> {
    while !value.is_empty() {
        let character = value.chars().next().ok_or(TokenTooLong)?;
        if character.is_ascii_alphanumeric() {
            let length = value.bytes().take_while(u8::is_ascii_alphanumeric).count();
            if length > 64 {
                return Err(TokenTooLong);
            }
            let mut token = [0u8; 64];
            for (output, input) in token[..length].iter_mut().zip(value.bytes()) {
                *output = input.to_ascii_lowercase();
            }
            emit(&token[..length]);
            value = &value[length..];
            continue;
        }
        let length = character.len_utf8();
        if !character.is_ascii() {
            emit(&value.as_bytes()[..length]);
        }
        value = &value[length..];
    }
    Ok(())
}
