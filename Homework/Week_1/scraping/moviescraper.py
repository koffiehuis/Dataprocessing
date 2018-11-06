#!/usr/bin/env python
# Name:
# Student number:
"""
This script scrapes IMDB and outputs a CSV file with highest rated movies.
"""

import csv
from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup

TARGET_URL = "https://www.imdb.com/search/title?title_type=feature&release_date=2008-01-01,2018-01-01&num_votes=5000,&sort=user_rating,desc"
BACKUP_HTML = 'movies.html'
OUTPUT_CSV = 'movies.csv'


def extract_movies(dom):
    """
    Extract a list of highest rated movies from DOM (of IMDB page).
    Each movie entry should contain the following fields:
    - Title
    - Rating
    - Year of release (only a number!)
    - Actors/actresses (comma separated if more than one)
    - Runtime (only a number!)
    """

    # extract the sections containing title and year
    title_sections = dom.find_all("h3", {"class": "lister-item-header"})

    titles = []
    years = []

    # for every title section extract title and year
    for i in range(len(title_sections)):
        title = title_sections[i].select("a[href*=title]")[0].string
        year = title_sections[i].find("span", {"class": "lister-item-year text-muted unbold"})

        # format year
        year = year.string
        year = year.replace("(", "")
        year = year.replace(")", "")
        if " " in year:
            year = year.split(" ", 1)[1]

        # add to the lists
        titles.append(title)
        years.append(year)

    ratings = []

    # finds section containing ratings
    ratings_junk = dom.find_all("div", {"class": "ratings-bar"})

    # extract ratings from the sections
    for i in range(len(ratings_junk)):
        strong = ratings_junk[i].find("strong")
        rating = strong.string
        ratings.append(rating)

    runtimes = []

    # finds sections containing runtime of film
    times_junk = dom.find_all("span", {"class": "runtime"})

    # for every section isolate the runtime
    for i in range(len(times_junk)):
        runtime = times_junk[i].string
        runtime = runtime.split(" ", 1)[0]
        runtimes.append(runtime)

    # find all sections containing actor names
    all = dom.find_all("div", {"class": "pagecontent"})

    # remove irrelevant tags from sections
    for p in all[0].find_all("p", {"class": "text-muted"}):
        p.decompose()
    sections = all[0].find_all("p", {"class": ""})

    actors = []
    actors_movie = ""

    # for every section isolate actor names
    for i in sections:

        # check if any actor names are given
        if "Stars:" in i.text:

            # if so, isolate names and put in string
            stars = i.select("a[href*=?ref_=adv_li_st_]")
            for j in stars:
                actors_movie += f"{j.text}, "
            actors_movie = actors_movie[:-2]
            actors.append(actors_movie)
            actors_movie = ""

        # no actor names given, so put N/A
        else:
            actors.append("N/A")

    # make list of lists and return this
    lists = [titles, ratings, years, actors, runtimes]

    return lists

def save_csv(outfile, movies):
    """
    Output a CSV file containing highest rated movies.
    """
    writer = csv.writer(outfile)
    writer.writerow(['Title', 'Rating', 'Year', 'Actors', 'Runtime'])

    # for every movie write values in right order to row
    for i in range(len(movies[0])):
        writer.writerow([movies[0][i], movies[1][i], movies[2][i], movies[3][i], movies[4][i]])


def simple_get(url):
    """
    Attempts to get the content at `url` by making an HTTP GET request.
    If the content-type of response is some kind of HTML/XML, return the
    text content, otherwise return None
    """
    try:
        with closing(get(url, stream=True)) as resp:
            if is_good_response(resp):
                return resp.content
            else:
                return None
    except RequestException as e:
        print('The following error occurred during HTTP GET request to {0} : {1}'.format(url, str(e)))
        return None


def is_good_response(resp):
    """
    Returns true if the response seems to be HTML, false otherwise
    """
    content_type = resp.headers['Content-Type'].lower()
    return (resp.status_code == 200
            and content_type is not None
            and content_type.find('html') > -1)


if __name__ == "__main__":

    # get HTML content at target URL
    html = simple_get(TARGET_URL)

    # save a copy to disk in the current directory, this serves as an backup
    # of the original HTML, will be used in grading.
    with open(BACKUP_HTML, 'wb') as f:
        f.write(html)

    # parse the HTML file into a DOM representation
    dom = BeautifulSoup(html, 'html.parser')

    # extract the movies (using the function you implemented)
    movies = extract_movies(dom)

    # write the CSV file to disk (including a header)
    with open(OUTPUT_CSV, 'w', newline='') as output_file:
        save_csv(output_file, movies)
