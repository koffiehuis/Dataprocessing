#!/usr/bin/env python
# Name: Mark van Malestein
# Student number: 10807640
"""
This script will...........................
"""

import csv
import re
import pandas as pd
import numpy as np
import operator
from statistics import mean, mode, median

def parse_data():
    """
    Parses through csv file and filters rows with missing data
    """

    with open("input.csv", newline="") as file:
        all_data = csv.reader(file, delimiter=",")
        header = next(all_data)
        length = len(header)

        data = []
        labels = [header[0], header[1], header[4], header[7], header[8]]
        for row in all_data:
            if len(row) == length:
                combined = (row[0].strip(), row[1].strip(), row[4], row[7], re.sub("\D", "", row[8]))
                if "unknown" in combined:
                    continue
                elif check_empty(combined):
                    continue
                data.append(combined)

        df = pd.DataFrame.from_records(data, columns = labels)


        # with pd.option_context('display.max_rows', None, 'display.max_columns', None):
        #     print(df)
        #
        return df

def check_empty(list):
    """
    Returns True if element of list is empty
    """
    for i in range(5):
        if not list[i]:
            return True
    return False

def central_tendency(df):
    """
    Calculates mean, median and mode
    """
    GDP_list = df["GDP ($ per capita) dollars"].tolist()
    GDP_list_int =list(map(int, GDP_list))
    length = len(GDP_list)
    sorted_GDP = sorted(GDP_list_int)

    mean_self = sum(GDP_list_int)/len(GDP_list)

    if length % 2 == 0:
        median_self = sorted_GDP[int(length + 1 / 2)]
    else:
        median_self = (sorted_GDP[int(length /2)] + sorted_GDP[int((length + 2) / 2)]) / 2

    mode_self = max(set(GDP_list), key = GDP_list.count)


if __name__ == '__main__':
    panda_data = parse_data()
    central_tendency(panda_data)


    # data_list[]
    # for row in all_data:
    #     if len(row) == length:
    #         country = row[0].strip()
    #         region = row[1].strip()
    #         pop_density = row[4]
    #         infant_mortality = row[7]
    #         GDP = re.sub("\D", "", row[8])
    #         data_list.append((country, region, pop_density, infant_mortality, GDP)
    # print(data_dict)
