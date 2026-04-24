import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_CSV = ROOT.parent / 'agents_base.csv'
OUTPUT_JSON = ROOT / 'data' / 'healthy-agents.json'
OUTPUT_JS = ROOT / 'data' / 'healthy-agents.js'


def is_true(value):
    return str(value).strip().lower() == 'true'


def derive_fatigue_rate(row, walking_speed, bmi_value):
    age_band = row['Age_Group']
    age_factor = {
        '65-69': 0.82,
        '70-74': 0.9,
        '75-79': 1.02,
        '80-84': 1.14,
        '85+': 1.28,
    }.get(age_band, 0.95)
    bmi_penalty = max(0.0, (bmi_value - 23.0) * 0.015)
    speed_penalty = max(0.0, (1.2 - walking_speed) * 0.42)
    return round(age_factor + bmi_penalty + speed_penalty, 3)


def main():
    rows = list(csv.DictReader(SOURCE_CSV.open('r', encoding='utf-8-sig', newline='')))
    strict_pool = []

    for row in rows:
        if any(
            [
                is_true(row['Has_Arthritis']),
                is_true(row['Has_Back_Pain']),
                is_true(row['Has_Depression']),
                is_true(row['Has_Anxiety']),
                is_true(row['Has_MCI']),
                is_true(row['Has_Presbyopia']),
                is_true(row['Has_Cataract']),
                is_true(row['Needs_Assistance']),
            ]
        ):
            continue

        bmi_value = float(row['BMI_Value'])
        walking_speed = float(row['Final_Walking_Speed'])
        strict_pool.append(
            {
                'agentId': int(row['Agent_ID']),
                'ageBand': row['Age_Group'],
                'gender': 'female' if row['Gender'].strip().lower() == 'female' else 'male',
                'bmiCategory': row['BMI_Category'],
                'bmi': round(bmi_value, 2),
                'walkingSpeed': round(walking_speed, 3),
                'decisionDelay': round(float(row['Final_Decision_Time']), 3),
                'fatigueRate': derive_fatigue_rate(row, walking_speed, bmi_value),
            }
        )

    json_payload = json.dumps(strict_pool, ensure_ascii=False, indent=2)
    OUTPUT_JSON.write_text(json_payload, encoding='utf-8')
    OUTPUT_JS.write_text(f'window.__HEALTHY_AGENTS__ = {json_payload};\n', encoding='utf-8')
    print(f'Wrote {len(strict_pool)} healthy agents to {OUTPUT_JSON}')
    print(f'Wrote {len(strict_pool)} healthy agents to {OUTPUT_JS}')


if __name__ == '__main__':
    main()
