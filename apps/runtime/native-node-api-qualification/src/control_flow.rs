pub(crate) use super::phase_counter_core::ControlFlowCounters;

#[cfg(sdk_probe = "control_flow_observation")]
impl ControlFlowCounters {
    pub(crate) fn envelope(&self, parity: &[u8]) -> Option<Vec<u8>> {
        let counters = self.checked()?;
        let header = format!(
            "{{\"schemaVersion\":1,\"kind\":\"control_flow_observation\",\"counters\":{{\"inputCopyOperations\":{},\"inputBytesCopied\":{},\"asyncWorkCreateAttempts\":{},\"asyncWorkCreateSuccesses\":{},\"asyncWorkQueueAttempts\":{},\"asyncWorkQueueSuccesses\":{},\"workerCallbackEntries\":{},\"dispatcherInvocations\":{},\"completionCallbackEntries\":{},\"settlementAttempts\":{}}}}}\n",
            counters.input_copy_operations,
            counters.input_bytes_copied,
            counters.async_work_create_attempts,
            counters.async_work_create_successes,
            counters.async_work_queue_attempts,
            counters.async_work_queue_successes,
            counters.worker_callback_entries,
            counters.dispatcher_invocations,
            counters.completion_callback_entries,
            counters.settlement_attempts,
        );
        let mut output = Vec::new();
        output.try_reserve_exact(header.len() + parity.len()).ok()?;
        output.extend_from_slice(header.as_bytes());
        output.extend_from_slice(parity);
        Some(output)
    }
}
