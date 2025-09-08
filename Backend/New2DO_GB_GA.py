# === Imports ===
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import LabelEncoder, PolynomialFeatures
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from imblearn.over_sampling import SMOTE
import optuna
import lightgbm as lgb
import xgboost as xgb

# === Pretty Confusion Matrix ===
def pretty_confusion_matrix(y_true, y_pred, labels, title="Confusion Matrix"):
    cm = confusion_matrix(y_true, y_pred)
    cm_df = pd.DataFrame(cm, index=labels, columns=labels)
    print(f"\n--- {title} ---")
    print(cm_df)
    return cm_df

# === Load and Clean Data ===
df = pd.read_csv('klangRiverFinal.csv')
df.columns = df.columns.str.replace(r'\s+', ' ', regex=True).str.strip()

df.rename(columns={
    "DO": "DO_Sat",   # First one = DO% Saturation
    "DO.1": "DO"      # Second one = Actual DO
}, inplace=True)

# Rename columns to match columns_of_interest
rename_dict = {
    'DO mg/l': 'DO',
    'DO % Sat': 'DO_Sat',
    'BOD mg/l': 'BOD',
    'COD mg/l': 'COD',
    'SS mg/l': 'SS',
    'NH3-N mg/l': 'NH3N',
    'TEMP °C': 'TEMP'
}
df.rename(columns=rename_dict, inplace=True)

print("\n--- Columns after cleaning ---")
print(df.columns.tolist())

columns_of_interest = ['DO', 'DO_Sat', 'BOD', 'COD', 'SS', 'pH', 'NH3N', 'TEMP']

for col in columns_of_interest:
    df[col] = pd.to_numeric(df[col].astype(str).str.replace('<', '', regex=False), errors='coerce')
df.dropna(subset=columns_of_interest + ['RIVER STATUS'], inplace=True)

X = df[columns_of_interest]
y = df['RIVER STATUS']

le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Polynomial Interaction Features
poly = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
X_poly = poly.fit_transform(X)

# === Load GA-tuned GB model ===
gb_ga_model = joblib.load("ensemble_stack_model.pkl")

# === Optuna Objective ===
def ensemble_objective(trial):
    # XGBoost params
    xgb_params = {
        'n_estimators': trial.suggest_int('xgb_n_estimators', 500, 3000),
        'learning_rate': trial.suggest_float('xgb_learning_rate', 0.005, 0.3),
        'max_depth': trial.suggest_int('xgb_max_depth', 2, 20),
        'subsample': trial.suggest_float('xgb_subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('xgb_colsample_bytree', 0.5, 1.0),
        'gamma': trial.suggest_float('xgb_gamma', 0.0, 5.0),
        'reg_alpha': trial.suggest_float('xgb_reg_alpha', 0.0, 5.0),
        'reg_lambda': trial.suggest_float('xgb_reg_lambda', 0.0, 5.0)
    }

    # LightGBM params
    lgb_params = {
        'n_estimators': trial.suggest_int('lgb_n_estimators', 500, 3000),
        'learning_rate': trial.suggest_float('lgb_learning_rate', 0.005, 0.3),
        'max_depth': trial.suggest_int('lgb_max_depth', 2, 20),
        'num_leaves': trial.suggest_int('lgb_num_leaves', 16, 256),
        'subsample': trial.suggest_float('lgb_subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('lgb_colsample_bytree', 0.5, 1.0),
        'reg_alpha': trial.suggest_float('lgb_reg_alpha', 0.0, 5.0),
        'reg_lambda': trial.suggest_float('lgb_reg_lambda', 0.0, 5.0)
    }

    # Ensemble weights
    w_gb = trial.suggest_float('w_gb', 0.1, 5.0)
    w_lgb = trial.suggest_float('w_lgb', 0.1, 5.0)
    w_xgb = trial.suggest_float('w_xgb', 0.1, 5.0)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = []

    for train_idx, valid_idx in cv.split(X_poly, y_encoded):
        X_train_fold, X_valid_fold = X_poly[train_idx], X_poly[valid_idx]
        y_train_fold, y_valid_fold = y_encoded[train_idx], y_encoded[valid_idx]

        # SMOTE inside CV
        X_train_fold, y_train_fold = SMOTE(random_state=42).fit_resample(X_train_fold, y_train_fold)

        # Clone models fresh each fold
        gb_model_fold = joblib.load("gb_ga_model.pkl")
        lgb_model_fold = lgb.LGBMClassifier(**lgb_params, random_state=42)
        xgb_model_fold = xgb.XGBClassifier(**xgb_params, random_state=42, eval_metric='mlogloss')

        gb_model_fold.fit(X_train_fold, y_train_fold)
        lgb_model_fold.fit(X_train_fold, y_train_fold)
        xgb_model_fold.fit(X_train_fold, y_train_fold)

        preds_gb = gb_model_fold.predict_proba(X_valid_fold)
        preds_lgb = lgb_model_fold.predict_proba(X_valid_fold)
        preds_xgb = xgb_model_fold.predict_proba(X_valid_fold)

        final_preds = (w_gb * preds_gb + w_lgb * preds_lgb + w_xgb * preds_xgb) / (w_gb + w_lgb + w_xgb)
        final_labels = np.argmax(final_preds, axis=1)

        scores.append(accuracy_score(y_valid_fold, final_labels))

    return np.mean(scores)

# === Run Optuna ===
study = optuna.create_study(direction="maximize", sampler=optuna.samplers.TPESampler(seed=42))
study.optimize(ensemble_objective, n_trials=500, show_progress_bar=True)

best_params = study.best_params
print("Best params:", best_params)
print("Best CV Accuracy:", study.best_value)

# === Train Final Ensemble on Full Train Set ===
X_train, X_test, y_train, y_test = train_test_split(X_poly, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42)
X_train, y_train = SMOTE(random_state=42).fit_resample(X_train, y_train)

# Build final models
gb_final = joblib.load("gb_ga_model.pkl")
lgb_final = lgb.LGBMClassifier(
    n_estimators=best_params['lgb_n_estimators'],
    learning_rate=best_params['lgb_learning_rate'],
    max_depth=best_params['lgb_max_depth'],
    num_leaves=best_params['lgb_num_leaves'],
    subsample=best_params['lgb_subsample'],
    colsample_bytree=best_params['lgb_colsample_bytree'],
    reg_alpha=best_params['lgb_reg_alpha'],
    reg_lambda=best_params['lgb_reg_lambda'],
    random_state=42
)
xgb_final = xgb.XGBClassifier(
    n_estimators=best_params['xgb_n_estimators'],
    learning_rate=best_params['xgb_learning_rate'],
    max_depth=best_params['xgb_max_depth'],
    subsample=best_params['xgb_subsample'],
    colsample_bytree=best_params['xgb_colsample_bytree'],
    gamma=best_params['xgb_gamma'],
    reg_alpha=best_params['xgb_reg_alpha'],
    reg_lambda=best_params['xgb_reg_lambda'],
    random_state=42,
    eval_metric='mlogloss'
)

# Fit all models
gb_final.fit(X_train, y_train)
lgb_final.fit(X_train, y_train)
xgb_final.fit(X_train, y_train)

# Ensemble predict
preds_gb = gb_final.predict_proba(X_test)
preds_lgb = lgb_final.predict_proba(X_test)
preds_xgb = xgb_final.predict_proba(X_test)

final_preds = (
    best_params['w_gb'] * preds_gb +
    best_params['w_lgb'] * preds_lgb +
    best_params['w_xgb'] * preds_xgb
) / (best_params['w_gb'] + best_params['w_lgb'] + best_params['w_xgb'])

final_labels = np.argmax(final_preds, axis=1)

# Evaluation
cm_df = pretty_confusion_matrix(y_test, final_labels, labels=le.classes_)
accuracy = accuracy_score(y_test, final_labels)
report = classification_report(y_test, final_labels, target_names=le.classes_)

print("\n--- Final Ensemble Accuracy ---")
print(f"Accuracy: {accuracy:.4f}")
print("\n--- Classification Report ---")
print(report)

# Save evaluation
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
with open("NEW2DO_ensemble_model_evaluation.txt", "w") as f:
    f.write("=== Ensemble_Model_Evaluation ===\n")
    f.write(f"Generated on: {now}\n\n")
    f.write("--- Confusion Matrix ---\n")
    f.write(cm_df.to_string())
    f.write("\n\n--- Classification Report ---\n")
    f.write(report)
    f.write(f"\n\nAccuracy: {accuracy:.4f}")

# Save models & weights
joblib.dump({
    'gb_model': gb_final,
    'lgb_model': lgb_final,
    'xgb_model': xgb_final,
    'weights': {
        'w_gb': best_params['w_gb'],
        'w_lgb': best_params['w_lgb'],
        'w_xgb': best_params['w_xgb']
    },
    'poly': poly,
    'label_encoder': le
}, "ensemble_stack_model.pkl")
