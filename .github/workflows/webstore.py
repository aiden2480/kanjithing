"""
This file is a script I wrote to automatically publish new versions of my
chrome extension to the webstore every time the version parameter in the
manifest.json file changes.

It fetches the two most recent commits from the GitHub GraphQL API (the commit
that triggered this script to run, and the one before it). It parses the manifest
file and determines if the version has changed. If it hasn't, the script exits.

If the versions are different, it zips all the files in the root directory into
memory, excluding the git files and directories, which it then uploads and attempts
to publish after fetching an authentication token from the webstore API. 

Credit to the following sources for the webstore API process they made in JS.
> https://github.com/mnao305/chrome-extension-upload
> https://github.com/fregante/chrome-webstore-upload

This file will also automatically create a new release on the GitHub repository
if the manifest version changes, no matter if it is a major, minor, or micro release.

Note: this file should be executed from the root directory, not ./github/workflows
"""

import io
import os
import re
import time
import json
import zipfile
import requests
import argparse
import functools
import traceback

from collections import OrderedDict
from packaging.version import Version

# Chrome webstore URLs
PACKAGE_ID = "nccfelhkfpbnefflolffkclhenplhiab"
FETCH_TOKEN = "https://www.googleapis.com/oauth2/v4/token"
STATUS_URL = f"https://www.googleapis.com/chromewebstore/v1.1/items/{PACKAGE_ID}?projection=draft"
UPLOAD_URL = f"https://www.googleapis.com/upload/chromewebstore/v1.1/items/{PACKAGE_ID}"
PUBLISH_URL = f"https://www.googleapis.com/chromewebstore/v1.1/items/{PACKAGE_ID}/publish"

class ChromeWebstoreStupid(Exception):
    pass

# Chrome webstore upload functions
def compare_manifest_versions() -> tuple[Version]:
    """
    Compares the manifest in this git commit with the one in the previous
    commit. Returns the two version values.
    """
    # FIXME: Doesn't run if the version wasn't changed in the last commit

    # Find first and last version data
    data = make_graphql_request()
    nodes = data["repository"]["main"]["target"]["history"]["nodes"]
    first = json.loads(nodes[0]["file"]["object"]["text"])
    last = json.loads(nodes[1]["file"]["object"]["text"])

    # Parse strings and return
    new = Version(first["version"])
    old = Version(last["version"])

    return old, new

def generate_chrome_access_token() -> str:
    """
    Generates an access token which is required to upload packages to the webstore
    It uses a hacky approach to bypass constant authentication through the use of
    the "refresh_token" variable. For details on retreiving these secrets, see:

    https://github.com/DrewML/chrome-webstore-upload/blob/master/How%20to%20generate%20Google%20API%20keys.md
    """

    data = {
        "client_id": os.environ["CHROME_CLIENT_ID"],
        "client_secret": os.environ["CHROME_CLIENT_SECRET"],
        "refresh_token": os.environ["CHROME_REFRESH_TOKEN"],
        "grant_type": "refresh_token"
    }
    
    resp = requests.post(FETCH_TOKEN, json=data)
    return resp.json()["access_token"]

def generate_zipfile() -> io.BytesIO:
    """
    Packages the repository directory into a zip file to be uploaded to the
    chrome webstore. The zipped file is stored in memory, in a BytesIO object
    """
    
    print("\nGenerating zip file")
    zipped = zipfile.ZipFile(buffer := io.BytesIO(), "w")
    pattern = re.compile(r".\\(.git\\|.github\\|local\\|.gitignore|README.md)")

    for root, dirs, files in os.walk("."):
        for name in files:
            concat = os.path.join(root, name)
            
            if re.match(pattern, concat):
                continue # Skip certain files and dirs
            
            print("* zipping", concat)
            zipped.write(concat)

    zipped.close()
    return buffer

def upload_package(sess: requests.Session) -> dict:
    """
    Generates the zipfile in memory and uploads it to the chrome webstore
    Authentication headers are stored in the session object so I don't need to request more
    """
    
    start = time.time()
    buffer = generate_zipfile()

    print("\nUploading zip file to webstore API")
    resp = sess.put(UPLOAD_URL, data=buffer.getvalue())
    data = resp.json()
    end = time.time()
    
    print(f"Finished upload in {(end - start) * 1000:.2f}ms. Received {resp.status_code}:")
    print(f"* {data}")
    
    return data

def publish_package(sess: requests.Session) -> dict:
    """
    Executes the request to publish the uploaded draft to the chrome webstore.
    Authentication headers are stored in the session object so I don't need to request more
    """
    
    print("\nSending publish request")
    start = time.time()
    resp = sess.post(PUBLISH_URL)
    data = resp.json()
    end = time.time()

    print(f"Received response in {(end - start) * 1000:.2f}ms. Received {resp.status_code}:")
    print(f"* {data}")
    
    return data

# GitHub release functions
def github_release():
    """
    Creates a release on the GitHub repository if the manifest version has changed at all.
    """

    data = make_graphql_request()
    commits = data["repository"]["main"]["target"]["history"]["nodes"]
    alreadyreleased = [n["node"]["tagName"][1:] for n in data["repository"]["releases"]["edges"]]

    # Parse commit data
    nonreleases = []
    releases = OrderedDict()
    lastver = Version("0.0.0")

    for commit in commits[::-1]:
        if not commit["file"]:
            nonreleases.append(commit)
            continue
    
        thisver = Version(json.loads(commit["file"]["object"]["text"])["version"])

        if not thisver > lastver:
            nonreleases.append(commit)
            continue
        
        nonreleases.append(commit)
        releases[thisver.base_version] = nonreleases.copy()
        nonreleases.clear()
        lastver = thisver
    
    # Send request(s) to create a new release
    headers = {"Authorization": "Bearer " + os.environ["GITHUB_TOKEN"]}
    lastver = Version("0.0.0")

    for release, commits in releases.items():
        if release in alreadyreleased:
            print(f"Skipping release {release} because it has already been published")
            continue

        concat = lambda c: "• [`" + c["oid"][0:7] + "`](" + c["url"] + ") " + c["headline"]
        body = map(concat, commits[::-1])
        thisver = Version(release)
        
        payload = {
            "tag_name": "v" + release,
            "target_commitish": commits[-1]["oid"],
            "name": f"Release v{release}",
            "body": "\n".join(body),
            "generate_release_notes": True,
            "prerelease": not (thisver.major > lastver.major or thisver.minor > lastver.minor),
        }

        resp = requests.post("https://api.github.com/repos/aiden2480/kanjithing/releases", headers=headers, json=payload)
        resp.raise_for_status()
        lastver = thisver
        print(thisver, "released")

# Helper functions
@functools.cache
def make_graphql_request() -> dict:
    """
    Makes the GraphQL request in .github/workflows/query.gql
    This is called twice so is cached to prevent redundant wait time
    """

    # Setup request variables
    with open(".github/workflows/query.gql") as fp:
        token = os.environ["GITHUB_TOKEN"]
        headers = {"Authorization": f"Bearer {token}"}
        body = {"query": fp.read()}

    # Make query to GraphQL API
    resp = requests.post("https://api.github.com/graphql", json=body, headers=headers)
    return resp.json()["data"]


if __name__ == "__main__":
    # Load dotenv if locally testing
    try:
        import dotenv
    except ModuleNotFoundError:
        pass
    else:
        dotenv.load_dotenv()

    # Check if the manifest versions are the same
    old, new = compare_manifest_versions()

    print("\nManifest versions")
    print(f" * {old} -> {new}\n")

    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("--event", type=str, default=None)
    parser.add_argument("--force", action="store_true", default=False)
    args = parser.parse_args()
    
    if args.force:
        print("Forcing update via --force flag")
    
    elif args.event == "workflow_dispatch":
        print("Forcing update via --event workflow_dispatch flag")

    elif old == new:
        print("Manifest version not changed")
        exit(0)
    
    elif not (new.major > old.major or new.minor > old.minor):
        print("No major or minor manifest version change detected. "
              "Creating GitHub release without publishing on the webstore")
        
        github_release()
        exit(0)
    
    else:
        print("Creating release and updating webstore application")
    
    # Create GitHub release
    try:
        print("Trying to create a GitHub release")
        github_release()
    except Exception:
        print(f"Error creating release, skipping\n\n{traceback.format_exc()}\n")

    # Create our session object and generate an access token
    sess = requests.Session()
    sess.headers.update({
        "Authorization": "Bearer " + generate_chrome_access_token(),
        "x-goog-api-version": "2"
    })
    
    # Upload and publish package
    upload = upload_package(sess)
    if upload["uploadState"] == "FAILURE":
        print()
        error = upload["itemError"][0]
        raise ChromeWebstoreStupid(error["error_code"] + ": " + error["error_detail"])

    publish_package(sess)
