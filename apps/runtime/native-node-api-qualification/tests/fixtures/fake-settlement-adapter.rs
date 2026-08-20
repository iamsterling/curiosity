#[path = "../../src/settlement_core.rs"]
mod settlement_core;

use std::cell::Cell;

use settlement_core::{
    SettlementAdmission, SettlementFailure, SettlementGate, settle_with_adapter,
};

const VECTORS: &str = include_str!("fake-settlement-vectors.json");
const PROFILES: [&str; 5] = [
    "normal",
    "panic",
    "allocationFailure",
    "queueFailure",
    "controlFlowObservation",
];
const KINDS: [&str; 2] = ["resolve", "reject"];
const MODES: [&str; 3] = ["success", "failure", "panic"];

fn main() {
    for profile in PROFILES {
        assert!(VECTORS.contains(profile));
        for kind in KINDS {
            assert!(VECTORS.contains(kind));
            for mode in MODES {
                assert!(VECTORS.contains(mode));
                run_vector(profile, kind, mode);
            }
        }
    }
}

fn run_vector(profile: &str, kind: &str, mode: &str) {
    let gate = SettlementGate::default();
    let settlement_attempts = Cell::new(0_u8);
    let raw_calls = Cell::new(0_u8);
    let first = settle_with_adapter(
        &gate,
        || {
            settlement_attempts.set(settlement_attempts.get() + 1);
            Ok::<_, &'static str>((profile, kind))
        },
        |_| {
            raw_calls.set(raw_calls.get() + 1);
            match mode {
                "success" => Ok(()),
                "failure" => Err("fake raw adapter failure"),
                "panic" => panic_without_hook(),
                _ => unreachable!(),
            }
        },
    );
    match mode {
        "success" => assert_eq!(first, Ok(SettlementAdmission::Admitted)),
        "failure" => assert_eq!(
            first,
            Err(SettlementFailure::RawAdapter("fake raw adapter failure"))
        ),
        "panic" => assert_eq!(first, Err(SettlementFailure::Panic)),
        _ => unreachable!(),
    }
    let duplicate: Result<SettlementAdmission, SettlementFailure<&'static str>> = settle_with_adapter(
        &gate,
        || panic!("duplicate payload builder must not run"),
        |_: ()| panic!("duplicate raw adapter must not run"),
    );
    assert_eq!(duplicate, Ok(SettlementAdmission::AlreadyAttempted));
    assert!(gate.attempted());
    assert_eq!(settlement_attempts.get(), 1);
    assert_eq!(raw_calls.get(), 1);
    println!("{profile}\t{kind}\t{mode}\t1\t1\tAttempted\tAlreadyAttempted");
}

fn panic_without_hook() -> ! {
    std::panic::resume_unwind(Box::new(()))
}
