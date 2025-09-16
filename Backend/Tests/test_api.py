import sys
import importlib
import json
import numpy as np
import joblib
import pytest

# ---- Fakes ----
class FakeModel:
    def __init__(self, proba=(0.6, 0.3, 0.1)):
        self._proba = np.array([list(proba)], dtype=float)
    def predict_proba(self, X):
        return self._proba

class FakePoly:
    def transform(self, X):
        return X  # identity

class FakeLabelEncoder:
    classes_ = np.array(["Clean", "Slightly Polluted", "Polluted"])
    def inverse_transform(self, idxs):
        return [self.classes_[i] for i in idxs]

def _fake_joblib_load(_path):
    return {
        "gb_model": FakeModel(),
        "lgb_model": FakeModel(),
        "xgb_model": FakeModel(),
        "weights": {"w_gb": 1.0, "w_lgb": 1.0, "w_xgb": 1.0},
        "poly": FakePoly(),
        "label_encoder": FakeLabelEncoder(),
    }

# ---- Fixtures ----
@pytest.fixture()  # function-scoped
def api_module(monkeypatch):
    monkeypatch.setattr(joblib, "load", _fake_joblib_load, raising=True)
    sys.modules.pop("api", None)  # ensure clean import
    import api  # loads Backend/api.py
    return importlib.import_module("api")

@pytest.fixture()
def app(api_module):
    return api_module.app

@pytest.fixture()
def client(app):
    return app.test_client()

@pytest.fixture()
def valid_payload():
    return {
        "DO": 7.1,
        "DO_SAT": 88.0,
        "BOD": 2.5,
        "COD": 12.0,
        "SS": 45.0,
        "pH": 7.2,
        "NH3N": 0.15,
        "TEMP": 26.0,
    }

# ---- Tests ----
def test_root_ok(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert b"API" in resp.data  # adjust to your exact message if needed

def test_test_endpoint_ok(client):
    resp = client.get("/test")
    assert resp.status_code == 200

def test_predict_success(client, valid_payload):
    resp = client.post("/predict", data=json.dumps(valid_payload), content_type="application/json")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["prediction"] in {"Clean", "Slightly Polluted", "Polluted"}
    assert isinstance(data["confidence"], (int, float))
    probs = data["probabilities"]
    assert set(probs.keys()) == {"Clean", "Slightly Polluted", "Polluted"}
    assert np.isclose(sum(probs.values()), 1.0, atol=1e-6)

def test_predict_missing_field_returns_400(client, valid_payload):
    bad = dict(valid_payload); bad.pop("TEMP")
    resp = client.post("/predict", data=json.dumps(bad), content_type="application/json")
    assert resp.status_code == 400
    assert "error" in resp.get_json()

def test_predict_wrong_method_not_allowed(client):
    resp = client.get("/predict")
    assert resp.status_code == 405

def test_internal_error_returns_400(api_module, client, valid_payload, monkeypatch):
    class BoomPoly:
        def transform(self, X): raise ValueError("boom")
    monkeypatch.setattr(api_module, "poly", BoomPoly(), raising=True)
    resp = client.post("/predict", data=json.dumps(valid_payload), content_type="application/json")
    assert resp.status_code == 400
    assert "error" in resp.get_json()
    
