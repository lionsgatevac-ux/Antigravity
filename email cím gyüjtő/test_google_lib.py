try:
    from googlesearch import search
except ImportError:
    print("google library not installed")
    exit(1)

query = "éttermek Vác"
print(f"Searching for (using 'google' lib): {query}")

try:
    results = []
    # Note: 'google' library also has a search function, slightly different signature
    for url in search(query, stop=5, pause=2):
        print(f"Found: {url}")
        results.append(url)
    
    if not results:
        print("No results found.")
    else:
        print(f"Successfully found {len(results)} results.")

except Exception as e:
    print(f"Error during search: {e}")
