use std::panic::{AssertUnwindSafe, catch_unwind};
use std::sync::atomic::{AtomicU8, Ordering};

const UNATTEMPTED: u8 = 0;
const ATTEMPTED: u8 = 1;

#[derive(Debug, Default)]
pub struct SettlementGate {
    state: AtomicU8,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SettlementAdmission {
    Admitted,
    AlreadyAttempted,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SettlementFailure<E> {
    Payload(E),
    RawAdapter(E),
    Panic,
}

impl SettlementGate {
    pub fn attempted(&self) -> bool {
        self.state.load(Ordering::Acquire) == ATTEMPTED
    }

    fn claim(&self) -> SettlementAdmission {
        match self.state.compare_exchange(
            UNATTEMPTED,
            ATTEMPTED,
            Ordering::AcqRel,
            Ordering::Acquire,
        ) {
            Ok(_) => SettlementAdmission::Admitted,
            Err(_) => SettlementAdmission::AlreadyAttempted,
        }
    }
}

pub fn settle_with_adapter<T, E>(
    gate: &SettlementGate,
    admitted_payload_builder: impl FnOnce() -> Result<T, E>,
    raw_adapter: impl FnOnce(T) -> Result<(), E>,
) -> Result<SettlementAdmission, SettlementFailure<E>> {
    let admission = gate.claim();
    if admission == SettlementAdmission::AlreadyAttempted {
        return Ok(admission);
    }
    catch_unwind(AssertUnwindSafe(|| {
        let payload = admitted_payload_builder().map_err(SettlementFailure::Payload)?;
        raw_adapter(payload).map_err(SettlementFailure::RawAdapter)?;
        Ok(SettlementAdmission::Admitted)
    }))
    .unwrap_or(Err(SettlementFailure::Panic))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn duplicate_admission_never_runs_callbacks() {
        let gate = SettlementGate::default();
        assert_eq!(
            settle_with_adapter(&gate, || Ok::<_, ()>(()), |_| Ok(())),
            Ok(SettlementAdmission::Admitted)
        );
        let duplicate: Result<SettlementAdmission, SettlementFailure<()>> = settle_with_adapter(
            &gate,
            || panic!("duplicate payload"),
            |_: ()| panic!("duplicate raw adapter"),
        );
        assert_eq!(duplicate, Ok(SettlementAdmission::AlreadyAttempted));
    }
}
