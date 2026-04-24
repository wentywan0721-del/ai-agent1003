import os
import re

from export_rhino_sim import (
    build_pressure_id,
    classify_pressure_object,
    infer_node_kind,
    normalize_pressure_fields,
    should_export_pressure_object,
)


def assert_equal(actual, expected, message):
    if actual != expected:
        raise AssertionError(f"{message}: expected {expected!r}, got {actual!r}")


def assert_close(actual, expected, message, tolerance=1e-6):
    if abs(actual - expected) > tolerance:
        raise AssertionError(f"{message}: expected {expected!r}, got {actual!r}")


def main():
    script_path = os.path.join(os.path.dirname(__file__), "export_rhino_sim.py")
    with open(script_path, "r") as handle:
        export_source = handle.read()

    if "from __future__ import annotations" in export_source:
        raise AssertionError("Rhino export script must not require future annotations for Python 2.7")
    if 'f"' in export_source or "f'" in export_source:
        raise AssertionError("Rhino export script must not use f-strings for Python 2.7")
    if "**coords" in export_source:
        raise AssertionError("Rhino export script must not use dict unpacking for Python 2.7")
    if re.search(r'(?<!\.)open\s*\([^\n]*encoding\s*=', export_source):
        raise AssertionError("Rhino export script must not rely on Python 3 built-in open(..., encoding=...) in Rhino 2.7")
    if "timezone.utc" in export_source:
        raise AssertionError("Rhino export script must not require datetime.timezone in Rhino 2.7")

    assert_equal(infer_node_kind("gate_in_1"), "gate", "gate kind")
    assert_equal(infer_node_kind("es_up_4_top"), "escalator", "escalator kind")
    assert_equal(infer_node_kind("elev_3"), "elevator", "elevator kind")
    assert_equal(infer_node_kind("stair_2_top"), "stair", "stair kind")
    assert_equal(infer_node_kind("train_4_door3"), "platform", "platform kind")

    escalator = classify_pressure_object("Escalator Entrance", "Noise level 74 decibels,noisy")
    assert_equal(escalator["category"], "noise_congestion", "escalator category")
    assert_equal(escalator["activeForSimulation"], True, "escalator active")
    assert_close(escalator["range"], 4.5, "escalator range")

    advert = classify_pressure_object("Ground advertising", "Slowing down movement to capture information")
    assert_equal(advert["category"], "advert", "advert category")
    assert_close(advert["strength"], 0.65, "advert strength")

    signage = classify_pressure_object("Ground ATM signage", "Cantonese and English text may confuse mainland tourists")
    assert_equal(signage["category"], "signage", "signage category")
    assert_close(signage["range"], 2.5, "signage range")

    decision = classify_pressure_object("End point of tactile paving", "Blind elderly people may be confused")
    assert_equal(decision["category"], "decision", "decision category")
    assert_equal(decision["simRole"], "pressure", "decision role")

    signage_hanging = classify_pressure_object("Hanging Signs", "Brief information")
    assert_equal(signage_hanging["category"], "signage", "hanging signs category")
    assert_equal(signage_hanging["activeForSimulation"], True, "hanging signs active")

    signage_common = classify_pressure_object("Common direction Signs", "Brief information")
    assert_equal(signage_common["category"], "signage", "common signs category")

    signage_lcd = classify_pressure_object("LCD", "Brief information")
    assert_equal(signage_lcd["category"], "signage", "lcd category")

    signage_map = classify_pressure_object("Panoramic guide map", "Detailed information")
    assert_equal(signage_map["category"], "signage", "guide map category")

    facility = classify_pressure_object("Customer Service Centre", "")
    assert_equal(facility["category"], "facility", "facility category")
    assert_equal(facility["activeForSimulation"], True, "facility active")
    if facility["strength"] <= 0:
        raise AssertionError("facility strength should be positive")

    ai_facility = classify_pressure_object("AI virtual service ambassador", "")
    assert_equal(ai_facility["category"], "facility", "ai ambassador category")
    assert_equal(ai_facility["activeForSimulation"], True, "ai ambassador active")

    normalized_name, normalized_feature = normalize_pressure_fields("Advertisement", "1060 lux")
    assert_equal(normalized_name, "Advertisement", "normalized advert name")
    assert_equal(normalized_feature, "Dynamic/flashing ads, 1060 lux", "normalized advert feature")
    advert_lux = classify_pressure_object(normalized_name, normalized_feature)
    assert_equal(advert_lux["category"], "advert", "lux advert category")
    assert_close(advert_lux["lux"], 1060.0, "lux advert lux")

    assert_equal(should_export_pressure_object("Book Drop", "For returning library materials borrowed from public library"), False, "book drop excluded")
    assert_equal(should_export_pressure_object("Newspaper box", "Purchase or pick up newspapers"), False, "newspaper box excluded")
    assert_equal(should_export_pressure_object("AED", "Automated External Defibrillator"), False, "aed excluded")
    assert_equal(should_export_pressure_object("Customer Service Centre", ""), True, "customer service exported")
    assert_equal(should_export_pressure_object("AI virtual service ambassador", ""), True, "ai ambassador exported")

    generated_id = build_pressure_id({}, "1234-ABCD", "Hanging Signs")
    assert_equal(generated_id, "pressure_hanging_signs_1234-ABCD", "generated pressure id")
    explicit_id = build_pressure_id({"id": "pressure_custom"}, "1234-ABCD", "Hanging Signs")
    assert_equal(explicit_id, "pressure_custom", "explicit pressure id")

    noise = classify_pressure_object("Noise from wall advertisements", "80 decibels; train noise drowns out the broadcast")
    assert_equal(noise["category"], "noise", "noise category")
    assert_close(noise["decibel"], 80.0, "noise decibel")

    print("Rhino export classification validation passed")


if __name__ == "__main__":
    main()
