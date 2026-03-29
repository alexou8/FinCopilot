from __future__ import annotations

import asyncio
import json
import unittest
from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import backend.db as db
from backend.main import app
from backend.models.schemas import ComparisonProfile
from backend.services.extraction import extract_and_save_profile
from backend.services.simulation_engine import project_monthly_balances


def _next_month_label() -> str:
    next_month = (date.today().replace(day=1) + timedelta(days=32)).replace(day=1)
    return f"{next_month.year:04d}-{next_month.month:02d}"


def _before_profile() -> dict:
    return {
        "name": None,
        "profile_label": "before",
        "scenario_name": None,
        "income_sources": [
            {"name": "Job", "type": "employment", "amount": 500.0, "frequency": "monthly"},
        ],
        "debts": [
            {
                "name": "OSAP loan",
                "balance": 3500.0,
                "interest_rate": None,
                "minimum_payment": None,
                "months_remaining": None,
            }
        ],
        "recurring_expenses": [
            {"name": "Food", "amount": 200.0, "frequency": "monthly"},
            {"name": "Entertainment", "amount": 100.0, "frequency": "monthly"},
        ],
        "outliers": [],
        "accounts": [
            {"name": "Chequing account", "type": "chequing", "balance": 1500.0, "interest_rate": None},
            {"name": "Savings account", "type": "savings", "balance": 3000.0, "interest_rate": None},
        ],
        "dashboard_summary": {
            "monthly_income": 500.0,
            "monthly_surplus": 200.0,
            "debt_total": 3500.0,
            "account_total": 4500.0,
        },
        "decision": None,
    }


class SimulationExtractionTests(unittest.TestCase):
    def setUp(self):
        db._use_memory = True
        db._profiles.clear()
        db._conversations.clear()
        db._simulations.clear()

    def test_after_extraction_keeps_unchanged_before_values(self):
        user_id = "merge-user"
        asyncio.run(db.save_comparison_profile(user_id, _before_profile(), "before"))

        extracted_after = {
            "name": None,
            "profile_label": "after",
            "scenario_name": "Move out scenario",
            "income_sources": [
                {"name": "Job", "type": "employment", "amount": 1000.0, "frequency": "monthly"},
                {"name": "Parents", "type": "family_support", "amount": 250.0, "frequency": "monthly"},
            ],
            "debts": [],
            "recurring_expenses": [
                {"name": "Rent", "amount": 900.0, "frequency": "monthly"},
            ],
            "outliers": [
                {"name": "Moving expenses", "kind": "expense", "amount": 300.0, "month": _next_month_label()},
            ],
            "accounts": [],
            "dashboard_summary": {
                "monthly_income": 0.0,
                "monthly_surplus": 0.0,
                "debt_total": 0.0,
                "account_total": 0.0,
            },
            "decision": None,
        }

        with patch(
            "backend.services.extraction.chat_completion",
            new=AsyncMock(return_value=json.dumps(extracted_after)),
        ):
            merged = asyncio.run(
                extract_and_save_profile(
                    user_id,
                    [{"role": "user", "content": "I want to move out."}],
                    "after",
                )
            )

        self.assertIsNotNone(merged)
        self.assertEqual(merged["income_sources"][0]["amount"], 1000.0)
        self.assertTrue(any(item["name"] == "Parents" for item in merged["income_sources"]))
        self.assertTrue(any(item["name"] == "OSAP loan" for item in merged["debts"]))
        self.assertTrue(any(item["name"] == "Chequing account" for item in merged["accounts"]))
        self.assertTrue(any(item["name"] == "Food" for item in merged["recurring_expenses"]))
        self.assertTrue(any(item["name"] == "Rent" for item in merged["recurring_expenses"]))
        self.assertTrue(any(item["name"] == "Moving expenses" for item in merged["outliers"]))
        self.assertEqual(merged["dashboard_summary"]["monthly_income"], 1250.0)
        self.assertEqual(merged["dashboard_summary"]["account_total"], 4500.0)

    def test_after_extraction_preserves_explicit_zero_amount_updates(self):
        user_id = "zero-update-user"
        asyncio.run(
            db.save_comparison_profile(
                user_id,
                {
                    **_before_profile(),
                    "recurring_expenses": [
                        {"name": "Food", "amount": 200.0, "frequency": "monthly"},
                        {"name": "Transit", "amount": 152.0, "frequency": "monthly"},
                    ],
                },
                "before",
            )
        )

        extracted_after = {
            "name": None,
            "profile_label": "after",
            "scenario_name": "No transit cost",
            "income_sources": [],
            "debts": [],
            "recurring_expenses": [
                {"name": "Transit", "amount": 0.0, "frequency": "monthly"},
            ],
            "outliers": [],
            "accounts": [],
            "dashboard_summary": {
                "monthly_income": 0.0,
                "monthly_surplus": 0.0,
                "debt_total": 0.0,
                "account_total": 0.0,
            },
            "decision": None,
        }

        with patch(
            "backend.services.extraction.chat_completion",
            new=AsyncMock(return_value=json.dumps(extracted_after)),
        ):
            merged = asyncio.run(
                extract_and_save_profile(
                    user_id,
                    [{"role": "user", "content": "I would no longer pay transit."}],
                    "after",
                )
            )

        transit = next(item for item in merged["recurring_expenses"] if item["name"] == "Transit")
        self.assertEqual(transit["amount"], 0.0)

    def test_after_extraction_normalizes_every_two_months_and_month_names(self):
        user_id = "cadence-user"
        asyncio.run(db.save_comparison_profile(user_id, _before_profile(), "before"))

        extracted_after = {
            "name": None,
            "profile_label": "after",
            "scenario_name": "September move-out",
            "income_sources": [
                {"name": "Parents", "type": "gift", "amount": 500.0, "frequency": "biweekly"},
            ],
            "debts": [],
            "recurring_expenses": [],
            "outliers": [
                {"name": "Moving expense", "kind": "expense", "amount": 300.0, "month": "September"},
            ],
            "accounts": [],
            "dashboard_summary": {
                "monthly_income": 0.0,
                "monthly_surplus": 0.0,
                "debt_total": 0.0,
                "account_total": 0.0,
            },
            "decision": None,
        }

        conversation = [
            {
                "role": "user",
                "content": "My parents would send me $500 every two months and I would have a one-time $300 moving expense in September.",
            }
        ]

        with patch(
            "backend.services.extraction.chat_completion",
            new=AsyncMock(return_value=json.dumps(extracted_after)),
        ):
            merged = asyncio.run(extract_and_save_profile(user_id, conversation, "after"))

        parents = next(item for item in merged["income_sources"] if item["name"] == "Parents")
        self.assertEqual(parents["frequency"], "monthly")
        self.assertEqual(parents["amount"], 250.0)
        moving = next(item for item in merged["outliers"] if item["name"] == "Moving expense")
        self.assertRegex(moving["month"], r"^\d{4}-\d{2}$")


class SimulationResetSessionTests(unittest.TestCase):
    def setUp(self):
        db._use_memory = True
        db._profiles.clear()
        db._conversations.clear()
        db._simulations.clear()
        self.client = TestClient(app)

    def test_new_simulation_session_clears_stale_after_profile_and_history(self):
        real_user_id = "real-user"
        sim_user_id = f"{real_user_id}_sim"

        asyncio.run(db.save_comparison_profile(real_user_id, _before_profile(), "before"))
        asyncio.run(
            db.save_comparison_profile(
                real_user_id,
                {
                    "profile_label": "after",
                    "scenario_name": "Old scenario",
                    "income_sources": [],
                    "debts": [],
                    "recurring_expenses": [
                        {"name": "Old rent", "amount": 800.0, "frequency": "monthly"},
                    ],
                    "outliers": [],
                    "accounts": [],
                    "dashboard_summary": {
                        "monthly_income": 0.0,
                        "monthly_surplus": -800.0,
                        "debt_total": 0.0,
                        "account_total": 0.0,
                    },
                    "decision": {
                        "description": "Old move out plan",
                        "target_amount": None,
                        "deadline_months": 3,
                        "new_recurring_costs": [
                            {"name": "Old rent", "amount": 800.0, "frequency": "monthly"},
                        ],
                    },
                },
                "after",
            )
        )
        db._conversations[sim_user_id] = [
            {"role": "user", "content": "old scenario"},
            {"role": "assistant", "content": "old reply"},
        ]

        fresh_after = {
            "name": None,
            "profile_label": "after",
            "scenario_name": "Fresh move out scenario",
            "income_sources": [
                {"name": "Job", "type": "employment", "amount": 1000.0, "frequency": "monthly"},
            ],
            "debts": [],
            "recurring_expenses": [
                {"name": "Rent", "amount": 900.0, "frequency": "monthly"},
            ],
            "outliers": [],
            "accounts": [],
            "dashboard_summary": {
                "monthly_income": 1000.0,
                "monthly_surplus": 0.0,
                "debt_total": 0.0,
                "account_total": 0.0,
            },
            "decision": None,
        }

        with patch(
            "backend.routers.chat.chat_completion",
            new=AsyncMock(return_value="Thanks, I understand the new scenario."),
        ), patch(
            "backend.services.extraction.chat_completion",
            new=AsyncMock(return_value=json.dumps(fresh_after)),
        ):
            response = self.client.post(
                "/chat",
                json={
                    "user_id": sim_user_id,
                    "profile_user_id": real_user_id,
                    "message": "I am considering moving out and rent would be $900.",
                    "profile_target": "after",
                    "chat_mode": "simulation",
                    "reset_session": True,
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(db._conversations[sim_user_id]), 2)
        saved_after = asyncio.run(db.get_comparison_profile(real_user_id, "after"))
        self.assertEqual(saved_after["scenario_name"], "Fresh move out scenario")
        self.assertFalse(any(item["name"] == "Old rent" for item in saved_after["recurring_expenses"]))
        self.assertFalse(saved_after["decision"])
        self.assertTrue(any(item["name"] == "OSAP loan" for item in saved_after["debts"]))


class SimulationEngineEdgeCaseTests(unittest.TestCase):
    def test_projection_uses_virtual_cash_bucket_when_no_accounts_exist(self):
        profile = ComparisonProfile(
            profile_label="after",
            scenario_name="No listed accounts",
            income_sources=[
                {"name": "Job", "type": "employment", "amount": 1000.0, "frequency": "monthly"},
            ],
            debts=[],
            recurring_expenses=[
                {"name": "Rent", "amount": 300.0, "frequency": "monthly"},
            ],
            outliers=[],
            accounts=[],
            dashboard_summary={
                "monthly_income": 1000.0,
                "monthly_surplus": 700.0,
                "debt_total": 0.0,
                "account_total": 0.0,
            },
            decision=None,
        )
        points = project_monthly_balances(profile, months=2)
        self.assertEqual(points[0]["liquid_balance"], 700.0)
        self.assertEqual(points[1]["liquid_balance"], 1400.0)
