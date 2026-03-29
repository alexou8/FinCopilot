import json
import logging
from typing import Any

from backend.db import get_comparison_profile, save_comparison_profile
from backend.models.schemas import ComparisonProfile
from backend.prompts.extraction import EXTRACTION_SYSTEM_PROMPT
from backend.services.llm import chat_completion
from backend.services.simulation_engine import calculate_summary

logger = logging.getLogger(__name__)


def _merge_scalar(base_value: Any, overlay_value: Any) -> Any:
    return base_value if overlay_value is None else overlay_value


def _merge_item_dict(base_item: dict, overlay_item: dict) -> dict:
    merged = dict(base_item)
    for key, value in overlay_item.items():
        if value is not None:
            merged[key] = value
    return merged


def _normalize_key_part(value: Any) -> str:
    return str(value or "").strip().lower()


def _merge_item_list(
    base_items: list[dict] | None,
    overlay_items: list[dict] | None,
    key_fields: tuple[str, ...],
) -> list[dict] | None:
    if not base_items and not overlay_items:
        return [] if overlay_items == [] else base_items
    if not overlay_items:
        return list(base_items or [])

    merged: list[dict] = [dict(item) for item in (base_items or [])]
    index: dict[tuple[str, ...], int] = {}
    for i, item in enumerate(merged):
        key = tuple(_normalize_key_part(item.get(field)) for field in key_fields)
        if any(key):
            index[key] = i

    for item in overlay_items:
        key = tuple(_normalize_key_part(item.get(field)) for field in key_fields)
        if any(key) and key in index:
            merged[index[key]] = _merge_item_dict(merged[index[key]], item)
        else:
            merged.append(dict(item))
            if any(key):
                index[key] = len(merged) - 1

    return merged


def _merge_decision(
    existing_decision: dict | None,
    extracted_decision: dict | None,
) -> dict | None:
    if extracted_decision is None:
        return existing_decision
    if existing_decision is None:
        return extracted_decision

    merged = _merge_item_dict(existing_decision, extracted_decision)
    merged["new_recurring_costs"] = _merge_item_list(
        existing_decision.get("new_recurring_costs"),
        extracted_decision.get("new_recurring_costs"),
        ("name",),
    )
    return merged


def _merge_after_profile(
    before_profile: dict | None,
    existing_after: dict | None,
    extracted_after: dict,
) -> dict:
    before_profile = before_profile or {}
    existing_after = existing_after or {}

    merged = dict(before_profile)
    merged.update(
        {
            "name": _merge_scalar(before_profile.get("name"), existing_after.get("name")),
            "profile_label": "after",
            "scenario_name": existing_after.get("scenario_name"),
            "decision": existing_after.get("decision"),
        }
    )

    for source in (existing_after, extracted_after):
        merged["name"] = _merge_scalar(merged.get("name"), source.get("name"))
        merged["scenario_name"] = _merge_scalar(
            merged.get("scenario_name"),
            source.get("scenario_name"),
        )
        merged["income_sources"] = _merge_item_list(
            merged.get("income_sources"),
            source.get("income_sources"),
            ("name", "type"),
        )
        merged["debts"] = _merge_item_list(
            merged.get("debts"),
            source.get("debts"),
            ("name",),
        )
        merged["recurring_expenses"] = _merge_item_list(
            merged.get("recurring_expenses"),
            source.get("recurring_expenses"),
            ("name",),
        )
        merged["outliers"] = _merge_item_list(
            merged.get("outliers"),
            source.get("outliers"),
            ("name", "month", "kind"),
        )
        merged["accounts"] = _merge_item_list(
            merged.get("accounts"),
            source.get("accounts"),
            ("name",),
        )
        merged["decision"] = _merge_decision(merged.get("decision"), source.get("decision"))

    merged_profile = ComparisonProfile(**merged)
    summary = calculate_summary(merged_profile)
    merged["dashboard_summary"] = {
        "monthly_income": summary.monthly_income,
        "monthly_surplus": summary.monthly_surplus,
        "debt_total": summary.debt_total,
        "account_total": summary.account_total,
    }
    return ComparisonProfile(**merged).model_dump()


async def extract_and_save_profile(
    user_id: str, conversation: list[dict], target_profile: str = "before"
) -> dict | None:
    """Run structured extraction on the conversation and persist to storage."""
    messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Update the user's {target_profile} comparison profile. "
                f"Set profile_label to '{target_profile}'."
            ),
        },
    ]

    before_profile = None
    existing_after = None
    if target_profile == "after":
        before_profile = await get_comparison_profile(user_id, "before")
        existing_after = await get_comparison_profile(user_id, "after")
        messages.append(
            {
                "role": "user",
                "content": (
                    "For AFTER profile extraction, treat the user's BEFORE profile as the starting point. "
                    "Any financial data point not explicitly changed in this scenario should remain the same "
                    "as the BEFORE profile. When the user mentions a new amount, include the full updated item. "
                    "If they describe money 'every two months' or another unsupported cadence, convert it to a "
                    "monthly equivalent.\n\n"
                    f"BEFORE profile JSON:\n{json.dumps(before_profile or {}, indent=2)}\n\n"
                    f"Current AFTER profile JSON (same scenario, if any):\n{json.dumps(existing_after or {}, indent=2)}"
                ),
            }
        )

    messages.extend(conversation)

    try:
        raw = await chat_completion(messages, temperature=0, json_mode=True)
        extracted = ComparisonProfile(**json.loads(raw)).model_dump()
        profile_data = (
            _merge_after_profile(before_profile, existing_after, extracted)
            if target_profile == "after"
            else ComparisonProfile(**extracted).model_dump()
        )
        await save_comparison_profile(user_id, profile_data, target_profile)
        return profile_data
    except Exception:
        logger.exception("Extraction failed for user %s - skipping", user_id)
        return None
