import mysql.connector
import numpy as np
import json
import argparse
import importlib
import time

from adbench.run import RunPipeline
from adbench.myutils import Utils
from adbench.baseline.Customized.run import Customized
from model_import_path import model_import_paths
from sklearn.model_selection import train_test_split

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

parser = argparse.ArgumentParser(description='Run the model with the specified algorithm.')
parser.add_argument('--model', type=str, required=True, help='The name of the model to run.')
args = parser.parse_args()
model_name = args.model

import_path = model_import_paths.get(model_name)

if import_path:
    module = importlib.import_module(import_path)
    model_class = getattr(module, model_name)
    model = model_class(seed=42)
else:
    raise ValueError(f'Invalid model name: {model_name}')

try:
    with open('user_customized.sql', 'r') as file:
        query = file.read()

    connection = mysql.connector.connect(**config)
    cursor = connection.cursor()

    cursor.execute(query)

    results = cursor.fetchall()
    column_names = cursor.column_names

    if results:
        dtypes = [(name, 'U50') for name in column_names]
        arr = np.array(results, dtype=dtypes)
        np.savez_compressed('query_results.npz', **{name: arr[name] for name in column_names})
        print("Results have been saved to 'query_results.npz'")
    else:
        print("No results found.")

    data = np.load('query_results.npz')

    with open('columns_info.json', 'r') as file:
        columns_info = json.load(file)

    X_columns = columns_info.get('X', [])
    y_columns = columns_info.get('y', [])

    if not X_columns or not y_columns:
        raise ValueError("Invalid columns_info.json format. It should contain non-empty 'X' and 'y'.")

    dataset = {'X': np.column_stack([data[name] for name in X_columns]), 'y': np.column_stack([data[name] for name in y_columns])}

    X = dataset['X']
    y = dataset['y']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # fitting
    start_time = time.time()
    model.fit(X_train=data['X_train'], y_train=data['y_train'])
    end_time = time.time();
    time_fit = end_time - start_time
    print('Fit time: ' + str(time_fit))

    # prediction
    score = model.predict_score(data['X_test'])

    # evaluation
    result = utils.metric(y_true=data['y_test'], y_score=score, pos_label=1)

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
