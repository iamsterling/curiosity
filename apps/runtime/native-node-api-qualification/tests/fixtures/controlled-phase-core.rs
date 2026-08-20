#[path = "../../src/phase_counter_core.rs"]
mod phase_counter_core;

use std::fmt::Write as _;
use std::sync::{Arc, Condvar, Mutex};
use std::thread;

use phase_counter_core::{
    ControlFlowCounters, ControlledPhase, CounterSnapshot, PhaseController,
    record_completion_phase, record_entry_phase, record_worker_phase,
};

struct Event {
    sequence: usize,
    request_id: usize,
    phase: ControlledPhase,
}

struct ControllerState {
    phase_index: usize,
    order_index: usize,
    events: Vec<Event>,
}

struct ExplicitController {
    width: usize,
    orders: [Vec<usize>; 3],
    state: Mutex<ControllerState>,
    changed: Condvar,
}

struct RequestRecord {
    request_id: usize,
    byte_length: usize,
    counters: CounterSnapshot,
}

impl ExplicitController {
    fn new(width: usize, orders: [Vec<usize>; 3]) -> Self {
        Self {
            width,
            orders,
            state: Mutex::new(ControllerState {
                phase_index: 0,
                order_index: 0,
                events: Vec::with_capacity(3 * width),
            }),
            changed: Condvar::new(),
        }
    }

    fn close(&self, permutation: &str, requests: &[RequestRecord]) -> String {
        let state = self.state.lock().unwrap();
        assert_eq!(state.phase_index, 3);
        assert_eq!(state.order_index, 0);
        assert_eq!(state.events.len(), 3 * self.width);
        let mut output = format!(
            "{{\"schemaVersion\":1,\"kind\":\"controlled-phase-core-interleaving\",\"width\":{},\"permutation\":\"{}\",\"events\":[",
            self.width, permutation
        );
        for (index, event) in state.events.iter().enumerate() {
            if index != 0 {
                output.push(',');
            }
            write!(
                output,
                "{{\"sequence\":{},\"requestId\":\"request-{:02}\",\"phase\":\"{}\"}}",
                event.sequence,
                event.request_id,
                phase_name(event.phase)
            )
            .unwrap();
        }
        output.push_str("],\"requests\":[");
        for (index, request) in requests.iter().enumerate() {
            if index != 0 {
                output.push(',');
            }
            let counters = request.counters;
            write!(
                output,
                "{{\"requestId\":\"request-{:02}\",\"byteLength\":{},\"phaseTrace\":[\"entry\",\"worker\",\"completion\"],\"counterVector\":[{},{},{},{},{},{},{},{},{},{}],\"completed\":true}}",
                request.request_id,
                request.byte_length,
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
            )
            .unwrap();
        }
        output.push_str("],\"closed\":true}\n");
        output
    }
}

impl PhaseController for ExplicitController {
    fn before_phase(&self, request_id: usize, phase: ControlledPhase) {
        let expected_phase = phase_index(phase);
        let state = self.state.lock().unwrap();
        let _state = self
            .changed
            .wait_while(state, |state| {
                state.phase_index != expected_phase
                    || self.orders[expected_phase][state.order_index] != request_id
            })
            .unwrap();
    }

    fn after_phase(&self, request_id: usize, phase: ControlledPhase) {
        let expected_phase = phase_index(phase);
        let mut state = self.state.lock().unwrap();
        assert_eq!(state.phase_index, expected_phase);
        assert_eq!(self.orders[expected_phase][state.order_index], request_id);
        let sequence = state.events.len();
        state.events.push(Event {
            sequence,
            request_id,
            phase,
        });
        state.order_index += 1;
        if state.order_index == self.width {
            state.phase_index += 1;
            state.order_index = 0;
        }
        self.changed.notify_all();
    }
}

fn phase_index(phase: ControlledPhase) -> usize {
    match phase {
        ControlledPhase::Entry => 0,
        ControlledPhase::Worker => 1,
        ControlledPhase::Completion => 2,
    }
}

fn phase_name(phase: ControlledPhase) -> &'static str {
    match phase {
        ControlledPhase::Entry => "entry",
        ControlledPhase::Worker => "worker",
        ControlledPhase::Completion => "completion",
    }
}

fn orders(width: usize, permutation: &str) -> Option<[Vec<usize>; 3]> {
    let forward = (0..width).collect::<Vec<_>>();
    let reverse = (0..width).rev().collect::<Vec<_>>();
    let mut rotate = forward.clone();
    rotate.rotate_left(usize::from(width > 1));
    match permutation {
        "forward-forward" => Some([forward.clone(), forward.clone(), forward]),
        "forward-reverse" => Some([forward.clone(), reverse, forward]),
        "reverse-rotate-reverse" => Some([reverse.clone(), rotate, reverse]),
        _ => None,
    }
}

fn run(width: usize, permutation: &str) -> Option<String> {
    if ![1, 2, 8, 32].contains(&width) {
        return None;
    }
    let controller = Arc::new(ExplicitController::new(width, orders(width, permutation)?));
    let mut workers = Vec::with_capacity(width);
    for request_id in 0..width {
        let controller = Arc::clone(&controller);
        workers.push(thread::spawn(move || {
            let byte_length = 101 + request_id;
            let mut counters = ControlFlowCounters::default();
            record_entry_phase(
                &mut counters,
                request_id,
                byte_length,
                controller.as_ref(),
            );
            counters.record_async_work_create_attempt();
            counters.record_async_work_create_success();
            counters.record_async_work_queue_attempt();
            counters.record_async_work_queue_success();
            record_worker_phase(&mut counters, request_id, controller.as_ref());
            counters.record_dispatcher_invocation();
            record_completion_phase(&mut counters, request_id, controller.as_ref());
            counters.record_settlement_attempt();
            RequestRecord {
                request_id,
                byte_length,
                counters: counters.checked().unwrap(),
            }
        }));
    }
    let mut requests = workers
        .into_iter()
        .map(|worker| worker.join().unwrap())
        .collect::<Vec<_>>();
    requests.sort_by_key(|request| request.request_id);
    Some(controller.close(permutation, &requests))
}

fn main() {
    let arguments = std::env::args().collect::<Vec<_>>();
    let result = arguments
        .get(1)
        .and_then(|width| width.parse::<usize>().ok())
        .zip(arguments.get(2))
        .and_then(|(width, permutation)| run(width, permutation));
    match result {
        Some(transcript) => print!("{transcript}"),
        None => {
            eprintln!("PHASE_FIXTURE_CASE_INVALID");
            std::process::exit(2);
        }
    }
}
