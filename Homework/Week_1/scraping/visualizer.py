#!/usr/bin/env python
# Name: Mark van Malestein
# Student number: 10807640
"""
This script visualizes data obtained from a .csv file
"""

import csv
import matplotlib.pyplot as plt

# Global constants for the input file, first and last year
INPUT_CSV = "movies.csv"
START_YEAR = 2008
END_YEAR = 2018

# Global dictionary for the data
data_dict = {str(key): [] for key in range(START_YEAR, END_YEAR)}

# open csv file
with open(INPUT_CSV, newline="") as csvfile:

    # read the data
    data = csv.reader(csvfile, delimiter=",")

    # make list of ratings for every year found in data
    for row in data:
        if row[2] in data_dict:
            data_dict[row[2]] += [float(row[1])]

    # calculate average per year
    for year in data_dict:
        data_dict[year] = sum(data_dict[year])/len(data_dict[year])

    # plot results in line graph
    plt.plot(data_dict.keys(), data_dict.values())
    plt.ylabel("Ratings")
    plt.xlabel("Years")
    plt.title("Rating of top 50 films per year")

    plt.show()

if __name__ == "__main__":
    print(data_dict)
