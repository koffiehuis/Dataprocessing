#!/usr/bin/env python
# Name:
# Student number:
"""
This script crawls the IMDB top 250 movies.
"""

import os
import csv
import codecs
import errno

from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup

# global constants
TOP_250_URL = 'http://www.imdb.com/chart/top'
OUTPUT_CSV = 'top250movies.csv'
SCRIPT_DIR = os.path.split(os.path.realpath(__file__))[0]
BACKUP_DIR = os.path.join(SCRIPT_DIR, 'HTML_BACKUPS')

# --------------------------------------------------------------------------
# Utility functions (no need to edit):


def create_dir(directory):
    """
    Create directory if needed.
    Args:
        directory: string, path of directory to be made
    Note: the backup directory is used to save the HTML of the pages you
        crawl.
    """

    try:
        os.makedirs(directory)
    except OSError as e:
        if e.errno == errno.EEXIST:
            # Backup directory already exists, no problem for this script,
            # just ignore the exception and carry on.
            pass
        else:
            # All errors other than an already existing backup directory
            # are not handled, so the exception is re-raised and the
            # script will crash here.
            raise


def save_csv(filename, rows):
    """
    Save CSV file with the top 250 most popular movies on IMDB.
    Args:
        filename: string filename for the CSV file
        rows: list of rows to be saved (250 movies in this exercise)
    """
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'title', 'runtime', 'genre(s)', 'director(s)', 'writer(s)',
            'actor(s)', 'rating(s)', 'number of rating(s)'
        ])

        writer.writerows(rows)


def make_backup(filename, html):
    """
    Save HTML to file.
    Args:
        filename: absolute path of file to save
        html: (unicode) string of the html file
    """

    with open(filename, 'wb') as f:
        f.write(html)


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


def main():
    """
    Crawl the IMDB top 250 movies, save CSV with their information.
    Note:
        This function also makes backups of the HTML files in a sub-directory
        called HTML_BACKUPS (those will be used in grading).
    """

    # Create a directory to store copies of all the relevant HTML files (those
    # will be used in testing).
    print('Setting up backup dir if needed ...')
    create_dir(BACKUP_DIR)

    # Make backup of the IMDB top 250 movies page
    print('Access top 250 page, making backup ...')
    top_250_html = simple_get(TOP_250_URL)
    top_250_dom = BeautifulSoup(top_250_html, "lxml")

    make_backup(os.path.join(BACKUP_DIR, 'index.html'), top_250_html)

    # extract the top 250 movies
    print('Scraping top 250 page ...')
    url_strings = scrape_top_250(top_250_dom)

    # grab all relevant information from the 250 movie web pages
    rows = []
    for i, url in enumerate(url_strings):  # Enumerate, a great Python trick!
        print('Scraping movie %d ...' % i)

        # Grab web page
        movie_html = simple_get(url)

        # Extract relevant information for each movie
        movie_dom = BeautifulSoup(movie_html, "lxml")
        rows.append(scrape_movie_page(movie_dom))

        # Save one of the IMDB's movie pages (for testing)
        if i == 83:
            html_file = os.path.join(BACKUP_DIR, 'movie-%03d.html' % i)
            make_backup(html_file, movie_html)

    # Save a CSV file with the relevant information for the top 250 movies.
    print('Saving CSV ...')
    save_csv(os.path.join(SCRIPT_DIR, 'top250movies.csv'), rows)


# --------------------------------------------------------------------------
# Functions to adapt or provide implementations for:

def scrape_top_250(soup):
    """
    Scrape the IMDB top 250 movies index page.
    Args:
        soup: parsed DOM element of the top 250 index page
    Returns:
        A list of strings, where each string is the URL to a movie's page on
        IMDB, note that these URLS must be absolute (i.e. include the http
        part, the domain part and the path part).
    """
    movie_urls = []

    # isolate every section which contains the title
    title_sections = soup.find_all("td", {"class": "titleColumn"})

    # define the start of the url
    url_start = "https://www.imdb.com"

    # isolate every link and add complete link to list
    for title_section in title_sections:
        url_end = title_section.find("a")["href"]
        url = url_start + url_end
        movie_urls += [url]

    return movie_urls

def scrape_movie_page(dom):
    """
    Scrape the IMDB page for a single movie
    Args:
        dom: BeautifulSoup DOM instance representing the page of 1 single
            movie.
    Returns:
        A list of strings representing the following (in order): title, year,
        duration, genre(s) (semicolon separated if several), director(s)
        (semicolon separated if several), writer(s) (semicolon separated if
        several), actor(s) (semicolon separated if several), rating, number
        of ratings.
    """

    # isolate the title section of this page
    title_wrapper = dom.find_all("div", {"class": "title_wrapper"})[0]
    main_title = title_wrapper.find("h1")

    # make sure year is not included in title
    title = main_title.text[:-8]

    # isolate runtime and strip of whitespace
    runtime = title_wrapper.find("time").text
    runtime = runtime.strip()

    # convert runtime to minutes total
    runtime = time_converter(runtime)

    # isolate section containing genre(s)
    genres = title_wrapper.select("a[href*=/search/title?genres]")
    genre = ""

    # format the genre(s) into string
    for i in genres:
        genre += i.text.strip()
        genre += ";"

    # delete trailing semicolon
    genre = genre[:-1]

    # isolate summary section of page
    people_wrapper = dom.find_all("div", {"class": "plot_summary"})[0]

    # remove possible duplicates from writers and directors
    directors = set(people_wrapper.select("a[href*=?ref_=tt_ov_dr]"))
    writers = set(people_wrapper.select("a[href*=?ref_=tt_ov_wr]"))

    # select stars
    stars = people_wrapper.select("a[href*=?ref_=tt_ov_st]")

    # turn sets back into lists
    directors, writers = list(directors), list(writers)

    # format director names if any
    director_string = ""
    if len(directors) > 0:
        for director in directors:
            # make sure more credit option is not saved
            if "more credit" not in director.text:
                director_string += director.text
                director_string += ";"
        # remove trailing semicolon
        director_string = director_string[:-1]
    else:
        director_string = "N/A"


    # format writer names if any
    writer_string = ""
    if len(writers) > 0:
        for writer in writers:
            # make sure more credit option is not saved
            if "more credit" not in writer.text:
                writer_string += writer.text
                writer_string += ";"
        # remove trailing semicolon
        writer_string = writer_string[:-1]
    else:
        writer_string = "N/A"


    # format actor names if any
    star_string = ""
    if len(stars) > 0:
        for star in stars:
            # make sure see full cast option is not saved
            if "See full cast & crew" not in star.text:
                star_string += star.text
                star_string += ";"
        # remove trailing semicolon
        star_string = star_string[:-1]
    else:
        star_string = "N/A"


    # find ratings wrapper
    ratings_wrapper = dom.find_all("div", {"class": "ratings_wrapper"})[0]

    # isolate rating and number of ratings from wrapper
    rating = ratings_wrapper.find("span", {"itemprop": "ratingValue"}).text
    n_ratings = ratings_wrapper.find("span", {"itemprop": "ratingCount"}).text

    # return as row of the csv file
    return [title, runtime, genre, director_string, writer_string, star_string, rating, n_ratings]


def time_converter(runtime):
    """
    This function converts -hr --min to -- minutes
    for example 1hr 30min -> 90.
    """
    # convert hours to minutes
    runtime_hr = int(runtime[0]) * 60

    # isolate minutes from string if any
    if len(runtime) > 4:
        runtime_min = runtime[:-3]
        runtime_min = runtime_min[-2:]

    # no extra minutes so return hours in minutes
    else:
        return int(runtime_hr)

    # return total of minutes
    return int(runtime_hr) + int(runtime_min)

if __name__ == '__main__':

    # call into the program
    main()
