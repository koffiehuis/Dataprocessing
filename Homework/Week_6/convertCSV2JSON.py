#!/usr/bin/env python
# Name: Mark van Malestein
# Student number: 10807640

import csv
import pandas as pd
import json
import pycountry

def parse_data():
    # Doing a bit of preprocessing otherwise i can't make a valid JSON
    with open("dataset.csv", "r", newline = "") as csvfile:
        data = []
        for row in csv.reader(csvfile, delimiter=","):
            if row:
                row[0], row[3] = row[0], row[3]
                data.append(row)
        headers = data.pop(0)

        df = pd.DataFrame.from_records(data, columns = headers)

    return df

def add_codes(df):
    """
    adds country codes to JSON
    """
    for i in list(pycountry.countries):
        print(i)
    # print(list(pycountry.countries)[0])
    countries = df["Country"]
    abb_list = []
    for country in countries:
        country_name = pycountry.countries.get(name=country)
        off_country_name = pycountry.countries.get(official_name=country)
        if country_name:
            abb_list.append(country_name.alpha_3)
        elif off_country_name:
            abb_list.append(off_country_name.alpha_3)
        else:
            abb_list.append("NaN")

    df = df.assign(Code=abb_list)
    return df


def converting(df):
    """
    Converts dataframe to json format and writes this in a file
    """

    # Write in file and let user know the name of the file
    json = df.to_json(orient = "records")
    with open("json.js", "w") as file:
        file.write(json)


if __name__ == '__main__':
    df = parse_data()
    df = add_codes(df)
    converting(df)
