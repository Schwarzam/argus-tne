import requests
import pandas as pd
# OpenNGC dataset URL
url = "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv"

df = pd.read_csv(url, sep=";")
print(df.columns)
df.to_csv("NGC.csv")
print(df)