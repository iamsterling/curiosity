use napi_sys::{
    napi_deferred, napi_env, napi_reject_deferred, napi_resolve_deferred, napi_status, napi_value,
};

use super::control_flow::ControlFlowCounters;
use super::settlement_core::{
    SettlementAdmission, SettlementFailure, SettlementGate, settle_with_adapter,
};
use super::{TransportFailure, ok};

pub(crate) struct DeferredSettlement {
    deferred: napi_deferred,
    gate: SettlementGate,
}

#[derive(Clone, Copy)]
pub(crate) enum SettlementKind {
    Resolve,
    Reject,
}

impl DeferredSettlement {
    pub(crate) fn new(deferred: napi_deferred) -> Self {
        Self {
            deferred,
            gate: SettlementGate::default(),
        }
    }

    pub(crate) fn attempted(&self) -> bool {
        self.gate.attempted()
    }
}

type RawSettlement = unsafe extern "C" fn(napi_env, napi_deferred, napi_value) -> napi_status;

pub(crate) fn settle_deferred(
    env: napi_env,
    settlement: &DeferredSettlement,
    counters: &mut ControlFlowCounters,
    kind: SettlementKind,
    payload_builder: impl FnOnce(&ControlFlowCounters) -> Result<napi_value, TransportFailure>,
) -> Result<SettlementAdmission, TransportFailure> {
    let raw_settlement: RawSettlement = match kind {
        SettlementKind::Resolve => napi_resolve_deferred,
        SettlementKind::Reject => napi_reject_deferred,
    };
    settle_with_adapter(
        &settlement.gate,
        || {
            counters.record_settlement_attempt();
            payload_builder(counters)
        },
        |value| {
            // SAFETY: The shared gate admits at most one raw call for this deferred.
            ok(unsafe { raw_settlement(env, settlement.deferred, value) })
        },
    )
    .map_err(|failure| match failure {
        SettlementFailure::Payload(error) | SettlementFailure::RawAdapter(error) => error,
        SettlementFailure::Panic => TransportFailure::Panic,
    })
}
