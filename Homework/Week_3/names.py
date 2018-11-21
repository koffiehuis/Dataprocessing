#!/usr/bin/env python
# Name: Mark van Malestein
# Student number: 10807640

import csv
import pandas as pd
import json
####COMMANDLINE ARGS
def parse_data():
    # Doing a bit of preprocessing otherwise i can't make a valid JSON
    with open("baby-names-2018-1-26.csv", "r", newline = "") as csvfile:
        names_all = []
        for row in csv.reader((line.replace("\0", "") for line in csvfile), delimiter="\t"):
            if row:
                row[0], row[3] = row[0], row[3]
                names_all.append(row)
        headers = names_all.pop(0)

        df = pd.DataFrame.from_records(names_all, columns = headers)
        print(df)

    return df

def converting(df):
    """
    Converts dataframe to json format and writes this in a file
    """

    # Write in file and let user know the name of the file
    json = df.to_json(orient = "records")
    with open("json.json", "w") as file:
        file.write(json)

if __name__ == '__main__':
    df = parse_data()
    converting(df)
