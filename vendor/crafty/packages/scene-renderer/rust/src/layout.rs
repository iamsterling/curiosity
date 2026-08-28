use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use taffy::prelude::*;

const CONTRACT_VERSION: u32 = 1;

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct InputBounds {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Edges {
    top: f32,
    right: f32,
    bottom: f32,
    left: f32,
}

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Gap {
    row: f32,
    column: f32,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ContainerStyle {
    direction: String,
    wrap: bool,
    padding: Edges,
    gap: Gap,
    primary_align: String,
    counter_align: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Sizing {
    horizontal: String,
    vertical: String,
    min_width: Option<f32>,
    min_height: Option<f32>,
    max_width: Option<f32>,
    max_height: Option<f32>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LayoutNode {
    id: String,
    bounds: InputBounds,
    position: String,
    container: Option<ContainerStyle>,
    sizing: Sizing,
    measurement: Option<IntrinsicMeasurement>,
    children: Vec<LayoutNode>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct IntrinsicMeasurement {
    key: String,
    width: f32,
    height: f32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LayoutInput {
    version: u32,
    root: LayoutNode,
}

#[derive(Clone)]
struct NodeContext {
    id: String,
    intrinsic: Size<f32>,
}

#[derive(Clone, Copy, Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct ResolvedBox {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct LayoutOutput {
    version: u32,
    boxes: BTreeMap<String, ResolvedBox>,
    diagnostics: Vec<String>,
    measurement_dependencies: Vec<MeasurementDependency>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct MeasurementDependency {
    node_id: String,
    key: String,
}

fn dimension(mode: &str, authored: f32) -> Dimension {
    match mode {
        "fixed" => length(authored),
        "hug" | "fill" => auto(),
        _ => auto(),
    }
}

fn optional_dimension(value: Option<f32>) -> Dimension {
    value.map_or_else(auto, length)
}

fn style_for(node: &LayoutNode) -> Style {
    let mut style = Style {
        display: if node.container.is_some() {
            Display::Flex
        } else {
            Display::Block
        },
        position: if node.position == "absolute" {
            Position::Absolute
        } else {
            Position::Relative
        },
        size: Size {
            width: dimension(&node.sizing.horizontal, node.bounds.width),
            height: dimension(&node.sizing.vertical, node.bounds.height),
        },
        min_size: Size {
            width: optional_dimension(node.sizing.min_width),
            height: optional_dimension(node.sizing.min_height),
        },
        max_size: Size {
            width: optional_dimension(node.sizing.max_width),
            height: optional_dimension(node.sizing.max_height),
        },
        ..Default::default()
    };
    if node.position == "absolute" {
        style.inset.left = length(node.bounds.x);
        style.inset.top = length(node.bounds.y);
    }
    let Some(container) = &node.container else {
        return style;
    };
    style.flex_direction = if container.direction == "horizontal" {
        FlexDirection::Row
    } else {
        FlexDirection::Column
    };
    style.flex_wrap = if container.wrap {
        FlexWrap::Wrap
    } else {
        FlexWrap::NoWrap
    };
    style.padding = Rect {
        left: length(container.padding.left),
        right: length(container.padding.right),
        top: length(container.padding.top),
        bottom: length(container.padding.bottom),
    };
    style.gap = Size {
        width: length(container.gap.column),
        height: length(container.gap.row),
    };
    style.justify_content = Some(match container.primary_align.as_str() {
        "center" => JustifyContent::CENTER,
        "end" => JustifyContent::END,
        "space-between" => JustifyContent::SPACE_BETWEEN,
        _ => JustifyContent::START,
    });
    style.align_items = Some(match container.counter_align.as_str() {
        "center" => AlignItems::CENTER,
        "end" => AlignItems::END,
        _ => AlignItems::START,
    });
    style
}

fn add_node(tree: &mut TaffyTree<NodeContext>, node: &LayoutNode) -> Result<NodeId, String> {
    let children = node
        .children
        .iter()
        .map(|child| add_node(tree, child))
        .collect::<Result<Vec<_>, _>>()?;
    let mut style = style_for(node);
    if node.position != "absolute"
        && (node.sizing.horizontal == "fill" || node.sizing.vertical == "fill")
    {
        style.flex_grow = 1.0;
        style.flex_basis = zero();
    }
    let context = NodeContext {
        id: node.id.clone(),
        intrinsic: node.measurement.as_ref().map_or(
            Size {
                width: node.bounds.width,
                height: node.bounds.height,
            },
            |measurement| Size {
                width: measurement.width,
                height: measurement.height,
            },
        ),
    };
    let id = tree
        .new_leaf_with_context(style, context)
        .map_err(|_| "LAYOUT_TREE_CREATE_FAILED".to_string())?;
    tree.set_children(id, &children)
        .map_err(|_| "LAYOUT_TREE_CHILDREN_FAILED".to_string())?;
    Ok(id)
}

fn collect(
    tree: &TaffyTree<NodeContext>,
    node: NodeId,
    root_origin: Option<(f32, f32)>,
    boxes: &mut BTreeMap<String, ResolvedBox>,
) -> Result<(), String> {
    let layout = tree
        .layout(node)
        .map_err(|_| "LAYOUT_RESULT_MISSING".to_string())?;
    let (x, y) = root_origin.map_or(
        (layout.location.x, layout.location.y),
        |(origin_x, origin_y)| (origin_x + layout.location.x, origin_y + layout.location.y),
    );
    let context = tree
        .get_node_context(node)
        .ok_or_else(|| "LAYOUT_CONTEXT_MISSING".to_string())?;
    boxes.insert(
        context.id.clone(),
        ResolvedBox {
            x,
            y,
            width: layout.size.width,
            height: layout.size.height,
        },
    );
    for child in tree
        .children(node)
        .map_err(|_| "LAYOUT_RESULT_CHILDREN_MISSING".to_string())?
    {
        collect(tree, child, None, boxes)?;
    }
    Ok(())
}

pub fn resolve_layout_json(json: &str) -> Result<String, String> {
    let input: LayoutInput =
        serde_json::from_str(json).map_err(|_| "LAYOUT_INPUT_INVALID".to_string())?;
    if input.version != CONTRACT_VERSION {
        return Err(format!("LAYOUT_CONTRACT_UNSUPPORTED:{}", input.version));
    }
    fn collect_measurements(node: &LayoutNode, output: &mut Vec<MeasurementDependency>) {
        if let Some(measurement) = &node.measurement {
            output.push(MeasurementDependency {
                node_id: node.id.clone(),
                key: measurement.key.clone(),
            });
        }
        for child in &node.children {
            collect_measurements(child, output);
        }
    }
    let mut measurement_dependencies = Vec::new();
    collect_measurements(&input.root, &mut measurement_dependencies);
    let mut tree = TaffyTree::<NodeContext>::new();
    let root = add_node(&mut tree, &input.root)?;
    tree.compute_layout_with_measure(
        root,
        Size {
            width: AvailableSpace::Definite(input.root.bounds.width),
            height: AvailableSpace::Definite(input.root.bounds.height),
        },
        |known, _, _, context, _| {
            let intrinsic = context.map(|value| value.intrinsic).unwrap_or(Size::ZERO);
            Size {
                width: known.width.unwrap_or(intrinsic.width),
                height: known.height.unwrap_or(intrinsic.height),
            }
        },
    )
    .map_err(|_| "LAYOUT_EVALUATION_FAILED".to_string())?;
    let mut boxes = BTreeMap::new();
    collect(
        &tree,
        root,
        Some((input.root.bounds.x, input.root.bounds.y)),
        &mut boxes,
    )?;
    serde_json::to_string(&LayoutOutput {
        version: CONTRACT_VERSION,
        boxes,
        diagnostics: Vec::new(),
        measurement_dependencies,
    })
    .map_err(|_| "LAYOUT_OUTPUT_ENCODE_FAILED".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_a_row_deterministically() {
        let input = r#"{"version":1,"root":{"id":"root","bounds":{"x":0,"y":0,"width":100,"height":40},"position":"flow","container":{"direction":"horizontal","wrap":false,"padding":{"top":0,"right":0,"bottom":0,"left":0},"gap":{"row":0,"column":10},"primaryAlign":"start","counterAlign":"start"},"sizing":{"horizontal":"fixed","vertical":"fixed","minWidth":null,"minHeight":null,"maxWidth":null,"maxHeight":null},"measurement":null,"children":[{"id":"a","bounds":{"x":0,"y":0,"width":20,"height":10},"position":"flow","container":null,"sizing":{"horizontal":"fixed","vertical":"fixed","minWidth":null,"minHeight":null,"maxWidth":null,"maxHeight":null},"measurement":null,"children":[]},{"id":"b","bounds":{"x":0,"y":0,"width":30,"height":10},"position":"flow","container":null,"sizing":{"horizontal":"fixed","vertical":"fixed","minWidth":null,"minHeight":null,"maxWidth":null,"maxHeight":null},"measurement":null,"children":[]}]}}"#;
        let first = resolve_layout_json(input).unwrap();
        let second = resolve_layout_json(input).unwrap();
        assert_eq!(first, second);
        let output: serde_json::Value = serde_json::from_str(&first).unwrap();
        assert_eq!(output["boxes"]["b"]["x"], 30.0);
    }

    #[test]
    fn matches_the_recorded_chrome_reference_at_three_widths() {
        let reference: serde_json::Value = serde_json::from_str(include_str!(
            "../../benchmarks/layout-browser-reference.expected.json"
        ))
        .unwrap();
        for case in reference["cases"].as_array().unwrap() {
            let width = case["width"].as_f64().unwrap();
            let input = serde_json::json!({
                "version": 1,
                "root": {
                    "id": "root", "bounds": { "x": 0, "y": 0, "width": width, "height": 60 }, "position": "flow",
                    "container": { "direction": "horizontal", "wrap": false, "padding": { "top": 10, "right": 10, "bottom": 10, "left": 10 }, "gap": { "row": 8, "column": 8 }, "primaryAlign": "start", "counterAlign": "start" },
                    "sizing": { "horizontal": "fixed", "vertical": "fixed", "minWidth": null, "minHeight": null, "maxWidth": null, "maxHeight": null }, "measurement": null,
                    "children": [
                        { "id": "fixed", "bounds": { "x": 0, "y": 0, "width": 20, "height": 12 }, "position": "flow", "container": null, "sizing": { "horizontal": "fixed", "vertical": "fixed", "minWidth": null, "minHeight": null, "maxWidth": null, "maxHeight": null }, "measurement": null, "children": [] },
                        { "id": "fill", "bounds": { "x": 0, "y": 0, "width": 12, "height": 16 }, "position": "flow", "container": null, "sizing": { "horizontal": "fill", "vertical": "fixed", "minWidth": 12, "minHeight": null, "maxWidth": 80, "maxHeight": null }, "measurement": null, "children": [] },
                        { "id": "absolute", "bounds": { "x": 5, "y": 5, "width": 15, "height": 10 }, "position": "absolute", "container": null, "sizing": { "horizontal": "fixed", "vertical": "fixed", "minWidth": null, "minHeight": null, "maxWidth": null, "maxHeight": null }, "measurement": null, "children": [] }
                    ]
                }
            });
            let output: serde_json::Value =
                serde_json::from_str(&resolve_layout_json(&input.to_string()).unwrap()).unwrap();
            for id in ["root", "fixed", "fill", "absolute"] {
                for field in ["x", "y", "width", "height"] {
                    assert_eq!(
                        output["boxes"][id][field].as_f64(),
                        case["boxes"][id][field].as_f64(),
                        "Chrome geometry diverged for {id}.{field} at width {width}"
                    );
                }
            }
        }
    }

    #[test]
    fn covers_vertical_wrap_alignment_hug_and_nesting() {
        let leaf = |id: &str, width: f64, height: f64, horizontal: &str, vertical: &str| {
            serde_json::json!({
                "id": id, "bounds": { "x": 0, "y": 0, "width": width, "height": height }, "position": "flow", "container": null,
                "sizing": { "horizontal": horizontal, "vertical": vertical, "minWidth": null, "minHeight": null, "maxWidth": null, "maxHeight": null },
                "measurement": if horizontal == "hug" || vertical == "hug" { serde_json::json!({ "key": id, "width": width, "height": height }) } else { serde_json::Value::Null }, "children": []
            })
        };
        let evaluate = |direction: &str,
                        wrap: bool,
                        align: &str,
                        width: f64,
                        height: f64,
                        children: Vec<serde_json::Value>| {
            let input = serde_json::json!({ "version": 1, "root": {
                "id": "root", "bounds": { "x": 0, "y": 0, "width": width, "height": height }, "position": "flow",
                "container": { "direction": direction, "wrap": wrap, "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 }, "gap": { "row": 5, "column": 5 }, "primaryAlign": align, "counterAlign": "start" },
                "sizing": { "horizontal": "fixed", "vertical": "fixed", "minWidth": null, "minHeight": null, "maxWidth": null, "maxHeight": null }, "measurement": null, "children": children
            }});
            serde_json::from_str::<serde_json::Value>(
                &resolve_layout_json(&input.to_string()).unwrap(),
            )
            .unwrap()
        };
        let vertical = evaluate(
            "vertical",
            false,
            "center",
            60.0,
            80.0,
            vec![
                leaf("a", 20.0, 10.0, "hug", "fixed"),
                leaf("b", 20.0, 10.0, "fixed", "fixed"),
            ],
        );
        assert_eq!(vertical["boxes"]["a"]["y"].as_f64(), Some(28.0));
        assert_eq!(vertical["measurementDependencies"][0]["key"], "a");
        let wrapped = evaluate(
            "horizontal",
            true,
            "start",
            60.0,
            80.0,
            vec![
                leaf("a", 30.0, 10.0, "fixed", "fixed"),
                leaf("b", 30.0, 10.0, "fixed", "fixed"),
                leaf("c", 30.0, 10.0, "fixed", "fixed"),
            ],
        );
        assert!(
            wrapped["boxes"]["b"]["y"].as_f64().unwrap()
                > wrapped["boxes"]["a"]["y"].as_f64().unwrap()
        );
        let nested_child = leaf("nested-leaf", 10.0, 10.0, "fixed", "fixed");
        let nested = serde_json::json!({
            "id": "nested", "bounds": { "x": 0, "y": 0, "width": 40, "height": 30 }, "position": "flow",
            "container": { "direction": "horizontal", "wrap": false, "padding": { "top": 5, "right": 5, "bottom": 5, "left": 5 }, "gap": { "row": 0, "column": 0 }, "primaryAlign": "start", "counterAlign": "start" },
            "sizing": { "horizontal": "fixed", "vertical": "fixed", "minWidth": null, "minHeight": null, "maxWidth": null, "maxHeight": null }, "measurement": null, "children": [nested_child]
        });
        let nested_output = evaluate("horizontal", false, "start", 100.0, 50.0, vec![nested]);
        assert_eq!(
            nested_output["boxes"]["nested-leaf"]["x"].as_f64(),
            Some(5.0)
        );
    }
}
