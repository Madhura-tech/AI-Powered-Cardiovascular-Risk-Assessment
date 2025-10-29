import pandas as pd
import numpy as np


def clean_heart_data(df):
    """
    Performs data cleaning on the Heart Disease dataset.
    This includes handling missing values and capping outliers.

    Args:
        df (pd.DataFrame): The raw DataFrame to be cleaned.

    Returns:
        pd.DataFrame: The cleaned DataFrame.
    """

    # --- Step 1: Handling Missing Values ---
    # The dataset uses '?' as a placeholder for missing values.
    # We replace '?' with NaN (Not a Number)
    df.replace("?", np.nan, inplace=True)

    # Since your dataset appears to have no missing values after replacement,
    # no further imputation is needed. If it did, you would add a method here
    # like: df.fillna(df.median(), inplace=True)

    # --- Step 2: Outlier Detection and Handling using IQR ---
    # We'll handle outliers for relevant numerical columns.
    numerical_cols = df.select_dtypes(include=np.number).columns.tolist()

    for column in numerical_cols:
        # We skip the target variable and any columns that are categorical
        # but stored as numbers (e.g., 'sex', 'cp', etc.)
        if column in ["age", "trestbps", "chol", "thalach", "oldpeak"]:

            # Calculate Q1 (25th percentile) and Q3 (75th percentile)
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1

            # Define the outlier bounds
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            # Cap the outliers by replacing values outside the bounds
            # with the bound values themselves.
            df[column] = np.clip(df[column], lower_bound, upper_bound)

    return df
