from __future__ import annotations

import asyncio
import unittest
from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import backend.db as db
from backend.main import app
from backend.models.schemas import (
    ComparisonDecision,
    ComparisonProfile,
    IssueBrowserAgentStartResponse,
    IssueBrowserAgentStatusResponse,
)
from backend.services.browser_agent import (
    ASK_USER_TOOL,
    FINISH_TASK_TOOL,
    BrowserAgentManager,
)
from backend.services.issue_detection import detect_issues
from backend.services.simulation_engine import project_monthly_balances


def _next_month_label() -> str:
    next_month = (date.today().replace(day=1) + timedelta(days=32)).replace(day=1)
    return f"{next_month.year:04d}-{next_month.month:02d}"


def _healthy_profile() -> ComparisonProfile:
    return ComparisonProfile(
        profile_label="before",
        scenario_name="Current path",
        income_sources=[
            {"name": "Part-time Job", "type": "job", "amount": 2200, "frequency": "monthly"},
            {"name": "Family Support", "type": "family_support", "amount": 200, "frequency": "monthly"},
        ],
        debts=[
            {
                "name": "Student Loan",
                "balance": 1000,
                "months_remaining": 24,
                "interest_rate": 3.0,
                "minimum_payment": 50,
            }
        ],
        recurring_expenses=[
            {"name": "Rent", "amount": 650, "frequency": "monthly"},
            {"name": "Groceries", "amount": 250, "frequency": "monthly"},
            {"name": "Phone", "amount": 60, "frequency": "monthly"},
            {"name": "Transport", "amount": 90, "frequency": "monthly"},
        ],
        outliers=[],
        accounts=[
            {"name": "TD Chequing", "type": "chequing", "balance": 1800, "interest_rate": 0.0},
            {"name": "EQ Savings", "type": "savings", "balance": 2200, "interest_rate": 3.0},
        ],
        dashboard_summary={
            "monthly_income": 2400,
            "monthly_surplus": 1300,
            "debt_total": 1000,
            "account_total": 4000,
        },
        decision=None,
    )


def _profile_with(**updates) -> ComparisonProfile:
    payload = _healthy_profile().model_dump(mode="json")
    payload.update(updates)
    return ComparisonProfile(**payload)


class IssueRuleTests(unittest.TestCase):
    def test_no_issues_for_stable_profile(self):
        findings = detect_issues(_healthy_profile())
        self.assertEqual(findings, [])

    def test_detects_debt_vs_savings(self):
        healthy = _healthy_profile().model_dump(mode="json")
        profile = _profile_with(
            debts=healthy["debts"]
            + [
                {
                    "name": "Credit Card",
                    "balance": 2600,
                    "months_remaining": 18,
                    "interest_rate": 19.99,
                    "minimum_payment": 80,
                }
            ],
            accounts=[
                healthy["accounts"][0],
                {**healthy["accounts"][1], "interest_rate": 0.0},
            ],
        )
        findings = detect_issues(profile)
        self.assertIn("debt_vs_savings", [finding.rule_id for finding in findings])

    def test_detects_low_yield_savings(self):
        healthy = _healthy_profile().model_dump(mode="json")
        profile = _profile_with(
            accounts=[
                healthy["accounts"][0],
                {**healthy["accounts"][1], "interest_rate": 0.5},
            ]
        )
        findings = detect_issues(profile)
        self.assertIn("low_yield_savings", [finding.rule_id for finding in findings])

    def test_detects_low_emergency_buffer(self):
        profile = _profile_with(
            accounts=[
                {"name": "TD Chequing", "type": "chequing", "balance": 300, "interest_rate": 0.0}
            ]
        )
        findings = detect_issues(profile)
        finding = next(f for f in findings if f.rule_id == "low_emergency_buffer")
        self.assertLess(finding.metrics["emergency_months"], 1.0)

    def test_detects_negative_monthly_cashflow(self):
        profile = _profile_with(
            income_sources=[
                {"name": "Part-time Job", "type": "job", "amount": 900, "frequency": "monthly"}
            ],
            recurring_expenses=[
                {"name": "Rent", "amount": 250, "frequency": "monthly"},
                {"name": "Groceries", "amount": 400, "frequency": "monthly"},
                {"name": "Phone", "amount": 120, "frequency": "monthly"},
                {"name": "Transport", "amount": 260, "frequency": "monthly"},
            ],
            accounts=[
                {"name": "TD Chequing", "type": "chequing", "balance": 3000, "interest_rate": 0.0}
            ],
        )
        findings = detect_issues(profile)
        finding = next(f for f in findings if f.rule_id == "negative_monthly_cashflow")
        self.assertLess(finding.metrics["monthly_surplus"], 0)

    def test_detects_high_rent_burden(self):
        profile = _profile_with(
            income_sources=[
                {"name": "Part-time Job", "type": "job", "amount": 1500, "frequency": "monthly"}
            ],
            recurring_expenses=[
                {"name": "Rent", "amount": 800, "frequency": "monthly"},
                {"name": "Groceries", "amount": 150, "frequency": "monthly"},
            ],
        )
        findings = detect_issues(profile)
        finding = next(f for f in findings if f.rule_id == "high_rent_burden")
        self.assertGreaterEqual(finding.metrics["rent_burden_percent"], 40.0)

    def test_detects_outlier_shortfall_and_matches_projection(self):
        profile = _profile_with(
            income_sources=[
                {"name": "Part-time Job", "type": "job", "amount": 1000, "frequency": "monthly"}
            ],
            recurring_expenses=[
                {"name": "Rent", "amount": 500, "frequency": "monthly"},
                {"name": "Groceries", "amount": 300, "frequency": "monthly"},
                {"name": "Phone", "amount": 100, "frequency": "monthly"},
            ],
            accounts=[
                {"name": "TD Chequing", "type": "chequing", "balance": 300, "interest_rate": 0.0}
            ],
            debts=[],
            outliers=[
                {
                    "name": "Tuition Deposit",
                    "kind": "expense",
                    "amount": 700,
                    "month": _next_month_label(),
                }
            ],
        )

        findings = detect_issues(profile)
        finding = next(f for f in findings if f.rule_id == "tuition_or_outlier_shortfall")
        projection = project_monthly_balances(profile, months=12)
        expected = next(
            point
            for point in projection
            if point["outlier_impact"] < 0 and point["liquid_balance"] <= 100.0
        )
        self.assertEqual(finding.metrics["crunch_month"], expected["month"])
        self.assertEqual(finding.metrics["projected_liquid_balance"], expected["liquid_balance"])

    def test_detects_unrealistic_decision_timeline(self):
        profile = _profile_with(
            accounts=[
                {"name": "TD Chequing", "type": "chequing", "balance": 500, "interest_rate": 0.0}
            ],
            decision=ComparisonDecision(
                description="Move out",
                target_amount=9000,
                deadline_months=4,
                new_recurring_costs=[],
            ).model_dump(mode="json"),
        )
        findings = detect_issues(profile)
        finding = next(f for f in findings if f.rule_id == "decision_timeline_unrealistic")
        self.assertGreater(finding.metrics["months_needed"], finding.metrics["deadline_months"])

    def test_limits_issue_count_and_sorts_by_severity(self):
        profile = _profile_with(
            income_sources=[
                {"name": "Part-time Job", "type": "job", "amount": 1200, "frequency": "monthly"}
            ],
            debts=[
                {
                    "name": "Credit Card",
                    "balance": 3000,
                    "months_remaining": 24,
                    "interest_rate": 19.99,
                    "minimum_payment": 120,
                }
            ],
            recurring_expenses=[
                {"name": "Rent", "amount": 750, "frequency": "monthly"},
                {"name": "Groceries", "amount": 300, "frequency": "monthly"},
                {"name": "Phone", "amount": 80, "frequency": "monthly"},
                {"name": "Transport", "amount": 150, "frequency": "monthly"},
            ],
            outliers=[
                {
                    "name": "Tuition Deposit",
                    "kind": "expense",
                    "amount": 1200,
                    "month": _next_month_label(),
                }
            ],
            accounts=[
                {"name": "TD Chequing", "type": "chequing", "balance": 300, "interest_rate": 0.0},
                {"name": "TD Savings", "type": "savings", "balance": 1500, "interest_rate": 0.0},
            ],
            decision=ComparisonDecision(
                description="Move out",
                target_amount=6000,
                deadline_months=3,
                new_recurring_costs=[],
            ).model_dump(mode="json"),
        )
        findings = detect_issues(profile)
        self.assertLessEqual(len(findings), 5)
        severity_rank = {"critical": 0, "warning": 1, "tip": 2}
        self.assertEqual(
            [severity_rank[finding.severity] for finding in findings],
            sorted(severity_rank[finding.severity] for finding in findings),
        )


class IssueEndpointTests(unittest.TestCase):
    def setUp(self):
        db._use_memory = True
        db._profiles.clear()
        db._conversations.clear()
        db._simulations.clear()
        self.client = TestClient(app)

    def test_detect_endpoint_returns_404_when_before_profile_missing(self):
        response = self.client.post("/issues/detect", json={"user_id": "missing-user"})
        self.assertEqual(response.status_code, 404)

    def test_profile_route_persists_saved_name(self):
        response = self.client.put(
            "/profiles/demo-user",
            json={
                "name": "Dev Test",
                "income": {"amount": 1200, "frequency": "monthly", "is_variable": False},
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Dev Test")

        follow_up = self.client.get("/profiles/demo-user")
        self.assertEqual(follow_up.status_code, 200)
        self.assertEqual(follow_up.json()["name"], "Dev Test")

    def test_detect_endpoint_returns_fallback_issue_cards(self):
        healthy = _healthy_profile().model_dump(mode="json")
        profile = _profile_with(
            accounts=[
                healthy["accounts"][0],
                {**healthy["accounts"][1], "interest_rate": 0.0},
            ]
        )
        asyncio.run(
            db.save_comparison_profile(
                "demo-user",
                profile.model_dump(mode="json"),
                target_profile="before",
            )
        )

        with patch(
            "backend.services.issue_detection.chat_completion",
            new=AsyncMock(side_effect=RuntimeError("llm offline")),
        ):
            response = self.client.post("/issues/detect", json={"user_id": "demo-user"})

        self.assertEqual(response.status_code, 200)
        payload = response.json()["issues"]
        self.assertGreaterEqual(len(payload), 1)
        issue = payload[0]
        self.assertIn("rule_id", issue)
        self.assertIn("severity", issue)
        self.assertIn("title", issue)
        self.assertIn("explanation", issue)
        self.assertIn("action", issue)
        self.assertIn("actionType", issue)
        self.assertIn("metrics", issue)
        self.assertIn("reasons", issue)
        self.assertTrue(issue["explanation"])

    def test_research_endpoint_returns_manual_plan_when_web_search_fails(self):
        healthy = _healthy_profile().model_dump(mode="json")
        profile = _profile_with(
            accounts=[
                healthy["accounts"][0],
                {**healthy["accounts"][1], "interest_rate": 0.5},
            ]
        )
        asyncio.run(
            db.save_comparison_profile(
                "demo-user",
                profile.model_dump(mode="json"),
                target_profile="before",
            )
        )

        with patch(
            "backend.services.issue_research.client.responses.parse",
            new=AsyncMock(side_effect=RuntimeError("web search offline")),
        ):
            response = self.client.post(
                "/issues/research",
                json={"user_id": "demo-user", "rule_id": "low_yield_savings"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["rule_id"], "low_yield_savings")
        self.assertEqual(payload["mode"], "manual")
        self.assertTrue(payload["search_query"])
        self.assertTrue(payload["search_url"].startswith("https://www.google.com/search?q="))
        self.assertGreaterEqual(len(payload["steps"]), 1)
        self.assertGreaterEqual(len(payload["recommendations"]), 1)

    def test_browser_agent_start_route_returns_session_payload(self):
        with patch(
            "backend.routers.issues.browser_agent_manager.start_session",
            new=AsyncMock(
                return_value=IssueBrowserAgentStartResponse(
                    session_id="session-123",
                    task_id="task-123",
                    started=True,
                    state="running",
                    message="Launching browser",
                )
            ),
        ):
            response = self.client.post(
                "/issues/browser-agent/start",
                json={
                    "user_id": "demo-user",
                    "task_id": "task-123",
                    "research": {
                        "rule_id": "low_yield_savings",
                        "title": "Your savings are earning very little",
                        "action": "Compare savings options",
                        "mode": "manual",
                        "search_query": "best high interest savings account rates Canada",
                        "search_url": "https://www.google.com/search?q=test",
                        "browser_goal": "Find better current savings rates.",
                        "summary": "Compare current HISA options.",
                        "findings": [],
                        "steps": [],
                        "recommendations": [],
                        "sources": [],
                    },
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["session_id"], "session-123")
        self.assertEqual(payload["task_id"], "task-123")
        self.assertTrue(payload["started"])

    def test_browser_agent_status_route_returns_session_state(self):
        with patch(
            "backend.routers.issues.browser_agent_manager.get_status",
            return_value=IssueBrowserAgentStatusResponse(
                session_id="session-123",
                task_id="task-123",
                active=True,
                state="question",
                message="Waiting for input",
                question="What is the best rate you found?",
                result=None,
                current_url="https://example.com",
                error=None,
            ),
        ):
            response = self.client.get("/issues/browser-agent/status/session-123")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["state"], "question")
        self.assertEqual(payload["question"], "What is the best rate you found?")


class BrowserAgentSchemaTests(unittest.TestCase):
    def test_strict_function_schemas_require_all_declared_properties(self):
        ask_user_properties = ASK_USER_TOOL["parameters"]["properties"]
        ask_user_required = ASK_USER_TOOL["parameters"]["required"]
        finish_task_properties = FINISH_TASK_TOOL["parameters"]["properties"]
        finish_task_required = FINISH_TASK_TOOL["parameters"]["required"]

        self.assertEqual(sorted(ask_user_required), sorted(ask_user_properties.keys()))
        self.assertEqual(sorted(finish_task_required), sorted(finish_task_properties.keys()))

    def test_model_access_error_triggers_vision_fallback(self):
        manager = BrowserAgentManager()
        error = RuntimeError(
            "Error code: 404 - {'error': {'message': 'The model `computer-use-preview` does not exist or you do not have access to it.', 'code': 'model_not_found'}}"
        )

        self.assertTrue(manager._should_use_vision_fallback(error))
