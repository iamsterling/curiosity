use std::sync::atomic::{AtomicU8, Ordering};

#[derive(Debug, Default)]
pub(crate) struct ControlFlowCounters {
    input_copy_operations: u8,
    input_bytes_copied: usize,
    async_work_create_attempts: u8,
    async_work_create_successes: u8,
    async_work_queue_attempts: u8,
    async_work_queue_successes: AtomicU8,
    worker_callback_entries: u8,
    dispatcher_invocations: u8,
    completion_callback_entries: u8,
    settlement_attempts: u8,
}

#[cfg(any(test, sdk_probe = "control_flow_observation", phase_fixture))]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) struct CounterSnapshot {
    pub(crate) input_copy_operations: u8,
    pub(crate) input_bytes_copied: usize,
    pub(crate) async_work_create_attempts: u8,
    pub(crate) async_work_create_successes: u8,
    pub(crate) async_work_queue_attempts: u8,
    pub(crate) async_work_queue_successes: u8,
    pub(crate) worker_callback_entries: u8,
    pub(crate) dispatcher_invocations: u8,
    pub(crate) completion_callback_entries: u8,
    pub(crate) settlement_attempts: u8,
}

impl ControlFlowCounters {
    pub(crate) fn record_input_copy(&mut self, byte_length: usize) {
        self.input_copy_operations += 1;
        self.input_bytes_copied += byte_length;
    }

    pub(crate) fn record_async_work_create_attempt(&mut self) {
        self.async_work_create_attempts += 1;
    }

    pub(crate) fn record_async_work_create_success(&mut self) {
        self.async_work_create_successes += 1;
    }

    pub(crate) fn record_async_work_queue_attempt(&mut self) {
        self.async_work_queue_attempts += 1;
    }

    pub(crate) fn record_async_work_queue_success(&self) {
        self.async_work_queue_successes.store(1, Ordering::Release);
    }

    pub(crate) fn record_worker_callback_entry(&mut self) {
        self.worker_callback_entries += 1;
    }

    pub(crate) fn record_dispatcher_invocation(&mut self) {
        self.dispatcher_invocations += 1;
    }

    pub(crate) fn record_completion_callback_entry(&mut self) {
        self.completion_callback_entries += 1;
    }

    pub(crate) fn record_settlement_attempt(&mut self) {
        self.settlement_attempts += 1;
    }

    #[cfg(any(test, sdk_probe = "control_flow_observation", phase_fixture))]
    pub(crate) fn checked(&self) -> Option<CounterSnapshot> {
        let counters = CounterSnapshot {
            input_copy_operations: self.input_copy_operations,
            input_bytes_copied: self.input_bytes_copied,
            async_work_create_attempts: self.async_work_create_attempts,
            async_work_create_successes: self.async_work_create_successes,
            async_work_queue_attempts: self.async_work_queue_attempts,
            async_work_queue_successes: self.async_work_queue_successes.load(Ordering::Acquire),
            worker_callback_entries: self.worker_callback_entries,
            dispatcher_invocations: self.dispatcher_invocations,
            completion_callback_entries: self.completion_callback_entries,
            settlement_attempts: self.settlement_attempts,
        };
        let binary = [
            counters.input_copy_operations,
            counters.async_work_create_attempts,
            counters.async_work_create_successes,
            counters.async_work_queue_attempts,
            counters.async_work_queue_successes,
            counters.worker_callback_entries,
            counters.dispatcher_invocations,
            counters.completion_callback_entries,
            counters.settlement_attempts,
        ];
        (counters.input_bytes_copied <= 1_048_576
            && binary.into_iter().all(|value| value <= 1)
            && counters.async_work_create_successes <= counters.async_work_create_attempts
            && counters.async_work_queue_successes <= counters.async_work_queue_attempts)
            .then_some(counters)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum ControlledPhase {
    Entry,
    Worker,
    Completion,
}

pub(crate) trait PhaseController {
    fn before_phase(&self, request_id: usize, phase: ControlledPhase);
    fn after_phase(&self, request_id: usize, phase: ControlledPhase);
}

#[derive(Clone, Copy, Debug, Default)]
#[cfg_attr(phase_fixture, allow(dead_code))]
pub(crate) struct NoopPhaseController;

impl PhaseController for NoopPhaseController {
    fn before_phase(&self, _: usize, _: ControlledPhase) {}

    fn after_phase(&self, _: usize, _: ControlledPhase) {}
}

pub(crate) fn record_entry_phase(
    counters: &mut ControlFlowCounters,
    request_id: usize,
    byte_length: usize,
    controller: &impl PhaseController,
) {
    controller.before_phase(request_id, ControlledPhase::Entry);
    counters.record_input_copy(byte_length);
    controller.after_phase(request_id, ControlledPhase::Entry);
}

pub(crate) fn record_worker_phase(
    counters: &mut ControlFlowCounters,
    request_id: usize,
    controller: &impl PhaseController,
) {
    controller.before_phase(request_id, ControlledPhase::Worker);
    counters.record_worker_callback_entry();
    controller.after_phase(request_id, ControlledPhase::Worker);
}

pub(crate) fn record_completion_phase(
    counters: &mut ControlFlowCounters,
    request_id: usize,
    controller: &impl PhaseController,
) {
    controller.before_phase(request_id, ControlledPhase::Completion);
    counters.record_completion_callback_entry();
    controller.after_phase(request_id, ControlledPhase::Completion);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn records_the_complete_success_vector_and_rejects_overflow() {
        let mut counters = ControlFlowCounters::default();
        counters.record_input_copy(7);
        counters.record_async_work_create_attempt();
        counters.record_async_work_create_success();
        counters.record_async_work_queue_attempt();
        counters.record_async_work_queue_success();
        counters.record_worker_callback_entry();
        counters.record_dispatcher_invocation();
        counters.record_completion_callback_entry();
        counters.record_settlement_attempt();
        let snapshot = counters.checked().unwrap();
        assert_eq!(
            [
                snapshot.input_copy_operations as usize,
                snapshot.input_bytes_copied,
                snapshot.async_work_create_attempts as usize,
                snapshot.async_work_create_successes as usize,
                snapshot.async_work_queue_attempts as usize,
                snapshot.async_work_queue_successes as usize,
                snapshot.worker_callback_entries as usize,
                snapshot.dispatcher_invocations as usize,
                snapshot.completion_callback_entries as usize,
                snapshot.settlement_attempts as usize,
            ],
            [1, 7, 1, 1, 1, 1, 1, 1, 1, 1]
        );
        counters.record_settlement_attempt();
        assert!(counters.checked().is_none());
    }
}
