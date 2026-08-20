use std::collections::BTreeMap;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use quote::ToTokens;
use syn::visit::{self, Visit};
use syn::{
    BinOp, Expr, ExprAssign, ExprBinary, ExprCall, ExprClosure, ExprField, ExprForLoop, ExprIf,
    ExprLoop, ExprMatch, ExprMethodCall, ExprReference, ExprUnsafe, ExprWhile, ImplItemFn, ItemFn,
    ItemImpl, ItemMod, Member,
};

const SCANNER_VERSION: &str = "curiosity-rust-site-scanner-v1/syn-2.0.119";
const NORMALIZATION_RULES: &str = "quote::ToTokens token spacing; method-call AST node; nearest closure/if/match/for/while/loop/unsafe control-flow AST parent; enclosing function fallback; exact counter mutation and raw-adapter reference cardinality; full files parsed; cfg(test) modules and cfg(phase_fixture) impls excluded by AST attribute";
const COUNTER_FIELDS: [&str; 10] = [
    "input_copy_operations",
    "input_bytes_copied",
    "async_work_create_attempts",
    "async_work_create_successes",
    "async_work_queue_attempts",
    "async_work_queue_successes",
    "worker_callback_entries",
    "dispatcher_invocations",
    "completion_callback_entries",
    "settlement_attempts",
];
const COUNTERS: [(&str, &str); 10] = [
    ("inputCopyOperations", "record_input_copy"),
    ("inputBytesCopied", "record_input_copy"),
    (
        "asyncWorkCreateAttempts",
        "record_async_work_create_attempt",
    ),
    (
        "asyncWorkCreateSuccesses",
        "record_async_work_create_success",
    ),
    ("asyncWorkQueueAttempts", "record_async_work_queue_attempt"),
    ("asyncWorkQueueSuccesses", "record_async_work_queue_success"),
    ("workerCallbackEntries", "record_worker_callback_entry"),
    ("dispatcherInvocations", "record_dispatcher_invocation"),
    (
        "completionCallbackEntries",
        "record_completion_callback_entry",
    ),
    ("settlementAttempts", "record_settlement_attempt"),
];

#[derive(Clone, Debug, Eq, PartialEq)]
struct Site {
    path: String,
    symbol: String,
    node: String,
    parent: String,
}

struct Scanner {
    path: String,
    symbol: String,
    parents: Vec<String>,
    recorder_calls: BTreeMap<String, Vec<Site>>,
    mutations: BTreeMap<String, Vec<Site>>,
    phase_calls: BTreeMap<String, Vec<Site>>,
    phase_references: BTreeMap<String, Vec<Site>>,
    raw_calls: Vec<Site>,
    raw_references: BTreeMap<String, Vec<Site>>,
}

impl Scanner {
    fn site<T: ToTokens>(&self, node: &T) -> Site {
        Site {
            path: self.path.clone(),
            symbol: self.symbol.clone(),
            node: normalize(node),
            parent: self
                .parents
                .last()
                .cloned()
                .unwrap_or_else(|| format!("fn {}", self.symbol)),
        }
    }

    fn with_parent<T: ToTokens>(&mut self, node: &T, visit: impl FnOnce(&mut Self)) {
        self.parents.push(normalize(node));
        visit(self);
        self.parents.pop();
    }
}

impl<'ast> Visit<'ast> for Scanner {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let previous = std::mem::replace(&mut self.symbol, node.sig.ident.to_string());
        visit::visit_item_fn(self, node);
        self.symbol = previous;
    }

    fn visit_impl_item_fn(&mut self, node: &'ast ImplItemFn) {
        let previous = std::mem::replace(&mut self.symbol, node.sig.ident.to_string());
        visit::visit_impl_item_fn(self, node);
        self.symbol = previous;
    }

    fn visit_expr_method_call(&mut self, node: &'ast ExprMethodCall) {
        let method = node.method.to_string();
        if COUNTERS.iter().any(|(_, expected)| *expected == method) {
            let site = self.site(node);
            self.recorder_calls
                .entry(method.clone())
                .or_default()
                .push(site);
        }
        if let Expr::Field(field) = node.receiver.as_ref()
            && let Some(name) = field_name(field)
            && COUNTER_FIELDS.contains(&name.as_str())
            && [
                "store",
                "swap",
                "fetch_add",
                "fetch_sub",
                "fetch_update",
                "compare_exchange",
                "compare_exchange_weak",
            ]
            .contains(&method.as_str())
        {
            let site = self.site(node);
            self.mutations.entry(name).or_default().push(site);
        }
        visit::visit_expr_method_call(self, node);
    }

    fn visit_expr_binary(&mut self, node: &'ast ExprBinary) {
        if matches!(
            node.op,
            BinOp::AddAssign(_)
                | BinOp::SubAssign(_)
                | BinOp::MulAssign(_)
                | BinOp::DivAssign(_)
                | BinOp::RemAssign(_)
                | BinOp::BitXorAssign(_)
                | BinOp::BitAndAssign(_)
                | BinOp::BitOrAssign(_)
                | BinOp::ShlAssign(_)
                | BinOp::ShrAssign(_)
        ) && let Expr::Field(field) = node.left.as_ref()
            && let Some(name) = field_name(field)
            && COUNTER_FIELDS.contains(&name.as_str())
        {
            let site = self.site(node);
            self.mutations.entry(name).or_default().push(site);
        }
        visit::visit_expr_binary(self, node);
    }

    fn visit_expr_assign(&mut self, node: &'ast ExprAssign) {
        if let Expr::Field(field) = node.left.as_ref()
            && let Some(name) = field_name(field)
            && COUNTER_FIELDS.contains(&name.as_str())
        {
            let site = self.site(node);
            self.mutations.entry(name).or_default().push(site);
        }
        visit::visit_expr_assign(self, node);
    }

    fn visit_expr_reference(&mut self, node: &'ast ExprReference) {
        if node.mutability.is_some()
            && let Expr::Field(field) = node.expr.as_ref()
            && let Some(name) = field_name(field)
            && COUNTER_FIELDS.contains(&name.as_str())
        {
            let site = self.site(node);
            self.mutations.entry(name).or_default().push(site);
        }
        visit::visit_expr_reference(self, node);
    }

    fn visit_expr_call(&mut self, node: &'ast ExprCall) {
        if let Expr::Path(path) = node.func.as_ref()
            && let Some(name) = path
                .path
                .segments
                .last()
                .map(|segment| segment.ident.to_string())
        {
            if name == "raw_settlement" {
                self.raw_calls.push(self.site(node));
            }
            if [
                "record_entry_phase",
                "record_worker_phase",
                "record_completion_phase",
            ]
            .contains(&name.as_str())
            {
                let site = self.site(node);
                self.phase_calls.entry(name.clone()).or_default().push(site);
            }
            if COUNTERS.iter().any(|(_, recorder)| *recorder == name) {
                let site = self.site(node);
                self.recorder_calls.entry(name).or_default().push(site);
            }
        }
        visit::visit_expr_call(self, node);
    }

    fn visit_expr_path(&mut self, node: &'ast syn::ExprPath) {
        if let Some(name) = node
            .path
            .segments
            .last()
            .map(|segment| segment.ident.to_string())
        {
            if ["napi_resolve_deferred", "napi_reject_deferred"].contains(&name.as_str()) {
                let site = self.site(node);
                self.raw_references.entry(name).or_default().push(site);
            } else if [
                "record_entry_phase",
                "record_worker_phase",
                "record_completion_phase",
            ]
            .contains(&name.as_str())
            {
                let site = self.site(node);
                self.phase_references.entry(name).or_default().push(site);
            }
        }
        visit::visit_expr_path(self, node);
    }

    fn visit_item_mod(&mut self, node: &'ast ItemMod) {
        if !has_excluded_cfg(&node.attrs) {
            visit::visit_item_mod(self, node);
        }
    }

    fn visit_item_impl(&mut self, node: &'ast ItemImpl) {
        if !has_excluded_cfg(&node.attrs) {
            visit::visit_item_impl(self, node);
        }
    }

    fn visit_expr_closure(&mut self, node: &'ast ExprClosure) {
        self.with_parent(node, |scanner| visit::visit_expr_closure(scanner, node));
    }

    fn visit_expr_if(&mut self, node: &'ast ExprIf) {
        self.with_parent(node, |scanner| visit::visit_expr_if(scanner, node));
    }

    fn visit_expr_match(&mut self, node: &'ast ExprMatch) {
        self.with_parent(node, |scanner| visit::visit_expr_match(scanner, node));
    }

    fn visit_expr_for_loop(&mut self, node: &'ast ExprForLoop) {
        self.with_parent(node, |scanner| visit::visit_expr_for_loop(scanner, node));
    }

    fn visit_expr_while(&mut self, node: &'ast ExprWhile) {
        self.with_parent(node, |scanner| visit::visit_expr_while(scanner, node));
    }

    fn visit_expr_loop(&mut self, node: &'ast ExprLoop) {
        self.with_parent(node, |scanner| visit::visit_expr_loop(scanner, node));
    }

    fn visit_expr_unsafe(&mut self, node: &'ast ExprUnsafe) {
        self.with_parent(node, |scanner| visit::visit_expr_unsafe(scanner, node));
    }
}

fn normalize(value: &impl ToTokens) -> String {
    value.to_token_stream().to_string()
}

fn field_name(field: &ExprField) -> Option<String> {
    match &field.member {
        Member::Named(name) => Some(name.to_string()),
        Member::Unnamed(_) => None,
    }
}

fn has_excluded_cfg(attributes: &[syn::Attribute]) -> bool {
    attributes.iter().any(|attribute| {
        if !attribute.path().is_ident("cfg") {
            return false;
        }
        matches!(
            normalize(&attribute.meta).as_str(),
            "cfg (test)" | "cfg (phase_fixture)"
        )
    })
}

fn canonical_site_row(name: &str, site: &Site) -> String {
    format!(
        "{name}\t{}\t{}\t{}\t{}",
        site.path, site.symbol, site.node, site.parent
    )
}

fn scan_file(repository: &Path, relative: &str, scanner: &mut Scanner) -> Result<(), String> {
    let source =
        fs::read_to_string(repository.join(relative)).map_err(|error| error.to_string())?;
    let syntax = syn::parse_file(&source).map_err(|error| error.to_string())?;
    scanner.path = relative.to_owned();
    scanner.visit_file(&syntax);
    Ok(())
}

fn scan(repository: &Path) -> Result<String, String> {
    let mut scanner = Scanner {
        path: String::new(),
        symbol: "<module>".into(),
        parents: Vec::new(),
        recorder_calls: BTreeMap::new(),
        mutations: BTreeMap::new(),
        phase_calls: BTreeMap::new(),
        phase_references: BTreeMap::new(),
        raw_calls: Vec::new(),
        raw_references: BTreeMap::new(),
    };
    for relative in [
        "apps/runtime/native-node-api-qualification/src/lib.rs",
        "apps/runtime/native-node-api-qualification/src/settlement.rs",
        "apps/runtime/native-node-api-qualification/src/control_flow.rs",
        "apps/runtime/native-node-api-qualification/src/phase_counter_core.rs",
        "apps/runtime/native-node-api-qualification/src/settlement_core.rs",
    ] {
        scan_file(repository, relative, &mut scanner)?;
    }
    let expected_symbols = BTreeMap::from([
        ("record_input_copy", "record_entry_phase"),
        ("record_async_work_create_attempt", "create_async_work"),
        ("record_async_work_create_success", "create_async_work"),
        ("record_async_work_queue_attempt", "admit_execute"),
        ("record_async_work_queue_success", "admit_execute"),
        ("record_worker_callback_entry", "record_worker_phase"),
        ("record_dispatcher_invocation", "execute_owned"),
        (
            "record_completion_callback_entry",
            "record_completion_phase",
        ),
        ("record_settlement_attempt", "settle_deferred"),
    ]);
    for (method, symbol) in expected_symbols {
        let sites = scanner
            .recorder_calls
            .get(method)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        if sites.len() != 1 || sites[0].symbol != symbol {
            return Err(format!(
                "SITE_CARDINALITY_INVALID:{method}:{symbol}:{}",
                sites.len()
            ));
        }
    }
    if scanner.recorder_calls.len() != 9 {
        return Err(format!(
            "EXTRA_COUNTER_ALIAS_SITE:{}",
            scanner.recorder_calls.len()
        ));
    }
    let expected_mutations = BTreeMap::from([
        ("input_copy_operations", "record_input_copy"),
        ("input_bytes_copied", "record_input_copy"),
        (
            "async_work_create_attempts",
            "record_async_work_create_attempt",
        ),
        (
            "async_work_create_successes",
            "record_async_work_create_success",
        ),
        (
            "async_work_queue_attempts",
            "record_async_work_queue_attempt",
        ),
        (
            "async_work_queue_successes",
            "record_async_work_queue_success",
        ),
        ("worker_callback_entries", "record_worker_callback_entry"),
        ("dispatcher_invocations", "record_dispatcher_invocation"),
        (
            "completion_callback_entries",
            "record_completion_callback_entry",
        ),
        ("settlement_attempts", "record_settlement_attempt"),
    ]);
    for (field, symbol) in expected_mutations {
        let sites = scanner
            .mutations
            .get(field)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        if sites.len() != 1 || sites[0].symbol != symbol {
            return Err(format!(
                "COUNTER_MUTATION_INVALID:{field}:{symbol}:{}",
                sites.len()
            ));
        }
    }
    if scanner.mutations.len() != 10 {
        return Err(format!(
            "EXTRA_COUNTER_MUTATION:{}",
            scanner.mutations.len()
        ));
    }
    if scanner.raw_calls.len() != 1 || scanner.raw_calls[0].symbol != "settle_deferred" {
        return Err(format!(
            "RAW_SETTLEMENT_SITE_INVALID:{}",
            scanner.raw_calls.len()
        ));
    }
    for raw_name in ["napi_resolve_deferred", "napi_reject_deferred"] {
        let sites = scanner
            .raw_references
            .get(raw_name)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        if sites.len() != 1 || sites[0].symbol != "settle_deferred" {
            return Err(format!(
                "RAW_SETTLEMENT_ALIAS_INVALID:{raw_name}:{}",
                sites.len()
            ));
        }
    }
    if scanner.raw_references.len() != 2 {
        return Err(format!(
            "EXTRA_RAW_SETTLEMENT_ALIAS:{}",
            scanner.raw_references.len()
        ));
    }
    let expected_phase_calls = [
        ("record_entry_phase", "admit_execute"),
        ("record_worker_phase", "execute_work"),
        ("record_completion_phase", "complete_work"),
    ];
    for (phase_function, symbol) in expected_phase_calls {
        let calls = scanner
            .phase_calls
            .get(phase_function)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        let references = scanner
            .phase_references
            .get(phase_function)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        if calls.len() != 1
            || calls[0].symbol != symbol
            || !calls[0].node.contains("& NoopPhaseController")
            || references.len() != 1
            || references[0].symbol != symbol
        {
            return Err(format!(
                "PHASE_CORE_CALL_INVALID:{phase_function}:{symbol}:{}:{}",
                calls.len(),
                references.len()
            ));
        }
    }
    if scanner.phase_calls.len() != 3 || scanner.phase_references.len() != 3 {
        return Err(format!(
            "EXTRA_PHASE_CORE_CALL_OR_ALIAS:{}:{}",
            scanner.phase_calls.len(),
            scanner.phase_references.len()
        ));
    }
    let mutation_fields = [
        "input_copy_operations",
        "input_bytes_copied",
        "async_work_create_attempts",
        "async_work_create_successes",
        "async_work_queue_attempts",
        "async_work_queue_successes",
        "worker_callback_entries",
        "dispatcher_invocations",
        "completion_callback_entries",
        "settlement_attempts",
    ];
    let mut output = format!("version\t{SCANNER_VERSION}\nnormalization\t{NORMALIZATION_RULES}\n");
    for ((counter, _), field) in COUNTERS.into_iter().zip(mutation_fields) {
        output.push_str("mutation\t");
        output.push_str(&canonical_site_row(counter, &scanner.mutations[field][0]));
        output.push('\n');
    }
    let recorder_order = [
        "record_input_copy",
        "record_async_work_create_attempt",
        "record_async_work_create_success",
        "record_async_work_queue_attempt",
        "record_async_work_queue_success",
        "record_worker_callback_entry",
        "record_dispatcher_invocation",
        "record_completion_callback_entry",
        "record_settlement_attempt",
    ];
    for recorder in recorder_order {
        output.push_str("recorder\t");
        output.push_str(&canonical_site_row(
            recorder,
            &scanner.recorder_calls[recorder][0],
        ));
        output.push('\n');
    }
    for (phase, phase_function) in [
        ("entry", "record_entry_phase"),
        ("worker", "record_worker_phase"),
        ("completion", "record_completion_phase"),
    ] {
        output.push_str("phase\t");
        output.push_str(&canonical_site_row(
            phase,
            &scanner.phase_calls[phase_function][0],
        ));
        output.push('\n');
    }
    let raw = &scanner.raw_calls[0];
    output.push_str("raw\t");
    output.push_str(&canonical_site_row("deferredSettlement", raw));
    output.push('\n');
    Ok(output)
}

fn main() {
    let repository = env::args_os()
        .nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."));
    match scan(&repository) {
        Ok(output) => print!("{output}"),
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(1);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalization_is_token_based() {
        let compact: ExprMethodCall = syn::parse_str("x.record_worker_callback_entry()").unwrap();
        let spaced: ExprMethodCall =
            syn::parse_str("x . record_worker_callback_entry ( )").unwrap();
        assert_eq!(normalize(&compact), normalize(&spaced));
    }

    #[test]
    fn scanner_rejects_duplicate_sites() {
        let source: syn::File = syn::parse_str(
            "fn execute_work(){ x.record_worker_callback_entry(); x.record_worker_callback_entry(); }",
        )
        .unwrap();
        let mut scanner = Scanner {
            path: "fixture.rs".into(),
            symbol: "<module>".into(),
            parents: Vec::new(),
            recorder_calls: BTreeMap::new(),
            mutations: BTreeMap::new(),
            phase_calls: BTreeMap::new(),
            phase_references: BTreeMap::new(),
            raw_calls: Vec::new(),
            raw_references: BTreeMap::new(),
        };
        scanner.visit_file(&source);
        assert_eq!(
            scanner.recorder_calls["record_worker_callback_entry"].len(),
            2
        );
    }

    #[test]
    fn scanner_observes_direct_counter_mutation_aliases() {
        let source: syn::File =
            syn::parse_str("fn alias(counters: &mut C){ counters.settlement_attempts += 1; }")
                .unwrap();
        let mut scanner = Scanner {
            path: "fixture.rs".into(),
            symbol: "<module>".into(),
            parents: Vec::new(),
            recorder_calls: BTreeMap::new(),
            mutations: BTreeMap::new(),
            phase_calls: BTreeMap::new(),
            phase_references: BTreeMap::new(),
            raw_calls: Vec::new(),
            raw_references: BTreeMap::new(),
        };
        scanner.visit_file(&source);
        assert_eq!(scanner.mutations["settlement_attempts"].len(), 1);
        assert_eq!(scanner.mutations["settlement_attempts"][0].symbol, "alias");
    }

    #[test]
    fn scanner_observes_assignment_and_raw_adapter_aliases() {
        let source: syn::File = syn::parse_str(
            "fn alias(counters: &mut C){ counters.settlement_attempts = 1; let resolve = napi_resolve_deferred; let reject = napi_reject_deferred; use_aliases(resolve, reject); }",
        )
        .unwrap();
        let mut scanner = Scanner {
            path: "fixture.rs".into(),
            symbol: "<module>".into(),
            parents: Vec::new(),
            recorder_calls: BTreeMap::new(),
            mutations: BTreeMap::new(),
            phase_calls: BTreeMap::new(),
            phase_references: BTreeMap::new(),
            raw_calls: Vec::new(),
            raw_references: BTreeMap::new(),
        };
        scanner.visit_file(&source);
        assert_eq!(scanner.mutations["settlement_attempts"].len(), 1);
        assert_eq!(scanner.raw_references["napi_resolve_deferred"].len(), 1);
        assert_eq!(scanner.raw_references["napi_reject_deferred"].len(), 1);
    }

    #[test]
    fn canonical_rows_exclude_transport_prefixes() {
        let site = Site {
            path: "source.rs".into(),
            symbol: "record".into(),
            node: "node".into(),
            parent: "parent".into(),
        };
        let row = canonical_site_row("inputBytesCopied", &site);
        assert_eq!(row, "inputBytesCopied\tsource.rs\trecord\tnode\tparent");
        assert!(!row.starts_with("mutation\t"));
        assert!(!row.starts_with("recorder\t"));
    }

    #[test]
    fn scanner_observes_ufcs_recorder_aliases() {
        let source: syn::File =
            syn::parse_str("fn alias(counters: &mut C){ C::record_settlement_attempt(counters); }")
                .unwrap();
        let mut scanner = Scanner {
            path: "fixture.rs".into(),
            symbol: "<module>".into(),
            parents: Vec::new(),
            recorder_calls: BTreeMap::new(),
            mutations: BTreeMap::new(),
            phase_calls: BTreeMap::new(),
            phase_references: BTreeMap::new(),
            raw_calls: Vec::new(),
            raw_references: BTreeMap::new(),
        };
        scanner.visit_file(&source);
        assert_eq!(scanner.recorder_calls["record_settlement_attempt"].len(), 1);
    }

    #[test]
    fn mutation_nodes_are_distinct_from_recorder_calls() {
        let source: syn::File = syn::parse_str(
            "struct C { input_copy_operations: u8, input_bytes_copied: usize } impl C { fn record_input_copy(&mut self, n: usize) { self.input_copy_operations += 1; self.input_bytes_copied += n; } } fn admit_execute(c: &mut C) { c.record_input_copy(7); }",
        )
        .unwrap();
        let mut scanner = Scanner {
            path: "fixture.rs".into(),
            symbol: "<module>".into(),
            parents: Vec::new(),
            recorder_calls: BTreeMap::new(),
            mutations: BTreeMap::new(),
            phase_calls: BTreeMap::new(),
            phase_references: BTreeMap::new(),
            raw_calls: Vec::new(),
            raw_references: BTreeMap::new(),
        };
        scanner.visit_file(&source);
        assert_ne!(
            scanner.mutations["input_copy_operations"][0].node,
            scanner.mutations["input_bytes_copied"][0].node
        );
        assert_ne!(
            scanner.mutations["input_copy_operations"][0].node,
            scanner.recorder_calls["record_input_copy"][0].node
        );
    }

    #[test]
    fn redirected_phase_facades_do_not_satisfy_recorder_inventory() {
        let source: syn::File =
            syn::parse_str("fn execute_work(c: &mut C) { copied_worker_phase(c); }").unwrap();
        let mut scanner = Scanner {
            path: "fixture.rs".into(),
            symbol: "<module>".into(),
            parents: Vec::new(),
            recorder_calls: BTreeMap::new(),
            mutations: BTreeMap::new(),
            phase_calls: BTreeMap::new(),
            phase_references: BTreeMap::new(),
            raw_calls: Vec::new(),
            raw_references: BTreeMap::new(),
        };
        scanner.visit_file(&source);
        assert!(
            !scanner
                .recorder_calls
                .contains_key("record_worker_callback_entry")
        );
        assert!(!scanner.phase_calls.contains_key("record_worker_phase"));
    }
}
