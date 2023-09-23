import mysql.connector
import numpy as np
import json
import argparse
import importlib
import time
import pandas as pd
from adbench.myutils import Utils
from model_import_path import model_import_paths
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import RandomOverSampler
from imblearn.under_sampling import RandomUnderSampler

# 아래 download_datasets를 comment in 해서 최초 1번 실행시켜주어야 함
# adbench library에 github에서 제공하는 default dataset을 Inject해야 RunPipeline이 실행 됨.
utils = Utils()
# utils.download_datasets(repo='github')

config = {
    'user': 'dg',
    'password': 'password',
    'host': 'localhost',
    'database': 'dg'
}

# parameter parsing
parser = argparse.ArgumentParser(description='Run the model with the specified algorithm.')
parser.add_argument('--model', type=str, required=True, help='The name of the model to run.')
parser.add_argument('--impute', type=str, default='mean', choices=['mean', 'zero', 'most_frequent'], help='The method of imputation to be used.')
parser.add_argument('--rebalance', type=str, default='no', choices=['no', 'over', 'under'], help='The method of rebalancing data')
parser.add_argument('--onehotencoding', type=str, default='yes', choices=['yes', 'no'], help='Will you apply one hot encoding on Dataset?')
args = parser.parse_args()
model_name = args.model
imputation_method = args.impute
rebalancing_method = args.rebalance
one_hot_encoding = args.onehotencoding

# import for adbench models
import_path = model_import_paths.get(model_name)

if import_path == 'adbench.baseline.PyOD':
    class_name = 'PYOD'
else:
    class_name = model_name

if import_path:
    module = importlib.import_module(import_path)
    model_class = getattr(module, class_name)
    if class_name == 'PYOD':
        model = model_class(seed=42, model_name=model_name)
    else:
        model = model_class(seed=42)
else:
    raise ValueError(f'Invalid model name: {model_name}')

try:
    # connect with mysql db
    with open('user_customized.sql', 'r') as file:
        query = file.read()

    connection = mysql.connector.connect(**config)
    cursor = connection.cursor()

    cursor.execute(query)

    results = cursor.fetchall()
    column_names = cursor.column_names

    # save query result in npz format
    if results:
        dtypes = [(name, 'U50') for name in column_names]
        arr = np.array(results, dtype=dtypes)
        np.savez_compressed('query_results.npz', **{name: arr[name] for name in column_names})
        print("Results have been saved to 'query_results.npz'")
    else:
        print("No results found.")

    # read data from npz and store data on pandas dataframe
    data = np.load('query_results.npz')

    df = pd.DataFrame({name: data[name] for name in data.files})

    # data imputation methods
    def impute_mean(df, column):
        df[column].fillna(df[column].mean(), inplace=True)

    def impute_zero(df, column):
        df[column].fillna(0, inplace=True)

    def impute_most_frequent(df, column):
        most_frequent = df[column].mode()[0]
        df[column].fillna(most_frequent, inplace=True)

    for column in df.columns:
        if imputation_method == "mean":
            impute_mean(df, column)
        elif imputation_method == "zero":
            impute_zero(df, column)
        elif imputation_method == "most_frequent":
            impute_most_frequent(df, column)

    # separate data by columns_info.json
    with open('columns_info.json', 'r') as file:
        columns_info = json.load(file)

    X_columns = columns_info.get('X', [])
    y_columns = columns_info.get('y', [])

    if not X_columns or not y_columns:
        raise ValueError("Invalid columns_info.json format. It should contain non-empty 'X' and 'y'.")

    X = df.loc[:, X_columns].to_numpy()
    y = df.loc[:, y_columns].to_numpy()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # One-hot Encoding
    if one_hot_encoding == 'yes':
        X_train_encoded = pd.get_dummies(X_train, columns=X_columns)
        X_test_encoded = pd.get_dummies(X_test, columns=X_columns)
        # Ensure the columns are the same in both dataframes
        X_train_encoded, X_test_encoded = X_train_encoded.align(X_test_encoded, join='left', axis=1, fill_value=0)
    else:
        X_train_encoded, X_test_encoded = X_train, X_test

    # data rebalancing
    if rebalancing_method == 'over':
        sampler = RandomOverSampler(random_state=42)
        X_resampled, y_resampled = sampler.fit_resample(X_train_encoded, y_train)
    elif rebalancing_method == 'under':
        sampler = RandomUnderSampler(random_state=42)
        X_resampled, y_resampled = sampler.fit_resample(X_train_encoded, y_train)
    elif rebalancing_method == 'no':
        X_resampled, y_resampled = X_train_encoded, y_train
    else:
        raise ValueError("Invalid rebalancing_method")

    # fitting
    start_time = time.time()
    model.fit(X_train=X_resampled, y_train=y_resampled)
    end_time = time.time()
    time_fit = end_time - start_time
    print('Fit time: ' + str(time_fit))

    # prediction
    score = model.predict_score(X_test_encoded)

    # evaluation
    result = utils.metric(y_true=y_test, y_score=score, pos_label=1)

    print(f"AUC-ROC: {result['aucroc']}, AUC-PR: {result['aucpr']}")

except FileNotFoundError as err:
    print(f"Error: {err}")
except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    if cursor:
        cursor.close()
    if connection:
        connection.close()
