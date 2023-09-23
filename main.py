import mysql.connector
import numpy as np
import json

from adbench.run import RunPipeline
from adbench.myutils import Utils
from adbench.baseline.Customized.run import Customized

# 아래 download_datasets를 comment in 해서 최초 1번 실행시켜주어야 함
# adbench library에 github에서 제공하는 default dataset을 Inject해야 RunPipeline이 실행 됨.
# utils = Utils()
# utils.download_datasets(repo='github')

config = {
    'user': 'dg',
    'password': 'password',
    'host': 'localhost',
    'database': 'dg'
}

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

    # JSON 파일에서 X, y 축 column 정보를 불러오기
    with open('columns_info.json', 'r') as file:
        columns_info = json.load(file)

    X_columns = columns_info.get('X', [])
    y_columns = columns_info.get('y', [])

    if not X_columns or not y_columns:
        raise ValueError("Invalid columns_info.json format. It should contain non-empty 'X' and 'y'.")

    dataset = {'X': np.column_stack([data[name] for name in X_columns]), 'y': np.column_stack([data[name] for name in y_columns])}

    pipeline = RunPipeline(suffix='test', parallel='supervise', realistic_synthetic_mode=None, noise_type=None)
    results = pipeline.run(dataset=dataset, clf=Customized)
    # 위 부분은 모델을 어떻게 학습시킬지, 라벨링 할지에 따라 달라질 것임.

except FileNotFoundError as err:
    print(f"Error: {err}")
except mysql.connector.Error as err:
    print(f"Error: {err}")
finally:
    if cursor:
        cursor.close()
    if connection:
        connection.close()
