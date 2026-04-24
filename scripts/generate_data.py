import csv
import heapq
import json
import math
import re
from pathlib import Path


APP_DIR = Path(__file__).resolve().parent.parent
SOURCE_DIR = APP_DIR.parent
DATA_DIR = APP_DIR / "data"

CONCOURSE_Z = 10.5
POINT_TOLERANCE = 0.25

NODE_LABELS = {
    "gate_in_1": "闸机入口",
    "gate_out_1": "出口闸机",
    "es_up_4_top": "荃湾线扶梯口",
    "es_up_5_top": "中段扶梯口",
    "es_up_6_top": "港岛线扶梯口",
    "es_down_4_top": "下行扶梯口 A",
    "es_down_5_top": "下行扶梯口 B",
    "es_down_6_top": "下行扶梯口 C",
    "elev_3": "电梯厅",
    "stair_2_top": "楼梯口",
}

ROUTE_DEFINITIONS = [
    {
        "id": "to-tsuen-wan",
        "name": "进站 → 荃湾线扶梯口",
        "shortName": "荃湾线",
        "startNodeId": "gate_in_1",
        "endNodeId": "es_up_4_top",
    },
    {
        "id": "to-island",
        "name": "进站 → 港岛线扶梯口",
        "shortName": "港岛线",
        "startNodeId": "gate_in_1",
        "endNodeId": "es_up_6_top",
    },
    {
        "id": "transfer",
        "name": "荃湾线 → 港岛线换乘",
        "shortName": "换乘",
        "startNodeId": "es_up_4_top",
        "endNodeId": "es_up_6_top",
    },
]

PRESETS = [
    {
        "id": "current-route",
        "name": "当前路线",
        "description": "中等拥挤、20人、标准老人画像",
        "routeId": "to-tsuen-wan",
        "crowdLevel": "medium",
        "groupSize": 20,
        "profileMode": "standard",
    },
    {
        "id": "high-crowd",
        "name": "高拥挤场景",
        "description": "高拥挤、30人、易疲劳画像",
        "routeId": "transfer",
        "crowdLevel": "high",
        "groupSize": 30,
        "profileMode": "fatigue",
    },
]


def load_csv(name):
    with open(SOURCE_DIR / name, newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def is_concourse(z_value, tolerance=0.05):
    return abs(float(z_value) - CONCOURSE_Z) <= tolerance


def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def point_distance_to_segment(point, start, end):
    px, py = point
    ax, ay = start
    bx, by = end
    abx = bx - ax
    aby = by - ay
    ab2 = abx * abx + aby * aby
    if ab2 == 0:
        return math.dist(point, start)
    apx = px - ax
    apy = py - ay
    t = max(0.0, min(1.0, (apx * abx + apy * aby) / ab2))
    closest = (ax + abx * t, ay + aby * t)
    return math.dist(point, closest)


def normalize_key(value, fallback):
    text = (value or "").strip()
    return text if text else fallback


def display_label(node_id):
    if node_id in NODE_LABELS:
        return NODE_LABELS[node_id]
    if node_id.startswith("gate_in"):
        return "入口闸机"
    if node_id.startswith("gate_out"):
        return "出口闸机"
    if node_id.startswith("es_up"):
        return "扶梯口"
    if node_id.startswith("es_down"):
        return "下行扶梯口"
    if node_id.startswith("stair"):
        return "楼梯口"
    if node_id.startswith("elev"):
        return "电梯厅"
    return node_id.replace("_", " ")


def parse_pp_attributes(row):
    attributes = {}
    for key_col, value_col in (("KEY1", "VALUE1"), ("KEY2", "VALUE2"), ("KEY3", "VALUE3")):
        key = (row.get(key_col) or "").strip()
        value = (row.get(value_col) or "").strip()
        if key and value and value.upper() != "NULL":
            attributes[key.lower()] = value
    return attributes


def parse_numeric_from_text(pattern, text):
    matches = re.findall(pattern, text, flags=re.IGNORECASE)
    return max((float(match) for match in matches), default=0.0)


def classify_pressure_point(attributes):
    joined = " ".join(attributes.values())
    lowered = joined.lower()
    name = attributes.get("name", "未命名设施")
    lux = parse_numeric_from_text(r"(\d+(?:\.\d+)?)\s*lux", joined)
    decibel = parse_numeric_from_text(r"(\d+(?:\.\d+)?)\s*decibel", joined)

    advert_score = 1.0 if "advert" in lowered else 0.0
    lighting_score = (lux / 700.0) if lux else (0.6 if "lighting" in lowered else 0.0)
    noise_score = max(0.0, (decibel - 65.0) / 15.0) if decibel else (0.5 if "noise" in lowered or "noisy" in lowered else 0.0)
    signage_score = 1.0 if "signage" in lowered or "confuse" in lowered else 0.0
    amenity_score = 1.0 if any(token in lowered for token in ["toilet", "customer service", "aed", "book drop", "newspaper box"]) else 0.0

    tags = []
    if advert_score:
        tags.append("advert")
    if lighting_score:
        tags.append("lighting")
    if noise_score:
        tags.append("noise")
    if signage_score:
        tags.append("signage")
    if amenity_score:
        tags.append("amenity")
    if not tags:
        tags.append("landmark")

    primary_tag = max(
        [
            ("advert", advert_score),
            ("lighting", lighting_score),
            ("noise", noise_score),
            ("signage", signage_score),
            ("amenity", amenity_score),
        ],
        key=lambda item: item[1],
    )[0]
    if primary_tag == "advert" and advert_score == 0:
        primary_tag = tags[0]

    return {
        "name": name,
        "description": attributes.get("feature") or joined or name,
        "tags": tags,
        "primaryTag": primary_tag,
        "scores": {
            "advert": round(advert_score, 3),
            "lighting": round(lighting_score, 3),
            "noise": round(noise_score, 3),
            "signage": round(signage_score, 3),
            "amenity": round(amenity_score, 3),
        },
    }


def dijkstra(adjacency, start, end):
    queue = [(0.0, start)]
    distance = {start: 0.0}
    previous = {}
    while queue:
        current_distance, current = heapq.heappop(queue)
        if current_distance != distance[current]:
            continue
        if current == end:
            break
        for neighbor, weight in adjacency.get(current, []):
            candidate = current_distance + weight
            if candidate < distance.get(neighbor, math.inf):
                distance[neighbor] = candidate
                previous[neighbor] = current
                heapq.heappush(queue, (candidate, neighbor))
    if end not in distance:
        raise ValueError(f"No path between {start} and {end}")

    node_path = [end]
    while node_path[-1] != start:
        node_path.append(previous[node_path[-1]])
    node_path.reverse()
    return distance[end], node_path


def build_station_graph():
    raw_nodes = load_csv("node.csv")
    raw_links = load_csv("link.csv")
    raw_pp = load_csv("pp.csv")

    nodes = []
    coord_to_node_id = {}
    for index, row in enumerate(raw_nodes):
        if not is_concourse(row["Z"]):
            continue
        node_id = normalize_key(row.get("Key"), f"anon_node_{index}")
        coord_key = (row["X"], row["Y"], row["Z"])
        coord_to_node_id[coord_key] = node_id
        nodes.append(
            {
                "id": node_id,
                "key": row.get("Key") or "",
                "x": safe_float(row["X"]),
                "y": safe_float(row["Y"]),
                "z": safe_float(row["Z"]),
                "displayName": display_label(node_id),
                "isAnchor": bool((row.get("Key") or "").strip() and not row["Key"].lower().startswith("node_")),
            }
        )

    node_by_id = {node["id"]: node for node in nodes}
    degrees = {node["id"]: 0 for node in nodes}
    segments = []
    adjacency = {node["id"]: [] for node in nodes}
    edge_to_segment = {}

    for index, row in enumerate(raw_links):
        if not is_concourse(row["StartZ"]) or not is_concourse(row["EndZ"]):
            continue
        start_id = coord_to_node_id.get((row["StartX"], row["StartY"], row["StartZ"]))
        end_id = coord_to_node_id.get((row["EndX"], row["EndY"], row["EndZ"]))
        if not start_id or not end_id:
            continue
        start_node = node_by_id[start_id]
        end_node = node_by_id[end_id]
        dx = end_node["x"] - start_node["x"]
        dy = end_node["y"] - start_node["y"]
        length = safe_float(row.get("Value"), math.dist((start_node["x"], start_node["y"]), (end_node["x"], end_node["y"])))
        segment_id = f"seg_{len(segments) + 1}"
        segment = {
            "id": segment_id,
            "startNodeId": start_id,
            "endNodeId": end_id,
            "length": round(length, 3),
            "angle": round(math.degrees(math.atan2(dy, dx)), 3),
            "midpoint": {
                "x": round((start_node["x"] + end_node["x"]) / 2.0, 3),
                "y": round((start_node["y"] + end_node["y"]) / 2.0, 3),
            },
            "pressurePointIds": [],
            "metrics": {
                "advert": 0.0,
                "lighting": 0.0,
                "noise": 0.0,
                "signage": 0.0,
                "amenity": 0.0,
            },
        }
        segments.append(segment)
        degrees[start_id] += 1
        degrees[end_id] += 1
        adjacency[start_id].append((end_id, length))
        adjacency[end_id].append((start_id, length))
        edge_to_segment[(start_id, end_id)] = segment_id
        edge_to_segment[(end_id, start_id)] = segment_id

    for segment in segments:
        segment["startDegree"] = degrees[segment["startNodeId"]]
        segment["endDegree"] = degrees[segment["endNodeId"]]
        segment["junctionScore"] = max(segment["startDegree"], segment["endDegree"]) - 1
        segment["label"] = f"{node_by_id[segment['startNodeId']]['displayName']} → {node_by_id[segment['endNodeId']]['displayName']}"

    pressure_points = []
    segment_by_id = {segment["id"]: segment for segment in segments}

    for index, row in enumerate(raw_pp):
        if abs(float(row["Z"]) - CONCOURSE_Z) > POINT_TOLERANCE:
            continue
        attributes = parse_pp_attributes(row)
        if not attributes:
            continue
        classification = classify_pressure_point(attributes)
        point_id = f"pp_{len(pressure_points) + 1}"
        point_xy = (safe_float(row["X"]), safe_float(row["Y"]))

        nearest_segment = None
        nearest_distance = math.inf
        for segment in segments:
            start_node = node_by_id[segment["startNodeId"]]
            end_node = node_by_id[segment["endNodeId"]]
            distance = point_distance_to_segment(
                point_xy,
                (start_node["x"], start_node["y"]),
                (end_node["x"], end_node["y"]),
            )
            if distance < nearest_distance:
                nearest_distance = distance
                nearest_segment = segment

        pressure_point = {
            "id": point_id,
            "x": round(point_xy[0], 3),
            "y": round(point_xy[1], 3),
            "displayName": classification["name"],
            "description": classification["description"],
            "primaryTag": classification["primaryTag"],
            "tags": classification["tags"],
            "scores": classification["scores"],
            "nearestSegmentId": nearest_segment["id"] if nearest_segment else None,
            "distanceToSegment": round(nearest_distance, 3),
        }
        pressure_points.append(pressure_point)
        if nearest_segment:
            nearest_segment["pressurePointIds"].append(point_id)
            for key, value in classification["scores"].items():
                nearest_segment["metrics"][key] = round(nearest_segment["metrics"][key] + value, 3)

    amenity_segment_ids = []
    for segment in segments:
        total_pressure = sum(segment["metrics"].values())
        segment["environmentScore"] = round(total_pressure + max(0.0, segment["junctionScore"] - 1) * 0.35, 3)
        if segment["metrics"]["amenity"] > 0:
            amenity_segment_ids.append(segment["id"])

    route_definitions = []
    for route in ROUTE_DEFINITIONS:
        route_distance, node_path = dijkstra(adjacency, route["startNodeId"], route["endNodeId"])
        segment_path = [edge_to_segment[(current, nxt)] for current, nxt in zip(node_path, node_path[1:])]
        route_definitions.append(
            {
                **route,
                "startLabel": display_label(route["startNodeId"]),
                "endLabel": display_label(route["endNodeId"]),
                "nodeIds": node_path,
                "segmentIds": segment_path,
                "distance": round(route_distance, 3),
            }
        )

    bounds = {
        "minX": round(min(node["x"] for node in nodes), 3),
        "maxX": round(max(node["x"] for node in nodes), 3),
        "minY": round(min(node["y"] for node in nodes), 3),
        "maxY": round(max(node["y"] for node in nodes), 3),
    }

    return {
        "stationGraph": {
            "name": "中环站 concourse 评估图",
            "bounds": bounds,
            "nodes": nodes,
            "segments": segments,
            "pressurePoints": pressure_points,
            "amenitySegmentIds": amenity_segment_ids,
        },
        "routes": route_definitions,
        "nodeDisplayNames": {node_id: display_label(node_id) for node_id in node_by_id},
    }


def build_agent_pool():
    raw_agents = load_csv("agents_base.csv")
    selected = []
    for row in raw_agents:
        if any(
            row[key] != "False"
            for key in [
                "Has_Arthritis",
                "Has_Back_Pain",
                "Has_Depression",
                "Has_Anxiety",
                "Has_MCI",
                "Has_Cataract",
            ]
        ):
            continue
        if row["Needs_Assistance"] != "False":
            continue

        age_band = row["Age_Group"]
        age_floor = int(re.match(r"(\d+)", age_band).group(1)) if re.match(r"(\d+)", age_band) else 80
        bmi_value = safe_float(row["BMI_Value"], 23.0)
        walking_speed = safe_float(row["Final_Walking_Speed"], 1.0)
        decision_delay = safe_float(row["Final_Decision_Time"], 0.8)
        fatigue_rate = 0.8 + max(0.0, (age_floor - 65) * 0.03) + max(0.0, (bmi_value - 22.0) * 0.04) + max(0.0, (1.15 - walking_speed) * 0.6)

        selected.append(
            {
                "id": f"agent_{row['Agent_ID']}",
                "ageBand": age_band,
                "gender": row["Gender"],
                "bmiBand": row["BMI_Category"],
                "bmiValue": round(bmi_value, 2),
                "walkingSpeed": round(walking_speed, 3),
                "decisionDelay": round(decision_delay, 3),
                "fatigueRate": round(fatigue_rate, 3),
                "hasPresbyopia": row["Has_Presbyopia"] == "True",
            }
        )

    return selected


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    station = build_station_graph()
    data = {
        "meta": {
            "title": "中环站认知包容性评估器 MVP",
            "subtitle": "单层预置数据 + 加权图评分模型",
            "sourceDirectory": str(SOURCE_DIR),
            "version": 1,
        },
        **station,
        "agentPool": build_agent_pool(),
        "presets": PRESETS,
    }

    json_text = json.dumps(data, ensure_ascii=False, indent=2)
    (DATA_DIR / "generated-data.json").write_text(json_text, encoding="utf-8")
    (DATA_DIR / "generated-data.js").write_text(f"window.APP_DATA = {json_text};\n", encoding="utf-8")
    print(f"Generated {DATA_DIR / 'generated-data.json'}")


if __name__ == "__main__":
    main()
