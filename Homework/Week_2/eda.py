#!/usr/bin/env python
# Name: Mark van Malestein
# Student number: 10807640
"""
This script extracts data from a csv file, saves it in a dataframe, outputs
the data in a JSON format and visualizes GDP in a histogram
and infant mortality in a boxplot.
"""

import csv
import re
import pandas as pd
import numpy as np
from statistics import mean, mode, median, pstdev, stdev
import matplotlib.pyplot as plt
import json

def parse_data():
    """
    Parses through csv file and filters rows with missing data
    """

    # Read the csv file
    with open("input.csv", newline="") as file:
        all_data = csv.reader(file, delimiter=",")
        header = next(all_data)
        length = len(header)

        data = []
        label = [header[0], header[1], header[4], header[7], header[8]]

        # For every row check if all columns contain data
        # and reformat floats
        for row in all_data:
            if len(row) is length:
                combined = (row[0].strip(), row[1].strip(),
                row[4].replace(",", "."), row[7].replace(",", "."),
                re.sub("\D", "", row[8]))
                if "unknown" in combined or check_empty(combined):
                    continue
                data.append(combined)

        # Return as dataframe
        return pd.DataFrame.from_records(data, index = label[0], columns = label)

def check_empty(list):
    """
    Returns True if element of list is empty
    """
    for element in list:
        if not element:
            return True
    return False

def central_tendency(df):
    """
    Calculates mean, median and mode
    """

    # Get GDP from data frame and convert to integers
    GDP_list = df["GDP ($ per capita) dollars"].tolist()
    GDP_list_int =list(map(int, GDP_list))
    length = len(GDP_list)

    # Calculate mean median and mode
    mean_GDP = mean(GDP_list_int)
    median_GDP = median(GDP_list_int)
    mode_GDP = mode(GDP_list_int)

    # Calculate standard deviation for exclusion of outliers
    std = pstdev(GDP_list_int)

    # Exlude outliers
    for index, GDP in enumerate(GDP_list_int):
        if GDP > (mean_GDP + (2 * std)) or GDP < (mean_GDP - (2 * std)):
            del GDP_list_int[index]

    # Plot our histogram
    plt.hist(GDP_list_int, bins = 50, color = "dodgerblue")
    plt.axvline(x = mean_GDP, color = "r", label = f"Mean: {round(mean_GDP)}")
    plt.axvline(x = median_GDP, color = "b", label = f"Median: {median_GDP}")
    plt.axvline(x = mode_GDP, color = "g", label = f"Mode: {mode_GDP}")
    plt.legend()
    plt.xlabel("GDP")
    plt.ylabel("Frequency")
    plt.title("GDP per capita in dollars")

    plt.show()

def five_number_summ(df):
    """
    Shows boxplot of infant mortality numbers
    """
    # Get infant mortality number and convert to floats
    floats = df["Infant mortality (per 1000 births)"].tolist()
    floats = [float(i) for i in floats]

    # Plot as a boxplot
    df = pd.DataFrame(floats, columns = ["Infant mortality (per 1000 births)"])
    df.plot.box()
    plt.xlabel(" ")
    plt.title("Boxplot of infant mortality for all countries")
    plt.show()

def converting(df):
    """
    Converts dataframe to json format and writes this in a file
    """

    # Convert it to a JSON formatted string
    json_string = df.to_json(orient="index")

    # Write in file and let user know the name of the file
    with open("output.json", "w") as file:
        file.write(json_string)
    print("Data is written in output.json file")


if __name__ == '__main__':
    panda_data = parse_data()
    central_tendency(panda_data)
    five_number_summ(panda_data)
    converting(panda_data)
