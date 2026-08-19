use std::collections::BTreeMap;

use super::model::{Code, Counters, Limits, Result, Telemetry, fail, fail_with_telemetry};

pub(super) trait ReadAtV1 {
    fn len(&self) -> u64;
    fn read_at(&self, offset: u64, destination: &mut [u8]) -> std::result::Result<(), ()>;
}

pub(super) type Sources<'a> = BTreeMap<&'a str, &'a dyn ReadAtV1>;

pub(super) struct Access<'a> {
    pub name: &'static str,
    pub source: &'a dyn ReadAtV1,
    pub sampled_len: u64,
}

impl Access<'_> {
    pub fn read(
        &self,
        offset: u64,
        destination: &mut [u8],
        limits: &Limits,
        telemetry: &mut Telemetry,
        counters: &Counters,
    ) -> Result<()> {
        if destination.is_empty() {
            return Ok(());
        }
        let length = u64::try_from(destination.len())
            .map_err(|_| fail(Code::BoundsInvalid, Some(self.name), Some(offset), counters))?;
        let end = offset
            .checked_add(length)
            .ok_or_else(|| fail(Code::BoundsInvalid, Some(self.name), Some(offset), counters))?;
        if end > self.sampled_len {
            return Err(fail(
                Code::BoundsInvalid,
                Some(self.name),
                Some(offset),
                counters,
            ));
        }
        let calls = telemetry.read_calls.checked_add(1).ok_or_else(|| {
            fail_with_telemetry(
                Code::ResourceLimit,
                Some(self.name),
                Some(offset),
                counters,
                telemetry,
            )
        })?;
        let bytes = telemetry
            .requested_read_bytes
            .checked_add(length)
            .ok_or_else(|| {
                fail_with_telemetry(
                    Code::ResourceLimit,
                    Some(self.name),
                    Some(offset),
                    counters,
                    telemetry,
                )
            })?;
        if calls > limits.max_read_calls || bytes > limits.max_read_bytes {
            return Err(fail_with_telemetry(
                Code::ResourceLimit,
                Some(self.name),
                Some(offset),
                counters,
                telemetry,
            ));
        }
        telemetry.read_calls = calls;
        telemetry.requested_read_bytes = bytes;
        self.source.read_at(offset, destination).map_err(|()| {
            fail_with_telemetry(
                Code::IoReadFailed,
                Some(self.name),
                Some(offset),
                counters,
                telemetry,
            )
        })
    }
    pub fn finish(&self, counters: &Counters, telemetry: &Telemetry) -> Result<()> {
        if self.source.len() != self.sampled_len {
            return Err(fail_with_telemetry(
                Code::IoReadFailed,
                Some(self.name),
                None,
                counters,
                telemetry,
            ));
        }
        Ok(())
    }
}
