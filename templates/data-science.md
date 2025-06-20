# {{PROJECT_NAME}} - Data Science AI Context Configuration

## Project Overview
{{PROJECT_DESCRIPTION}}

**Data Science Stack:**
- **Language:** {{PRIMARY_LANGUAGE}} (e.g., Python, R, Julia)
- **Data Processing:** {{DATA_PROCESSING_TOOLS}} (e.g., Pandas, NumPy, Dask)
- **Machine Learning:** {{ML_FRAMEWORKS}} (e.g., scikit-learn, TensorFlow, PyTorch)
- **Visualization:** {{VIZ_TOOLS}} (e.g., Matplotlib, Plotly, Seaborn)
- **Notebooks:** {{NOTEBOOK_ENVIRONMENT}} (e.g., Jupyter, JupyterLab, Google Colab)
- **Deployment:** {{DEPLOYMENT_PLATFORM}} (e.g., MLflow, Docker, Kubernetes)
- **Version Control:** {{DATA_VERSION_CONTROL}} (e.g., DVC, Git LFS)

## Project Structure
```
{{PROJECT_NAME}}/
├── data/
│   ├── raw/                # Original, immutable data
│   ├── interim/            # Intermediate data transformations
│   ├── processed/          # Final, canonical datasets
│   └── external/           # External data sources
├── notebooks/
│   ├── exploratory/        # Jupyter notebooks for exploration
│   ├── experiments/        # Model experiments and testing
│   └── reports/            # Analysis reports and presentations
├── src/
│   ├── data/              # Data acquisition and preprocessing
│   ├── features/          # Feature engineering pipelines
│   ├── models/            # Model definitions and training
│   ├── visualization/     # Plotting and visualization utilities
│   └── utils/             # General utility functions
├── models/                # Trained model artifacts
├── reports/               # Generated analysis reports
├── tests/                 # Unit tests for code
├── requirements.txt       # Python dependencies
├── setup.py              # Package setup
└── {{CONFIG_FILES}}      # Configuration files
```

## Data Management

### Data Loading and Validation
```{{LANGUAGE_EXTENSION}}
# Data loading utilities
import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List
from pathlib import Path
import logging

class DataLoader:
    """Centralized data loading and validation"""
    
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir)
        self.logger = logging.getLogger(__name__)
    
    def load_dataset(
        self, 
        filename: str, 
        data_type: str = 'processed',
        validate: bool = True
    ) -> pd.DataFrame:
        """Load dataset with optional validation"""
        
        file_path = self.data_dir / data_type / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Dataset not found: {file_path}")
        
        # Load based on file extension
        if file_path.suffix == '.csv':
            df = pd.read_csv(file_path)
        elif file_path.suffix == '.parquet':
            df = pd.read_parquet(file_path)
        elif file_path.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
        
        self.logger.info(f"Loaded {filename}: {df.shape}")
        
        if validate:
            self._validate_dataset(df, filename)
        
        return df
    
    def _validate_dataset(self, df: pd.DataFrame, filename: str) -> None:
        """Basic dataset validation"""
        
        # Check for empty dataset
        if df.empty:
            raise ValueError(f"Dataset {filename} is empty")
        
        # Check for expected columns (implement project-specific logic)
        expected_columns = {{EXPECTED_COLUMNS}}
        missing_columns = set(expected_columns) - set(df.columns)
        if missing_columns:
            raise ValueError(f"Missing columns in {filename}: {missing_columns}")
        
        # Check data types
        {{DATA_TYPE_VALIDATION}}
        
        # Log basic statistics
        self.logger.info(f"Dataset validation passed for {filename}")
        self.logger.info(f"Shape: {df.shape}, Memory usage: {df.memory_usage().sum() / 1024**2:.2f} MB")

# Data preprocessing pipeline
class DataPreprocessor:
    """Data cleaning and preprocessing utilities"""
    
    def __init__(self):
        self.fitted_transformers = {}
    
    def clean_dataset(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply standard cleaning operations"""
        
        df_clean = df.copy()
        
        # Remove duplicates
        initial_shape = df_clean.shape
        df_clean = df_clean.drop_duplicates()
        if df_clean.shape[0] < initial_shape[0]:
            logging.info(f"Removed {initial_shape[0] - df_clean.shape[0]} duplicate rows")
        
        # Handle missing values
        df_clean = self._handle_missing_values(df_clean)
        
        # Data type conversions
        df_clean = self._convert_data_types(df_clean)
        
        # Remove outliers
        df_clean = self._remove_outliers(df_clean)
        
        return df_clean
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values based on column types"""
        
        df_processed = df.copy()
        
        for column in df_processed.columns:
            if df_processed[column].dtype in ['object', 'string']:
                # Fill categorical missing values
                df_processed[column] = df_processed[column].fillna('Unknown')
            elif df_processed[column].dtype in ['int64', 'float64']:
                # Fill numerical missing values
                if {{FILL_STRATEGY}} == 'median':
                    df_processed[column] = df_processed[column].fillna(df_processed[column].median())
                elif {{FILL_STRATEGY}} == 'mean':
                    df_processed[column] = df_processed[column].fillna(df_processed[column].mean())
                else:
                    df_processed[column] = df_processed[column].fillna(0)
        
        return df_processed
    
    def _convert_data_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Convert data types for optimization"""
        
        df_converted = df.copy()
        
        # Convert date columns
        date_columns = {{DATE_COLUMNS}}
        for col in date_columns:
            if col in df_converted.columns:
                df_converted[col] = pd.to_datetime(df_converted[col])
        
        # Convert categorical columns
        categorical_columns = {{CATEGORICAL_COLUMNS}}
        for col in categorical_columns:
            if col in df_converted.columns:
                df_converted[col] = df_converted[col].astype('category')
        
        return df_converted
    
    def _remove_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove outliers using IQR method"""
        
        df_no_outliers = df.copy()
        numerical_columns = df_no_outliers.select_dtypes(include=[np.number]).columns
        
        for column in numerical_columns:
            Q1 = df_no_outliers[column].quantile(0.25)
            Q3 = df_no_outliers[column].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers_mask = (df_no_outliers[column] < lower_bound) | (df_no_outliers[column] > upper_bound)
            outliers_count = outliers_mask.sum()
            
            if outliers_count > 0:
                df_no_outliers = df_no_outliers[~outliers_mask]
                logging.info(f"Removed {outliers_count} outliers from {column}")
        
        return df_no_outliers
```

## Feature Engineering

### Feature Creation Pipeline
```{{LANGUAGE_EXTENSION}}
# Feature engineering utilities
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_selection import SelectKBest, f_classif

class FeatureEngineer:
    """Custom feature engineering pipeline"""
    
    def __init__(self):
        self.transformers = {}
        self.feature_names = []
    
    def create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create new features from existing data"""
        
        df_features = df.copy()
        
        # Temporal features
        df_features = self._create_temporal_features(df_features)
        
        # Numerical features
        df_features = self._create_numerical_features(df_features)
        
        # Categorical features
        df_features = self._create_categorical_features(df_features)
        
        # Interaction features
        df_features = self._create_interaction_features(df_features)
        
        return df_features
    
    def _create_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract temporal features from datetime columns"""
        
        df_temporal = df.copy()
        
        for col in df_temporal.select_dtypes(include=['datetime64']).columns:
            # Extract common temporal features
            df_temporal[f'{col}_year'] = df_temporal[col].dt.year
            df_temporal[f'{col}_month'] = df_temporal[col].dt.month
            df_temporal[f'{col}_day'] = df_temporal[col].dt.day
            df_temporal[f'{col}_dayofweek'] = df_temporal[col].dt.dayofweek
            df_temporal[f'{col}_quarter'] = df_temporal[col].dt.quarter
            df_temporal[f'{col}_is_weekend'] = df_temporal[col].dt.dayofweek.isin([5, 6]).astype(int)
            
            # Project-specific temporal features
            {{TEMPORAL_FEATURES}}
        
        return df_temporal
    
    def _create_numerical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create numerical features"""
        
        df_numerical = df.copy()
        
        numerical_cols = df_numerical.select_dtypes(include=[np.number]).columns
        
        for col in numerical_cols:
            # Log transformation for skewed data
            if df_numerical[col].min() > 0:
                df_numerical[f'{col}_log'] = np.log1p(df_numerical[col])
            
            # Squared features
            df_numerical[f'{col}_squared'] = df_numerical[col] ** 2
            
            # Binning
            df_numerical[f'{col}_binned'] = pd.cut(
                df_numerical[col], 
                bins={{BIN_COUNT}}, 
                labels=False
            )
        
        # Ratio features
        {{RATIO_FEATURES}}
        
        return df_numerical
    
    def _create_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create categorical features"""
        
        df_categorical = df.copy()
        
        categorical_cols = df_categorical.select_dtypes(include=['object', 'category']).columns
        
        for col in categorical_cols:
            # Frequency encoding
            value_counts = df_categorical[col].value_counts()
            df_categorical[f'{col}_frequency'] = df_categorical[col].map(value_counts)
            
            # Rare category encoding
            rare_threshold = {{RARE_THRESHOLD}}
            rare_categories = value_counts[value_counts < rare_threshold].index
            df_categorical[f'{col}_is_rare'] = df_categorical[col].isin(rare_categories).astype(int)
        
        return df_categorical
    
    def _create_interaction_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create interaction features"""
        
        df_interactions = df.copy()
        
        # Define feature interactions
        interaction_pairs = {{INTERACTION_PAIRS}}
        
        for col1, col2 in interaction_pairs:
            if col1 in df_interactions.columns and col2 in df_interactions.columns:
                # Multiplication interaction
                df_interactions[f'{col1}_x_{col2}'] = df_interactions[col1] * df_interactions[col2]
                
                # Division interaction (avoid division by zero)
                df_interactions[f'{col1}_div_{col2}'] = df_interactions[col1] / (df_interactions[col2] + 1e-8)
        
        return df_interactions

class FeatureSelector:
    """Feature selection utilities"""
    
    def __init__(self, method: str = 'univariate'):
        self.method = method
        self.selector = None
        self.selected_features = []
    
    def select_features(
        self, 
        X: pd.DataFrame, 
        y: pd.Series, 
        k: int = 10
    ) -> pd.DataFrame:
        """Select top k features"""
        
        if self.method == 'univariate':
            self.selector = SelectKBest(score_func=f_classif, k=k)
            X_selected = self.selector.fit_transform(X, y)
            self.selected_features = X.columns[self.selector.get_support()].tolist()
        
        elif self.method == 'correlation':
            # Remove highly correlated features
            corr_matrix = X.corr().abs()
            upper_triangle = corr_matrix.where(
                np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
            )
            
            to_drop = [column for column in upper_triangle.columns if any(upper_triangle[column] > 0.9)]
            self.selected_features = [col for col in X.columns if col not in to_drop]
            X_selected = X[self.selected_features]
        
        return pd.DataFrame(X_selected, columns=self.selected_features)
```

## Model Development

### Model Training Pipeline
```{{LANGUAGE_EXTENSION}}
# Model training and evaluation
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import mlflow
import mlflow.sklearn

class ModelTrainer:
    """Model training and evaluation pipeline"""
    
    def __init__(self, experiment_name: str):
        self.experiment_name = experiment_name
        self.models = {}
        self.best_model = None
        self.best_score = 0
        
        # Initialize MLflow
        mlflow.set_experiment(experiment_name)
    
    def train_models(
        self, 
        X: pd.DataFrame, 
        y: pd.Series, 
        models: Dict[str, Any],
        test_size: float = 0.2
    ) -> Dict[str, Dict]:
        """Train multiple models and compare performance"""
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        results = {}
        
        for model_name, model in models.items():
            with mlflow.start_run(run_name=model_name):
                # Train model
                model.fit(X_train, y_train)
                
                # Predictions
                y_pred = model.predict(X_test)
                y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
                
                # Evaluate
                score = model.score(X_test, y_test)
                auc_score = roc_auc_score(y_test, y_prob) if y_prob is not None else None
                
                # Cross-validation
                cv_scores = cross_val_score(model, X_train, y_train, cv=5)
                
                # Store results
                results[model_name] = {
                    'model': model,
                    'test_score': score,
                    'auc_score': auc_score,
                    'cv_mean': cv_scores.mean(),
                    'cv_std': cv_scores.std(),
                    'predictions': y_pred,
                    'probabilities': y_prob
                }
                
                # Log to MLflow
                mlflow.log_param('model_type', type(model).__name__)
                mlflow.log_metric('test_accuracy', score)
                mlflow.log_metric('cv_mean', cv_scores.mean())
                mlflow.log_metric('cv_std', cv_scores.std())
                if auc_score:
                    mlflow.log_metric('auc_score', auc_score)
                
                mlflow.sklearn.log_model(model, f"models/{model_name}")
                
                # Track best model
                if score > self.best_score:
                    self.best_score = score
                    self.best_model = model
                
                self.models[model_name] = model
        
        return results
    
    def hyperparameter_tuning(
        self, 
        X: pd.DataFrame, 
        y: pd.Series, 
        model: Any, 
        param_grid: Dict,
        cv: int = 5
    ) -> Any:
        """Perform hyperparameter tuning"""
        
        with mlflow.start_run(run_name=f"{type(model).__name__}_tuned"):
            grid_search = GridSearchCV(
                model, 
                param_grid, 
                cv=cv, 
                scoring='accuracy',
                n_jobs=-1
            )
            
            grid_search.fit(X, y)
            
            # Log best parameters
            mlflow.log_params(grid_search.best_params_)
            mlflow.log_metric('best_cv_score', grid_search.best_score_)
            
            return grid_search.best_estimator_
    
    def evaluate_model(
        self, 
        model: Any, 
        X_test: pd.DataFrame, 
        y_test: pd.Series
    ) -> Dict:
        """Comprehensive model evaluation"""
        
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
        
        evaluation = {
            'accuracy': model.score(X_test, y_test),
            'classification_report': classification_report(y_test, y_pred),
            'confusion_matrix': confusion_matrix(y_test, y_pred)
        }
        
        if y_prob is not None:
            evaluation['auc_score'] = roc_auc_score(y_test, y_prob)
        
        return evaluation
    
    def save_model(self, model: Any, filepath: str) -> None:
        """Save trained model"""
        joblib.dump(model, filepath)
        logging.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str) -> Any:
        """Load trained model"""
        model = joblib.load(filepath)
        logging.info(f"Model loaded from {filepath}")
        return model

# Model configuration
MODEL_CONFIGS = {
    'random_forest': {
        'model': RandomForestClassifier(random_state=42),
        'params': {
            'n_estimators': [100, 200, 300],
            'max_depth': [None, 10, 20, 30],
            'min_samples_split': [2, 5, 10]
        }
    },
    'gradient_boosting': {
        'model': GradientBoostingClassifier(random_state=42),
        'params': {
            'n_estimators': [100, 200],
            'learning_rate': [0.1, 0.01, 0.001],
            'max_depth': [3, 5, 7]
        }
    },
    'svm': {
        'model': SVC(random_state=42, probability=True),
        'params': {
            'C': [0.1, 1, 10],
            'kernel': ['rbf', 'linear'],
            'gamma': ['scale', 'auto']
        }
    }
}
```

## Visualization and Reporting

### Data Visualization
```{{LANGUAGE_EXTENSION}}
# Visualization utilities
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

class DataVisualizer:
    """Data visualization utilities"""
    
    def __init__(self, style: str = 'seaborn'):
        plt.style.use(style)
        sns.set_palette("husl")
    
    def plot_distribution(self, df: pd.DataFrame, columns: List[str]) -> None:
        """Plot distribution of numerical columns"""
        
        n_cols = len(columns)
        n_rows = (n_cols + 2) // 3
        
        fig, axes = plt.subplots(n_rows, 3, figsize=(15, 5 * n_rows))
        axes = axes.flatten() if n_rows > 1 else [axes]
        
        for i, column in enumerate(columns):
            if i < len(axes):
                sns.histplot(data=df, x=column, kde=True, ax=axes[i])
                axes[i].set_title(f'Distribution of {column}')
        
        # Hide unused subplots
        for i in range(len(columns), len(axes)):
            axes[i].set_visible(False)
        
        plt.tight_layout()
        plt.show()
    
    def plot_correlation_matrix(self, df: pd.DataFrame) -> None:
        """Plot correlation matrix heatmap"""
        
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        corr_matrix = df[numerical_cols].corr()
        
        plt.figure(figsize=(12, 10))
        sns.heatmap(
            corr_matrix, 
            annot=True, 
            cmap='coolwarm', 
            center=0,
            square=True,
            fmt='.2f'
        )
        plt.title('Feature Correlation Matrix')
        plt.tight_layout()
        plt.show()
    
    def plot_feature_importance(
        self, 
        model: Any, 
        feature_names: List[str], 
        top_k: int = 20
    ) -> None:
        """Plot feature importance"""
        
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            importances = np.abs(model.coef_[0])
        else:
            print("Model doesn't have feature importance or coefficients")
            return
        
        # Create feature importance dataframe
        feature_imp_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False).head(top_k)
        
        plt.figure(figsize=(10, 8))
        sns.barplot(data=feature_imp_df, x='importance', y='feature')
        plt.title(f'Top {top_k} Feature Importances')
        plt.xlabel('Importance')
        plt.tight_layout()
        plt.show()
    
    def plot_model_performance(self, results: Dict) -> None:
        """Plot model comparison"""
        
        model_names = list(results.keys())
        test_scores = [results[name]['test_score'] for name in model_names]
        cv_means = [results[name]['cv_mean'] for name in model_names]
        cv_stds = [results[name]['cv_std'] for name in model_names]
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Test scores
        ax1.bar(model_names, test_scores)
        ax1.set_title('Test Set Performance')
        ax1.set_ylabel('Accuracy')
        ax1.tick_params(axis='x', rotation=45)
        
        # Cross-validation scores
        ax2.errorbar(model_names, cv_means, yerr=cv_stds, fmt='o', capsize=5)
        ax2.set_title('Cross-Validation Performance')
        ax2.set_ylabel('CV Accuracy')
        ax2.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.show()
    
    def create_interactive_plot(self, df: pd.DataFrame, x: str, y: str, color: str = None) -> None:
        """Create interactive plotly visualization"""
        
        fig = px.scatter(
            df, 
            x=x, 
            y=y, 
            color=color,
            title=f'{y} vs {x}',
            hover_data=df.columns
        )
        
        fig.update_layout(
            xaxis_title=x,
            yaxis_title=y,
            hovermode='closest'
        )
        
        fig.show()

# Report generation
class ReportGenerator:
    """Generate analysis reports"""
    
    def __init__(self, output_dir: str = 'reports'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def generate_data_profile(self, df: pd.DataFrame, filename: str = 'data_profile.html') -> None:
        """Generate comprehensive data profiling report"""
        
        try:
            from pandas_profiling import ProfileReport
            
            profile = ProfileReport(
                df, 
                title="Data Profiling Report",
                explorative=True
            )
            
            output_path = self.output_dir / filename
            profile.to_file(output_path)
            print(f"Data profile saved to {output_path}")
            
        except ImportError:
            print("pandas-profiling not installed. Install with: pip install pandas-profiling")
    
    def generate_model_report(
        self, 
        results: Dict, 
        filename: str = 'model_report.html'
    ) -> None:
        """Generate model comparison report"""
        
        # Create HTML report
        html_content = self._create_model_report_html(results)
        
        output_path = self.output_dir / filename
        with open(output_path, 'w') as f:
            f.write(html_content)
        
        print(f"Model report saved to {output_path}")
    
    def _create_model_report_html(self, results: Dict) -> str:
        """Create HTML content for model report"""
        
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Model Performance Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .metric { font-weight: bold; color: #2e8b57; }
            </style>
        </head>
        <body>
            <h1>Model Performance Report</h1>
            <table>
                <tr>
                    <th>Model</th>
                    <th>Test Accuracy</th>
                    <th>CV Mean</th>
                    <th>CV Std</th>
                    <th>AUC Score</th>
                </tr>
        """
        
        for model_name, result in results.items():
            html += f"""
                <tr>
                    <td>{model_name}</td>
                    <td class="metric">{result['test_score']:.4f}</td>
                    <td class="metric">{result['cv_mean']:.4f}</td>
                    <td>{result['cv_std']:.4f}</td>
                    <td class="metric">{result.get('auc_score', 'N/A')}</td>
                </tr>
            """
        
        html += """
            </table>
        </body>
        </html>
        """
        
        return html
```

## Experiment Tracking

### MLflow Integration
```{{LANGUAGE_EXTENSION}}
# MLflow experiment tracking
import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient

class ExperimentTracker:
    """MLflow experiment tracking utilities"""
    
    def __init__(self, experiment_name: str):
        self.experiment_name = experiment_name
        self.client = MlflowClient()
        
        # Set or create experiment
        try:
            experiment = mlflow.get_experiment_by_name(experiment_name)
            if experiment is None:
                mlflow.create_experiment(experiment_name)
        except:
            mlflow.create_experiment(experiment_name)
        
        mlflow.set_experiment(experiment_name)
    
    def log_dataset_info(self, df: pd.DataFrame, dataset_name: str) -> None:
        """Log dataset information"""
        
        with mlflow.start_run(run_name=f"dataset_{dataset_name}"):
            mlflow.log_param('dataset_name', dataset_name)
            mlflow.log_param('n_rows', df.shape[0])
            mlflow.log_param('n_columns', df.shape[1])
            mlflow.log_param('memory_usage_mb', df.memory_usage().sum() / 1024**2)
            
            # Log basic statistics
            for col in df.select_dtypes(include=[np.number]).columns:
                mlflow.log_metric(f'{col}_mean', df[col].mean())
                mlflow.log_metric(f'{col}_std', df[col].std())
                mlflow.log_metric(f'{col}_missing_pct', df[col].isnull().sum() / len(df) * 100)
    
    def compare_experiments(self, experiment_names: List[str]) -> pd.DataFrame:
        """Compare results across experiments"""
        
        all_runs = []
        
        for exp_name in experiment_names:
            experiment = mlflow.get_experiment_by_name(exp_name)
            if experiment:
                runs = mlflow.search_runs(
                    experiment_ids=[experiment.experiment_id],
                    order_by=['metrics.test_accuracy DESC']
                )
                runs['experiment'] = exp_name
                all_runs.append(runs)
        
        if all_runs:
            comparison_df = pd.concat(all_runs, ignore_index=True)
            return comparison_df[['experiment', 'run_name', 'metrics.test_accuracy', 'metrics.cv_mean']]
        
        return pd.DataFrame()
    
    def get_best_model(self, metric: str = 'test_accuracy') -> Any:
        """Get best model from current experiment"""
        
        experiment = mlflow.get_experiment_by_name(self.experiment_name)
        runs = mlflow.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=[f'metrics.{metric} DESC'],
            max_results=1
        )
        
        if not runs.empty:
            best_run_id = runs.iloc[0]['run_id']
            model_uri = f"runs:/{best_run_id}/model"
            return mlflow.sklearn.load_model(model_uri)
        
        return None
```

## Deployment

### Model Serving
```{{LANGUAGE_EXTENSION}}
# Model serving utilities
from flask import Flask, request, jsonify
import pickle
import numpy as np

class ModelServer:
    """Simple model serving with Flask"""
    
    def __init__(self, model_path: str):
        self.model = joblib.load(model_path)
        self.app = Flask(__name__)
        self._setup_routes()
    
    def _setup_routes(self):
        @self.app.route('/predict', methods=['POST'])
        def predict():
            try:
                # Get data from request
                data = request.get_json()
                
                # Convert to DataFrame
                input_df = pd.DataFrame([data])
                
                # Make prediction
                prediction = self.model.predict(input_df)[0]
                probability = self.model.predict_proba(input_df)[0].max() if hasattr(self.model, 'predict_proba') else None
                
                response = {
                    'prediction': int(prediction),
                    'probability': float(probability) if probability else None,
                    'status': 'success'
                }
                
                return jsonify(response)
                
            except Exception as e:
                return jsonify({
                    'error': str(e),
                    'status': 'error'
                }), 400
        
        @self.app.route('/health', methods=['GET'])
        def health():
            return jsonify({'status': 'healthy'})
    
    def run(self, host: str = '0.0.0.0', port: int = 5000):
        self.app.run(host=host, port=port)

# Docker deployment
DOCKERFILE_TEMPLATE = """
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
COPY models/ ./models/
COPY serve.py .

EXPOSE 5000

CMD ["python", "serve.py"]
"""
```

<!-- Tool-specific instructions -->

<!-- AI:CLAUDE -->
Focus on statistical rigor and scientific methodology.
Help with complex data analysis and modeling challenges.
Suggest improvements for model performance and interpretability.
Provide guidance on experimental design and validation strategies.
<!-- /AI:CLAUDE -->

<!-- AI:CURSOR -->
Navigate efficiently between notebooks and code modules.
Focus on rapid experimentation and iteration.
Help with data visualization and exploratory analysis.
<!-- /AI:CURSOR -->

<!-- AI:COPILOT -->
Generate comprehensive data processing pipelines.
Suggest advanced ML techniques and optimizations.
Help with deployment and productionization of models.
<!-- /AI:COPILOT -->

<!-- AI:CODEIUM -->
Provide context-aware suggestions for data science workflows.
Help with feature engineering and model selection.
Suggest best practices for reproducible research.
<!-- /AI:CODEIUM -->

## Configuration

### Environment Setup
```bash
# Create virtual environment
python -m venv {{PROJECT_NAME}}_env
source {{PROJECT_NAME}}_env/bin/activate  # On Windows: {{PROJECT_NAME}}_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt

# Install project as package
pip install -e .
```

### Jupyter Configuration
```{{LANGUAGE_EXTENSION}}
# Jupyter extensions and settings
{{JUPYTER_CONFIG}}
```

---

*This configuration is managed by ContextHub. Edit this file to update all AI tool configurations.*