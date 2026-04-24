import io
import json
import math
import os
import re
from datetime import datetime

try:
    import rhinoscriptsyntax as rs
    import scriptcontext as sc
except ImportError:  # pragma: no cover - Rhino runtime only
    rs = None
    sc = None


LAYER_NAMES = {
    "walkable": "WALKABLE",
    "obstacle": "OBSTACLE",
    "node": "NODE",
    "pressure": "PRESSURE",
    "seat": "SEAT",
}

FACILITY_NAMES = {
    "customer service centre",
    "ai virtual service ambassador",
}

SIGNAGE_NAMES = {
    "lcd",
    "common direction signs",
    "panoramic guide map",
    "hanging signs",
}

EXCLUDED_PRESSURE_NAMES = {
    "aed",
    "book drop",
    "newspaper box",
}


def extract_numeric(pattern, text):
    matches = re.findall(pattern, text or "", flags=re.IGNORECASE)
    if not matches:
        return 0.0
    return max(float(match) for match in matches)


def clamp(value, minimum, maximum):
    return min(maximum, max(minimum, value))


def infer_node_kind(node_id):
    lowered = (node_id or "").strip().lower()
    if lowered.startswith("gate_"):
        return "gate"
    if lowered.startswith("es_up") or lowered.startswith("es_down"):
        return "escalator"
    if lowered.startswith("elev"):
        return "elevator"
    if lowered.startswith("stair"):
        return "stair"
    if lowered.startswith("train_"):
        return "platform"
    return "node"


def normalize_pressure_fields(name, feature):
    normalized_name = (name or "").strip()
    normalized_feature = (feature or "").strip()
    lowered_name = normalized_name.lower()
    lowered_feature = normalized_feature.lower()

    advert_tokens = ["static ads", "dynamic/flashing ads", "psa/artwork"]
    if lowered_name == "advertisement" and "lux" in lowered_feature and not any(token in lowered_feature for token in advert_tokens):
        normalized_feature = "Dynamic/flashing ads, {0}".format(normalized_feature) if normalized_feature else "Dynamic/flashing ads"

    return normalized_name, normalized_feature


def infer_pressure_category(name, feature):
    normalized_name, normalized_feature = normalize_pressure_fields(name, feature)
    lowered_name = normalized_name.lower()
    lowered_feature = normalized_feature.lower()
    combined = ("%s %s" % (lowered_name, lowered_feature)).strip()

    if lowered_name in EXCLUDED_PRESSURE_NAMES:
        return "excluded"
    if lowered_name == "escalator entrance":
        return "noise_congestion"
    if lowered_name in ["ground advertising", "advertisement"]:
        return "advert"
    if lowered_name in ["noise from wall advertisements", "escalator noise"]:
        return "noise"
    if lowered_name == "ground atm signage" or lowered_name in SIGNAGE_NAMES:
        return "signage"
    if lowered_name == "end point of tactile paving":
        return "decision"
    if lowered_name in FACILITY_NAMES:
        return "facility"

    if "advert" in combined:
        return "advert"
    if "noise" in combined or "noisy" in combined or "decibel" in combined:
        return "noise"
    if lowered_name in SIGNAGE_NAMES:
        return "signage"
    if "signage" in combined or "confuse" in combined or "guide map" in combined or "direction sign" in combined or "brief information" in combined or "detailed information" in combined:
        return "signage"
    if "tactile" in combined or "blind" in combined:
        return "decision"
    if any(token in combined for token in ["customer service", "ai virtual service ambassador"]):
        return "facility"
    if any(token in combined for token in ["aed", "book drop", "newspaper box"]):
        return "excluded"
    return "unknown"


def classify_pressure_object(name, feature):
    _, feature_text = normalize_pressure_fields(name, feature)
    category = infer_pressure_category(name, feature_text)
    lux = extract_numeric(r"(\d+(?:\.\d+)?)\s*lux", feature_text)
    decibel = extract_numeric(r"(\d+(?:\.\d+)?)\s*decibel", feature_text)

    advert_metric = 1.0 if category == "advert" else 0.0
    lighting_metric = clamp(lux / 700.0, 0.0, 1.5) if lux else (0.6 if "lighting" in feature_text.lower() else 0.0)
    if category == "noise_congestion":
        noise_metric = clamp(max(0.65, (decibel - 60.0) / 20.0) if decibel else 0.75, 0.0, 1.2)
    elif category == "noise":
        noise_metric = clamp((decibel - 65.0) / 15.0 if decibel else 0.8, 0.0, 1.2)
    else:
        noise_metric = 0.0
    signage_metric = 1.0 if category == "signage" else (0.8 if category == "decision" else 0.0)
    amenity_metric = 1.0 if category == "facility" else 0.0

    defaults = {
        "noise_congestion": {"strength": 0.75, "range": 4.5, "active": True, "role": "pressure"},
        "noise": {"strength": clamp(noise_metric if noise_metric else 0.8, 0.0, 1.0), "range": 6.0, "active": True, "role": "pressure"},
        "advert": {"strength": 0.65, "range": 2.5, "active": True, "role": "pressure"},
        "signage": {"strength": 0.6, "range": 2.5, "active": True, "role": "pressure"},
        "decision": {"strength": 0.6, "range": 2.5, "active": True, "role": "pressure"},
        "facility": {"strength": 0.58, "range": 3.2, "active": True, "role": "pressure"},
        "excluded": {"strength": 0.0, "range": 0.0, "active": False, "role": "neutral"},
        "unknown": {"strength": 0.0, "range": 0.0, "active": False, "role": "neutral"},
    }
    chosen = defaults[category]

    return {
        "category": category,
        "strength": chosen["strength"],
        "range": chosen["range"],
        "activeForSimulation": chosen["active"],
        "simRole": chosen["role"],
        "lux": lux,
        "decibel": decibel,
        "metrics": {
            "advert": round(advert_metric, 3),
            "lighting": round(lighting_metric, 3),
            "noise": round(noise_metric, 3),
            "signage": round(signage_metric, 3),
            "amenity": round(amenity_metric, 3),
        },
    }


def should_export_pressure_object(name, feature):
    return bool(classify_pressure_object(name, feature)["activeForSimulation"])


def slugify_identifier(value):
    normalized = re.sub(r"[^0-9A-Za-z]+", "_", (value or "").strip()).strip("_").lower()
    return normalized or "pressure"


def build_pressure_id(attributes, obj_id, name):
    explicit_id = (attributes or {}).get("id")
    if explicit_id:
        return explicit_id
    object_key = re.sub(r"[{}]", "", str(obj_id))
    return "pressure_{0}_{1}".format(slugify_identifier(name), object_key)


def _require_rhino():  # pragma: no cover - Rhino runtime only
    if rs is None or sc is None:
        raise RuntimeError("This script must run inside Rhino's Python environment.")


def _get_layer_objects(layer_name):  # pragma: no cover - Rhino runtime only
    if not rs.IsLayer(layer_name):
        return []
    return list(rs.ObjectsByLayer(layer_name, select=False) or [])


def _get_user_text(obj_id):  # pragma: no cover - Rhino runtime only
    keys = rs.GetUserText(obj_id) or []
    data = {}
    for key in keys:
        value = rs.GetUserText(obj_id, key)
        if value is not None:
            data[str(key)] = str(value)
    return data


def _curve_to_polygon(obj_id, warnings):  # pragma: no cover - Rhino runtime only
    curve = rs.coercecurve(obj_id)
    if curve is None:
        warnings.append("Skipped non-curve object in layer: {0}".format(obj_id))
        return None
    if not curve.IsClosed:
        warnings.append("Skipped open curve: {0}".format(obj_id))
        return None

    success, polyline = curve.TryGetPolyline()
    if success:
        points = list(polyline)
    else:
        length = max(curve.GetLength(), 1.0)
        division_count = max(12, min(240, int(math.ceil(length / 1.0))))
        parameters = curve.DivideByCount(division_count, True)
        if not parameters:
            warnings.append("Failed to sample closed curve: {0}".format(obj_id))
            return None
        points = [curve.PointAt(parameter) for parameter in parameters]

    polygon = [[round(point.X, 3), round(point.Y, 3)] for point in points]
    if len(polygon) < 3:
        warnings.append("Skipped degenerate polygon: {0}".format(obj_id))
        return None
    if polygon[0] == polygon[-1]:
        polygon = polygon[:-1]
    return polygon if len(polygon) >= 3 else None


def _point_xyz(obj_id):  # pragma: no cover - Rhino runtime only
    point = rs.PointCoordinates(obj_id)
    if point is None:
        return None
    return {
        "x": round(point.X, 3),
        "y": round(point.Y, 3),
        "z": round(point.Z, 3),
    }


def _build_node(obj_id, warnings):  # pragma: no cover - Rhino runtime only
    if not rs.IsPoint(obj_id):
        warnings.append("Skipped non-point object in NODE: {0}".format(obj_id))
        return None
    coords = _point_xyz(obj_id)
    attributes = _get_user_text(obj_id)
    node_id = attributes.get("name") or str(obj_id)
    data = {
        "id": node_id,
        "label": node_id,
        "kind": infer_node_kind(node_id),
        "selectableAsStart": True,
        "selectableAsEnd": True,
        "sourceLayer": LAYER_NAMES["node"],
        "attributes": attributes,
    }
    data.update(coords)
    return data


def _build_pressure(obj_id, warnings):  # pragma: no cover - Rhino runtime only
    if not rs.IsPoint(obj_id):
        warnings.append("Skipped non-point object in PRESSURE: {0}".format(obj_id))
        return None
    coords = _point_xyz(obj_id)
    attributes = _get_user_text(obj_id)
    name, feature = normalize_pressure_fields(attributes.get("name", ""), attributes.get("feature", ""))
    if not should_export_pressure_object(name, feature):
        return None
    classification = classify_pressure_object(name, feature)
    data = {
        "id": build_pressure_id(attributes, obj_id, name),
        "name": name,
        "feature": feature,
        "category": classification["category"],
        "strength": classification["strength"],
        "range": classification["range"],
        "activeForSimulation": classification["activeForSimulation"],
        "simRole": classification["simRole"],
        "metrics": classification["metrics"],
        "lux": classification["lux"],
        "decibel": classification["decibel"],
        "sourceLayer": LAYER_NAMES["pressure"],
        "attributes": attributes,
    }
    data.update(coords)
    return data


def _build_seat(obj_id, warnings):  # pragma: no cover - Rhino runtime only
    if not rs.IsPoint(obj_id):
        warnings.append("Skipped non-point object in SEAT: {0}".format(obj_id))
        return None
    coords = _point_xyz(obj_id)
    attributes = _get_user_text(obj_id)
    seat_id = attributes.get("id") or attributes.get("name") or str(obj_id)
    data = {
        "id": seat_id,
        "label": attributes.get("label") or seat_id,
        "seatCount": int(float(attributes.get("seat_count", 2))),
        "reliefStrength": float(attributes.get("relief_strength", 0.6)),
        "reliefRange": float(attributes.get("relief_range", 2.5)),
        "sourceLayer": LAYER_NAMES["seat"],
        "attributes": attributes,
    }
    data.update(coords)
    return data


def export_sim_json(output_path=None):  # pragma: no cover - Rhino runtime only
    _require_rhino()

    warnings = []
    missing_layers = [layer_name for layer_name in LAYER_NAMES.values() if not rs.IsLayer(layer_name)]
    for layer_name in missing_layers:
        warnings.append("Layer not found: {0}".format(layer_name))

    document_name = sc.doc.Name or "untitled.3dm"
    floor_id = os.path.splitext(document_name)[0]
    units = str(sc.doc.ModelUnitSystem)

    data = {
        "meta": {
            "sourceFile": document_name,
            "units": units,
            "floorId": floor_id,
            "exportedAt": datetime.utcnow().isoformat() + "Z",
        },
        "walkableAreas": [],
        "obstacles": [],
        "nodes": [],
        "pressureObjects": [],
        "seats": [],
        "warnings": warnings,
    }

    for obj_id in _get_layer_objects(LAYER_NAMES["walkable"]):
        polygon = _curve_to_polygon(obj_id, warnings)
        if polygon:
            data["walkableAreas"].append(polygon)

    for obj_id in _get_layer_objects(LAYER_NAMES["obstacle"]):
        polygon = _curve_to_polygon(obj_id, warnings)
        if polygon:
            data["obstacles"].append(polygon)

    for obj_id in _get_layer_objects(LAYER_NAMES["node"]):
        node = _build_node(obj_id, warnings)
        if node:
            data["nodes"].append(node)

    for obj_id in _get_layer_objects(LAYER_NAMES["pressure"]):
        pressure = _build_pressure(obj_id, warnings)
        if pressure:
            data["pressureObjects"].append(pressure)

    for obj_id in _get_layer_objects(LAYER_NAMES["seat"]):
        seat = _build_seat(obj_id, warnings)
        if seat:
            data["seats"].append(seat)

    if output_path is None:
        output_path = rs.SaveFileName(
            "Save simulation JSON",
            "JSON Files (*.json)|*.json||",
            folder=rs.WorkingFolder(),
            filename="{0}.sim.json".format(floor_id),
        )
    if not output_path:
        return None

    with io.open(output_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)

    print("Exported sim package: {0}".format(output_path))
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print("- {0}".format(warning))
    return output_path


if __name__ == "__main__":  # pragma: no cover - Rhino runtime only
    export_sim_json()
